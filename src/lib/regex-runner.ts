import { REGEX_LIMITS, type RegexScanResult } from "./regex-scan";

type WorkerMessage = {
  id: number;
  ok: boolean;
  matches: RegexScanResult["matches"];
  truncated: boolean;
  error: string;
};

export interface RegexWorkerLike {
  postMessage(message: unknown): void;
  terminate(): void;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
}

export type RegexRunner = {
  run(pattern: string, flags: string, text: string): Promise<RegexScanResult>;
  dispose(): void;
};

const timeoutResult = (): RegexScanResult => ({
  ok: false,
  matches: [],
  truncated: true,
  error: `Pattern took longer than ${REGEX_LIMITS.timeoutMs / 1000}s and was stopped. It may be catastrophically backtracking.`,
});

/**
 * Runs regex scans off the main thread.
 *
 * A catastrophic pattern such as /^(a+)+$/ blocks inside a single exec() call,
 * so a cooperative deadline inside the scan cannot interrupt it. Posting the
 * work to a Worker and calling terminate() from a timer does stop it, which
 * keeps the page interactive.
 *
 * The worker factory is injected so this can be unit tested without a browser.
 */
export function createRegexRunner(factory: () => RegexWorkerLike): RegexRunner {
  let worker: RegexWorkerLike | null = null;
  let nextId = 1;
  let disposed = false;

  const ensureWorker = (): RegexWorkerLike => {
    if (worker) return worker;

    const created = factory();
    created.onmessage = (event) => {
      const data = event.data as WorkerMessage | undefined;
      if (!data || typeof data.id !== "number") return;
      const pending = pendingRequests.get(data.id);
      if (!pending) return;
      pendingRequests.delete(data.id);
      clearTimeout(pending.timer);
      pending.resolve({
        ok: data.ok,
        matches: data.matches ?? [],
        truncated: Boolean(data.truncated),
        error: data.error ?? "",
      });
    };
    created.onerror = () => {
      for (const [id, pending] of pendingRequests) {
        clearTimeout(pending.timer);
        pending.resolve({
          ok: false,
          matches: [],
          truncated: false,
          error: "The regex worker crashed. Try a simpler pattern.",
        });
        pendingRequests.delete(id);
      }
      created.terminate();
      if (worker === created) worker = null;
    };

    worker = created;
    return created;
  };

  const pendingRequests = new Map<
    number,
    { resolve: (result: RegexScanResult) => void; timer: ReturnType<typeof setTimeout> }
  >();

  return {
    run(pattern, flags, text) {
      if (disposed) return Promise.resolve(timeoutResult());
      if (pattern === "") {
        return Promise.resolve({ ok: true, matches: [], truncated: false, error: "" });
      }

      const target = ensureWorker();
      const id = nextId++;

      return new Promise<RegexScanResult>((resolve) => {
        const timer = setTimeout(() => {
          if (!pendingRequests.has(id)) return;
          pendingRequests.delete(id);
          // terminate() is what actually stops a blocked regex.
          target.terminate();
          if (worker === target) worker = null;
          resolve(timeoutResult());
        }, REGEX_LIMITS.timeoutMs);

        pendingRequests.set(id, { resolve, timer });
        try {
          target.postMessage({ id, pattern, flags, text });
        } catch {
          clearTimeout(timer);
          pendingRequests.delete(id);
          resolve({
            ok: false,
            matches: [],
            truncated: false,
            error: "Could not start the regex worker.",
          });
        }
      });
    },

    dispose() {
      disposed = true;
      for (const [id, pending] of pendingRequests) {
        clearTimeout(pending.timer);
        pending.resolve({ ok: false, matches: [], truncated: false, error: "" });
        pendingRequests.delete(id);
      }
      if (worker) {
        worker.terminate();
        worker = null;
      }
    },
  };
}

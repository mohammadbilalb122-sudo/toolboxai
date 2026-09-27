export type RegexMatch = {
  value: string;
  index: number;
  captures: Array<string | undefined>;
};

/** Guard rails so a pathological pattern or input cannot exhaust the page. */
export const REGEX_LIMITS = {
  maxTextLength: 100_000,
  maxMatches: 1_000,
  maxMatchValueLength: 500,
  maxCaptureValueLength: 200,
  timeoutMs: 2_000,
} as const;

export function advanceRegexIndex(text: string, index: number, unicode: boolean): number {
  if (!unicode || index + 1 >= text.length) {
    return index + 1;
  }

  const first = text.charCodeAt(index);
  const second = text.charCodeAt(index + 1);
  return first >= 0xd800 && first <= 0xdbff && second >= 0xdc00 && second <= 0xdfff
    ? index + 2
    : index + 1;
}

function clamp(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export type RegexScanResult = {
  ok: boolean;
  matches: RegexMatch[];
  truncated: boolean;
  error: string;
};

export function scanRegex(
  pattern: string,
  flags: string,
  text: string,
  deadline: number,
): RegexScanResult {
  const empty: RegexScanResult = { ok: true, matches: [], truncated: false, error: "" };

  if (pattern === "") return empty;

  let regex: RegExp;
  try {
    // Validate the flags the user actually typed before deriving the scan flags.
    new RegExp(pattern, flags.replace(/[gy]/g, ""));
    regex = new RegExp(pattern, flags.includes("g") ? flags : `${flags}g`);
  } catch (cause) {
    return {
      ok: false,
      matches: [],
      truncated: false,
      error: cause instanceof Error ? cause.message : "Check the pattern and flags.",
    };
  }

  const subject = text.length > REGEX_LIMITS.maxTextLength ? text.slice(0, REGEX_LIMITS.maxTextLength) : text;
  const inputTruncated = subject.length < text.length;

  const matches: RegexMatch[] = [];
  let match: RegExpExecArray | null;
  let truncated = inputTruncated;

  try {
    while ((match = regex.exec(subject)) !== null) {
      // Only guards loops that yield control between calls. A single
      // catastrophic exec() cannot be interrupted here, which is why the
      // caller runs this in a Worker and terminates it on timeout.
      if (Date.now() > deadline) {
        return {
          ok: false,
          matches: [],
          truncated: true,
          error: `Pattern took longer than ${REGEX_LIMITS.timeoutMs / 1000}s and was stopped. It may be catastrophically backtracking.`,
        };
      }

      matches.push({
        value: clamp(match[0], REGEX_LIMITS.maxMatchValueLength),
        index: match.index,
        captures: match.slice(1).map((capture) =>
          capture === undefined ? undefined : clamp(capture, REGEX_LIMITS.maxCaptureValueLength),
        ),
      });

      if (matches.length >= REGEX_LIMITS.maxMatches) {
        truncated = true;
        break;
      }

      if (match[0].length === 0) {
        regex.lastIndex = advanceRegexIndex(subject, regex.lastIndex, regex.unicode);
      }
    }
  } catch (cause) {
    return {
      ok: false,
      matches: [],
      truncated,
      error: cause instanceof Error ? cause.message : "Check the pattern and flags.",
    };
  }

  return { ok: true, matches, truncated, error: "" };
}

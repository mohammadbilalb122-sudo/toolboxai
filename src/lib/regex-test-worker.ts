import { REGEX_LIMITS, scanRegex } from "./regex-scan";

type ScanRequest = {
  id: number;
  pattern: string;
  flags: string;
  text: string;
};

self.onmessage = (event: MessageEvent<ScanRequest>) => {
  const { id, pattern, flags, text } = event.data;
  const result = scanRegex(pattern, flags, text, Date.now() + REGEX_LIMITS.timeoutMs);
  self.postMessage({ id, ...result });
};

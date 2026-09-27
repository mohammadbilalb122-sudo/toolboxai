export type CopyResult = { ok: true } | { ok: false; reason: string };

/**
 * Copies text to the clipboard.
 *
 * `navigator.clipboard` is undefined on any non-secure origin, so calling
 * `navigator.clipboard.writeText` unguarded throws a TypeError that blanks the
 * page rather than showing a message. This falls back to a selection-based
 * copy, which still works over plain http://.
 */
export async function copyTextToClipboard(text: string): Promise<CopyResult> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return { ok: true };
    } catch {
      // Fall through to the legacy path; permission prompts can reject here.
    }
  }

  if (typeof document === "undefined") {
    return { ok: false, reason: "Clipboard is unavailable in this browser." };
  }

  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(area);
    return copied
      ? { ok: true }
      : { ok: false, reason: "Your browser blocked the copy. Select the text and copy manually." };
  } catch {
    return { ok: false, reason: "Your browser blocked the copy. Select the text and copy manually." };
  }
}

export const CLIPBOARD_UNAVAILABLE_MESSAGE =
  "Could not copy automatically. Select the text and copy it manually.";

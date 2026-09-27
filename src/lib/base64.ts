/**
 * UTF-8 safe Base64 helpers.
 *
 * `btoa`/`atob` operate on Latin-1 code units, so any character above U+00FF
 * either throws (`日本語`) or silently produces a different string than the
 * UTF-8 encoding other tools expect (`café` -> `Y2Fm6Q==` instead of
 * `Y2Fmw6k=`). These helpers always round-trip through UTF-8.
 */

export function encodeBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function decodeBase64(input: string): string {
  const normalized = input.replace(/\s+/g, "");
  if (normalized.length === 0) return "";
  if (normalized.length % 4 !== 0) {
    throw new Error("Length must be a multiple of 4");
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) {
    throw new Error("Contains characters outside the Base64 alphabet");
  }
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

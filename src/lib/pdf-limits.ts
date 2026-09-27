/**
 * Resource limits for the PDF tools.
 *
 * Every PDF tool runs in the browser, so the whole document is held in memory
 * alongside decoded bitmaps. Rendering an unbounded number of pages at 2x
 * scale exhausts memory and kills the tab with no recoverable error, so each
 * tool checks these budgets before starting.
 */
export const PDF_LIMITS = {
  /** Pages a single run may rasterise into canvases. */
  maxRenderedPages: 100,
  /** Upper bound on the longest edge of a rendered page, in CSS pixels. */
  maxRenderEdge: 2200,
  /** Upper bound on total pixels across every page rendered in one run. */
  maxTotalRenderPixels: 400_000_000,
  /** Pages of text extraction before warning about a very long document. */
  maxTextPages: 2_000,
} as const;

export function formatPageCount(pages: number): string {
  return `${pages.toLocaleString()} ${pages === 1 ? "page" : "pages"}`;
}

/**
 * Picks a render scale that keeps a page inside the per-page and total
 * pixel budgets while never upscaling beyond `maxScale`.
 */
export function planPageRender(
  baseWidth: number,
  baseHeight: number,
  maxScale: number,
  pixelsAlreadySpent: number,
): { scale: number; width: number; height: number } {
  const longestEdge = Math.max(baseWidth, baseHeight);
  if (!Number.isFinite(longestEdge) || longestEdge <= 0) {
    return {
      scale: 1,
      width: Number.isFinite(baseWidth) && baseWidth > 0 ? Math.round(baseWidth) : 1,
      height: Number.isFinite(baseHeight) && baseHeight > 0 ? Math.round(baseHeight) : 1,
    };
  }

  let scale = Math.min(maxScale, PDF_LIMITS.maxRenderEdge / longestEdge);
  const remaining = Math.max(0, PDF_LIMITS.maxTotalRenderPixels - pixelsAlreadySpent);

  if (remaining > 0 && Number.isFinite(baseWidth) && Number.isFinite(baseHeight)) {
    const affordable = Math.sqrt(remaining / Math.max(1, baseWidth * baseHeight));
    scale = Math.min(scale, affordable);
  }

  if (!Number.isFinite(scale)) scale = 1;
  scale = Math.max(0.1, scale);

  return {
    scale,
    width: Math.max(1, Math.ceil(baseWidth * scale) || 1),
    height: Math.max(1, Math.ceil(baseHeight * scale) || 1),
  };
}

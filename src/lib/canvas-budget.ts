/**
 * Shared canvas guards for the image tools.
 *
 * Every image tool allocates a full-size canvas. Browsers silently fail
 * `getContext("2d")` or `toBlob` once an allocation is too large, and a
 * `toBlob` callback that receives null can otherwise be reported to the user
 * as a successful export. These helpers make the limit explicit and make a
 * failed encode a thrown error instead of a blank download.
 */

/** Longest edge a single canvas may have. */
export const MAX_CANVAS_EDGE = 16384;

/**
 * Total pixels a single canvas may have. A 6000x4000 photo is 24M pixels and
 * still fits comfortably; 16384x16384 (268M) does not, and is the value that
 * previously produced blank or failed exports.
 */
export const MAX_CANVAS_PIXELS = 40_000_000;

export function formatPixels(count: number): string {
  return `${(count / 1_000_000).toFixed(1)} megapixels`;
}

export function assertCanvasWithinBudget(
  width: number,
  height: number,
  toolLabel: string,
): void {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    throw new Error("That image reported an invalid size and could not be processed.");
  }

  if (width > MAX_CANVAS_EDGE || height > MAX_CANVAS_EDGE) {
    throw new Error(
      `This image is ${Math.round(width)}x${Math.round(height)}, larger than the ` +
        `${MAX_CANVAS_EDGE}px per side this browser can handle. Resize it first with the ` +
        `Resize Image tool.`,
    );
  }

  const pixels = width * height;
  if (pixels > MAX_CANVAS_PIXELS) {
    throw new Error(
      `${toolLabel} needs a ${Math.round(width)}x${Math.round(height)} canvas ` +
        `(${formatPixels(pixels)}), which exceeds the ${formatPixels(MAX_CANVAS_PIXELS)} ` +
        `this tool allows. Resize the image first, or use a smaller region.`,
    );
  }
}

/** Creates a canvas of the requested size after validating it fits. */
export function createSizedCanvas(
  width: number,
  height: number,
  toolLabel: string,
  options?: CanvasRenderingContext2DSettings,
): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
  assertCanvasWithinBudget(width, height, toolLabel);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);

  const context = canvas.getContext("2d", options);
  if (!context) {
    throw new Error(
      "Your browser could not allocate a canvas that large. Close other tabs and try again, " +
        "or resize the image first.",
    );
  }

  return { canvas, context };
}

/** Releases a canvas back to the browser as soon as it is no longer needed. */
export function releaseCanvas(canvas: HTMLCanvasElement | null | undefined): void {
  if (!canvas) return;
  canvas.width = 0;
  canvas.height = 0;
}

/**
 * Encodes a canvas, treating a null result as a failure.
 *
 * A PNG under ~120 bytes is a single-colour image, which is what a canvas that
 * silently failed to draw produces. Reporting that as a successful export is
 * worse than an error, so it is rejected here.
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number | undefined,
  toolLabel: string,
): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => {
        if (!value || value.size === 0) {
          reject(
            new Error(
              `${toolLabel} could not produce an image. The source may be too large or in a ` +
                `format this browser cannot re-encode.`,
            ),
          );
          return;
        }

        if (mimeType === "image/png" && value.size < 120 && canvas.width * canvas.height > 4) {
          reject(
            new Error(
              `${toolLabel} produced a blank image and was stopped rather than saving an ` +
                `empty file. Try a smaller or different source image.`,
            ),
          );
          return;
        }

        resolve(value);
      },
      mimeType,
      quality,
    );
  });
}

/**
 * Hands control back to the browser between heavy steps.
 *
 * `await new Promise(r => requestAnimationFrame(r))` never resolves in a
 * background tab, which left the tool permanently stuck on "Processing…" with
 * no way forward. A zero-delay timeout always fires.
 */
export function yieldToBrowser(): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

import {
  PDFArray,
  PDFBool,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFRawStream,
  decodePDFRawStream,
  type PDFRef,
} from "pdf-lib";

const JPEG_QUALITY = 0.72;
const MAX_EDGE = 1800;
const MIN_PIXELS = 80 * 80;
const MAX_DECODED_BYTES = 64 * 1024 * 1024;

export type CompressProgress = (percent: number, message: string) => void;

export type CompressPdfResult = {
  bytes: Uint8Array;
  originalSize: number;
  compressedSize: number;
  reductionPercent: number;
  alreadyOptimized: boolean;
};

function lookupNumber(dict: PDFRawStream["dict"], key: string): number | null {
  const value = dict.lookup(PDFName.of(key));
  if (value instanceof PDFNumber) return value.asNumber();
  return null;
}

function isTrue(dict: PDFRawStream["dict"], key: string): boolean {
  return dict.lookup(PDFName.of(key)) === PDFBool.True;
}

function filterNames(dict: PDFRawStream["dict"]): string[] {
  const filter = dict.lookup(PDFName.of("Filter"));
  if (filter instanceof PDFName) return [filter.asString()];
  if (filter instanceof PDFArray) {
    const names: string[] = [];
    for (let i = 0; i < filter.size(); i++) {
      const item = filter.lookup(i);
      if (item instanceof PDFName) names.push(item.asString());
    }
    return names;
  }
  return [];
}

function colorSpaceName(dict: PDFRawStream["dict"]): string | null {
  const space = dict.lookup(PDFName.of("ColorSpace"));
  if (space instanceof PDFName) return space.asString();
  return null;
}

function hasName(names: string[], expected: string): boolean {
  return names.some((name) => name === `/${expected}` || name === expected);
}

type StreamPredictor = {
  predictor: number;
  colors: number;
  columns: number;
};

/**
 * Reads /DecodeParms. An array of parms means the stream chains multiple
 * filters, which this compressor does not attempt to reverse.
 */
function streamPredictor(dict: PDFRawStream["dict"]): StreamPredictor | null | "unsupported" {
  const raw = dict.lookup(PDFName.of("DecodeParms")) ?? dict.lookup(PDFName.of("DP"));
  if (raw === undefined) return null;
  if (raw instanceof PDFArray) return "unsupported";
  if (!(raw instanceof PDFDict)) return "unsupported";

  return {
    predictor: lookupNumber(raw, "Predictor") ?? 1,
    colors: lookupNumber(raw, "Colors") ?? 1,
    columns: lookupNumber(raw, "Columns") ?? 0,
  };
}

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/**
 * Reverses the PNG/TIFF row filters described by /Predictor.
 *
 * pdf-lib's FlateStream only inflates; it never un-applies predictors, so a
 * predictor-encoded image would otherwise be handed to the canvas as raw
 * samples and silently re-encoded into visual noise.
 */
function undoPredictors(
  data: Uint8Array,
  params: StreamPredictor,
  rowBytes: number,
): Uint8Array | null {
  if (rowBytes <= 0) return null;

  const bytesPerPixel = Math.max(1, params.colors);
  const rowLength = rowBytes + 1;
  const rows = Math.floor(data.length / rowLength);
  if (rows <= 0) return null;

  const out = new Uint8Array(rows * rowBytes);
  let previous = new Uint8Array(rowBytes);
  let read = 0;

  for (let row = 0; row < rows; row++) {
    const filter = data[read++];
    const start = row * rowBytes;

    for (let i = 0; i < rowBytes; i++) {
      const raw = data[read + i];
      const left = i >= bytesPerPixel ? out[start + i - bytesPerPixel] : 0;
      const up = previous[i];
      const upLeft = i >= bytesPerPixel ? previous[i - bytesPerPixel] : 0;

      let value: number;
      switch (filter) {
        case 0:
          value = raw;
          break;
        case 1:
          value = raw + left;
          break;
        case 2:
          value = raw + up;
          break;
        case 3:
          value = raw + ((left + up) >> 1);
          break;
        case 4:
          value = raw + paethPredictor(left, up, upLeft);
          break;
        default:
          return null;
      }
      out[start + i] = value & 0xff;
    }

    read += rowBytes;
    previous = out.subarray(start, start + rowBytes);
  }

  return out;
}

async function canvasToJpeg(
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void,
  srcWidth: number,
  srcHeight: number,
): Promise<{ bytes: Uint8Array; width: number; height: number } | null> {
  const scale = Math.min(1, MAX_EDGE / Math.max(srcWidth, srcHeight));
  const width = Math.max(1, Math.round(srcWidth * scale));
  const height = Math.max(1, Math.round(srcHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  draw(ctx, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) return null;

  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    width,
    height,
  };
}

async function jpegBytesToCanvasImage(
  bytes: Uint8Array,
): Promise<HTMLImageElement> {
  const blobBytes = new Uint8Array(bytes.byteLength);
  blobBytes.set(bytes);
  const blob = new Blob([blobBytes.buffer], { type: "image/jpeg" });
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not decode JPEG image"));
      image.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function compressImageStream(
  stream: PDFRawStream,
): Promise<{ bytes: Uint8Array; width: number; height: number } | null> {
  const width = lookupNumber(stream.dict, "Width");
  const height = lookupNumber(stream.dict, "Height");
  if (!width || !height || width * height < MIN_PIXELS) return null;

  const filters = filterNames(stream.dict);
  const space = colorSpaceName(stream.dict);
  const bits = lookupNumber(stream.dict, "BitsPerComponent") ?? 8;

  if (hasName(filters, "DCTDecode") && !hasName(filters, "FlateDecode")) {
    const image = await jpegBytesToCanvasImage(stream.contents);
    return canvasToJpeg(
      (ctx, w, h) => ctx.drawImage(image, 0, 0, w, h),
      image.naturalWidth || width,
      image.naturalHeight || height,
    );
  }

  if (bits !== 8) return null;
  if (space !== "/DeviceRGB" && space !== "DeviceRGB" && space !== "/DeviceGray" && space !== "DeviceGray") {
    return null;
  }

  const isGray = space === "/DeviceGray" || space === "DeviceGray";
  const components = isGray ? 1 : 3;
  const expected = width * height * components;
  if (expected > MAX_DECODED_BYTES) return null;

  const parms = streamPredictor(stream.dict);
  if (parms === "unsupported") return null;
  if (parms && parms.predictor > 1 && parms.colors !== components) return null;

  let decoded: Uint8Array;
  try {
    decoded = decodePDFRawStream(stream).decode();
  } catch {
    return null;
  }

  if (parms && parms.predictor > 1) {
    const unfiltered = undoPredictors(decoded, parms, width * components);
    if (!unfiltered) return null;
    decoded = unfiltered;
  }

  // Encoded rows are longer than the samples they carry, so a mismatch in
  // either direction means the samples were not understood. Bail out and keep
  // the original image rather than re-encoding bytes as if they were pixels.
  if (decoded.length !== expected) return null;

  const imageData = new ImageData(width, height);
  if (isGray) {
    for (let i = 0, p = 0; i < width * height; i++, p += 4) {
      const v = decoded[i];
      imageData.data[p] = v;
      imageData.data[p + 1] = v;
      imageData.data[p + 2] = v;
      imageData.data[p + 3] = 255;
    }
  } else {
    for (let i = 0, p = 0; i < width * height; i++, p += 4) {
      const o = i * 3;
      imageData.data[p] = decoded[o];
      imageData.data[p + 1] = decoded[o + 1];
      imageData.data[p + 2] = decoded[o + 2];
      imageData.data[p + 3] = 255;
    }
  }

  return canvasToJpeg((ctx, w, h) => {
    if (w === width && h === height) {
      ctx.putImageData(imageData, 0, 0);
      return;
    }
    const tmp = document.createElement("canvas");
    tmp.width = width;
    tmp.height = height;
    tmp.getContext("2d")?.putImageData(imageData, 0, 0);
    ctx.drawImage(tmp, 0, 0, w, h);
  }, width, height);
}

async function loadPdf(bytes: Uint8Array) {
  try {
    return await PDFDocument.load(bytes);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/encrypt|password/i.test(message)) {
      return PDFDocument.load(bytes, { ignoreEncryption: true });
    }
    throw error;
  }
}

export async function compressPdf(
  input: Uint8Array,
  onProgress?: CompressProgress,
): Promise<CompressPdfResult> {
  const originalSize = input.byteLength;
  onProgress?.(8, "Loading PDF…");

  const pdfDoc = await loadPdf(input);
  const objects = pdfDoc.context.enumerateIndirectObjects();
  const images: Array<[PDFRef, PDFRawStream]> = [];

  for (const [ref, object] of objects) {
    if (!(object instanceof PDFRawStream)) continue;
    if (object.dict.get(PDFName.of("Subtype")) !== PDFName.of("Image")) continue;
    if (isTrue(object.dict, "ImageMask")) continue;
    if (object.dict.get(PDFName.of("SMask"))) continue;
    images.push([ref, object]);
  }

  let index = 0;
  for (const [ref, stream] of images) {
    index += 1;
    const percent = 10 + Math.round((index / Math.max(images.length, 1)) * 70);
    onProgress?.(percent, `Compressing images (${index}/${images.length})…`);

    try {
      const compressed = await compressImageStream(stream);
      if (!compressed) continue;
      if (compressed.bytes.byteLength >= stream.contents.byteLength && compressed.width >= (lookupNumber(stream.dict, "Width") ?? 0)) {
        continue;
      }

      const next = pdfDoc.context.stream(compressed.bytes, {
        Type: "XObject",
        Subtype: "Image",
        BitsPerComponent: 8,
        Width: compressed.width,
        Height: compressed.height,
        ColorSpace: PDFName.of("DeviceRGB"),
        Filter: "DCTDecode",
      });
      pdfDoc.context.assign(ref, next);
    } catch {
      // Keep the original image if this one cannot be recompressed.
    }

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  // Save the edited source document directly. Copying pages into a new
  // document can drop document-level structures such as outlines, metadata,
  // and form state even though the visible pages appear unchanged.
  onProgress?.(88, "Saving compressed PDF…");
  const saved = await pdfDoc.save({ useObjectStreams: true });
  const compressedSize = saved.byteLength;

  if (compressedSize >= originalSize) {
    onProgress?.(100, "PDF is already optimized");
    return {
      bytes: input,
      originalSize,
      compressedSize: originalSize,
      reductionPercent: 0,
      alreadyOptimized: true,
    };
  }

  const reductionPercent = ((originalSize - compressedSize) / originalSize) * 100;
  onProgress?.(100, "Compression complete");

  return {
    bytes: saved,
    originalSize,
    compressedSize,
    reductionPercent,
    alreadyOptimized: false,
  };
}

export function isPdfFile(file: File): boolean {
  if (file.type === "application/pdf") return true;
  return file.name.toLowerCase().endsWith(".pdf");
}

export async function assertPdfMagic(file: File): Promise<void> {
  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const magic = String.fromCharCode(...header);
  if (!magic.startsWith("%PDF")) {
    throw new Error("That file does not look like a valid PDF.");
  }
}

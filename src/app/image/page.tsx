"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useDirectToolRoute } from "@/lib/use-direct-tool-route";
import {
  canvasToBlob,
  createSizedCanvas,
  releaseCanvas,
  yieldToBrowser,
} from "@/lib/canvas-budget";

type OutputFormat = "image/jpeg" | "image/png" | "image/webp";
type CompressedImage = { blob: Blob; url: string; filename: string; format: OutputFormat };

const supportedFormats: Record<string, OutputFormat> = {
  "image/jpeg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
};

const supportedExtensions: Record<string, OutputFormat> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const formatExtensions: Record<OutputFormat, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function detectFormat(file: File): OutputFormat | undefined {
  const extension = file.name.toLowerCase().split(".").pop() ?? "";
  if (file.type) {
    if (file.type === "image/jpg") return "image/jpeg";
    return supportedFormats[file.type];
  }
  return supportedExtensions[extension];
}

export default function ImageTools() {
  const { activeTool, closeTool, openTool } = useDirectToolRoute(
    "image",
    ["compress", "resize", "convert", "crop", "metadata"],
    { webp: "convert" },
  );
  const tools = [
    { id: "compress", name: "Compress Image", description: "Reduce image file size while maintaining quality", icon: "📉" },
    { id: "resize", name: "Resize Image", description: "Change image dimensions to any size", icon: "📐" },
    { id: "convert", name: "Convert Format", description: "Convert between JPG, PNG, and WebP", icon: "🔄" },
    { id: "crop", name: "Crop Image", description: "Crop images to custom dimensions", icon: "✂️" },
    { id: "metadata", name: "Image Metadata Remover", description: "Remove EXIF, GPS, and other embedded metadata", icon: "🧹" },
  ];

  if (activeTool === "compress") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16">
          <button onClick={closeTool} className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-8">
            ← Back to Image Tools
          </button>
          <CompressImage />
        </div>
      </div>
    );
  }

  if (activeTool === "resize") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16">
          <button onClick={closeTool} className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-8">
            ← Back to Image Tools
          </button>
          <ResizeImage />
        </div>
      </div>
    );
  }

  if (activeTool === "convert") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16">
          <button onClick={closeTool} className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-8">
            ← Back to Image Tools
          </button>
          <ConvertImage />
        </div>
      </div>
    );
  }

  if (activeTool === "crop") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16">
          <button onClick={closeTool} className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-8">
            ← Back to Image Tools
          </button>
          <CropImage />
        </div>
      </div>
    );
  }

  if (activeTool === "metadata") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16">
          <button onClick={closeTool} className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-8">
            ← Back to Image Tools
          </button>
          <ImageMetadataRemover />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <Link href="/" className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-blue-300 dark:hover:border-gray-500 dark:hover:bg-gray-700 dark:focus-visible:ring-offset-gray-900">
          ← Back to Home
        </Link>

        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-3">
            <span className="text-4xl sm:text-5xl">🖼️</span>
            Image Tools
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Compress, resize, convert, and crop your images with ease
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={`/image?tool=${encodeURIComponent(tool.id)}`}
              onClick={(event) => { event.preventDefault(); openTool(tool.id); }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 cursor-pointer"
            >
              <div className="text-4xl mb-4">{tool.icon}</div>
              <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">{tool.name}</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

type MetadataFreeImage = { blob: Blob; url: string; filename: string; width: number; height: number };

function ImageMetadataRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceFormat, setSourceFormat] = useState<OutputFormat | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<MetadataFreeImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  const clearPreview = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreviewUrl(null);
  };

  const clearResult = () => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResult(null);
  };

  const acceptFile = async (selected: File | undefined) => {
    if (!selected || isProcessing) return;
    clearPreview();
    clearResult();
    setFile(null);
    setSourceFormat(null);
    setError("");
    setProgressMessage("");

    const format = detectFormat(selected);
    if (!format) {
      setError("Unsupported file. Choose a JPG, JPEG, PNG, or WebP image.");
      return;
    }

    setIsProcessing(true);
    setProgressMessage("Checking image…");
    let image: BrowserImage | null = null;
    try {
      image = await loadBrowserImage(selected);
      const preview = URL.createObjectURL(selected);
      previewUrlRef.current = preview;
      setPreviewUrl(preview);
      setFile(selected);
      setSourceFormat(format);
      setError("");
    } catch (loadError) {
      setError(`This image could not be opened. ${loadError instanceof Error ? loadError.message : "Choose a valid JPG, PNG, or WebP image."}`);
    } finally {
      image?.close();
      setIsProcessing(false);
      setProgressMessage("");
    }
  };

  const removeMetadata = async () => {
    if (!file || !sourceFormat) {
      setError("Please upload a JPG, JPEG, PNG, or WebP image first.");
      return;
    }

    setIsProcessing(true);
    setError("");
    clearResult();
    setProgressMessage("Loading image…");
    let image: BrowserImage | null = null;
    let canvas: HTMLCanvasElement | null = null;
    try {
      image = await loadBrowserImage(file);
      const { canvas: sizedCanvas, context } = createSizedCanvas(
        image.width,
        image.height,
        "Metadata Remover",
        { alpha: sourceFormat !== "image/jpeg" },
      );
      canvas = sizedCanvas;
      if (sourceFormat === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(image.source, 0, 0, canvas.width, canvas.height);
      const outputWidth = canvas.width;
      const outputHeight = canvas.height;
      image.close();
      image = null;
      setProgressMessage("Removing embedded metadata…");

      const blob = await canvasToBlob(
        canvas,
        sourceFormat,
        sourceFormat === "image/png" ? undefined : 1,
        "Metadata Remover",
      );
      if (blob.type !== sourceFormat) {
        throw new Error(`Your browser could not create ${formatExtensions[sourceFormat].toUpperCase()} files. Try a current browser and retry.`);
      }

      const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResult({
        blob,
        url,
        filename: `${baseName}-metadata-removed.${formatExtensions[sourceFormat]}`,
        width: outputWidth,
        height: outputHeight,
      });
      setProgressMessage("Metadata removed.");
    } catch (processingError) {
      setError(`Could not remove metadata from this image. ${processingError instanceof Error ? processingError.message : "Please try another file."}`);
      setProgressMessage("");
    } finally {
      image?.close();
      releaseCanvas(canvas);
      setIsProcessing(false);
    }
  };

  const resetTool = () => {
    clearPreview();
    clearResult();
    setFile(null);
    setSourceFormat(null);
    setError("");
    setProgressMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">🧹 Image Metadata Remover</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-6">
          <label htmlFor="image-metadata-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload image</label>
          <input
            id="image-metadata-upload"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            onChange={(event) => { const selected = event.target.files?.[0]; event.target.value = ""; void acceptFile(selected); }}
            disabled={isProcessing}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">The image stays on your device. Re-encoding applies EXIF orientation to the pixels and omits EXIF/GPS, camera, date/time, and most other embedded metadata.</p>
        </div>

        {file && <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="font-semibold text-blue-800 dark:text-blue-300 truncate">{file.name}</p>
          <p className="text-sm text-blue-600 dark:text-blue-400">{formatBytes(file.size)} · {formatExtensions[sourceFormat ?? "image/png"].toUpperCase()}</p>
        </div>}

        {error && <div role="alert" className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"><p className="text-red-800 dark:text-red-300">{error}</p></div>}

        {isProcessing && <div role="status" aria-live="polite" className="mb-4 flex items-center gap-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-blue-800 dark:text-blue-300">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-300 border-t-blue-700 dark:border-blue-700 dark:border-t-blue-300" aria-hidden="true" />
          <span>{progressMessage || "Processing image…"}</span>
        </div>}

        {previewUrl && file && <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">{result ? "Metadata-free image preview" : "Image preview"}</h3>
          <div className="rounded-lg bg-gray-100 dark:bg-gray-900 p-3 flex justify-center">
            <Image src={result?.url ?? previewUrl} alt={result ? "Preview of image with metadata removed" : `Preview of ${file.name}`} width={1600} height={1200} unoptimized className="max-h-[28rem] max-w-full object-contain rounded" />
          </div>
          {result && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{result.width} × {result.height} pixels · {formatBytes(result.blob.size)}</p>}
        </div>}

        <div className="flex flex-col sm:flex-row gap-3">
          <button type="button" onClick={() => void removeMetadata()} disabled={!file || isProcessing} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors">{isProcessing ? "Removing metadata…" : "Remove Metadata"}</button>
          <button type="button" onClick={resetTool} disabled={isProcessing} className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3 px-6 rounded-lg transition-colors">Reset</button>
        </div>

        {result && <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-300 font-semibold mb-3">Image re-encoded. EXIF/GPS, camera, date/time, and most other embedded metadata were removed.</p>
          <a href={result.url} download={result.filename} className="inline-flex bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">Download Image</a>
        </div>}
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

type BrowserImage = { source: CanvasImageSource; width: number; height: number; close: () => void };

async function loadBrowserImage(file: File): Promise<BrowserImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      // Fall through to HTMLImageElement for browsers with partial bitmap support.
    }
  }

  const url = URL.createObjectURL(file);
  const image = new window.Image();
  image.decoding = "async";
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("This browser could not read the image."));
      image.src = url;
      if (image.complete && image.naturalWidth > 0) resolve();
    });
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function CompressImage() {
  const [file, setFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("image/jpeg");
  const [quality, setQuality] = useState(82);
  const [result, setResult] = useState<CompressedImage | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  const clearResult = () => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResult(null);
  };

  const acceptFile = (selected: File | undefined) => {
    if (!selected) return;
    const sourceFormat = detectFormat(selected);
    if (!sourceFormat) {
      clearResult();
      setFile(null);
      setError("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    clearResult();
    setFile(selected);
    setOutputFormat(sourceFormat === "image/png" ? "image/webp" : sourceFormat);
    setError("");
    setProgress(0);
    setProgressMessage("");
  };

  const compress = async () => {
    if (!file) {
      setError("Please upload an image first.");
      return;
    }

    setIsProcessing(true);
    setError("");
    clearResult();
    setProgress(5);
    setProgressMessage("Loading image…");

    let bitmap: BrowserImage | null = null;
    try {
      bitmap = await loadBrowserImage(file);
      setProgress(35);
      setProgressMessage("Preparing image…");

      const maxDimension = 12000;
      const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
      const targetWidth = Math.max(1, Math.round(bitmap.width * scale));
      const targetHeight = Math.max(1, Math.round(bitmap.height * scale));
      const { canvas, context } = createSizedCanvas(
        targetWidth,
        targetHeight,
        "Image Compressor",
        { alpha: outputFormat !== "image/jpeg" },
      );

      if (outputFormat === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(bitmap.source, 0, 0, canvas.width, canvas.height);
      setProgress(70);
      setProgressMessage(`Compressing as ${formatExtensions[outputFormat].toUpperCase()}…`);
      bitmap.close();
      bitmap = null;

      const compressedBlob = await canvasToBlob(
        canvas,
        outputFormat,
        outputFormat === "image/png" ? undefined : quality / 100,
        "Image Compressor",
      );
      if (compressedBlob.type !== outputFormat) {
        throw new Error(`${formatExtensions[outputFormat].toUpperCase()} output is not supported by this browser.`);
      }
      releaseCanvas(canvas);

      const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
      const filename = `${baseName}-compressed.${formatExtensions[outputFormat]}`;
      const url = URL.createObjectURL(compressedBlob);
      resultUrlRef.current = url;
      setResult({ blob: compressedBlob, url, filename, format: outputFormat });
      setProgress(100);
      setProgressMessage("Compression complete");
    } catch (err) {
      setError(`Could not compress this image. ${err instanceof Error ? err.message : "Please try another file."}`);
      setProgressMessage("");
    } finally {
      bitmap?.close();
      setIsProcessing(false);
    }
  };

  const reductionPercent = result && file
    ? ((file.size - result.blob.size) / file.size) * 100
    : 0;

  const resetTool = () => {
    clearResult();
    setFile(null);
    setError("");
    setProgress(0);
    setProgressMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">📉 Compress Image</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-6">
          <label htmlFor="compress-image-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload image</label>
          <label
            onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => { event.preventDefault(); setIsDragging(false); acceptFile(event.dataTransfer.files?.[0]); }}
            className={`block cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"}`}
          >
            <p className="text-3xl mb-3">🖼️</p>
            <p className="text-gray-800 dark:text-white font-medium">Drag and drop an image here</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">or click to browse — JPG, PNG, or WebP</p>
            <input id="compress-image-upload" ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={(event) => { const selected = event.target.files?.[0]; event.target.value = ""; acceptFile(selected); }} className="sr-only" />
          </label>
        </div>

        {file && <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="font-semibold text-blue-800 dark:text-blue-300 truncate">{file.name}</p>
          <p className="text-sm text-blue-600 dark:text-blue-400">Original size: {formatBytes(file.size)}</p>
        </div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          <div>
            <label htmlFor="compress-image-format" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Output format</label>
            <select id="compress-image-format" value={outputFormat} onChange={(event) => { setOutputFormat(event.target.value as OutputFormat); clearResult(); }} disabled={isProcessing} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="image/jpeg">JPG</option>
              <option value="image/png">PNG (lossless)</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="compress-image-quality" className="text-sm font-medium text-gray-700 dark:text-gray-300">Quality</label>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{quality}%</span>
            </div>
            <input id="compress-image-quality" type="range" min="40" max="100" step="1" value={quality} onChange={(event) => { setQuality(Number(event.target.value)); clearResult(); }} disabled={isProcessing || outputFormat === "image/png"} className="w-full accent-blue-600 disabled:opacity-50" />
            {outputFormat === "image/png" && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG uses lossless compression; choose JPG or WebP to adjust quality.</p>}
          </div>
        </div>

        {error && <div role="alert" className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"><p className="text-red-800 dark:text-red-300">{error}</p></div>}

        {isProcessing && <div className="mb-6" aria-live="polite">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-2"><span>{progressMessage}</span><span>{progress}%</span></div>
          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"><div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} /></div>
        </div>}

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => void compress()} disabled={!file || isProcessing} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors">{isProcessing ? "Compressing…" : "Compress Image"}</button>
          <button onClick={resetTool} disabled={isProcessing} className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3 px-6 rounded-lg transition-colors">Reset</button>
        </div>

        {result && file && <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-300 font-semibold mb-3">Image compressed successfully!</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg bg-white/70 dark:bg-gray-900/40 p-3"><p className="text-xs text-gray-500 dark:text-gray-400">Original size</p><p className="font-semibold text-gray-800 dark:text-white">{formatBytes(file.size)}</p></div>
            <div className="rounded-lg bg-white/70 dark:bg-gray-900/40 p-3"><p className="text-xs text-gray-500 dark:text-gray-400">Compressed size</p><p className="font-semibold text-gray-800 dark:text-white">{formatBytes(result.blob.size)}</p></div>
            <div className="rounded-lg bg-white/70 dark:bg-gray-900/40 p-3"><p className="text-xs text-gray-500 dark:text-gray-400">Size reduction</p><p className="font-semibold text-gray-800 dark:text-white">{Math.max(0, reductionPercent).toFixed(1)}%</p></div>
          </div>
          {reductionPercent <= 0 && <p className="text-sm text-amber-800 dark:text-amber-300 mb-4">This image did not get smaller with these settings. Try a lower quality or choose WebP.</p>}
          <div className="mb-4 rounded-lg bg-gray-100 dark:bg-gray-900 p-3 flex justify-center"><Image src={result.url} alt="Compressed image preview" width={1200} height={900} unoptimized className="max-h-[28rem] max-w-full object-contain rounded" /></div>
          <a href={result.url} download={result.filename} className="inline-flex bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">Download Compressed Image</a>
        </div>}
      </div>
    </div>
  );
}

type ResizedImage = { blob: Blob; url: string; filename: string };

function ResizeImage() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceFormat, setSourceFormat] = useState<OutputFormat | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [widthInput, setWidthInput] = useState("");
  const [heightInput, setHeightInput] = useState("");
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [resizeQuality, setResizeQuality] = useState(92);
  const [result, setResult] = useState<ResizedImage | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  const clearResult = () => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResult(null);
  };

  const acceptFile = async (selected: File | undefined) => {
    if (!selected || isProcessing) return;
    const format = detectFormat(selected);
    if (!format) {
      clearResult();
      setFile(null);
      setSourceFormat(null);
      setDimensions(null);
      setWidthInput("");
      setHeightInput("");
      setError("Please choose a JPG, PNG, or WebP image.");
      return;
    }

    clearResult();
    setFile(selected);
    setSourceFormat(format);
    setDimensions(null);
    setWidthInput("");
    setHeightInput("");
    setError("");
    setIsProcessing(true);
    setProgress(10);
    setProgressMessage("Reading image dimensions…");

    let bitmap: BrowserImage | null = null;
    try {
      bitmap = await loadBrowserImage(selected);
      const naturalDimensions = { width: bitmap.width, height: bitmap.height };
      setDimensions(naturalDimensions);
      setWidthInput(String(bitmap.width));
      setHeightInput(String(bitmap.height));
      setProgress(100);
      setProgressMessage("Image ready to resize");
    } catch (err) {
      setFile(null);
      setSourceFormat(null);
      setDimensions(null);
      setError(`Could not open this image. ${err instanceof Error ? err.message : "Please try another file."}`);
      setProgressMessage("");
    } finally {
      bitmap?.close();
      setIsProcessing(false);
    }
  };

  const changeWidth = (value: string) => {
    setWidthInput(value);
    clearResult();
    const width = Number(value);
    if (lockAspectRatio && dimensions && Number.isFinite(width) && width > 0) {
      setHeightInput(String(Math.max(1, Math.round(width * dimensions.height / dimensions.width))));
    }
  };

  const changeHeight = (value: string) => {
    setHeightInput(value);
    clearResult();
    const height = Number(value);
    if (lockAspectRatio && dimensions && Number.isFinite(height) && height > 0) {
      setWidthInput(String(Math.max(1, Math.round(height * dimensions.width / dimensions.height))));
    }
  };

  const resize = async () => {
    if (!file || !sourceFormat || !dimensions) {
      setError("Please upload a supported image first.");
      return;
    }
    const width = Number(widthInput);
    const height = Number(heightInput);
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
      setError("Enter a whole-number width and height greater than zero.");
      return;
    }
    if (width > 16384 || height > 16384 || width * height > 100_000_000) {
      setError("Choose dimensions no larger than 16,384 pixels per side and 100 megapixels total.");
      return;
    }

    setIsProcessing(true);
    setError("");
    clearResult();
    setProgress(10);
    setProgressMessage("Loading image…");
    let bitmap: BrowserImage | null = null;
    let canvas: HTMLCanvasElement | null = null;
    try {
      bitmap = await loadBrowserImage(file);
      setProgress(35);
      setProgressMessage("Resizing image…");
      await yieldToBrowser();

      const { canvas: sizedCanvas, context } = createSizedCanvas(
        width,
        height,
        "Image Resizer",
        { alpha: sourceFormat !== "image/jpeg" },
      );
      canvas = sizedCanvas;
      if (sourceFormat === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
      }
      context.drawImage(bitmap.source, 0, 0, width, height);
      bitmap.close();
      bitmap = null;
      setProgress(75);
      setProgressMessage("Saving resized image…");

      const blob = await canvasToBlob(
        canvas,
        sourceFormat,
        sourceFormat === "image/jpeg" ? resizeQuality / 100 : undefined,
        "Image Resizer",
      );
      releaseCanvas(canvas);
      canvas = null;

      const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
      const filename = `${baseName}-resized.${formatExtensions[sourceFormat]}`;
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResult({ blob, url, filename });
      setProgress(100);
      setProgressMessage("Resize complete");
    } catch (err) {
      setError(`Could not resize this image. ${err instanceof Error ? err.message : "Please try smaller dimensions."}`);
      setProgressMessage("");
    } finally {
      bitmap?.close();
      releaseCanvas(canvas);
      setIsProcessing(false);
    }
  };

  const resetTool = () => {
    clearResult();
    setFile(null);
    setSourceFormat(null);
    setDimensions(null);
    setWidthInput("");
    setHeightInput("");
    setError("");
    setProgress(0);
    setProgressMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">📐 Resize Image</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-6">
          <label htmlFor="resize-image-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload image</label>
          <label
            onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => { event.preventDefault(); setIsDragging(false); void acceptFile(event.dataTransfer.files?.[0]); }}
            className={`block cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"}`}
          >
            <p className="text-3xl mb-3">🖼️</p>
            <p className="text-gray-800 dark:text-white font-medium">Drag and drop an image here</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">or click to browse — JPG, PNG, or WebP</p>
            <input id="resize-image-upload" ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={(event) => { const selected = event.target.files?.[0]; event.target.value = ""; void acceptFile(selected); }} disabled={isProcessing} className="sr-only" />
          </label>
        </div>

        {file && dimensions && <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="font-semibold text-blue-800 dark:text-blue-300 truncate">{file.name}</p>
          <p className="text-sm text-blue-600 dark:text-blue-400">Current image size: {dimensions.width} × {dimensions.height} px</p>
        </div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
          <div>
            <label htmlFor="resize-image-width" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Width (pixels)</label>
            <input id="resize-image-width" type="number" min="1" max="16384" step="1" value={widthInput} onChange={(event) => changeWidth(event.target.value)} disabled={!dimensions || isProcessing} placeholder="e.g. 1200" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-60" />
          </div>
          <div>
            <label htmlFor="resize-image-height" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Height (pixels)</label>
            <input id="resize-image-height" type="number" min="1" max="16384" step="1" value={heightInput} onChange={(event) => changeHeight(event.target.value)} disabled={!dimensions || isProcessing} placeholder="e.g. 800" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-60" />
          </div>
        </div>

        <label className="mb-6 inline-flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={lockAspectRatio} onChange={(event) => setLockAspectRatio(event.target.checked)} disabled={!dimensions || isProcessing} className="h-4 w-4 accent-blue-600" />
          Lock Aspect Ratio
        </label>

        {dimensions && sourceFormat !== "image/png" && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="resize-image-quality" className="text-sm font-medium text-gray-700 dark:text-gray-300">Output quality</label>
              <span className="text-sm text-gray-600 dark:text-gray-400">{resizeQuality}%</span>
            </div>
            <input id="resize-image-quality" type="range" min="10" max="100" step="1" value={resizeQuality} onChange={(event) => { setResizeQuality(Number(event.target.value)); clearResult(); }} disabled={isProcessing} className="w-full accent-blue-600" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Lower quality produces a smaller file. PNG output is always lossless.</p>
          </div>
        )}

        {error && <div role="alert" className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"><p className="text-red-800 dark:text-red-300">{error}</p></div>}

        {isProcessing && <div className="mb-6" aria-live="polite">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-2"><span>{progressMessage}</span><span>{progress}%</span></div>
          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"><div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} /></div>
        </div>}

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => void resize()} disabled={!dimensions || isProcessing} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors">{isProcessing ? "Resizing…" : "Resize Image"}</button>
          <button onClick={resetTool} disabled={isProcessing} className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3 px-6 rounded-lg transition-colors">Reset</button>
        </div>

        {result && <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-300 font-semibold mb-3">Image resized to {widthInput} × {heightInput} px.</p>
          <div className="mb-4 rounded-lg bg-gray-100 dark:bg-gray-900 p-3 flex justify-center"><Image src={result.url} alt={`Resized image preview, ${widthInput} by ${heightInput} pixels`} width={1200} height={900} unoptimized className="max-h-[28rem] max-w-full object-contain rounded" /></div>
          <a href={result.url} download={result.filename} className="inline-flex bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">Download Resized Image</a>
        </div>}
      </div>
    </div>
  );
}

type ConvertedImage = { blob: Blob; url: string; filename: string; width: number; height: number };

function ConvertImage() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceFormat, setSourceFormat] = useState<OutputFormat | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("image/webp");
  const [convertQuality, setConvertQuality] = useState(92);
  const [result, setResult] = useState<ConvertedImage | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  const clearPreview = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreviewUrl(null);
  };

  const clearResult = () => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResult(null);
  };

  const acceptFile = async (selected: File | undefined) => {
    if (!selected || isProcessing) return;
    clearPreview();
    clearResult();
    setFile(null);
    setSourceFormat(null);
    setError("");
    setProgress(0);
    setProgressMessage("");

    const format = detectFormat(selected);
    if (!format) {
      setError("Please choose a JPG, PNG, or WebP image.");
      return;
    }

    setIsProcessing(true);
    setProgressMessage("Reading image…");
    let image: BrowserImage | null = null;
    try {
      image = await loadBrowserImage(selected);
      const preview = URL.createObjectURL(selected);
      previewUrlRef.current = preview;
      setPreviewUrl(preview);
      setFile(selected);
      setSourceFormat(format);
      setOutputFormat(format === "image/webp" ? "image/png" : "image/webp");
    } catch (loadError) {
      setError(`This image could not be opened. ${loadError instanceof Error ? loadError.message : "Choose a valid JPG, PNG, or WebP image."}`);
    } finally {
      image?.close();
      setIsProcessing(false);
      setProgressMessage("");
    }
  };

  const convert = async () => {
    if (!file || !sourceFormat) {
      setError("Please upload a supported image first.");
      return;
    }

    setIsProcessing(true);
    setError("");
    clearResult();
    setProgress(5);
    setProgressMessage("Loading image…");

    let image: BrowserImage | null = null;
    let canvas: HTMLCanvasElement | null = null;
    try {
      image = await loadBrowserImage(file);
      setProgress(35);
      setProgressMessage(`Converting to ${formatExtensions[outputFormat].toUpperCase()}…`);
      await yieldToBrowser();

      const { canvas: sizedCanvas, context } = createSizedCanvas(
        image.width,
        image.height,
        "Image Converter",
        { alpha: outputFormat !== "image/jpeg" },
      );
      canvas = sizedCanvas;
      if (outputFormat === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(image.source, 0, 0, canvas.width, canvas.height);
      image.close();
      image = null;
      setProgress(75);
      setProgressMessage("Saving converted image…");

      const blob = await canvasToBlob(
        canvas,
        outputFormat,
        outputFormat === "image/png" ? undefined : convertQuality / 100,
        "Image Converter",
      );
      if (blob.type !== outputFormat) {
        throw new Error(`${formatExtensions[outputFormat].toUpperCase()} output is not supported by this browser.`);
      }
      const width = canvas.width;
      const height = canvas.height;
      releaseCanvas(canvas);
      canvas = null;

      const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
      const filename = `${baseName}-converted.${formatExtensions[outputFormat]}`;
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResult({ blob, url, filename, width, height });
      setProgress(100);
      setProgressMessage("Conversion complete");
    } catch (err) {
      setError(`Could not convert this image. ${err instanceof Error ? err.message : "Please try another file."}`);
      setProgressMessage("");
    } finally {
      image?.close();
      releaseCanvas(canvas);
      setIsProcessing(false);
    }
  };

  const resetTool = () => {
    clearPreview();
    clearResult();
    setFile(null);
    setSourceFormat(null);
    setError("");
    setProgress(0);
    setProgressMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatHint = outputFormat === "image/jpeg"
    ? "Transparent areas will use a white background in JPG."
    : outputFormat === "image/webp"
      ? "WebP gives the smallest file and keeps transparency."
      : "PNG is lossless but produces the largest file.";

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">🔄 Convert Format</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-6">
          <label htmlFor="convert-image-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload image</label>
          <label
            onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => { event.preventDefault(); setIsDragging(false); void acceptFile(event.dataTransfer.files?.[0]); }}
            className={`block cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"}`}
          >
            <p className="text-3xl mb-3">🖼️</p>
            <p className="text-gray-800 dark:text-white font-medium">Drag and drop an image here</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">or click to browse — JPG, PNG, or WebP</p>
            <input id="convert-image-upload" ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={(event) => { const selected = event.target.files?.[0]; event.target.value = ""; void acceptFile(selected); }} disabled={isProcessing} className="sr-only" />
          </label>
        </div>

        {file && sourceFormat && <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="font-semibold text-blue-800 dark:text-blue-300 truncate">{file.name}</p>
          <p className="text-sm text-blue-600 dark:text-blue-400">Input: {formatExtensions[sourceFormat].toUpperCase()} · {formatBytes(file.size)}</p>
        </div>}

        <div className="mb-6">
          <label htmlFor="convert-image-format" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Output format</label>
          <select id="convert-image-format" value={outputFormat} onChange={(event) => { setOutputFormat(event.target.value as OutputFormat); clearResult(); }} disabled={isProcessing} className="w-full sm:w-64 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="image/jpeg">JPG</option>
            <option value="image/png">PNG</option>
            <option value="image/webp">WebP</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatHint}</p>
        </div>

        {outputFormat !== "image/png" && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="convert-image-quality" className="text-sm font-medium text-gray-700 dark:text-gray-300">Quality</label>
              <span className="text-sm text-gray-600 dark:text-gray-400">{convertQuality}%</span>
            </div>
            <input id="convert-image-quality" type="range" min="10" max="100" step="1" value={convertQuality} onChange={(event) => { setConvertQuality(Number(event.target.value)); clearResult(); }} disabled={isProcessing} className="w-full accent-blue-600" />
          </div>
        )}

        {error && <div role="alert" className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"><p className="text-red-800 dark:text-red-300">{error}</p></div>}

        {isProcessing && <div className="mb-6" aria-live="polite">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-2"><span>{progressMessage}</span><span>{progress}%</span></div>
          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"><div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} /></div>
        </div>}

        {previewUrl && file && <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">{result ? "Converted image" : "Image preview"}</h3>
          <div className="rounded-lg bg-gray-100 dark:bg-gray-900 p-3 flex justify-center">
            <Image src={result?.url ?? previewUrl} alt={result ? "Converted image preview" : `Preview of ${file.name}`} width={1600} height={1200} unoptimized className="max-h-[28rem] max-w-full object-contain rounded" />
          </div>
          {result && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{result.width} × {result.height} pixels · {formatBytes(result.blob.size)}</p>}
        </div>}

        <div className="flex flex-col sm:flex-row gap-3">
          <button type="button" onClick={() => void convert()} disabled={!file || isProcessing} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors">{isProcessing ? "Converting…" : "Convert Image"}</button>
          <button type="button" onClick={resetTool} disabled={isProcessing} className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3 px-6 rounded-lg transition-colors">Reset</button>
        </div>

        {result && file && sourceFormat && <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-300 font-semibold mb-3">Image converted successfully to {formatExtensions[outputFormat].toUpperCase()}.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg bg-white/70 dark:bg-gray-900/40 p-3"><p className="text-xs text-gray-500 dark:text-gray-400">Original</p><p className="font-semibold text-gray-800 dark:text-white">{formatExtensions[sourceFormat].toUpperCase()} · {formatBytes(file.size)}</p></div>
            <div className="rounded-lg bg-white/70 dark:bg-gray-900/40 p-3"><p className="text-xs text-gray-500 dark:text-gray-400">Converted</p><p className="font-semibold text-gray-800 dark:text-white">{formatExtensions[outputFormat].toUpperCase()} · {formatBytes(result.blob.size)}</p></div>
          </div>
          <a href={result.url} download={result.filename} className="inline-flex bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">Download Converted Image</a>
        </div>}
      </div>
    </div>
  );
}

type CropBox = { x: number; y: number; width: number; height: number };
type CropHandle = "move" | "n" | "e" | "s" | "w" | "nw" | "ne" | "sw" | "se";
type CropInteraction = { handle: CropHandle; startX: number; startY: number; crop: CropBox };
type CropAspect = "free" | "1:1" | "4:3" | "3:4" | "3:2" | "2:3" | "16:9" | "9:16" | "16:10" | "5:4" | "21:9";
type CroppedImage = { blob: Blob; url: string; filename: string; width: number; height: number };
type PixelBox = { x: number; y: number; width: number; height: number };
type PixelDraft = { x: string; y: string; width: string; height: string; edited: "width" | "height" };

const cropAspectValues: Record<Exclude<CropAspect, "free">, number> = {
  "1:1": 1,
  "4:3": 4 / 3,
  "3:4": 3 / 4,
  "3:2": 3 / 2,
  "2:3": 2 / 3,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
  "16:10": 16 / 10,
  "5:4": 5 / 4,
  "21:9": 21 / 9,
};

const cropAspectOptions: { value: CropAspect; label: string }[] = [
  { value: "free", label: "Free (any shape)" },
  { value: "1:1", label: "1:1 — square" },
  { value: "4:3", label: "4:3 — classic" },
  { value: "3:4", label: "3:4 — portrait" },
  { value: "3:2", label: "3:2 — photo" },
  { value: "2:3", label: "2:3 — portrait photo" },
  { value: "16:9", label: "16:9 — widescreen" },
  { value: "9:16", label: "9:16 — vertical video" },
  { value: "16:10", label: "16:10 — computer" },
  { value: "5:4", label: "5:4 — photo print" },
  { value: "21:9", label: "21:9 — ultrawide" },
];

const cropSizePresets: { id: string; label: string; width: number; height: number }[] = [
  { id: "custom", label: "Custom size (use the fields below)", width: 0, height: 0 },
  { id: "instagram-post", label: "Instagram post — 1080 × 1080", width: 1080, height: 1080 },
  { id: "instagram-portrait", label: "Instagram portrait — 1080 × 1350", width: 1080, height: 1350 },
  { id: "story", label: "Story / Reel / Shorts — 1080 × 1920", width: 1080, height: 1920 },
  { id: "youtube-thumbnail", label: "YouTube thumbnail — 1280 × 720", width: 1280, height: 720 },
  { id: "youtube-banner", label: "YouTube channel banner — 2560 × 1440", width: 2560, height: 1440 },
  { id: "x-post", label: "X post — 1600 × 900", width: 1600, height: 900 },
  { id: "x-header", label: "X header — 1500 × 500", width: 1500, height: 500 },
  { id: "facebook-cover", label: "Facebook cover — 1640 × 856", width: 1640, height: 856 },
  { id: "linkedin-banner", label: "LinkedIn banner — 1584 × 396", width: 1584, height: 396 },
  { id: "avatar", label: "Profile picture — 400 × 400", width: 400, height: 400 },
  { id: "full-hd", label: "Full HD wallpaper — 1920 × 1080", width: 1920, height: 1080 },
  { id: "a4", label: "A4 at 300dpi — 2480 × 3508", width: 2480, height: 3508 },
];

const cropHandles: { id: CropHandle; className: string }[] = [
  { id: "nw", className: "-top-2 -left-2 cursor-nw-resize" },
  { id: "n", className: "-top-2 left-1/2 w-6 -translate-x-1/2 cursor-ns-resize" },
  { id: "ne", className: "-top-2 -right-2 cursor-ne-resize" },
  { id: "e", className: "-right-2 top-1/2 h-6 -translate-y-1/2 cursor-ew-resize" },
  { id: "se", className: "-bottom-2 -right-2 cursor-se-resize" },
  { id: "s", className: "-bottom-2 left-1/2 w-6 -translate-x-1/2 cursor-ns-resize" },
  { id: "sw", className: "-bottom-2 -left-2 cursor-sw-resize" },
  { id: "w", className: "-left-2 top-1/2 h-6 -translate-y-1/2 cursor-ew-resize" },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function cropToAspect(crop: CropBox, targetRatio: number, imageRatio: number): CropBox {
  const normalizedRatio = targetRatio / imageRatio;
  const width = Math.min(crop.width, crop.height * normalizedRatio);
  const height = width / normalizedRatio;
  return {
    x: clamp(crop.x + (crop.width - width) / 2, 0, 1 - width),
    y: clamp(crop.y + (crop.height - height) / 2, 0, 1 - height),
    width,
    height,
  };
}

function CropImage() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceFormat, setSourceFormat] = useState<OutputFormat | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [crop, setCrop] = useState<CropBox>({ x: 0, y: 0, width: 1, height: 1 });
  const [aspect, setAspect] = useState<CropAspect>("free");
  const [sizePresetId, setSizePresetId] = useState("custom");
  const [pixelDraft, setPixelDraft] = useState<PixelDraft | null>(null);
  const [clampNotice, setClampNotice] = useState("");
  const cropQuality = 92;
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [sourceVersion, setSourceVersion] = useState(0);
  const [result, setResult] = useState<CroppedImage | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageHostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const sourceBitmapRef = useRef<BrowserImage | null>(null);
  const sourceUrlRef = useRef<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const interactionRef = useRef<CropInteraction | null>(null);

  useEffect(() => () => {
    sourceBitmapRef.current?.close();
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  useEffect(() => {
    const host = stageHostRef.current;
    const bitmap = sourceBitmapRef.current;
    if (!host || !bitmap) return;
    const observer = new ResizeObserver(() => {
      const availableWidth = Math.max(1, host.clientWidth - 16);
      const scale = Math.min(availableWidth / bitmap.width, 520 / bitmap.height, 1);
      setStageSize({
        width: Math.max(1, Math.floor(bitmap.width * scale)),
        height: Math.max(1, Math.floor(bitmap.height * scale)),
      });
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, [sourceVersion]);

  useEffect(() => {
    const bitmap = sourceBitmapRef.current;
    const canvas = previewCanvasRef.current;
    if (!bitmap || !canvas) return;

    const left = clamp(Math.round(crop.x * bitmap.width), 0, bitmap.width - 1);
    const top = clamp(Math.round(crop.y * bitmap.height), 0, bitmap.height - 1);
    const width = clamp(Math.round(crop.width * bitmap.width), 1, bitmap.width - left);
    const height = clamp(Math.round(crop.height * bitmap.height), 1, bitmap.height - top);
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context?.drawImage(bitmap.source, left, top, width, height, 0, 0, width, height);
  }, [crop, sourceVersion]);

  const clearResult = () => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResult(null);
  };

  const invalidateResult = () => {
    setClampNotice("");
    clearResult();
  };

  /** Any hand edit to the crop drops the chosen preset and the previous result. */
  const invalidateCropEdit = () => {
    setSizePresetId("custom");
    invalidateResult();
  };

  const toPixelBox = (box: CropBox): PixelBox => ({
    x: Math.round(box.x * (dimensions?.width ?? 1)),
    y: Math.round(box.y * (dimensions?.height ?? 1)),
    width: Math.max(1, Math.round(box.width * (dimensions?.width ?? 1))),
    height: Math.max(1, Math.round(box.height * (dimensions?.height ?? 1))),
  });

  /**
   * Turns an explicit width/height request into a real crop size. The field the user
   * actually edited wins, and the active aspect ratio governs the other one.
   */
  const resolveSize = (requestedWidth: number, requestedHeight: number, edited: "width" | "height") => {
    if (!dimensions) return { width: requestedWidth, height: requestedHeight };
    if (aspect === "free") {
      return {
        width: clamp(requestedWidth, 1, dimensions.width),
        height: clamp(requestedHeight, 1, dimensions.height),
      };
    }

    const targetRatio = cropAspectValues[aspect];
    const requested = edited === "width"
      ? { width: requestedWidth, height: Math.round(requestedWidth / targetRatio) }
      : { width: Math.round(requestedHeight * targetRatio), height: requestedHeight };
    const fits = requested.width <= dimensions.width && requested.height <= dimensions.height;
    const largest = targetRatio > dimensions.width / dimensions.height
      ? { width: dimensions.width, height: Math.round(dimensions.width / targetRatio) }
      : { width: Math.round(dimensions.height * targetRatio), height: dimensions.height };
    const chosen = fits ? requested : largest;

    return {
      width: clamp(chosen.width, 1, dimensions.width),
      height: clamp(chosen.height, 1, dimensions.height),
    };
  };

  const setPixelBox = (width: number, height: number, x: number, y: number) => {
    if (!dimensions) return;
    const safeWidth = clamp(Math.round(width), 1, dimensions.width);
    const safeHeight = clamp(Math.round(height), 1, dimensions.height);
    const safeX = clamp(Math.round(x), 0, dimensions.width - safeWidth);
    const safeY = clamp(Math.round(y), 0, dimensions.height - safeHeight);
    invalidateResult();
    setClampNotice(
      width > dimensions.width || height > dimensions.height
        ? `Crop size was limited to the ${dimensions.width} × ${dimensions.height} px source image.`
        : "",
    );
    setCrop({
      x: safeX / dimensions.width,
      y: safeY / dimensions.height,
      width: safeWidth / dimensions.width,
      height: safeHeight / dimensions.height,
    });
  };

  const applySizePreset = (presetId: string) => {
    const preset = cropSizePresets.find((option) => option.id === presetId);
    if (!preset) return;
    setPixelDraft(null);
    if (preset.width === 0 || !dimensions) {
      setSizePresetId(presetId);
      invalidateResult();
      return;
    }
    if (aspect !== "free" && Math.abs(cropAspectValues[aspect] - preset.width / preset.height) > 0.01) {
      setAspect("free");
    }
    const current = toPixelBox(crop);
    setSizePresetId(presetId);
    setPixelBox(
      preset.width,
      preset.height,
      current.x + (current.width - preset.width) / 2,
      current.y + (current.height - preset.height) / 2,
    );
  };

  const parseDraftValue = (value: string, fallback: number) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const commitPixelDraft = () => {
    if (!pixelDraft || !dimensions) return;
    const current = toPixelBox(crop);
    const size = resolveSize(
      Math.max(1, parseDraftValue(pixelDraft.width, current.width)),
      Math.max(1, parseDraftValue(pixelDraft.height, current.height)),
      pixelDraft.edited === "height" ? "height" : "width",
    );
    setSizePresetId("custom");
    setPixelBox(
      size.width,
      size.height,
      clamp(parseDraftValue(pixelDraft.x, current.x), 0, dimensions.width - size.width),
      clamp(parseDraftValue(pixelDraft.y, current.y), 0, dimensions.height - size.height),
    );
    setPixelDraft(null);
  };

  const clearSource = () => {
    sourceBitmapRef.current?.close();
    sourceBitmapRef.current = null;
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    sourceUrlRef.current = null;
    setSourceUrl(null);
    setDimensions(null);
    setStageSize({ width: 0, height: 0 });
  };

  const acceptFile = async (selected: File | undefined) => {
    if (!selected || isProcessing) return;
    const format = detectFormat(selected);
    if (!format) {
      clearResult();
      clearSource();
      setFile(null);
      setSourceFormat(null);
      setError("Please choose a JPG, PNG, or WebP image.");
      return;
    }

    clearResult();
    clearSource();
    setFile(selected);
    setSourceFormat(format);
    setCrop({ x: 0, y: 0, width: 1, height: 1 });
    setAspect("free");
    setSizePresetId("custom");
    setPixelDraft(null);
    setClampNotice("");
    setError("");
    setIsProcessing(true);
    setProgress(10);
    setProgressMessage("Loading image…");

    let bitmap: BrowserImage | null = null;
    try {
      bitmap = await loadBrowserImage(selected);
      const objectUrl = URL.createObjectURL(selected);
      sourceBitmapRef.current = bitmap;
      bitmap = null;
      sourceUrlRef.current = objectUrl;
      setSourceUrl(objectUrl);
      setDimensions({ width: sourceBitmapRef.current.width, height: sourceBitmapRef.current.height });
      setSourceVersion((version) => version + 1);
      setProgress(100);
      setProgressMessage("Image ready to crop");
    } catch (err) {
      bitmap?.close();
      clearSource();
      setFile(null);
      setSourceFormat(null);
      setError(`Could not open this image. ${err instanceof Error ? err.message : "Please try another file."}`);
      setProgressMessage("");
    } finally {
      setIsProcessing(false);
    }
  };

  const updateCropFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const interaction = interactionRef.current;
    const stage = stageRef.current;
    if (!interaction || !stage) return;
    const bounds = stage.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const deltaX = (event.clientX - interaction.startX) / bounds.width;
    const deltaY = (event.clientY - interaction.startY) / bounds.height;
    const start = interaction.crop;

    if (interaction.handle === "move") {
      invalidateCropEdit();
      setCrop({
        ...start,
        x: clamp(start.x + deltaX, 0, 1 - start.width),
        y: clamp(start.y + deltaY, 0, 1 - start.height),
      });
      return;
    }

    if (aspect === "free") {
      const minSize = 0.025;
      let left = start.x;
      let right = start.x + start.width;
      let top = start.y;
      let bottom = start.y + start.height;
      if (interaction.handle.includes("w")) left = clamp(start.x + deltaX, 0, right - minSize);
      if (interaction.handle.includes("e")) right = clamp(start.x + start.width + deltaX, left + minSize, 1);
      if (interaction.handle.includes("n")) top = clamp(start.y + deltaY, 0, bottom - minSize);
      if (interaction.handle.includes("s")) bottom = clamp(start.y + start.height + deltaY, top + minSize, 1);
      invalidateCropEdit();
      setCrop({ x: left, y: top, width: right - left, height: bottom - top });
      return;
    }

    const imageRatio = (dimensions?.width ?? 1) / (dimensions?.height ?? 1);
    const normalizedRatio = cropAspectValues[aspect] / imageRatio;
    const west = interaction.handle.includes("w");
    const north = interaction.handle.includes("n");
    const anchorX = west ? start.x + start.width : start.x;
    const anchorY = north ? start.y + start.height : start.y;
    const widthFromX = start.width + (west ? -deltaX : deltaX);
    const widthFromY = (start.height + (north ? -deltaY : deltaY)) * normalizedRatio;
    const proposedWidth = Math.abs(widthFromX - start.width) >= Math.abs(widthFromY - start.width)
      ? widthFromX
      : widthFromY;
    const maxWidth = Math.min(
      west ? anchorX : 1 - anchorX,
      (north ? anchorY : 1 - anchorY) * normalizedRatio,
    );
    const width = clamp(proposedWidth, Math.min(0.025, maxWidth), maxWidth);
    const height = width / normalizedRatio;
    invalidateCropEdit();
    setCrop({ x: west ? anchorX - width : anchorX, y: north ? anchorY - height : anchorY, width, height });
  };

  const beginCropInteraction = (event: PointerEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    event.preventDefault();
    const target = event.target instanceof HTMLElement ? event.target : null;
    const handle = (target?.dataset.cropHandle as CropHandle | undefined) ?? "move";
    event.currentTarget.setPointerCapture(event.pointerId);
    interactionRef.current = {
      handle,
      startX: event.clientX,
      startY: event.clientY,
      crop: { ...crop },
    };
  };

  const changeAspect = (value: CropAspect) => {
    setAspect(value);
    setPixelDraft(null);
    if (value !== "free" && dimensions) {
      setCrop((current) => cropToAspect(current, cropAspectValues[value], dimensions.width / dimensions.height));
    }
    invalidateCropEdit();
  };

  const cropImage = async () => {
    const source = sourceBitmapRef.current;
    if (!file || !sourceFormat || !source || !dimensions) {
      setError("Please upload a supported image first.");
      return;
    }

    setIsProcessing(true);
    setError("");
    clearResult();
    setProgress(10);
    setProgressMessage("Preparing crop…");
    let bitmap: BrowserImage | null = null;
    let canvas: HTMLCanvasElement | null = null;
    try {
      bitmap = await loadBrowserImage(file);
      const left = clamp(Math.round(crop.x * bitmap.width), 0, bitmap.width - 1);
      const top = clamp(Math.round(crop.y * bitmap.height), 0, bitmap.height - 1);
      const width = clamp(Math.round(crop.width * bitmap.width), 1, bitmap.width - left);
      const height = clamp(Math.round(crop.height * bitmap.height), 1, bitmap.height - top);
      setProgress(40);
      setProgressMessage("Cropping image.");
      await yieldToBrowser();

      const { canvas: sizedCanvas, context } = createSizedCanvas(
        width,
        height,
        "Image Cropper",
        { alpha: sourceFormat !== "image/jpeg" },
      );
      canvas = sizedCanvas;
      context.drawImage(bitmap.source, left, top, width, height, 0, 0, width, height);
      bitmap.close();
      bitmap = null;
      setProgress(75);
      setProgressMessage("Saving cropped image.");

      const blob = await canvasToBlob(
        canvas,
        sourceFormat,
        sourceFormat === "image/jpeg" ? cropQuality / 100 : undefined,
        "Image Cropper",
      );
      if (blob.type !== sourceFormat) {
        throw new Error(`${formatExtensions[sourceFormat].toUpperCase()} output is not supported by this browser.`);
      }
      canvas.width = 0;
      canvas.height = 0;
      canvas = null;

      const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
      const filename = `${baseName}-cropped.${formatExtensions[sourceFormat]}`;
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResult({ blob, url, filename, width, height });
      setProgress(100);
      setProgressMessage("Crop complete");
    } catch (err) {
      setError(`Could not crop this image. ${err instanceof Error ? err.message : "Please try again."}`);
      setProgressMessage("");
    } finally {
      bitmap?.close();
      releaseCanvas(canvas);
      setIsProcessing(false);
    }
  };

  const resetTool = () => {
    clearResult();
    clearSource();
    setFile(null);
    setSourceFormat(null);
    setCrop({ x: 0, y: 0, width: 1, height: 1 });
    setAspect("free");
    setSizePresetId("custom");
    setPixelDraft(null);
    setClampNotice("");
    setError("");
    setProgress(0);
    setProgressMessage("");
    interactionRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const pixelBox = toPixelBox(crop);

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">✂️ Crop Image</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-6">
          <label htmlFor="crop-image-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload image</label>
          <label
            onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => { event.preventDefault(); setIsDragging(false); void acceptFile(event.dataTransfer.files?.[0]); }}
            className={`block cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"}`}
          >
            <p className="text-3xl mb-2">🖼️</p>
            <p className="text-gray-800 dark:text-white font-medium">Drag and drop an image here</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">or click to browse — JPG, PNG, or WebP</p>
            <input id="crop-image-upload" ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={(event) => { const selected = event.target.files?.[0]; event.target.value = ""; void acceptFile(selected); }} disabled={isProcessing} className="sr-only" />
          </label>
        </div>

        {file && dimensions && <div className="mb-5 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="font-semibold text-blue-800 dark:text-blue-300 truncate">{file.name}</p>
          <p className="text-sm text-blue-600 dark:text-blue-400">{formatExtensions[sourceFormat!].toUpperCase()} · {dimensions.width} × {dimensions.height} px</p>
        </div>}

        {file && dimensions && <div className="mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
            <div>
              <label htmlFor="crop-image-aspect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Aspect ratio</label>
              <select id="crop-image-aspect" value={aspect} onChange={(event) => changeAspect(event.target.value as CropAspect)} disabled={isProcessing} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                {cropAspectOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="crop-image-preset" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preset size</label>
              <select id="crop-image-preset" value={sizePresetId} onChange={(event) => applySizePreset(event.target.value)} disabled={isProcessing} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                {cropSizePresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Drag the crop area to move it, drag an edge or corner to resize, or type exact pixel values below.</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {([
              { id: "crop-input-x", field: "x", label: "X offset", min: 0, max: dimensions.width - 1 },
              { id: "crop-input-y", field: "y", label: "Y offset", min: 0, max: dimensions.height - 1 },
              { id: "crop-input-width", field: "width", label: "Width", min: 1, max: dimensions.width },
              { id: "crop-input-height", field: "height", label: "Height", min: 1, max: dimensions.height },
            ] as const).map((input) => <div key={input.field}>
              <label htmlFor={input.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{input.label}</label>
              <input
                id={input.id}
                type="number"
                inputMode="numeric"
                min={input.min}
                max={input.max}
                value={pixelDraft ? pixelDraft[input.field] : String(pixelBox[input.field])}
                onFocus={() => setPixelDraft({
                  x: String(pixelBox.x),
                  y: String(pixelBox.y),
                  width: String(pixelBox.width),
                  height: String(pixelBox.height),
                  edited: "width",
                })}
                onChange={(event) => setPixelDraft((draft) => ({
                  x: draft?.x ?? String(pixelBox.x),
                  y: draft?.y ?? String(pixelBox.y),
                  width: draft?.width ?? String(pixelBox.width),
                  height: draft?.height ?? String(pixelBox.height),
                  edited: input.field === "height" ? "height" : "width",
                  [input.field]: event.target.value,
                }))}
                onBlur={commitPixelDraft}
                onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
                disabled={isProcessing}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              />
            </div>)}
          </div>
          {clampNotice && <p role="status" className="text-xs text-amber-700 dark:text-amber-400 mb-4">{clampNotice}</p>}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Crop area</h3>
              <div ref={stageHostRef} className="w-full flex justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900 p-2">
                {sourceUrl && stageSize.width > 0 && <div
                  ref={stageRef}
                  className="relative shrink-0 overflow-hidden touch-none select-none"
                  style={{ width: stageSize.width, height: stageSize.height }}
                  onPointerMove={updateCropFromPointer}
                  onPointerUp={() => { interactionRef.current = null; }}
                  onPointerCancel={() => { interactionRef.current = null; }}
                >
                  <Image src={sourceUrl} alt="Image being cropped" width={dimensions.width} height={dimensions.height} unoptimized draggable={false} className="pointer-events-none absolute inset-0 h-full w-full max-w-none select-none object-fill" />
                  <div
                    role="group"
                    aria-label="Crop selection. Drag to move, or drag an edge or corner handle to resize. Arrow keys move the selection."
                    tabIndex={0}
                    onPointerDown={beginCropInteraction}
                    onKeyDown={(event) => {
                      const step = event.shiftKey ? 0.05 : 0.01;
                      let x = crop.x;
                      let y = crop.y;
                      if (event.key === "ArrowLeft") x = clamp(x - step, 0, 1 - crop.width);
                      else if (event.key === "ArrowRight") x = clamp(x + step, 0, 1 - crop.width);
                      else if (event.key === "ArrowUp") y = clamp(y - step, 0, 1 - crop.height);
                      else if (event.key === "ArrowDown") y = clamp(y + step, 0, 1 - crop.height);
                      else return;
                      event.preventDefault();
                      invalidateCropEdit();
                      setCrop({ ...crop, x, y });
                    }}
                    className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.48)] touch-none cursor-move focus:outline focus:outline-2 focus:outline-blue-500"
                    style={{ left: `${crop.x * 100}%`, top: `${crop.y * 100}%`, width: `${crop.width * 100}%`, height: `${crop.height * 100}%` }}
                  >
                    {cropHandles.map((handle) => <span
                      key={handle.id}
                      data-crop-handle={handle.id}
                      aria-hidden="true"
                      className={`absolute z-10 h-4 w-4 rounded-sm border-2 border-blue-600 bg-white shadow ${handle.className}`}
                    />)}
                  </div>
                </div>}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Selection: {pixelBox.width} × {pixelBox.height} px at {pixelBox.x}, {pixelBox.y}</p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Live preview</h3>
              <div className="min-h-32 max-h-[28rem] rounded-lg bg-gray-100 dark:bg-gray-900 p-3 flex items-center justify-center overflow-auto">
                <canvas ref={previewCanvasRef} aria-label="Live preview of cropped image" className="max-h-[26rem] max-w-full object-contain" />
              </div>
            </div>
          </div>
        </div>}

        {error && <div role="alert" className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"><p className="text-red-800 dark:text-red-300">{error}</p></div>}

        {isProcessing && <div className="mb-6" aria-live="polite">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-2"><span>{progressMessage}</span><span>{progress}%</span></div>
          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"><div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} /></div>
        </div>}

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => void cropImage()} disabled={!dimensions || isProcessing} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors">{isProcessing ? "Cropping…" : "Crop Image"}</button>
          <button onClick={resetTool} disabled={isProcessing} className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3 px-6 rounded-lg transition-colors">Reset</button>
        </div>

        {result && sourceFormat && <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-300 font-semibold mb-1">Image cropped successfully.</p>
          <p className="text-sm text-green-700 dark:text-green-400 mb-3">{result.width} × {result.height} px · {formatBytes(result.blob.size)}</p>
          <div className="mb-4 rounded-lg bg-gray-100 dark:bg-gray-900 p-3 flex justify-center"><Image src={result.url} alt="Cropped image preview" width={1200} height={900} unoptimized className="max-h-[28rem] max-w-full object-contain rounded" /></div>
          <a href={result.url} download={result.filename} className="inline-flex bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">Download Cropped Image</a>
        </div>}
      </div>
    </div>
  );
}

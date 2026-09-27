"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { degrees, PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { assertPdfMagic, compressPdf, isPdfFile } from "@/lib/compress-pdf";
import { PDF_LIMITS, formatPageCount, planPageRender } from "@/lib/pdf-limits";
import { useDirectToolRoute } from "@/lib/use-direct-tool-route";

export default function PDFTools() {
  const { activeTool, setActiveTool, openTool } = useDirectToolRoute("pdf", [
    "compress", "merge", "jpg-to-pdf", "pdf-to-word", "to-images", "split", "rotate",
  ]);

  const tools = [
    { id: "compress", name: "Compress PDF", description: "Reduce PDF file size while maintaining quality", icon: "📉" },
    { id: "merge", name: "Merge PDF", description: "Combine multiple PDF files into one", icon: "🔗" },
    { id: "jpg-to-pdf", name: "JPG to PDF", description: "Turn JPG and JPEG images into one PDF", icon: "📷" },
    { id: "pdf-to-word", name: "PDF to Word", description: "Extract PDF text into a Word document", icon: "📝" },
    { id: "to-images", name: "PDF to Images", description: "Convert PDF pages to images", icon: "🖼️" },
    { id: "split", name: "Split PDF", description: "Split a PDF into separate pages", icon: "✂️" },
    { id: "rotate", name: "Rotate PDF", description: "Rotate all or selected PDF pages", icon: "🔄" },
  ];

  if (activeTool) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16">
          <Link
            href="/pdf"
            onClick={() => setActiveTool(null)}
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-8"
          >
            ← Back to PDF Tools
          </Link>
          {activeTool === "merge" && <MergePDF />}
          {activeTool === "split" && <SplitPDF />}
          {activeTool === "compress" && <CompressPDF />}
          {activeTool === "to-images" && <PdfToImages />}
          {activeTool === "jpg-to-pdf" && <JpgToPDF />}
          {activeTool === "pdf-to-word" && <PdfToWord />}
          {activeTool === "rotate" && <RotatePDF />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <Link
          href="/"
          className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-blue-300 dark:hover:border-gray-500 dark:hover:bg-gray-700 dark:focus-visible:ring-offset-gray-900"
        >
          ← Back to Home
        </Link>

        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-3">
            <span className="text-4xl sm:text-5xl">📄</span>
            PDF Tools
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Merge, split, compress, and convert your PDF files with ease
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={`/pdf?tool=${encodeURIComponent(tool.id)}`}
              onClick={(event) => { event.preventDefault(); openTool(tool.id); }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 cursor-pointer"
            >
              <div className="text-4xl mb-4">{tool.icon}</div>
              <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">
                {tool.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

type RotatePreviewPage = { pageNumber: number; previewUrl: string; originalRotation: number };

function RotatePDF() {
  const [file, setFile] = useState<File | null>(null);
  const [previewPages, setPreviewPages] = useState<RotatePreviewPage[]>([]);
  const [pageRotations, setPageRotations] = useState<number[]>([]);
  const [selectedPages, setSelectedPages] = useState<boolean[]>([]);
  const [rotation, setRotation] = useState<90 | -90 | 180>(90);
  const [applyTo, setApplyTo] = useState<"all" | "selected">("all");
  const [rotatedPdfUrl, setRotatedPdfUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef(new Set<string>());
  const resultUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current.clear();
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
  }, []);

  const clearPreviews = () => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current.clear();
    setPreviewPages([]);
  };

  const clearResult = () => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setRotatedPdfUrl(null);
  };

  const acceptFile = async (selected: File | undefined) => {
    if (!selected) return;
    if (fileInputRef.current) fileInputRef.current.value = "";
    clearPreviews();
    clearResult();
    setFile(null);
    setPageRotations([]);
    setSelectedPages([]);
    setError("");
    setProgressMessage("");

    if (!isPdfFile(selected)) {
      setError("Please select a PDF file (.pdf).");
      return;
    }

    setIsProcessing(true);
    let destroyPdf: (() => Promise<void>) | null = null;
    try {
      await assertPdfMagic(selected);
      const pdfBytes = new Uint8Array(await selected.arrayBuffer());
      const sourcePdf = await PDFDocument.load(pdfBytes);
      const pages = sourcePdf.getPages();
      if (pages.length === 0) throw new Error("This PDF does not contain any pages.");
      const initialRotations = pages.map((page) => page.getRotation().angle);
      setProgressMessage(`Preparing previews for ${pages.length} ${pages.length === 1 ? "page" : "pages"}…`);

      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const loadingTask = pdfjs.getDocument({ data: pdfBytes });
      destroyPdf = () => loadingTask.destroy();
      const previewPdf = await loadingTask.promise;
      const previews: RotatePreviewPage[] = [];
      let previewPixels = 0;

      if (previewPdf.numPages > PDF_LIMITS.maxRenderedPages) {
        throw new Error(
          `This PDF has ${formatPageCount(previewPdf.numPages)}. Previews are limited to ` +
            `${formatPageCount(PDF_LIMITS.maxRenderedPages)} at a time so the browser does not run ` +
            `out of memory. Use Split PDF to work through it in smaller chunks.`,
        );
      }

      for (let pageNumber = 1; pageNumber <= previewPdf.numPages; pageNumber += 1) {
        setProgressMessage(`Rendering page ${pageNumber} of ${previewPdf.numPages}…`);
        const page = await previewPdf.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const plan = planPageRender(
          baseViewport.width,
          baseViewport.height,
          1,
          previewPixels,
        );
        previewPixels += plan.width * plan.height;
        const canvas = document.createElement("canvas");
        canvas.width = plan.width;
        canvas.height = plan.height;
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("Your browser could not render the PDF page previews.");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        const renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport: page.getViewport({ scale: plan.scale }),
        });
        await renderTask.promise;
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((value) => value ? resolve(value) : reject(new Error(`Could not render page ${pageNumber}.`)), "image/png");
        });
        canvas.width = 0;
        canvas.height = 0;
        page.cleanup();
        const previewUrl = URL.createObjectURL(blob);
        previewUrlsRef.current.add(previewUrl);
        previews.push({ pageNumber, previewUrl, originalRotation: initialRotations[pageNumber - 1] });
      }

      if (previewPdf.numPages !== pages.length) {
        throw new Error("The PDF page count could not be read consistently.");
      }
      setFile(selected);
      setPageRotations(initialRotations);
      setSelectedPages(pages.map(() => false));
      setPreviewPages(previews);
      setError("");
    } catch (fileError) {
      clearPreviews();
      setError(`This PDF could not be opened. ${fileError instanceof Error ? fileError.message : "Choose a valid, readable PDF and try again."}`);
    } finally {
      if (destroyPdf) await destroyPdf().catch(() => undefined);
      setIsProcessing(false);
      setProgressMessage("");
    }
  };

  const togglePage = (index: number) => {
    setSelectedPages((current) => current.map((selected, pageIndex) => pageIndex === index ? !selected : selected));
    clearResult();
  };

  const rotatePDF = async () => {
    if (!file) {
      setError("Please upload a PDF file first.");
      return;
    }
    const pageIndices = applyTo === "all"
      ? pageRotations.map((_, index) => index)
      : selectedPages.flatMap((selected, index) => selected ? [index] : []);
    if (pageIndices.length === 0) {
      setError("Select at least one page to rotate, or choose All pages.");
      return;
    }

    setIsProcessing(true);
    setError("");
    clearResult();
    setProgressMessage("Applying rotation…");
    try {
      const pdf = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
      const pdfPages = pdf.getPages();
      if (pdfPages.length !== pageRotations.length) {
        throw new Error("The PDF page count changed. Upload the file again and retry.");
      }
      const updatedRotations = [...pageRotations];
      for (const index of pageIndices) {
        const nextRotation = ((updatedRotations[index] + rotation) % 360 + 360) % 360;
        updatedRotations[index] = nextRotation;
      }
      pdfPages.forEach((page, index) => page.setRotation(degrees(updatedRotations[index])));
      const bytes = await pdf.save();
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
      resultUrlRef.current = url;
      setRotatedPdfUrl(url);
      setPageRotations(updatedRotations);
      setProgressMessage(`Rotated ${pageIndices.length} ${pageIndices.length === 1 ? "page" : "pages"}.`);
    } catch (rotationError) {
      setError(`This PDF could not be rotated. ${rotationError instanceof Error ? rotationError.message : "Check the PDF and try again."}`);
      setProgressMessage("");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetTool = () => {
    clearPreviews();
    clearResult();
    setFile(null);
    setPageRotations([]);
    setSelectedPages([]);
    setApplyTo("all");
    setRotation(90);
    setProgressMessage("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">🔄 Rotate PDF</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-6">
          <label htmlFor="rotate-pdf-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select PDF File</label>
          <input
            id="rotate-pdf-upload"
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => void acceptFile(event.target.files?.[0])}
            disabled={isProcessing}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">PDFs are rendered and rotated locally in your browser.</p>
        </div>

        {file && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-800 dark:text-blue-300 font-semibold">📄 {file.name}</p>
            <p className="text-blue-600 dark:text-blue-400 text-sm">{previewPages.length} {previewPages.length === 1 ? "page" : "pages"}</p>
          </div>
        )}

        {error && (
          <div role="alert" className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {isProcessing && (
          <div role="status" aria-live="polite" className="mb-4 flex items-center gap-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-blue-800 dark:text-blue-300">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-300 border-t-blue-700 dark:border-blue-700 dark:border-t-blue-300" aria-hidden="true" />
            <span>{progressMessage || "Processing PDF…"}</span>
          </div>
        )}

        {previewPages.length > 0 && (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="rotate-pdf-angle" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Rotation</label>
                <select id="rotate-pdf-angle" value={rotation} onChange={(event) => { setRotation(Number(event.target.value) as 90 | -90 | 180); clearResult(); }} disabled={isProcessing} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  <option value={90}>90° clockwise</option>
                  <option value={-90}>90° counterclockwise</option>
                  <option value={180}>180°</option>
                </select>
              </div>
              <fieldset>
                <legend className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Apply to</legend>
                <div className="flex h-[50px] items-center gap-5 rounded-lg border border-gray-300 px-4 dark:border-gray-600">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200"><input type="radio" name="rotate-scope" value="all" checked={applyTo === "all"} onChange={() => { setApplyTo("all"); clearResult(); }} disabled={isProcessing} />All pages</label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200"><input type="radio" name="rotate-scope" value="selected" checked={applyTo === "selected"} onChange={() => { setApplyTo("selected"); clearResult(); }} disabled={isProcessing} />Selected pages</label>
                </div>
              </fieldset>
            </div>

            {applyTo === "selected" && <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">Select the pages you want to rotate.</p>}
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {previewPages.map((page, index) => {
                const previewRotation = ((pageRotations[index] - page.originalRotation + 540) % 360) - 180;
                const appliedRotation = pageRotations[index];
                return (
                  <div key={page.pageNumber} className={`overflow-hidden rounded-lg border bg-gray-50 dark:bg-gray-700 ${selectedPages[index] && applyTo === "selected" ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900" : "border-gray-200 dark:border-gray-600"}`}>
                    {applyTo === "selected" && (
                      <label className="flex cursor-pointer items-center gap-2 border-b border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-200">
                        <input type="checkbox" checked={selectedPages[index] ?? false} onChange={() => togglePage(index)} disabled={isProcessing} />
                        Select page {page.pageNumber}
                      </label>
                    )}
                    <div className="flex h-44 items-center justify-center overflow-hidden bg-gray-100 p-2 dark:bg-gray-900/50">
                      <Image src={page.previewUrl} alt={`Preview of PDF page ${page.pageNumber}`} width={560} height={720} unoptimized className="max-h-full max-w-full object-contain transition-transform" style={{ transform: `rotate(${previewRotation}deg)` }} />
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
                      <span>Page {page.pageNumber}</span>
                      <span>{appliedRotation}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => void rotatePDF()} disabled={!file || isProcessing} className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400">
            {isProcessing && file ? "Rotating…" : "Rotate PDF"}
          </button>
          <button type="button" onClick={resetTool} disabled={isProcessing} className="rounded-lg bg-gray-100 px-6 py-3 font-semibold text-gray-800 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">Reset</button>
        </div>

        {rotatedPdfUrl && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <p className="mb-3 font-semibold text-green-800 dark:text-green-300">✓ PDF rotated successfully.</p>
            <a href={rotatedPdfUrl} download={`${(file?.name ?? "document.pdf").replace(/\.pdf$/i, "") || "document"}-rotated.pdf`} className="inline-flex rounded-lg bg-green-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-green-700">Download PDF</a>
          </div>
        )}
      </div>
    </div>
  );
}

function PdfToWord() {
  const [file, setFile] = useState<File | null>(null);
  const [wordUrl, setWordUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wordUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (wordUrlRef.current) URL.revokeObjectURL(wordUrlRef.current);
    wordUrlRef.current = null;
  }, []);

  const clearResult = () => {
    if (wordUrlRef.current) URL.revokeObjectURL(wordUrlRef.current);
    wordUrlRef.current = null;
    setWordUrl(null);
  };

  const acceptFile = async (selected: File | undefined) => {
    if (!selected) return;
    clearResult();
    setFile(null);
    if (!isPdfFile(selected)) {
      setError("Please select a PDF file (.pdf).");
      return;
    }
    try {
      await assertPdfMagic(selected);
      setFile(selected);
      setError("");
      setProgressMessage("");
    } catch (selectionError) {
      setError(selectionError instanceof Error ? selectionError.message : "That file does not look like a valid PDF.");
    }
  };

  const convertToWord = async () => {
    if (!file) {
      setError("Please upload a PDF file first.");
      return;
    }

    setIsProcessing(true);
    setError("");
    clearResult();
    setProgressMessage("Loading PDF…");
    let destroyPdf: (() => Promise<void>) | null = null;

    try {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
      destroyPdf = () => loadingTask.destroy();
      const pdf = await loadingTask.promise;
      const pageTexts: string[] = [];

      if (pdf.numPages > PDF_LIMITS.maxTextPages) {
        throw new Error(
          `This PDF has ${formatPageCount(pdf.numPages)}, which is more than the ` +
            `${formatPageCount(PDF_LIMITS.maxTextPages)} this tool will process in one go. ` +
            `Use Split PDF to convert it in smaller chunks.`,
        );
      }

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        setProgressMessage(`Extracting text from page ${pageNumber} of ${pdf.numPages}…`);
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        let pageText = "";
        for (const item of textContent.items) {
          if (!("str" in item) || !item.str) continue;
          pageText += item.str;
          pageText += item.hasEOL ? "\n" : " ";
        }
        pageTexts.push(pageText.replace(/[ \t]+\n/g, "\n").trim());
        page.cleanup();
      }

      if (!pageTexts.some((pageText) => pageText.trim().length > 0)) {
        throw new Error("No selectable text was found. Scanned or image-only PDFs cannot be converted without OCR.");
      }

      setProgressMessage("Building Word document…");
      const { createDocxBytes } = await import("@/lib/pdf-to-word");
      const bytes = await createDocxBytes(pageTexts);
      const blob = new Blob([bytes as BlobPart], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      const url = URL.createObjectURL(blob);
      wordUrlRef.current = url;
      setWordUrl(url);
      setProgressMessage(`Word document ready (${formatPageCount(pdf.numPages)}).`);
    } catch (conversionError) {
      setError(`Could not process this PDF. ${conversionError instanceof Error ? conversionError.message : "Check the file and try again."}`);
      setProgressMessage("");
    } finally {
      if (destroyPdf) await destroyPdf().catch(() => undefined);
      setIsProcessing(false);
    }
  };

  const resetTool = () => {
    setFile(null);
    setError("");
    setProgressMessage("");
    clearResult();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">📝 PDF to Word</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-6">
          <label htmlFor="pdf-to-word-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select PDF File</label>
          <input
            id="pdf-to-word-upload"
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => void acceptFile(event.target.files?.[0])}
            disabled={isProcessing}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Text is extracted and converted locally in your browser. Scanned PDFs need OCR and are not supported.</p>
        </div>

        {file && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-800 dark:text-blue-300 font-semibold">📄 {file.name}</p>
            <p className="text-blue-600 dark:text-blue-400 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}

        {error && (
          <div role="alert" className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {isProcessing && (
          <div role="status" aria-live="polite" className="mb-4 flex items-center gap-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-blue-800 dark:text-blue-300">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-300 border-t-blue-700 dark:border-blue-700 dark:border-t-blue-300" aria-hidden="true" />
            <span>{progressMessage || "Converting PDF…"}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button type="button" onClick={() => void convertToWord()} disabled={!file || isProcessing} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            {isProcessing ? "Converting…" : "Convert to Word"}
          </button>
          <button type="button" onClick={resetTool} disabled={isProcessing} className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors">Reset</button>
        </div>

        {wordUrl && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-300 font-semibold mb-3">✓ Word document created successfully.</p>
            <a href={wordUrl} download={`${(file?.name ?? "document.pdf").replace(/\.pdf$/i, "") || "document"}.docx`} className="inline-flex bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">Download Word</a>
          </div>
        )}
      </div>
    </div>
  );
}

type JpegImage = {
  id: string;
  file: File;
  previewUrl: string;
};

function JpgToPDF() {
  const [images, setImages] = useState<JpegImage[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef(new Set<string>());
  const pdfUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current.clear();
    if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    pdfUrlRef.current = null;
  }, []);

  const clearPdf = () => {
    if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    pdfUrlRef.current = null;
    setPdfUrl(null);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (selectedFiles.length === 0) return;

    clearPdf();
    const accepted: JpegImage[] = [];
    const rejected: string[] = [];

    for (const file of selectedFiles) {
      const hasJpegExtension = /\.jpe?g$/i.test(file.name);
      const hasJpegMimeType = !file.type || file.type === "image/jpeg";
      const isJpeg = hasJpegExtension && hasJpegMimeType;
      if (!isJpeg) {
        rejected.push(`${file.name}: choose a JPG or JPEG image.`);
        continue;
      }
      if (file.size === 0) {
        rejected.push(`${file.name}: the file is empty.`);
        continue;
      }

      let previewUrl: string | null = null;
      try {
        const bitmap = await createImageBitmap(file);
        bitmap.close();
        previewUrl = URL.createObjectURL(file);
        previewUrlsRef.current.add(previewUrl);
        accepted.push({ id: previewUrl, file, previewUrl });
      } catch {
        rejected.push(`${file.name}: this file is not a valid, readable JPEG image.`);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          previewUrlsRef.current.delete(previewUrl);
        }
      }
    }

    if (accepted.length > 0) {
      setImages((current) => [...current, ...accepted]);
    }
    setError(rejected.join(" "));
  };

  const removeImage = (id: string) => {
    const image = images.find((item) => item.id === id);
    if (image) {
      URL.revokeObjectURL(image.previewUrl);
      previewUrlsRef.current.delete(image.previewUrl);
    }
    setImages((current) => current.filter((item) => item.id !== id));
    clearPdf();
  };

  const moveImage = (index: number, offset: number) => {
    setImages((current) => {
      const next = [...current];
      const [image] = next.splice(index, 1);
      next.splice(index + offset, 0, image);
      return next;
    });
    clearPdf();
  };

  const convertToPDF = async () => {
    if (images.length === 0) {
      setError("Select at least one JPG or JPEG image to create a PDF.");
      return;
    }

    setIsProcessing(true);
    setError("");
    clearPdf();
    try {
      const pdf = await PDFDocument.create();
      for (const image of images) {
        const jpeg = await pdf.embedJpg(new Uint8Array(await image.file.arrayBuffer()));
        const page = pdf.addPage([jpeg.width, jpeg.height]);
        page.drawImage(jpeg, { x: 0, y: 0, width: jpeg.width, height: jpeg.height });
      }
      const bytes = await pdf.save();
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
      pdfUrlRef.current = url;
      setPdfUrl(url);
    } catch (conversionError) {
      setError(`Could not create the PDF. ${conversionError instanceof Error ? conversionError.message : "Please check the selected images and try again."}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetTool = () => {
    images.forEach(({ previewUrl }) => {
      URL.revokeObjectURL(previewUrl);
      previewUrlsRef.current.delete(previewUrl);
    });
    setImages([]);
    setError("");
    clearPdf();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">📷 JPG to PDF</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-6">
          <label htmlFor="jpg-to-pdf-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select JPG or JPEG images
          </label>
          <input
            id="jpg-to-pdf-upload"
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,image/jpeg"
            multiple
            onChange={(event) => void handleFileSelect(event)}
            disabled={isProcessing}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Images stay on your device. Each image becomes one page, in the order shown below.
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {images.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Images ({images.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {images.map((image, index) => (
                <div key={image.id} className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                  <div className="h-44 p-2 flex items-center justify-center bg-gray-100 dark:bg-gray-900/50">
                    <Image src={image.previewUrl} alt={`Preview of ${image.file.name}`} width={1200} height={900} unoptimized className="max-h-full max-w-full object-contain rounded" />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-sm font-semibold text-blue-700 dark:text-blue-200">{index + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-sm text-gray-800 dark:text-white" title={image.file.name}>{image.file.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0 || isProcessing} aria-label={`Move ${image.file.name} up`} className="rounded border border-gray-300 dark:border-gray-500 px-3 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-600 disabled:opacity-40">↑ Up</button>
                      <button type="button" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1 || isProcessing} aria-label={`Move ${image.file.name} down`} className="rounded border border-gray-300 dark:border-gray-500 px-3 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-600 disabled:opacity-40">↓ Down</button>
                      <button type="button" onClick={() => removeImage(image.id)} disabled={isProcessing} className="ml-auto rounded px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button type="button" onClick={() => void convertToPDF()} disabled={images.length === 0 || isProcessing} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            {isProcessing ? "Converting…" : "Convert to PDF"}
          </button>
          <button type="button" onClick={resetTool} disabled={isProcessing} className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors">Reset</button>
        </div>

        {pdfUrl && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-300 font-semibold mb-3">✓ PDF created successfully with {images.length} {images.length === 1 ? "page" : "pages"}.</p>
            <a href={pdfUrl} download="images.pdf" className="inline-flex bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">Download PDF</a>
          </div>
        )}
      </div>
    </div>
  );
}

function SplitPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageRange, setPageRange] = useState("");
  const [splitPdfUrl, setSplitPdfUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [previewPages, setPreviewPages] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const splitUrlRef = useRef<string | null>(null);
  const runIdRef = useRef(0);

  useEffect(() => {
    return () => {
      if (splitUrlRef.current) URL.revokeObjectURL(splitUrlRef.current);
    };
  }, []);

  const clearSplit = () => {
    if (splitUrlRef.current) URL.revokeObjectURL(splitUrlRef.current);
    splitUrlRef.current = null;
    setSplitPdfUrl(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!isPdfFile(selectedFile)) {
      setError("Please select a PDF file only");
      return;
    }

    clearSplit();
    setError("");
    setFile(selectedFile);
    setTotalPages(0);
    setPageRange("");
    setSplitPdfUrl(null);
    setPreviewPages([]);

    // Load PDF to get page count
    selectedFile.arrayBuffer().then(buffer => {
      PDFDocument.load(buffer).then(pdf => {
        setTotalPages(pdf.getPageCount());
      }).catch(err => {
        setError("Error loading PDF: " + (err as Error).message);
      });
    }).catch(err => {
      setError("Error reading file: " + (err as Error).message);
    });
  };

  const parsePageRange = (range: string, maxPages: number): number[] => {
    const pages: number[] = [];
    const parts = range.split(",").map(p => p.trim()).filter(p => p !== "");

    if (parts.length === 0) {
      throw new Error("Please enter at least one page or range");
    }

    for (const part of parts) {
      if (part.includes("-")) {
        const rangeParts = part.split("-").map(n => n.trim());
        if (rangeParts.length !== 2) {
          throw new Error(`Invalid range format: ${part}. Use format like 1-5`);
        }

        const [start, end] = rangeParts.map(n => parseInt(n));
        if (isNaN(start) || isNaN(end)) {
          throw new Error(`Invalid range: ${part}. Page numbers must be integers`);
        }
        if (start < 1 || end > maxPages) {
          throw new Error(`Range ${part} exceeds PDF bounds. Valid range: 1 to ${maxPages}`);
        }
        if (start > end) {
          throw new Error(`Invalid range: ${part}. Start page must be less than or equal to end page`);
        }
        for (let i = start; i <= end; i++) {
          if (!pages.includes(i)) pages.push(i);
        }
      } else {
        const pageNum = parseInt(part);
        if (isNaN(pageNum)) {
          throw new Error(`Invalid page number: ${part}. Must be an integer`);
        }
        if (pageNum < 1 || pageNum > maxPages) {
          throw new Error(`Page ${pageNum} is out of range. Valid range: 1 to ${maxPages}`);
        }
        if (!pages.includes(pageNum)) pages.push(pageNum);
      }
    }

    return pages.sort((a, b) => a - b);
  };

  const handlePageRangeChange = (value: string) => {
    setPageRange(value);
    // The visible range no longer matches an already-produced split file.
    clearSplit();
    if (totalPages > 0 && value.trim()) {
      try {
        const pages = parsePageRange(value, totalPages);
        setPreviewPages(pages);
        setError("");
      } catch {
        setPreviewPages([]);
        // Don't show error while typing, only on submit
      }
    } else {
      setPreviewPages([]);
    }
  };

  const splitPDF = async () => {
    if (!file) {
      setError("Please select a PDF file");
      return;
    }

    if (!pageRange.trim()) {
      setError("Please enter a page range");
      return;
    }

    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    setIsProcessing(true);
    setError("");
    clearSplit();

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const maxPages = pdf.getPageCount();

      let pagesToExtract: number[];
      try {
        pagesToExtract = parsePageRange(pageRange, maxPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid page range");
        setIsProcessing(false);
        return;
      }

      if (pagesToExtract.length === 0) {
        setError("No valid pages to extract");
        setIsProcessing(false);
        return;
      }

      const newPdf = await PDFDocument.create();
      const pages = await newPdf.copyPages(pdf, pagesToExtract.map((p) => p - 1));
      pages.forEach((page) => newPdf.addPage(page));

      const splitPdfBytes = await newPdf.save();
      if (runIdRef.current !== runId) return;
      const blob = new Blob([splitPdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      splitUrlRef.current = url;
      setSplitPdfUrl(url);
    } catch (err) {
      if (runIdRef.current !== runId) return;
      setError(
        err instanceof Error
          ? `Error splitting PDF: ${err.message}`
          : "Error splitting PDF. The file may be encrypted or damaged.",
      );
    } finally {
      if (runIdRef.current === runId) setIsProcessing(false);
    }
  };

  const resetTool = () => {
    setFile(null);
    setTotalPages(0);
    setPageRange("");
    setSplitPdfUrl(null);
    setError("");
    setPreviewPages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">✂️ Split PDF</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select PDF File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Select a PDF file to split
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {file && totalPages > 0 && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-800 dark:text-blue-300 font-semibold">
              📄 {file.name}
            </p>
            <p className="text-blue-600 dark:text-blue-400 text-sm">
              Total pages: {totalPages}
            </p>
          </div>
        )}

        {totalPages > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Page Range
            </label>
            <input
              type="text"
              value={pageRange}
              onChange={(e) => handlePageRangeChange(e.target.value)}
              placeholder="e.g., 1-5, 2,6,9, 1-3,6,9-10"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Supported formats: page ranges (1-5), individual pages (2,6,9), or mixed (1-3,6,9-10)
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Valid range: 1 to {totalPages} • Duplicates are automatically removed • Pages sorted in ascending order
            </p>
            {previewPages.length > 0 && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                  Pages to extract: {previewPages.join(", ")} ({previewPages.length} page{previewPages.length !== 1 ? 's' : ''})
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={splitPDF}
            disabled={!file || totalPages === 0 || !pageRange.trim() || isProcessing}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {isProcessing ? "Splitting..." : "Split PDF"}
          </button>
          <button
            onClick={resetTool}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>

        {splitPdfUrl && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-300 font-semibold mb-3">
              ✓ PDF split successfully!
            </p>
            <a href={splitPdfUrl} download="split.pdf" className="inline-flex bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
              Download Split PDF
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

type ConvertedPage = { pageNumber: number; blob: Blob; url: string; filename: string };

function PdfToImages() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<"png" | "jpg">("png");
  const [pages, setPages] = useState<ConvertedPage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageUrlsRef = useRef<string[]>([]);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const runIdRef = useRef(0);

  useEffect(() => () => {
    pageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    renderTaskRef.current?.cancel();
  }, []);

  const clearPages = () => {
    renderTaskRef.current?.cancel();
    renderTaskRef.current = null;
    pageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    pageUrlsRef.current = [];
    setPages([]);
  };

  const acceptFile = async (selected: File | undefined) => {
    if (!selected) return;
    if (!isPdfFile(selected)) {
      clearPages();
      setFile(null);
      setError("Please upload a PDF file only (.pdf)");
      return;
    }
    try {
      await assertPdfMagic(selected);
      clearPages();
      setFile(selected);
      setError("");
      setProgress(0);
      setProgressMessage("");
    } catch (err) {
      clearPages();
      setFile(null);
      setError(err instanceof Error ? err.message : "That file does not look like a valid PDF.");
    }
  };

  const handleConvert = async () => {
    if (!file) {
      setError("Please upload a PDF file first.");
      return;
    }

    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    setIsProcessing(true);
    setError("");
    clearPages();
    setProgress(2);
    setProgressMessage("Loading PDF…");
    let destroyPdf: (() => Promise<void>) | null = null;

    try {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
      destroyPdf = () => loadingTask.destroy();
      const pdf = await loadingTask.promise;

      if (pdf.numPages > PDF_LIMITS.maxRenderedPages) {
        throw new Error(
          `This PDF has ${formatPageCount(pdf.numPages)}. Rendering is limited to ` +
            `${formatPageCount(PDF_LIMITS.maxRenderedPages)} at a time so the browser does not run ` +
            `out of memory. Use Split PDF to convert it in smaller chunks.`,
        );
      }

      const baseName = file.name.replace(/\.pdf$/i, "") || "document";
      const extension = format;
      const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
      const converted: ConvertedPage[] = [];
      let pixelsSpent = 0;

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        if (runIdRef.current !== runId) return;
        setProgressMessage(`Rendering page ${pageNumber} of ${pdf.numPages}…`);
        const page = await pdf.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const plan = planPageRender(
          baseViewport.width,
          baseViewport.height,
          2,
          pixelsSpent,
        );
        pixelsSpent += plan.width * plan.height;

        const canvas = document.createElement("canvas");
        canvas.width = plan.width;
        canvas.height = plan.height;
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("Your browser could not create an image canvas.");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        const renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport: page.getViewport({ scale: plan.scale }),
        });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        renderTaskRef.current = null;

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((value) => value ? resolve(value) : reject(new Error(`Could not encode page ${pageNumber} as ${format.toUpperCase()}.`)), mimeType, format === "jpg" ? 0.92 : undefined);
        });
        canvas.width = 0;
        canvas.height = 0;
        page.cleanup();
        const filename = `${baseName}-page-${String(pageNumber).padStart(3, "0")}.${extension}`;
        const url = URL.createObjectURL(blob);
        pageUrlsRef.current.push(url);
        converted.push({ pageNumber, blob, url, filename });

        setProgress(Math.round((pageNumber / pdf.numPages) * 100));
        // Publish once per page, not once per array copy, and skip the paint
        // for every intermediate page so React does not re-render the list
        // hundreds of times on a long document.
        if (pageNumber === pdf.numPages || pageNumber % 5 === 0) {
          setPages([...converted]);
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
      setPages([...converted]);
      setProgressMessage(`Converted ${formatPageCount(pdf.numPages)}.`);
    } catch (err) {
      if (runIdRef.current !== runId) return;
      clearPages();
      setError(`Could not convert this PDF. ${err instanceof Error ? err.message : "Please try another file."}`);
      setProgressMessage("");
    } finally {
      if (destroyPdf) await destroyPdf().catch(() => undefined);
      if (runIdRef.current === runId) setIsProcessing(false);
    }
  };

  const downloadAll = async () => {
    if (pages.length < 2) return;
    setIsProcessing(true);
    setProgressMessage("Preparing your ZIP file…");
    try {
      const zip = new JSZip();
      pages.forEach((page) => zip.file(page.filename, page.blob));
      const archive = await zip.generateAsync({ type: "blob" }, (metadata) => {
        setProgress(Math.round(metadata.percent));
        setProgressMessage("Preparing your ZIP file…");
      });
      const url = URL.createObjectURL(archive);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${file?.name.replace(/\.pdf$/i, "") || "pdf-pages"}-images.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(`Could not create the ZIP file. ${err instanceof Error ? err.message : "Please try again."}`);
    } finally {
      setIsProcessing(false);
      setProgressMessage("");
    }
  };

  const resetTool = () => {
    clearPages();
    setFile(null);
    setError("");
    setProgress(0);
    setProgressMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">🖼️ PDF to Images</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-6">
          <label htmlFor="pdf-images-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload PDF</label>
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") fileInputRef.current?.click(); }}
            onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => { event.preventDefault(); setIsDragging(false); void acceptFile(event.dataTransfer.files?.[0]); }}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"}`}
          >
            <p className="text-3xl mb-3">📄</p>
            <p className="text-gray-800 dark:text-white font-medium">Drag and drop a PDF here</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">or click to browse — PDF files only</p>
            <input id="pdf-images-upload" ref={fileInputRef} type="file" accept="application/pdf,.pdf" onChange={(event) => void acceptFile(event.target.files?.[0])} className="hidden" />
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="pdf-image-format" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image format</label>
          <select id="pdf-image-format" value={format} onChange={(event) => { setFormat(event.target.value as "png" | "jpg"); clearPages(); }} disabled={isProcessing} className="w-full sm:w-56 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
          </select>
        </div>

        {file && <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">Selected: <span className="font-medium text-gray-800 dark:text-white">{file.name}</span> ({formatBytes(file.size)})</p>}
        {error && <div role="alert" className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"><p className="text-red-800 dark:text-red-300">{error}</p></div>}
        {isProcessing && <div className="mb-6" aria-live="polite"><div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-2"><span>{progressMessage || "Processing…"}</span><span>{progress}%</span></div><div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"><div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} /></div></div>}

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => void handleConvert()} disabled={!file || isProcessing} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors">{isProcessing ? "Converting…" : "Convert PDF to Images"}</button>
          <button onClick={resetTool} disabled={isProcessing} className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3 px-6 rounded-lg transition-colors">Reset</button>
        </div>

        {pages.length > 0 && <div className="mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Converted pages ({pages.length})</h3>
            {pages.length > 1 && <button onClick={() => void downloadAll()} disabled={isProcessing} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-5 rounded-lg transition-colors">Download All as ZIP</button>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pages.map((page) => <article key={page.pageNumber} className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
              <div className="aspect-[3/4] p-3 flex items-center justify-center bg-gray-100 dark:bg-gray-900"><Image src={page.url} alt={`PDF page ${page.pageNumber}`} width={800} height={1100} unoptimized loading="lazy" decoding="async" className="max-w-full max-h-full object-contain shadow-sm" /></div>
              <div className="flex items-center justify-between gap-3 p-3"><p className="text-sm font-medium text-gray-800 dark:text-white">Page {page.pageNumber}</p><a href={page.url} download={page.filename} className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors">Download</a></div>
            </article>)}
          </div>
        </div>}
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function CompressPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [reductionPercent, setReductionPercent] = useState(0);
  const [alreadyOptimized, setAlreadyOptimized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  const resetResult = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setOriginalSize(0);
    setCompressedSize(0);
    setReductionPercent(0);
    setAlreadyOptimized(false);
  };

  const acceptFile = async (selected: File | undefined) => {
    if (!selected) return;

    if (!isPdfFile(selected)) {
      setError("Please upload a PDF file only (.pdf)");
      return;
    }

    try {
      await assertPdfMagic(selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid PDF file");
      return;
    }

    setError("");
    resetResult();
    setFile(selected);
    setProgress(0);
    setProgressMessage("");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    void acceptFile(e.target.files?.[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    void acceptFile(e.dataTransfer.files?.[0]);
  };

  const compressFile = async () => {
    if (!file) {
      setError("Please upload a PDF file first");
      return;
    }

    setIsProcessing(true);
    setError("");
    resetResult();
    setProgress(4);
    setProgressMessage("Reading file…");

    try {
      const input = new Uint8Array(await file.arrayBuffer());
      const result = await compressPdf(input, (percent, message) => {
        setProgress(percent);
        setProgressMessage(message);
      });

      const blob = new Blob([result.bytes as BlobPart], { type: "application/pdf" });
      setResultUrl(URL.createObjectURL(blob));
      setOriginalSize(result.originalSize);
      setCompressedSize(result.compressedSize);
      setReductionPercent(result.reductionPercent);
      setAlreadyOptimized(result.alreadyOptimized);
    } catch (err) {
      setError("Could not compress this PDF. " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsProcessing(false);
    }
  };

  const resetTool = () => {
    setFile(null);
    setError("");
    setIsProcessing(false);
    setProgress(0);
    setProgressMessage("");
    resetResult();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">📉 Compress PDF</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Upload PDF
          </label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
            }`}
          >
            <p className="text-3xl mb-3">📄</p>
            <p className="text-gray-800 dark:text-white font-medium">
              Drag and drop a PDF here
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              or click to browse — PDF files only
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {file && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-800 dark:text-blue-300 font-semibold">📄 {file.name}</p>
            <p className="text-blue-600 dark:text-blue-400 text-sm">
              Original size: {formatBytes(file.size)}
            </p>
          </div>
        )}

        {isProcessing && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
              <span>{progressMessage || "Compressing…"}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={compressFile}
            disabled={!file || isProcessing}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {isProcessing ? "Compressing…" : "Compress PDF"}
          </button>
          <button
            onClick={resetTool}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>

        {resultUrl && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-300 font-semibold mb-3">
              {alreadyOptimized
                ? "This PDF is already well optimized — the original file is ready to download."
                : "PDF compressed successfully!"}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg bg-white/70 dark:bg-gray-900/40 p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Original size</p>
                <p className="font-semibold text-gray-800 dark:text-white">{formatBytes(originalSize)}</p>
              </div>
              <div className="rounded-lg bg-white/70 dark:bg-gray-900/40 p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Compressed size</p>
                <p className="font-semibold text-gray-800 dark:text-white">{formatBytes(compressedSize)}</p>
              </div>
              <div className="rounded-lg bg-white/70 dark:bg-gray-900/40 p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Size reduction</p>
                <p className="font-semibold text-gray-800 dark:text-white">
                  {reductionPercent.toFixed(1)}%
                </p>
              </div>
            </div>
            <a href={resultUrl} download={`${(file?.name ?? "document.pdf").replace(/\.pdf$/i, "")}-compressed.pdf`} className="inline-flex bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
              Download Compressed PDF
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function MergePDF() {
  const [files, setFiles] = useState<File[]>([]);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [progressNote, setProgressNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mergedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (mergedUrlRef.current) URL.revokeObjectURL(mergedUrlRef.current);
    };
  }, []);

  const clearMerged = () => {
    if (mergedUrlRef.current) URL.revokeObjectURL(mergedUrlRef.current);
    mergedUrlRef.current = null;
    setMergedPdfUrl(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const pdfFiles = selectedFiles.filter((file) => isPdfFile(file));

    if (pdfFiles.length === 0) {
      setError("Please select PDF files only");
      return;
    }

    setError("");
    clearMerged();
    setFiles((prev) => [...prev, ...pdfFiles]);
  };

  const removeFile = (index: number) => {
    // Any change to the list makes an existing merge stale, so drop it
    // instead of letting the user download the previous ordering.
    clearMerged();
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const moveFile = (fromIndex: number, toIndex: number) => {
    clearMerged();
    const newFiles = [...files];
    const [movedFile] = newFiles.splice(fromIndex, 1);
    if (!movedFile) return;
    newFiles.splice(toIndex, 0, movedFile);
    setFiles(newFiles);
  };

  const mergePDFs = async () => {
    if (files.length < 2) {
      setError("Please select at least 2 PDF files to merge");
      return;
    }

    setIsProcessing(true);
    setError("");
    clearMerged();

    try {
      const mergedPdf = await PDFDocument.create();
      let totalPages = 0;

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => mergedPdf.addPage(page));
        totalPages += pages.length;
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      mergedUrlRef.current = url;
      setMergedPdfUrl(url);
      setError("");
      setProgressNote(`Merged ${files.length} files into ${formatPageCount(totalPages)}.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Error merging PDFs: ${err.message}`
          : "Error merging PDFs. One of the files may be encrypted or damaged.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const resetTool = () => {
    setFiles([]);
    clearMerged();
    setError("");
    setProgressNote("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">🔗 Merge PDF</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select PDF Files
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileSelect}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Select multiple PDF files to merge them into one
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {files.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
              Selected Files ({files.length})
            </h3>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <span className="text-2xl">📄</span>
                  <span className="flex-1 text-sm text-gray-800 dark:text-white truncate">
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <div className="flex gap-2">
                    {index > 0 && (
                      <button
                        onClick={() => moveFile(index, index - 1)}
                        className="p-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Move up"
                      >
                        ↑
                      </button>
                    )}
                    {index < files.length - 1 && (
                      <button
                        onClick={() => moveFile(index, index + 1)}
                        className="p-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Move down"
                      >
                        ↓
                      </button>
                    )}
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={mergePDFs}
            disabled={files.length < 2 || isProcessing}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {isProcessing ? "Merging..." : "Merge PDFs"}
          </button>
          <button
            onClick={resetTool}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>

        {mergedPdfUrl && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-300 font-semibold mb-1">
              ✓ PDFs merged successfully!
            </p>
            {progressNote && (
              <p className="text-sm text-green-700 dark:text-green-400 mb-3">{progressNote}</p>
            )}
            <a href={mergedPdfUrl} download="merged.pdf" className="inline-flex bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
              Download Merged PDF
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

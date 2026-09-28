"use client";

import { useEffect, useState, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import { isPdfFile } from "@/lib/compress-pdf";

export default function SplitPDF({ seoPage = false }: { seoPage?: boolean } = {}) {
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
      {seoPage ? (
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Split PDF Online</h1>
      ) : (
        <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">✂️ Split PDF</h2>
      )}
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

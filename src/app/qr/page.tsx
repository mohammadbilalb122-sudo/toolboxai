"use client";

import { useCallback, useId, useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { Html5Qrcode } from "html5-qrcode";
import { useDirectToolRoute } from "@/lib/use-direct-tool-route";
import { copyTextToClipboard } from "@/lib/clipboard";

export default function QRTools() {
  const { activeTool, setActiveTool, openTool } = useDirectToolRoute("qr", ["generate", "scan"]);

  const tools = [
    { id: "generate", name: "Generate QR", description: "Create QR codes from text, URLs, or contact info", icon: "🔳" },
    { id: "scan", name: "Scan QR", description: "Decode QR codes from images", icon: "📷" },
  ];

  if (activeTool) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16">
          <Link
            href="/qr"
            onClick={() => setActiveTool(null)}
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-8"
          >
            ← Back to QR Tools
          </Link>
          {activeTool === "generate" && <QRGenerator />}
          {activeTool === "scan" && <QRScanner />}
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
            <span className="text-4xl sm:text-5xl">🔳</span>
            QR Tools
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Generate and scan QR codes quickly and easily
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={`/qr?tool=${encodeURIComponent(tool.id)}`}
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

function QRGenerator() {
  const [text, setText] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [size, setSize] = useState(256);
  const [errorCorrection, setErrorCorrection] = useState<"L" | "M" | "Q" | "H">("M");
  const [qrError, setQrError] = useState("");

  const generateQR = useCallback(async () => {
    if (!text.trim()) {
      setQrCodeUrl("");
      return;
    }

    try {
      const url = await QRCode.toDataURL(text, {
        width: size,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: errorCorrection,
      });
      setQrCodeUrl(url);
      setQrError("");
    } catch (err) {
      setQrCodeUrl("");
      setQrError(
        err instanceof Error
          ? `Could not generate the QR code: ${err.message}`
          : "Could not generate the QR code.",
      );
    }
  }, [text, size, errorCorrection]);

  useEffect(() => {
    const handle = setTimeout(() => {
      void generateQR();
    }, 150);
    return () => clearTimeout(handle);
  }, [generateQR]);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">🔳 QR Code Generator</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Text or URL
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text or URL to generate QR code..."
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Size (px)
            </label>
            <select
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={128}>128x128</option>
              <option value={256}>256x256</option>
              <option value={512}>512x512</option>
              <option value={1024}>1024x1024</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Error Correction
            </label>
            <select
              value={errorCorrection}
              onChange={(e) => setErrorCorrection(e.target.value as "L" | "M" | "Q" | "H")}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="L">Low (7%)</option>
              <option value="M">Medium (15%)</option>
              <option value="Q">Quartile (25%)</option>
              <option value="H">High (30%)</option>
            </select>
          </div>
        </div>
        <button
          onClick={generateQR}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors mb-6"
        >
          Generate QR Code
        </button>
        {qrError && (
          <p role="alert" className="mb-4 text-sm text-red-600 dark:text-red-400">
            {qrError}
          </p>
        )}
        {qrCodeUrl && (
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-lg shadow-md mb-4">
              <Image src={qrCodeUrl} alt="Generated QR code" width={size} height={size} unoptimized className="h-auto max-w-full" />
            </div>
            <a href={qrCodeUrl} download="qrcode.png" className="inline-flex bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
              Download QR Code
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function QRScanner() {
  const [scanResult, setScanResult] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isImageScanning, setIsImageScanning] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrCodeScannerId = useId();

  const stopScanner = useCallback(async (scanner: Html5Qrcode) => {
    try {
      // html5-qrcode keeps the camera stream open until stop() resolves.
      // If the stream already died (device revoked, tab backgrounded) stop()
      // rejects with "Cannot stop, scanner is not running", so clear() is
      // still required to detach the video element.
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch (err) {
      console.debug("QR scanner stop was a no-op:", err);
    } finally {
      try {
        scanner.clear();
      } catch {
        // clear() throws if the element was already removed; nothing to do.
      }
    }
  }, []);

  const startScanning = async () => {
    setError("");
    setScanResult("");
    setCopied(false);

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError(
        "Camera access requires a secure HTTPS connection on mobile. Open this page using its HTTPS address, then allow camera access."
      );
      return;
    }

    if (scannerRef.current) {
      await stopScanner(scannerRef.current);
      scannerRef.current = null;
    }

    const scanner = new Html5Qrcode(qrCodeScannerId);
    scannerRef.current = scanner;

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    try {
      await scanner.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          setScanResult(decodedText);
          setIsScanning(false);
          void stopScanner(scanner).then(() => {
            if (scannerRef.current === scanner) {
              scannerRef.current = null;
            }
          });
        },
        () => {
          // Per-frame decode misses are expected while aiming; not errors.
        }
      );

      setIsScanning(true);
    } catch (err) {
      setIsScanning(false);
      if (scannerRef.current === scanner) {
        scannerRef.current = null;
      }
      await stopScanner(scanner);

      const errorName = err instanceof DOMException ? err.name : "";
      setError(
        errorName === "NotAllowedError" || errorName === "PermissionDeniedError"
          ? "Camera access was blocked. Allow camera permission for this site in your browser settings, then try again."
          : errorName === "NotFoundError" || errorName === "DevicesNotFoundError"
            ? "No camera was found on this device."
            : "Unable to start camera. Check that camera access is allowed and that no other app is using it."
      );
      console.error("Error starting scanner:", err);
    }
  };

  const stopScanning = async () => {
    const scanner = scannerRef.current;
    if (!scanner) {
      setIsScanning(false);
      return;
    }
    scannerRef.current = null;
    setIsScanning(false);
    await stopScanner(scanner);
  };

  const scanImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Choose an image file containing a QR code.");
      return;
    }
    if (isScanning || isImageScanning) {
      setError("Stop the camera scan before scanning an image.");
      return;
    }

    setError("");
    setScanResult("");
    setCopied(false);
    setIsImageScanning(true);
    const scanner = new Html5Qrcode(qrCodeScannerId);
    try {
      const decodedText = await scanner.scanFile(file, true);
      setScanResult(decodedText);
    } catch {
      setError("Could not find a readable QR code in that image.");
    } finally {
      try {
        scanner.clear();
      } catch {
        // scanFile may already have cleared its temporary preview.
      }
      setIsImageScanning(false);
    }
  };

  const copyResult = async () => {
    const result = await copyTextToClipboard(scanResult);
    setCopied(result.ok);
    setError(result.ok ? "" : result.reason);
  };

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        void stopScanner(scanner);
      }
    };
  }, [stopScanner]);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">📷 QR Code Scanner</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-4">
          <div id={qrCodeScannerId} className="w-full overflow-hidden rounded-lg" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {!isScanning ? (
            <button
              disabled={isImageScanning}
              onClick={startScanning}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Start Camera
            </button>
          ) : (
            <button
              onClick={stopScanning}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Stop Camera
            </button>
          )}
          <label className={`flex-1 text-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors ${isImageScanning || isScanning ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
            {isImageScanning ? "Scanning Image…" : "Scan an Image"}
            <input
              type="file"
              accept="image/*"
              onChange={scanImage}
              disabled={isImageScanning || isScanning}
              className="sr-only"
              aria-label="Choose an image containing a QR code"
            />
          </label>
        </div>
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}
        {scanResult && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-2">
              Scanned Result:
            </p>
            <p className="text-green-800 dark:text-green-300 break-all mb-3">{scanResult}</p>
            <button
              onClick={copyResult}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
          </div>
        )}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="font-medium mb-1">Instructions:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Use the camera or choose an image containing a QR code</li>
            <li>Camera scanning requires permission on a secure HTTPS connection</li>
            <li>The code will be automatically scanned</li>
            <li>Results will appear below</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useDirectToolRoute } from "@/lib/use-direct-tool-route";
import { decodeBase64, encodeBase64 } from "@/lib/base64";
import { copyTextToClipboard } from "@/lib/clipboard";
import { createRegexRunner, type RegexRunner } from "@/lib/regex-runner";
import { REGEX_LIMITS, type RegexMatch } from "@/lib/regex-scan";

export default function DeveloperTools() {
  const { activeTool, setActiveTool, openTool } = useDirectToolRoute("developer", [
    "json-formatter", "url", "base64", "xml-formatter", "csv-json", "uuid-generator", "regex-tester",
  ]);

  const tools = [
    { id: "json-formatter", name: "JSON Formatter", description: "Format, validate, and beautify JSON data", icon: "{ }" },
    { id: "url", name: "URL Encode/Decode", description: "Encode and decode URL strings", icon: "🔗" },
    { id: "base64", name: "Base64 Encode/Decode", description: "Encode and decode Base64 strings", icon: "🔐" },
    { id: "xml-formatter", name: "XML Formatter", description: "Format, minify, and validate XML", icon: "📄" },
    { id: "csv-json", name: "CSV ↔ JSON Converter", description: "Convert tabular CSV data and JSON", icon: "🔄" },
    { id: "uuid-generator", name: "UUID Generator", description: "Generate secure version 4 UUIDs", icon: "🆔" },
    { id: "regex-tester", name: "Regex Tester", description: "Test regular expressions against text", icon: ".*" },
  ];

  if (activeTool) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16">
          <Link
            href="/developer"
            onClick={() => setActiveTool(null)}
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-8"
          >
            ← Back to Developer Tools
          </Link>
          {activeTool === "json-formatter" && <JSONFormatter />}
          {activeTool === "base64" && <Base64Tool />}
          {activeTool === "url" && <URLTool />}
          {activeTool === "xml-formatter" && <XMLFormatter />}
          {activeTool === "csv-json" && <CSVJSONConverter />}
          {activeTool === "uuid-generator" && <UUIDGenerator />}
          {activeTool === "regex-tester" && <RegexTester />}
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
            <span className="text-4xl sm:text-5xl">💻</span>
            Developer Tools
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            JSON and XML formatting, CSV conversion, UUID generation, regex testing, Base64 encoding, and URL encoding utilities
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={`/developer?tool=${encodeURIComponent(tool.id)}`}
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

function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("");
  const [matches, setMatches] = useState<RegexMatch[]>([]);
  const [hasTested, setHasTested] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const runnerRef = useRef<RegexRunner | null>(null);

  useEffect(() => {
    const runner = createRegexRunner(
      () => new Worker(new URL("../../lib/regex-test-worker.ts", import.meta.url)),
    );
    runnerRef.current = runner;
    return () => {
      runner.dispose();
      runnerRef.current = null;
    };
  }, []);

  const clearResult = () => {
    setMatches([]);
    setHasTested(false);
    setError("");
    setCopied(false);
    setTruncated(false);
  };

  const testRegex = async () => {
    const runner = runnerRef.current;
    if (!runner) return;

    setIsRunning(true);
    const result = await runner.run(pattern, flags, text);
    setIsRunning(false);

    setMatches(result.matches);
    setHasTested(result.ok);
    setCopied(false);
    setTruncated(result.truncated);
    setError(result.error);
  };

  const copyMatches = async () => {
    try {
      await navigator.clipboard.writeText(matches.map((match) => match.value).join("\n"));
      setCopied(true);
      setError("");
    } catch {
      setCopied(false);
      setError("Unable to copy. Check your browser clipboard permissions and try again.");
    }
  };

  const clearAll = () => {
    setPattern("");
    setFlags("g");
    setText("");
    clearResult();
  };

  const highlightedText: ReactNode[] = [];
  let highlightCursor = 0;
  matches.forEach((match, index) => {
    if (match.value.length === 0 || match.index < highlightCursor) return;
    if (match.index > highlightCursor) {
      highlightedText.push(text.slice(highlightCursor, match.index));
    }
    highlightedText.push(
      <mark key={`match-${index}`} className="bg-yellow-300 dark:bg-yellow-500/70 text-gray-900 dark:text-gray-950 rounded-sm">
        {match.value}
      </mark>,
    );
    highlightCursor = match.index + match.value.length;
  });
  if (highlightCursor < text.length) {
    highlightedText.push(text.slice(highlightCursor));
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">.* Regex Tester</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_10rem] gap-4 mb-4">
          <div>
            <label htmlFor="regex-pattern" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Regular expression
            </label>
            <input
              id="regex-pattern"
              type="text"
              value={pattern}
              onChange={(event) => {
                setPattern(event.target.value);
                clearResult();
              }}
              placeholder="e.g. \\b\\w+\\b"
              spellCheck={false}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
          </div>
          <div>
            <label htmlFor="regex-flags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Flags
            </label>
            <input
              id="regex-flags"
              type="text"
              value={flags}
              onChange={(event) => {
                setFlags(event.target.value);
                clearResult();
              }}
              placeholder="gim"
              spellCheck={false}
              aria-describedby="regex-flags-help"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
          </div>
        </div>
        <p id="regex-flags-help" className="-mt-2 mb-4 text-sm text-gray-500 dark:text-gray-400">
          Common flags: g (global), i (ignore case), m (multiline). All matches are listed.
        </p>
        <div className="mb-4">
          <label htmlFor="regex-test-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Test text
          </label>
          <textarea
            id="regex-test-text"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              clearResult();
            }}
            placeholder="Enter text to test against..."
            rows={10}
            spellCheck={false}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y font-mono text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={testRegex}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {isRunning ? "Testing…" : "Test"}
          </button>
          <button
            onClick={clearAll}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors ml-auto"
          >
            Clear
          </button>
        </div>
        {error && (
          <div role="alert" className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}
        {truncated && (
          <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-amber-800 dark:text-amber-300 text-sm">
              Showing the first {REGEX_LIMITS.maxMatches.toLocaleString()} matches. Longer input is
              capped at {REGEX_LIMITS.maxTextLength.toLocaleString()} characters and each pattern is
              stopped after {REGEX_LIMITS.timeoutMs / 1000}s so the page stays responsive.
            </p>
          </div>
        )}
        {hasTested && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Matches ({matches.length})
              </h3>
              {matches.length > 0 ? (
                <ol className="max-h-72 overflow-y-auto space-y-2">
                  {matches.map((match, index) => (
                    <li key={`${match.index}-${index}`} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Match {index + 1} · position {match.index + 1}{match.value.length === 0 ? " (zero-width)" : ""}
                      </div>
                      <code className="font-mono text-sm text-gray-900 dark:text-gray-100 break-all">
                        {match.value || "(empty match)"}
                      </code>
                      {match.captures.some((capture) => capture !== undefined) && (
                        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          Groups: {match.captures.map((capture) => capture ?? "(unmatched)").join(" · ")}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400">
                  No matches found.
                </p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Highlighted text</h3>
              <pre className="min-h-16 max-h-96 overflow-auto whitespace-pre-wrap break-words p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm">
                {highlightedText.length > 0 ? highlightedText : text}
              </pre>
            </div>
            {matches.length > 0 && (
              <button
                onClick={copyMatches}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function createUUIDv4(): string {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto.getRandomValues !== "function") {
    throw new Error("Secure random number generation is not available in this browser.");
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function UUIDGenerator() {
  const [count, setCount] = useState("1");
  const [uuids, setUuids] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = () => {
    const quantity = Number(count);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) {
      setUuids([]);
      setCopied(false);
      setError("Enter a whole number from 1 to 1,000.");
      return;
    }

    try {
      setUuids(Array.from({ length: quantity }, createUUIDv4));
      setError("");
      setCopied(false);
    } catch (cause) {
      setUuids([]);
      setCopied(false);
      setError(cause instanceof Error ? cause.message : "Unable to generate UUIDs in this browser.");
    }
  };

  const copyUUIDs = async () => {
    try {
      await navigator.clipboard.writeText(uuids.join("\n"));
      setCopied(true);
      setError("");
    } catch {
      setCopied(false);
      setError("Unable to copy. Check your browser clipboard permissions and try again.");
    }
  };

  const clearAll = () => {
    setCount("1");
    setUuids([]);
    setError("");
    setCopied(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">🆔 UUID Generator</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-4">
          <label htmlFor="uuid-count" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Number of UUIDs
          </label>
          <input
            id="uuid-count"
            type="number"
            min={1}
            max={1000}
            step={1}
            value={count}
            onChange={(event) => {
              setCount(event.target.value);
              setUuids([]);
              setError("");
              setCopied(false);
            }}
            className="w-full sm:w-48 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Generate between 1 and 1,000 UUID v4 values at once.</p>
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={generate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Generate UUID
          </button>
          <button
            onClick={clearAll}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors ml-auto"
          >
            Clear
          </button>
        </div>
        {error && (
          <div role="alert" className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}
        {uuids.length > 0 && (
          <div>
            <label htmlFor="uuid-output" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Generated UUIDs ({uuids.length})
            </label>
            <textarea
              id="uuid-output"
              value={uuids.join("\n")}
              readOnly
              rows={Math.min(Math.max(uuids.length, 4), 12)}
              spellCheck={false}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white resize-y font-mono text-sm"
            />
            <button
              onClick={copyUUIDs}
              className="mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

type ConversionDirection = "csv-to-json" | "json-to-csv";

function parseCSV(input: string): string[][] {
  const csv = input.replace(/^\uFEFF/, "");
  if (!csv.trim()) {
    throw new Error("Enter CSV data to convert.");
  }

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let closedQuote = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];

    if (inQuotes) {
      if (character === '"') {
        if (csv[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
          closedQuote = true;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (closedQuote && character !== "," && character !== "\r" && character !== "\n") {
      throw new Error("Unexpected characters after a quoted field.");
    }

    if (character === '"') {
      if (field.length > 0) {
        throw new Error("A quote must begin at the start of a CSV field.");
      }
      inQuotes = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
      closedQuote = false;
    } else if (character === "\r" || character === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      closedQuote = false;
      if (character === "\r" && csv[index + 1] === "\n") {
        index += 1;
      }
    } else {
      field += character;
    }
  }

  if (inQuotes) {
    throw new Error("A quoted field was not closed.");
  }
  if (row.length > 0 || field.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function csvToJSON(input: string): string {
  const [headers, ...records] = parseCSV(input);
  if (!headers) {
    throw new Error("The CSV must include a header row.");
  }

  const seenHeaders = new Set<string>();
  for (const header of headers) {
    if (seenHeaders.has(header)) {
      throw new Error(`The column name “${header || "(empty)"}” appears more than once.`);
    }
    seenHeaders.add(header);
  }

  const objects = records.map((record, index) => {
    if (record.length > headers.length) {
      throw new Error(`Row ${index + 2} has ${record.length} values, but the header has ${headers.length} columns.`);
    }
    return Object.fromEntries(
      headers.map((header, columnIndex) => [header, record[columnIndex] ?? ""]),
    );
  });

  return JSON.stringify(objects, null, 2);
}

function escapeCSVField(value: unknown): string {
  const text = typeof value === "string"
    ? value
    : value === null
      ? "null"
      : JSON.stringify(value);
  const safeText = text ?? "";
  return /[",\r\n]|^\s|\s$/.test(safeText)
    ? `"${safeText.replace(/"/g, '""')}"`
    : safeText;
}

function jsonToCSV(input: string): string {
  if (!input.trim()) {
    throw new Error("Enter JSON data to convert.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (cause) {
    throw new Error(cause instanceof Error ? cause.message : "The JSON could not be parsed.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("JSON to CSV requires an array of objects.");
  }
  if (parsed.some((item) => item === null || typeof item !== "object" || Array.isArray(item))) {
    throw new Error("Every item in the JSON array must be an object.");
  }

  const headers = Array.from(
    parsed.reduce<Set<string>>((keys, item) => {
      Object.keys(item as Record<string, unknown>).forEach((key) => keys.add(key));
      return keys;
    }, new Set<string>()),
  );

  if (headers.length === 0) {
    return "";
  }

  const lines = [headers.map(escapeCSVField).join(",")];
  parsed.forEach((item) => {
    const record = item as Record<string, unknown>;
    lines.push(headers.map((header) => escapeCSVField(record[header] === undefined ? "" : record[header])).join(","));
  });
  return lines.join("\r\n");
}

function CSVJSONConverter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [direction, setDirection] = useState<ConversionDirection>("csv-to-json");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const convert = () => {
    try {
      setOutput(direction === "csv-to-json" ? csvToJSON(input) : jsonToCSV(input));
      setError("");
      setCopied(false);
    } catch (cause) {
      setOutput(null);
      setCopied(false);
      setError(`Unable to convert: ${cause instanceof Error ? cause.message : "Check the input and try again."}`);
    }
  };

  const copyOutput = async () => {
    if (output === null) return;

    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setError("");
    } catch {
      setCopied(false);
      setError("Unable to copy. Check your browser clipboard permissions and try again.");
    }
  };

  const clearAll = () => {
    setInput("");
    setOutput(null);
    setError("");
    setCopied(false);
  };

  const csvToJson = direction === "csv-to-json";

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">🔄 CSV ↔ JSON Converter</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-4">
          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Conversion direction</span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              aria-pressed={csvToJson}
              onClick={() => {
                setDirection("csv-to-json");
                setOutput(null);
                setError("");
                setCopied(false);
              }}
              className={`py-2 px-4 rounded-lg transition-colors ${csvToJson ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"}`}
            >
              CSV → JSON
            </button>
            <button
              type="button"
              aria-pressed={!csvToJson}
              onClick={() => {
                setDirection("json-to-csv");
                setOutput(null);
                setError("");
                setCopied(false);
              }}
              className={`py-2 px-4 rounded-lg transition-colors ${!csvToJson ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"}`}
            >
              JSON → CSV
            </button>
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="csv-json-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Input {csvToJson ? "CSV" : "JSON"}
          </label>
          <textarea
            id="csv-json-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setOutput(null);
              setError("");
              setCopied(false);
            }}
            placeholder={csvToJson ? "name,age\nAda,36" : '[{"name":"Ada","age":36}]'}
            rows={14}
            spellCheck={false}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y font-mono text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={convert}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Convert
          </button>
          <button
            onClick={clearAll}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors ml-auto"
          >
            Clear
          </button>
        </div>
        {error && (
          <div role="alert" className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}
        {output !== null && (
          <div>
            <label htmlFor="csv-json-output" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Output {csvToJson ? "JSON" : "CSV"}
            </label>
            <textarea
              id="csv-json-output"
              value={output}
              readOnly
              rows={14}
              spellCheck={false}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white resize-y font-mono text-sm"
            />
            <button
              onClick={copyOutput}
              className="mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const XML_SPACE_NAMESPACE = "http://www.w3.org/XML/1998/namespace";

function parseXML(input: string): XMLDocument {
  if (!input.trim()) {
    throw new Error("Enter XML to format or minify.");
  }

  const document = new DOMParser().parseFromString(input, "application/xml");
  const root = document.documentElement;
  const parserError = root?.localName === "parsererror" &&
    (root.namespaceURI?.toLowerCase().includes("parsererror") ||
      /(?:xml parsing error|error on line|not well-formed)/i.test(root.textContent ?? ""))
    ? root
    : null;
  if (parserError) {
    const details = parserError.textContent?.replace(/\s+/g, " ").trim();
    throw new Error(details || "The document is not well-formed XML.");
  }

  return document;
}

function updateXMLWhitespace(
  node: Node,
  mode: "format" | "minify",
  depth = 0,
  inheritedPreserve = false,
): void {
  if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_NODE) {
    return;
  }

  const isElement = node.nodeType === Node.ELEMENT_NODE;
  const element = isElement ? (node as Element) : null;
  const spaceSetting = element?.getAttributeNS(XML_SPACE_NAMESPACE, "space");
  const preserveSpace = spaceSetting === "preserve"
    ? true
    : spaceSetting === "default"
      ? false
      : inheritedPreserve;
  const children = Array.from(node.childNodes);
  const ownerDocument = node.nodeType === Node.DOCUMENT_NODE ? node as Document : node.ownerDocument!;

  if (!isElement) {
    children.forEach((child) => updateXMLWhitespace(child, mode, depth, false));
    return;
  }

  const hasTextContent = children.some(
    (child) => child.nodeType === Node.CDATA_SECTION_NODE ||
      (child.nodeType === Node.TEXT_NODE && Boolean(child.textContent?.trim())),
  );
  const hasTextNodes = children.some((child) => child.nodeType === Node.TEXT_NODE);
  const hasElementChildren = children.some((child) => child.nodeType === Node.ELEMENT_NODE);
  const isElementOnlyContent = children.length > 0 && !hasTextContent &&
    (hasElementChildren || !hasTextNodes);

  if (isElementOnlyContent && !preserveSpace) {
    children.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        node.removeChild(child);
      }
    });

    if (mode === "format") {
      const remainingChildren = Array.from(node.childNodes);
      remainingChildren.forEach((child) => {
        node.insertBefore(
          ownerDocument.createTextNode(`\n${"  ".repeat(depth + 1)}`),
          child,
        );
      });
      if (remainingChildren.length > 0) {
        node.appendChild(ownerDocument.createTextNode(`\n${"  ".repeat(depth)}`));
      }
    }
  }

  Array.from(node.childNodes).forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      updateXMLWhitespace(child, mode, depth + 1, preserveSpace);
    }
  });
}

function serializeXML(input: string, mode: "format" | "minify"): string {
  const document = parseXML(input);
  updateXMLWhitespace(document, mode);
  return new XMLSerializer().serializeToString(document).trim();
}

function XMLFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [outputMode, setOutputMode] = useState<"Formatted" | "Minified">("Formatted");

  const processXML = (mode: "format" | "minify") => {
    try {
      setOutput(serializeXML(input, mode));
      setOutputMode(mode === "format" ? "Formatted" : "Minified");
      setError("");
      setCopied(false);
    } catch (cause) {
      setOutput("");
      setCopied(false);
      setError(`Invalid XML: ${cause instanceof Error ? cause.message : "Unable to parse this document."}`);
    }
  };

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setError("");
    } catch {
      setCopied(false);
      setError("Unable to copy. Check your browser clipboard permissions and try again.");
    }
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
    setError("");
    setCopied(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">📄 XML Formatter</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-4">
          <label htmlFor="xml-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Input XML
          </label>
          <textarea
            id="xml-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setOutput("");
              setError("");
              setCopied(false);
            }}
            placeholder="Paste XML here..."
            rows={14}
            spellCheck={false}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y font-mono text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={() => processXML("format")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Format
          </button>
          <button
            onClick={() => processXML("minify")}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Minify
          </button>
          <button
            onClick={clearAll}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors ml-auto"
          >
            Clear
          </button>
        </div>
        {error && (
          <div role="alert" className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}
        {output && (
          <div>
            <label htmlFor="xml-output" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {outputMode} XML
            </label>
            <textarea
              id="xml-output"
              value={output}
              readOnly
              rows={14}
              spellCheck={false}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white resize-y font-mono text-sm"
            />
            <button
              onClick={copyOutput}
              className="mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function JSONFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [indent, setIndent] = useState(2);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, indent);
      setOutput(formatted);
      setError("");
    } catch (e) {
      setError("Invalid JSON: " + (e as Error).message);
      setOutput("");
    }
  };

  const minifyJSON = () => {
    try {
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setOutput(minified);
      setError("");
    } catch (e) {
      setError("Invalid JSON: " + (e as Error).message);
      setOutput("");
    }
  };

  const copyToClipboard = async () => {
    const result = await copyTextToClipboard(output);
    setCopied(result.ok);
    setCopyError(result.ok ? '' : result.reason);
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">{ "{ }" } JSON Formatter</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Input JSON
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"name": "John", "age": 30}'
            rows={10}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={formatJSON}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Format
          </button>
          <button
            onClick={minifyJSON}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Minify
          </button>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700 dark:text-gray-300">Indent:</label>
            <select
              value={indent}
              onChange={(e) => setIndent(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
              <option value={8}>8 spaces</option>
            </select>
          </div>
          <button
            onClick={clearAll}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors ml-auto"
          >
            Clear
          </button>
        </div>
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}
        {output && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Output
            </label>
            <textarea
              value={output}
              readOnly
              rows={10}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white resize-none font-mono text-sm"
            />
            <button
              onClick={copyToClipboard}
              className="mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
            {copyError && (
              <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
                {copyError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Base64Tool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');

  const processBase64 = () => {
    try {
      setOutput(mode === "encode" ? encodeBase64(input) : decodeBase64(input));
    } catch {
      setOutput(
        mode === "encode"
          ? "Error: Could not encode this input"
          : "Error: Invalid Base64 input (check padding and alphabet)",
      );
    }
  };

  const copyToClipboard = async () => {
    const result = await copyTextToClipboard(output);
    setCopied(result.ok);
    setCopyError(result.ok ? '' : result.reason);
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">🔐 Base64 Encode/Decode</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mode
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setMode("encode")}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                mode === "encode"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              }`}
            >
              Encode
            </button>
            <button
              onClick={() => setMode("decode")}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                mode === "decode"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              }`}
            >
              Decode
            </button>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {mode === "encode" ? "Text to encode" : "Base64 to decode"}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === "encode" ? "Enter text to encode..." : "Enter Base64 string to decode..."}
            rows={6}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
        <div className="flex gap-3 mb-4">
          <button
            onClick={processBase64}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {mode === "encode" ? "Encode" : "Decode"}
          </button>
          <button
            onClick={clearAll}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
        {output && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {mode === "encode" ? "Encoded Base64" : "Decoded text"}
            </label>
            <textarea
              value={output}
              readOnly
              rows={6}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
            />
            <button
              onClick={copyToClipboard}
              className="mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
            {copyError && (
              <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
                {copyError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function URLTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  const processURL = () => {
    try {
      if (mode === "encode") {
        const encoded = encodeURIComponent(input);
        setOutput(encoded);
      } else {
        const decoded = decodeURIComponent(input);
        setOutput(decoded);
      }
    } catch {
      setOutput("Error: Invalid input for " + mode);
    }
  };

  const copyToClipboard = async () => {
    const result = await copyTextToClipboard(output);
    setCopied(result.ok);
    setCopyError(result.ok ? '' : result.reason);
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">🔗 URL Encode/Decode</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mode
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setMode("encode")}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                mode === "encode"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              }`}
            >
              Encode
            </button>
            <button
              onClick={() => setMode("decode")}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                mode === "decode"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              }`}
            >
              Decode
            </button>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {mode === "encode" ? "URL to encode" : "URL to decode"}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === "encode" ? "Enter URL to encode..." : "Enter encoded URL to decode..."}
            rows={6}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
        <div className="flex gap-3 mb-4">
          <button
            onClick={processURL}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {mode === "encode" ? "Encode" : "Decode"}
          </button>
          <button
            onClick={clearAll}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
        {output && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {mode === "encode" ? "Encoded URL" : "Decoded URL"}
            </label>
            <textarea
              value={output}
              readOnly
              rows={6}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
            />
            <button
              onClick={copyToClipboard}
              className="mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
            {copyError && (
              <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
                {copyError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

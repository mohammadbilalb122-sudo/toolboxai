"use client";

import { useState } from "react";
import Link from "next/link";
import { useDirectToolRoute } from "@/lib/use-direct-tool-route";
import { copyTextToClipboard } from "@/lib/clipboard";

export default function TextTools() {
  const { activeTool, setActiveTool, openTool } = useDirectToolRoute("text", [
    "word-counter", "case-converter", "remove-spaces", "duplicate-lines",
  ]);

  const tools = [
    { id: "word-counter", name: "Word Counter", description: "Count words, characters, sentences, and paragraphs", icon: "🔢" },
    { id: "case-converter", name: "Case Converter", description: "Convert text to uppercase, lowercase, title case, etc.", icon: "🔤" },
    { id: "remove-spaces", name: "Remove Spaces", description: "Remove extra spaces, lines, and whitespace", icon: "🧹" },
    { id: "duplicate-lines", name: "Duplicate Line Remover", description: "Keep the first occurrence of each line", icon: "📋" },
  ];

  if (activeTool) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16">
          <Link
            href="/text"
            onClick={() => setActiveTool(null)}
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-8"
          >
            ← Back to Text Tools
          </Link>
          {activeTool === "word-counter" && <WordCounter />}
          {activeTool === "case-converter" && <CaseConverter />}
          {activeTool === "remove-spaces" && <RemoveSpaces />}
          {activeTool === "duplicate-lines" && <DuplicateLineRemover />}
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
            <span className="text-4xl sm:text-5xl">✍️</span>
            Text Tools
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Word counter, case converter, and text cleaning utilities
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={`/text?tool=${encodeURIComponent(tool.id)}`}
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

function WordCounter() {
  const [text, setText] = useState("");

  const stats = {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, "").length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    sentences: text.trim() ? text.split(/[.!?]+/).filter(s => s.trim()).length : 0,
    paragraphs: text.trim() ? text.split(/\n\n+/).filter(p => p.trim()).length : 0,
    lines: text ? text.split(/\n/).length : 0,
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">🔢 Word Counter</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enter your text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here..."
            rows={10}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Characters" value={stats.characters} />
          <StatCard label="Characters (no spaces)" value={stats.charactersNoSpaces} />
          <StatCard label="Words" value={stats.words} />
          <StatCard label="Sentences" value={stats.sentences} />
          <StatCard label="Paragraphs" value={stats.paragraphs} />
          <StatCard label="Lines" value={stats.lines} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{label}</p>
      <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{value.toLocaleString()}</p>
    </div>
  );
}

function CaseConverter() {
  const [text, setText] = useState("");
  const [convertedText, setConvertedText] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  const convertCase = (type: string) => {
    switch (type) {
      case "upper":
        setConvertedText(text.toUpperCase());
        break;
      case "lower":
        setConvertedText(text.toLowerCase());
        break;
      case "title":
        setConvertedText(
          text
            .toLowerCase()
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        );
        break;
      case "sentence":
        setConvertedText(
          text
            .toLowerCase()
            .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase())
        );
        break;
      case "alternate":
        setConvertedText(
          text
            .split("")
            .map((char, i) => (i % 2 === 0 ? char.toUpperCase() : char.toLowerCase()))
            .join("")
        );
        break;
      case "inverse":
        setConvertedText(
          text
            .split("")
            .map((char) =>
              char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()
            )
            .join("")
        );
        break;
    }
  };

  const copyToClipboard = async () => {
    const result = await copyTextToClipboard(convertedText);
    setCopied(result.ok);
    setCopyError(result.ok ? '' : result.reason);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">🔤 Case Converter</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enter your text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here..."
            rows={6}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <button
            onClick={() => convertCase("upper")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            UPPERCASE
          </button>
          <button
            onClick={() => convertCase("lower")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            lowercase
          </button>
          <button
            onClick={() => convertCase("title")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Title Case
          </button>
          <button
            onClick={() => convertCase("sentence")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Sentence case
          </button>
          <button
            onClick={() => convertCase("alternate")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            aLtErNaTe
          </button>
          <button
            onClick={() => convertCase("inverse")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            InVeRsE
          </button>
        </div>
        {convertedText && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Converted text
            </label>
            <textarea
              value={convertedText}
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

function RemoveSpaces() {
  const [text, setText] = useState("");
  const [processedText, setProcessedText] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  const processText = (type: string) => {
    switch (type) {
      case "extra-spaces":
        setProcessedText(text.replace(/\s+/g, " ").trim());
        break;
      case "all-spaces":
        setProcessedText(text.replace(/\s/g, ""));
        break;
      case "lines":
        setProcessedText(text.replace(/\n/g, " ").trim());
        break;
      case "extra-lines":
        setProcessedText(text.replace(/\n\s*\n/g, "\n").trim());
        break;
    }
  };

  const copyToClipboard = async () => {
    const result = await copyTextToClipboard(processedText);
    setCopied(result.ok);
    setCopyError(result.ok ? '' : result.reason);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">🧹 Remove Spaces</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enter your text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here..."
            rows={6}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => processText("extra-spaces")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Remove Extra Spaces
          </button>
          <button
            onClick={() => processText("all-spaces")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Remove All Spaces
          </button>
          <button
            onClick={() => processText("lines")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Remove Line Breaks
          </button>
          <button
            onClick={() => processText("extra-lines")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Remove Extra Lines
          </button>
        </div>
        {processedText && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Processed text
            </label>
            <textarea
              value={processedText}
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

function DuplicateLineRemover() {
  const [text, setText] = useState("");
  const [cleanedText, setCleanedText] = useState("");
  const [hasProcessed, setHasProcessed] = useState(false);
  const [removedCount, setRemovedCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const removeDuplicates = () => {
    const lines = text.split(/\r\n|\n|\r/);
    const seen = new Set<string>();
    const uniqueLines = lines.filter((line) => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    });
    setCleanedText(uniqueLines.join("\n"));
    setRemovedCount(lines.length - uniqueLines.length);
    setHasProcessed(true);
    setCopied(false);
    setError("");
  };

  const copyCleanedText = async () => {
    try {
      await navigator.clipboard.writeText(cleanedText);
      setCopied(true);
      setError("");
    } catch {
      setCopied(false);
      setError("Could not copy the text. Select the output and copy it manually.");
    }
  };

  const clearText = () => {
    setText("");
    setCleanedText("");
    setHasProcessed(false);
    setRemovedCount(0);
    setCopied(false);
    setError("");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">📋 Duplicate Line Remover</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-5">
          <label htmlFor="duplicate-lines-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Enter your text</label>
          <textarea
            id="duplicate-lines-input"
            value={text}
            onChange={(event) => { setText(event.target.value); setHasProcessed(false); setCopied(false); setError(""); }}
            placeholder="Paste or type your text here…"
            rows={12}
            className="w-full resize-y rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Matching is exact and case-sensitive. Blank lines are handled like any other line, and the first occurrence is kept.</p>
        </div>

        {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"><p className="text-red-800 dark:text-red-300">{error}</p></div>}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={removeDuplicates} className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700">Remove Duplicates</button>
          <button type="button" onClick={clearText} className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700">Clear</button>
        </div>

        {hasProcessed && <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="duplicate-lines-output" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cleaned text</label>
            <span className="text-sm text-gray-500 dark:text-gray-400">Removed {removedCount} duplicate {removedCount === 1 ? "line" : "lines"}</span>
          </div>
          <textarea
            id="duplicate-lines-output"
            value={cleanedText}
            readOnly
            rows={12}
            className="w-full resize-y rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
          <button type="button" onClick={() => void copyCleanedText()} className="mt-3 rounded-lg bg-green-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-green-700">{copied ? "Copied!" : "Copy"}</button>
        </div>}
      </div>
    </div>
  );
}

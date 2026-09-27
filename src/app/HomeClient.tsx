"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { makeToolKey, useToolActivity } from "@/lib/tool-activity";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeActivityList, setActiveActivityList] = useState<"favorites" | "recent" | "popular" | null>(null);
  const { activity, toggleFavorite } = useToolActivity();
  const categories = [
    {
      id: "pdf",
      name: "PDF Tools",
      icon: "📄",
      description: "Merge, split, rotate, and convert PDF files",
      tools: [
        { id: "compress", name: "Compress PDF" },
        { id: "merge", name: "Merge PDF" },
        { id: "jpg-to-pdf", name: "JPG to PDF" },
        { id: "pdf-to-word", name: "PDF to Word" },
        { id: "to-images", name: "PDF to Images" },
        { id: "split", name: "Split PDF" },
        { id: "rotate", name: "Rotate PDF" },
      ],
    },
    {
      id: "image",
      name: "Image Tools",
      icon: "🖼️",
      description: "Compress, resize, convert, crop, and clean up images",
      tools: [
        { id: "compress", name: "Compress Image" },
        { id: "resize", name: "Resize Image" },
        { id: "convert", name: "Convert Format" },
        { id: "crop", name: "Crop Image" },
        { id: "metadata", name: "Image Metadata Remover" },
      ],
    },
    {
      id: "calculator",
      name: "Calculators",
      icon: "🧮",
      description: "Date, percentage, loan, health, and unit calculators",
      tools: [
        { id: "percentage", name: "Percentage Calculator" },
        { id: "emi", name: "EMI Calculator" },
        { id: "gst", name: "GST Calculator" },
        { id: "age", name: "Age Calculator" },
        { id: "discount", name: "Discount Calculator" },
        { id: "unit", name: "Unit Converter" },
        { id: "bmi", name: "BMI Calculator" },
        { id: "compound-interest", name: "Compound Interest Calculator" },
        { id: "date-difference", name: "Date Difference" },
      ],
    },
    {
      id: "developer",
      name: "Developer Tools",
      icon: "💻",
      description: "Format, convert, generate, and test developer data",
      tools: [
        { id: "json-formatter", name: "JSON Formatter" },
        { id: "url", name: "URL Encode/Decode" },
        { id: "base64", name: "Base64 Encode/Decode" },
        { id: "xml-formatter", name: "XML Formatter" },
        { id: "csv-json", name: "CSV ↔ JSON Converter" },
        { id: "uuid-generator", name: "UUID Generator" },
        { id: "regex-tester", name: "Regex Tester" },
      ],
    },
    {
      id: "text",
      name: "Text Tools",
      icon: "✍️",
      description: "Count, convert, and clean text",
      tools: [
        { id: "word-counter", name: "Word Counter" },
        { id: "case-converter", name: "Case Converter" },
        { id: "remove-spaces", name: "Remove Spaces" },
        { id: "duplicate-lines", name: "Duplicate Line Remover" },
      ],
    },
    {
      id: "writing",
      name: "Writing Tools",
      icon: "✍️",
      description: "Private offline helpers for summaries, rewrites, grammar, and templates",
      tools: [
        { id: "summary", name: "Text Summary" },
        { id: "rewrite", name: "Rewrite Helper" },
        { id: "grammar", name: "Grammar Suggestions" },
        { id: "templates", name: "Writing Templates" },
      ],
    },
    {
      id: "qr",
      name: "QR Tools",
      icon: "🔳",
      description: "Generate and scan QR codes",
      tools: [
        { id: "generate", name: "Generate QR" },
        { id: "scan", name: "Scan QR" },
      ],
    },
  ];
  const allTools = categories.flatMap((category) =>
    category.tools.map((tool) => ({
      ...tool,
      key: makeToolKey(category.id, tool.id),
      categoryId: category.id,
      categoryName: category.name,
    })),
  );
  const toolsByKey = new Map(allTools.map((tool) => [tool.key, tool]));
  const favorites = activity.favorites
    .map((key) => toolsByKey.get(key))
    .filter((tool): tool is (typeof allTools)[number] => Boolean(tool));
  const recentlyUsed = activity.recent
    .map((key) => toolsByKey.get(key))
    .filter((tool): tool is (typeof allTools)[number] => Boolean(tool));
  const mostUsed = allTools
    .filter((tool) => (activity.counts[tool.key] ?? 0) > 0)
    .sort((first, second) => activity.counts[second.key] - activity.counts[first.key])
    .slice(0, 5);
  const favoriteKeys = new Set(activity.favorites);
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const searchResults = normalizedSearch
    ? allTools.filter((tool) => `${tool.name} ${tool.categoryName}`.toLowerCase().includes(normalizedSearch))
    : [];

  const renderActivitySection = (
    title: string,
    tools: typeof allTools,
    emptyMessage: string,
  ) => (
    <section className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow border border-gray-100 dark:border-gray-700">
      <h2 className="text-lg font-bold mb-3 text-gray-800 dark:text-white">{title}</h2>
      {tools.length > 0 ? (
        <ul className="space-y-2">
          {tools.map((tool) => {
            const isFavorite = favoriteKeys.has(tool.key);
            return (
              <li key={tool.key} className="flex items-center gap-2">
                <Link
                  href={`/${tool.categoryId}?tool=${encodeURIComponent(tool.id)}`}
                  className="min-w-0 flex-1 text-sm text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <span className="block truncate">{tool.name}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">{tool.categoryName}</span>
                </Link>
                {activity.counts[tool.key] !== undefined && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {activity.counts[tool.key]} {activity.counts[tool.key] === 1 ? "use" : "uses"}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => toggleFavorite(tool.key)}
                  aria-label={`${isFavorite ? "Remove" : "Add"} ${tool.name} ${isFavorite ? "from" : "to"} favorites`}
                  aria-pressed={isFavorite}
                  className="shrink-0 rounded p-1 text-xl leading-none text-amber-500 hover:bg-amber-50 dark:hover:bg-gray-700"
                >
                  {isFavorite ? "★" : "☆"}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      )}
    </section>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="relative z-10 mb-8 flex flex-wrap justify-start gap-2">
          {([
            ["favorites", "★ Favorites"],
            ["recent", "◷ Recently Used"],
            ["popular", "↗ Most Used"],
          ] as const).map(([list, label]) => (
            <button
              key={list}
              type="button"
              onClick={() => setActiveActivityList((current) => current === list ? null : list)}
              aria-expanded={activeActivityList === list}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${activeActivityList === list ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeActivityList && (
          <div className="mb-8 max-w-xl">
            {activeActivityList === "favorites" && renderActivitySection("Favorites", favorites, "Star a tool in search results to save it here.")}
            {activeActivityList === "recent" && renderActivitySection("Recently used", recentlyUsed, "Tools you open will appear here.")}
            {activeActivityList === "popular" && renderActivitySection("Most used on this browser", mostUsed, "Use a few tools to build a local usage list.")}
          </div>
        )}

        <div className="text-center mb-16">
          <h1 className="mb-4 text-3xl font-bold text-gray-800 dark:text-white">
            Free Online Tools for Everyday Tasks
          </h1>
          <span className="mx-auto mb-4 flex w-full max-w-[236px] justify-center rounded-xl dark:bg-white dark:p-2">
            <Image
              src="/toolboxai-logo.png"
              alt="ToolBoxAI — Free Tools for a Smarter You"
              width={1112}
              height={893}
              sizes="(max-width: 220px) 100vw, 220px"
              preload
              className="h-auto w-full max-w-[220px]"
            />
          </span>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Your all-in-one toolkit for PDF, images, QR codes, text, calculations, and developer utilities
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-10">
          <label htmlFor="tool-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search all tools
          </label>
          <input
            id="tool-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by tool name or category..."
            autoComplete="off"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <p className="max-w-7xl mx-auto -mt-6 mb-8 text-center text-xs text-gray-500 dark:text-gray-400">
          Favorites, recent tools, and usage counts stay in this browser.
        </p>

        {normalizedSearch ? (
          <section aria-live="polite" className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              {searchResults.length} {searchResults.length === 1 ? "tool" : "tools"} found
            </h2>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {searchResults.map((tool) => (
                  <div key={tool.key} className="flex items-center rounded-xl bg-white dark:bg-gray-800 shadow border border-gray-100 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                    <Link
                      href={`/${tool.categoryId}?tool=${encodeURIComponent(tool.id)}`}
                      className="min-w-0 flex-1 p-5"
                    >
                      <span className="font-semibold text-gray-800 dark:text-white">{tool.name}</span>
                      <span className="block mt-1 text-sm text-gray-500 dark:text-gray-400">{tool.categoryName}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(tool.key)}
                      aria-label={`${favoriteKeys.has(tool.key) ? "Remove" : "Add"} ${tool.name} ${favoriteKeys.has(tool.key) ? "from" : "to"} favorites`}
                      aria-pressed={favoriteKeys.has(tool.key)}
                      className="mr-4 shrink-0 rounded p-2 text-2xl text-amber-500 hover:bg-amber-50 dark:hover:bg-gray-700"
                    >
                      {favoriteKeys.has(tool.key) ? "★" : "☆"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No tools match “{searchQuery.trim()}”.</p>
            )}
          </section>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/${category.id}`}
                  className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{category.icon}</div>
                    <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs font-semibold px-3 py-1 rounded-full">
                      {category.tools.length} tools
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {category.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                    {category.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {category.tools.slice(0, 4).map((tool) => (
                      <span
                        key={tool.id}
                        className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded"
                      >
                        {tool.name}
                      </span>
                    ))}
                    {category.tools.length > 4 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                        +{category.tools.length - 4} more
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="text-center mt-16 text-gray-500 dark:text-gray-400">
          <p>Free to use • No signup required • All tools work in your browser</p>
        </div>
      </div>
    </div>
  );
}

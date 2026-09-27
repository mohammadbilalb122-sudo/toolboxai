"use client";

import { useState } from "react";
import Link from "next/link";
import { copyTextToClipboard } from "@/lib/clipboard";
import { useDirectToolRoute } from "@/lib/use-direct-tool-route";

const tools = [
  { id: "summary", name: "Text Summary", description: "Create a short extractive summary from your text.", icon: "📝" },
  { id: "rewrite", name: "Rewrite Helper", description: "Make text clearer, more concise, professional, or friendlier.", icon: "✨" },
  { id: "grammar", name: "Grammar Suggestions", description: "Fix common spelling and punctuation mistakes locally.", icon: "✅" },
  { id: "templates", name: "Writing Templates", description: "Draft a useful starting point for an email, post, or product description.", icon: "📄" },
] as const;

type RewriteStyle = "clear" | "concise" | "professional" | "friendly";
type TemplateKind = "email" | "post" | "product";

const STOP_WORDS = new Set("a an and are as at be been but by can for from had has have he her hers him his i if in into is it its me my of on or our she that the their them then there these they this to was we were what when which who will with you your".split(" "));

function splitSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];
}

function summarize(text: string, count: number): string {
  const sentences = splitSentences(text);
  if (sentences.length <= count) return sentences.join(" ");

  const frequency = new Map<string, number>();
  for (const word of text.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? []) {
    if (!STOP_WORDS.has(word) && word.length > 2) frequency.set(word, (frequency.get(word) ?? 0) + 1);
  }
  const ranked = sentences.map((sentence, index) => {
    const words = sentence.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? [];
    const score = words.reduce((total, word) => total + (frequency.get(word) ?? 0), 0) / Math.max(1, words.length);
    return { sentence, index, score };
  });
  return ranked
    .sort((first, second) => second.score - first.score || first.index - second.index)
    .slice(0, count)
    .sort((first, second) => first.index - second.index)
    .map(({ sentence }) => sentence)
    .join(" ");
}

function rewrite(text: string, style: RewriteStyle): string {
  const replacements: Record<RewriteStyle, Array<[RegExp, string]>> = {
    clear: [[/\bin order to\b/gi, "to"], [/\bat this point in time\b/gi, "now"], [/\bdue to the fact that\b/gi, "because"], [/\butili[sz]e\b/gi, "use"]],
    concise: [[/\b(in my opinion|i think that|it is important to note that)\b[, ]*/gi, ""], [/\bvery\s+/gi, ""], [/\breally\s+/gi, ""], [/\bin order to\b/gi, "to"], [/\bdue to the fact that\b/gi, "because"]],
    professional: [[/\bcan't\b/gi, "cannot"], [/\bwon't\b/gi, "will not"], [/\bdon't\b/gi, "do not"], [/\bi'm\b/gi, "I am"], [/\bthanks\b/gi, "Thank you"], [/\bawesome\b/gi, "excellent"]],
    friendly: [[/\btherefore\b/gi, "so"], [/\bhowever\b/gi, "but"], [/\bassist\b/gi, "help"], [/\bcommence\b/gi, "start"], [/\bplease be advised that\b/gi, ""]],
  };
  return replacements[style].reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), text).replace(/[ \t]{2,}/g, " ").replace(/\s+([,.!?;:])/g, "$1").trim();
}

function suggestGrammar(text: string): { corrected: string; fixes: string[] } {
  const rules: Array<[RegExp, string, string]> = [
    [/\bteh\b/gi, "the", "Corrected ‘teh’ to ‘the’"],
    [/\brecieve\b/gi, "receive", "Corrected ‘recieve’ to ‘receive’"],
    [/\bseperate\b/gi, "separate", "Corrected ‘seperate’ to ‘separate’"],
    [/\bdefinately\b/gi, "definitely", "Corrected ‘definately’ to ‘definitely’"],
    [/\balot\b/gi, "a lot", "Corrected ‘alot’ to ‘a lot’"],
    [/\bi\b/g, "I", "Capitalized the pronoun ‘I’"],
  ];
  let corrected = text;
  const fixes: string[] = [];
  for (const [pattern, replacement, description] of rules) {
    if (pattern.test(corrected)) {
      corrected = corrected.replace(pattern, replacement);
      fixes.push(description);
    }
  }
  if (/\s+[,.!?;:]/.test(corrected)) {
    corrected = corrected.replace(/\s+([,.!?;:])/g, "$1");
    fixes.push("Removed spaces before punctuation");
  }
  if (/[,.!?;:]{2,}/.test(corrected)) {
    corrected = corrected.replace(/([,.!?;:])\1+/g, "$1");
    fixes.push("Removed repeated punctuation");
  }
  if (/[ \t]{2,}/.test(corrected)) {
    corrected = corrected.replace(/[ \t]{2,}/g, " ");
    fixes.push("Collapsed repeated spaces");
  }
  return { corrected, fixes };
}

function makeTemplate(kind: TemplateKind, topic: string): string {
  const subject = topic.trim() || "your topic";
  if (kind === "email") return `Subject: About ${subject}\n\nHi [Name],\n\nI’m reaching out about ${subject}.\n\n[Add the key details and what you need from the reader.]\n\nThank you,\n[Your name]`;
  if (kind === "post") return `A quick note about ${subject}:\n\n[Share one useful idea, update, or takeaway.]\n\nWhat has your experience been?`;
  return `${subject}\n\n[One sentence explaining what it is and who it helps.]\n\nHighlights:\n• [Benefit or feature]\n• [Benefit or feature]\n• [Benefit or feature]\n\n[Add any important details, limitations, or specifications.]`;
}

export default function WritingTools() {
  const { activeTool, setActiveTool, openTool } = useDirectToolRoute(
    "writing",
    tools.map(({ id }) => id),
  );
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");
  const [message, setMessage] = useState("");
  const [summarySentences, setSummarySentences] = useState(3);
  const [rewriteStyle, setRewriteStyle] = useState<RewriteStyle>("clear");
  const [templateKind, setTemplateKind] = useState<TemplateKind>("email");

  const tool = tools.find(({ id }) => id === activeTool);
  const runTool = () => {
    setMessage("");
    if (activeTool === "templates") {
      setOutput(makeTemplate(templateKind, text));
      return;
    }
    if (!text.trim()) {
      setOutput("");
      setMessage("Enter some text first.");
      return;
    }
    if (activeTool === "summary") setOutput(summarize(text, summarySentences));
    if (activeTool === "rewrite") setOutput(rewrite(text, rewriteStyle));
    if (activeTool === "grammar") {
      const result = suggestGrammar(text);
      setOutput(result.corrected);
      setMessage(result.fixes.length ? `${result.fixes.length} suggestion${result.fixes.length === 1 ? "" : "s"}: ${result.fixes.join("; ")}` : "No common spelling or punctuation issues found.");
    }
  };

  const copyOutput = async () => {
    try {
      await copyTextToClipboard(output);
      setMessage("Copied to clipboard.");
    } catch {
      setMessage("Could not access the clipboard. Select and copy the text instead.");
    }
  };

  if (!tool) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16">
          <Link href="/" className="mb-8 inline-flex min-h-11 items-center rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-blue-300">← Back to Home</Link>
          <header className="mb-12 mt-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white sm:text-4xl">✍️ Writing Tools</h1>
            <p className="mt-3 text-gray-600 dark:text-gray-300">Private, offline helpers for everyday writing. Your text stays in this browser; these tools use transparent rules and templates rather than a hosted AI model.</p>
          </header>
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
            {tools.map((item) => (
              <Link key={item.id} href={`/writing?tool=${item.id}`} onClick={(event) => { event.preventDefault(); openTool(item.id); }} className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800">
                <span className="text-4xl" aria-hidden="true">{item.icon}</span>
                <h2 className="mt-3 text-xl font-bold text-gray-800 dark:text-white">{item.name}</h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <Link href="/writing" onClick={() => setActiveTool(null)} className="mb-8 inline-flex min-h-11 items-center text-blue-600 hover:underline dark:text-blue-400">← Back to Writing Tools</Link>
        <h1 className="mb-2 text-3xl font-bold text-gray-800 dark:text-white">{tool.icon} {tool.name}</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-300">Runs locally in your browser. It does not send text to a server.</p>
        {activeTool === "templates" ? (
          <div className="mb-4">
            <label htmlFor="writing-template-kind" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Template</label>
            <select id="writing-template-kind" value={templateKind} onChange={(event) => setTemplateKind(event.target.value as TemplateKind)} className="w-full rounded-lg border border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
              <option value="email">Email</option><option value="post">Social post</option><option value="product">Product description</option>
            </select>
          </div>
        ) : null}
        {activeTool === "summary" ? (
          <div className="mb-4">
            <label htmlFor="summary-sentences" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Summary length: {summarySentences} sentences</label>
            <input id="summary-sentences" type="range" min="1" max="5" value={summarySentences} onChange={(event) => setSummarySentences(Number(event.target.value))} />
          </div>
        ) : null}
        {activeTool === "rewrite" ? (
          <div className="mb-4">
            <label htmlFor="rewrite-style" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Style</label>
            <select id="rewrite-style" value={rewriteStyle} onChange={(event) => setRewriteStyle(event.target.value as RewriteStyle)} className="w-full rounded-lg border border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
              <option value="clear">Clearer</option><option value="concise">More concise</option><option value="professional">Professional</option><option value="friendly">Friendlier</option>
            </select>
          </div>
        ) : null}
        <label htmlFor="writing-input" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">{activeTool === "templates" ? "Topic or subject" : "Text"}</label>
        <textarea id="writing-input" value={text} onChange={(event) => { setText(event.target.value); setOutput(""); setMessage(""); }} rows={8} maxLength={100000} placeholder={activeTool === "templates" ? "e.g. launching a neighborhood bakery" : "Paste or type your text here…"} className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={runTool} className="min-h-11 rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700">{activeTool === "templates" ? "Create draft" : "Run tool"}</button>
          <button type="button" onClick={() => { setText(""); setOutput(""); setMessage(""); }} className="min-h-11 rounded-lg bg-gray-200 px-5 py-2 font-semibold text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white">Reset</button>
        </div>
        {message ? <p role="status" className="mt-4 text-sm text-gray-700 dark:text-gray-300">{message}</p> : null}
        {output ? (
          <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800" aria-labelledby="writing-output-title">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 id="writing-output-title" className="font-semibold text-gray-800 dark:text-white">{activeTool === "grammar" ? "Suggested text" : activeTool === "templates" ? "Draft template" : "Result"}</h2><button type="button" onClick={() => void copyOutput()} className="min-h-10 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Copy</button></div>
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6 text-gray-700 dark:text-gray-200">{output}</pre>
          </section>
        ) : null}
      </div>
    </main>
  );
}

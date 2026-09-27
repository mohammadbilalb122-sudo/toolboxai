"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          padding: "1.5rem",
          background: "#f8fafc",
          color: "#1e293b",
        }}
      >
        <main style={{ maxWidth: "32rem", textAlign: "center" }}>
          <p style={{ fontSize: "3rem", margin: 0, lineHeight: 1 }} aria-hidden="true">
            ⚠️
          </p>
          <h1 style={{ fontSize: "1.5rem", margin: "1rem 0 0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ margin: "0 0 1.5rem", lineHeight: 1.6 }}>
            ToolBoxAI hit an unexpected error and could not continue. Your files were never
            uploaded — everything runs in your browser.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={reset}
              style={{
                background: "#2563eb",
                color: "#fff",
                border: 0,
                borderRadius: "0.5rem",
                padding: "0.625rem 1.25rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <Link
              href="/"
              style={{
                background: "#e2e8f0",
                color: "#0f172a",
                borderRadius: "0.5rem",
                padding: "0.625rem 1.25rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Back to home
            </Link>
          </div>
          {error.digest ? (
            <p style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: "#64748b" }}>
              Reference: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}

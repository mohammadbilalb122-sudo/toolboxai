"use client";

import Link from "next/link";

type ToolErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
  /** Category label used in the message, e.g. "image tools". */
  area: string;
  /** Home route to offer as an escape hatch, e.g. "/image". */
  backHref: string;
  backLabel: string;
};

export default function ToolError({ error, reset, area, backHref, backLabel }: ToolErrorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-20 max-w-xl text-center">
        <p className="text-5xl mb-4" aria-hidden="true">
          ⚠️
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-3">
          This tool hit an unexpected error
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
          The {area} could not finish. Nothing was uploaded — every tool here runs entirely in your
          browser, so your files never left this device.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
          >
            Try again
          </button>
          <Link
            href={backHref}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-2.5 px-5 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {backLabel}
          </Link>
        </div>

        {error.digest ? (
          <p className="mt-8 text-xs text-gray-400 dark:text-gray-500">
            Reference: {error.digest}
          </p>
        ) : null}
      </div>
    </div>
  );
}

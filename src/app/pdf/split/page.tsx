import type { Metadata } from "next";
import Link from "next/link";
import SplitPDF from "@/components/pdf/SplitPDF";

export const metadata: Metadata = {
  title: {
    absolute: "Split PDF Online – Extract Pages from a PDF | ToolBoxAI",
  },
  description:
    "Split a PDF online by selecting page numbers or ranges. Extract the pages you need and download a new PDF, processed locally in your browser.",
  alternates: {
    canonical: "/pdf/split",
  },
};

export default function SplitPDFPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <Link
          href="/pdf"
          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-8"
        >
          ← Back to PDF Tools
        </Link>
        <SplitPDF seoPage />
      </div>
    </div>
  );
}

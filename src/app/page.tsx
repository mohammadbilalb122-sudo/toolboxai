import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: {
    absolute: "ToolBoxAI - Free Online Tools for PDF, Images, QR, Text & More",
  },
  description:
    "ToolBoxAI provides free online tools for PDF, images, QR codes, text, calculators, writing, and developer utilities. Fast and easy browser-based tools.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ToolBoxAI - Free Online Tools for PDF, Images, QR, Text & More",
    description:
      "ToolBoxAI provides free online tools for PDF, images, QR codes, text, calculators, writing, and developer utilities. Fast and easy browser-based tools.",
  },
  twitter: {
    title: "ToolBoxAI - Free Online Tools for PDF, Images, QR, Text & More",
    description:
      "ToolBoxAI provides free online tools for PDF, images, QR codes, text, calculators, writing, and developer utilities. Fast and easy browser-based tools.",
  },
};

export default function HomePage() {
  return <HomeClient />;
}

import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://toolboxai-gamma.vercel.app/"),
  verification: {
    google: "g9wQh6M2yyGOCO1aKb4PkRGiB9p9N3-iOS78llVpfoA",
  },
  title: {
    default: "ToolBoxAI - All-in-One Online Tools",
    template: "%s | ToolBoxAI",
  },
  description: "Free browser tools for PDF, images, QR codes, writing, text, calculations, and developer utilities. Your files and text stay on your device.",
  applicationName: "ToolBoxAI",
  robots: { index: true, follow: true },
  category: "utilities",
  openGraph: {
    title: "ToolBoxAI - All-in-One Online Tools",
    description: "Free browser tools for PDF, images, QR codes, writing, text, calculations, and developer utilities. Your files and text stay on your device.",
    siteName: "ToolBoxAI",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "ToolBoxAI - All-in-One Online Tools",
    description: "Free browser tools for PDF, images, QR codes, writing, text, calculations, and developer utilities.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5619746461315471"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const isDark = stored === 'dark' || (!stored && prefersDark);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {
                  console.error('Theme script error:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}

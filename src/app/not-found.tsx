import Link from "next/link";

const CATEGORIES = [
  { href: "/image", label: "Image Tools", icon: "🖼️" },
  { href: "/pdf", label: "PDF Tools", icon: "📄" },
  { href: "/text", label: "Text Tools", icon: "📝" },
  { href: "/writing", label: "Writing Tools", icon: "✍️" },
  { href: "/calculator", label: "Calculators", icon: "🧮" },
  { href: "/developer", label: "Developer Tools", icon: "💻" },
  { href: "/qr", label: "QR Codes", icon: "🔳" },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
        <p className="text-6xl font-black text-blue-600 dark:text-blue-400 mb-4">404</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-3">
          Page not found
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
          That link does not point to anything here. Pick a category below to get back to work.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {CATEGORIES.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 font-semibold text-gray-700 dark:text-gray-200 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-gray-700"
            >
              <span className="text-2xl" aria-hidden="true">
                {category.icon}
              </span>
              {category.label}
            </Link>
          ))}
        </div>

        <Link
          href="/"
          className="mt-8 inline-block text-blue-600 dark:text-blue-400 font-semibold hover:underline"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}

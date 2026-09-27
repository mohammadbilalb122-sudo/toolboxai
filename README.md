# ToolBoxAI

ToolBoxAI is a browser-first collection of PDF, image, QR, text, calculator, writing, and developer utilities. Files and text are processed locally in the browser; the app does not require API keys or a backend service.

## Current project

The deployable Next.js project is this repository root (`F:\toolboxai`). The nested `toolboxai/` directory is an older copy and is intentionally excluded from linting and TypeScript checks. It is kept in place and is not used for deployment.

## Requirements and local development

- Node.js 20.9 or newer
- npm

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Release checks

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run start
```

The app is a standard Next.js Node.js deployment. Connect the repository with its root as the project directory and use `npm ci`, `npm run build`, and `npm run start`. Vercel can detect these settings automatically.

`SITE_URL` is optional. Set it to the canonical public origin (for example, `https://your-domain.example`) when the hosting platform does not forward the request host and protocol. It is used only for crawler sitemap and robots URLs. No secrets or external AI service credentials are needed.

## Tools

- PDF: compress, merge, JPG to PDF, extract text to Word, PDF to images, split, and rotate
- Images: compress, resize, convert formats, crop, and remove embedded metadata
- QR: generate and download codes; scan an image or use the camera on HTTPS
- Text: word count, case conversion, whitespace cleanup, and duplicate-line removal
- Calculators: percentage, EMI, GST, age, discount, unit conversion, BMI, compound interest, and date difference
- Writing: offline summary, rewrite, grammar suggestions, and prompt-based templates; these are local deterministic helpers, not a hosted AI model
- Developer: JSON, URL, Base64, XML, CSV/JSON, UUID, and regex tools

All files under `public/` are deployable assets. The PDF.js worker is a required runtime asset and should remain in the project; lint excludes that minified upstream bundle.

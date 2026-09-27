import { headers } from "next/headers";

/** Resolve the public origin for crawler metadata from configured hosting data. */
export async function getSiteOrigin(): Promise<string> {
  const configured = process.env.SITE_URL?.trim();
  if (configured) return normalizeOrigin(configured);

  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || requestHeaders.get("host");
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol === "http" || forwardedProtocol === "https"
    ? forwardedProtocol
    : process.env.NODE_ENV === "development"
      ? "http"
      : "https";

  if (host) return normalizeOrigin(`${protocol}://${host}`);

  const deploymentHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (deploymentHost) return normalizeOrigin(`https://${deploymentHost}`);

  throw new Error("Could not determine the public site origin. Set SITE_URL for sitemap generation.");
}

function normalizeOrigin(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("SITE_URL must use http or https.");
  }
  if (url.username || url.password) {
    throw new Error("SITE_URL must not contain credentials.");
  }
  return url.origin;
}

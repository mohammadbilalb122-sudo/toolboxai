import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site-origin";

const routes = ["", "/pdf", "/image", "/qr", "/text", "/writing", "/calculator", "/developer"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await getSiteOrigin();
  return routes.map((route, index) => ({
    url: new URL(route, origin).toString(),
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : 0.8,
  }));
}

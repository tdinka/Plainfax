import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/config";
import { GUIDES } from "@/lib/guides";

// Built per request so it uses the live APP_URL rather than whatever was set at build time.
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  return [
    { url: `${base}/`, priority: 1 },
    ...GUIDES.map((g) => ({ url: `${base}/${g.slug}`, priority: 0.8 })),
    { url: `${base}/terms`, priority: 0.2 },
    { url: `${base}/privacy`, priority: 0.2 },
  ];
}

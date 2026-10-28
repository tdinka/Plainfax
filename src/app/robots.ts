import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/config";

export const dynamic = "force-dynamic";

// Fax status pages (/f/...) are private links, so search engines shouldn't crawl them.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/f/", "/api/"] },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// This is a free, educational wallet-security tool — we WANT search engines and
// AI assistants to index and cite it. So all crawlers (including GPTBot,
// ClaudeBot, PerplexityBot, etc.) are allowed by the wildcard rule. Only
// internal/session-specific routes are disallowed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/analytics", "/diagnostic/diagnosis"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

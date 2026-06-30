import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { HOW_PAGES } from "@/content/diagnoses";
import { LEARN_TOPICS } from "@/content/learn-topics";

export default function sitemap(): MetadataRoute.Sitemap {
  const base: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/learn`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/diagnostic`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/how-hackable-are-you`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.5 },
  ];
  const how = HOW_PAGES.map((p) => ({
    url: `${SITE_URL}/how/${p.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));
  const learn = LEARN_TOPICS.map((t) => ({
    url: `${SITE_URL}/learn/${t.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  return [...base, ...how, ...learn];
}

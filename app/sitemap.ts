import type { MetadataRoute } from "next";
import { isProductionSite, productionSiteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isProductionSite) return [];

  const lastModified = new Date("2026-11-05T00:00:00.000Z");

  return [
    { url: productionSiteUrl, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${productionSiteUrl}/contact`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${productionSiteUrl}/privacy`, lastModified: new Date("2026-08-02"), changeFrequency: "yearly", priority: 0.4 },
    { url: `${productionSiteUrl}/terms`, lastModified: new Date("2026-08-02"), changeFrequency: "yearly", priority: 0.4 },
  ];
}

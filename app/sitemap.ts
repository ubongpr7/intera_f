import type { MetadataRoute } from "next";
import { isProductionSite, productionSiteUrl } from "@/lib/seo";
import { getAllBlogPosts } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isProductionSite) return [];

  const lastModified = new Date("2026-11-05T00:00:00.000Z");

  const blogEntries = getAllBlogPosts().map((post) => ({
    url: `${productionSiteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly" as const,
    priority: post.featured ? 0.9 : 0.7,
  }));

  return [
    { url: productionSiteUrl, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${productionSiteUrl}/blog`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${productionSiteUrl}/contact`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${productionSiteUrl}/privacy`, lastModified: new Date("2026-08-02"), changeFrequency: "yearly", priority: 0.4 },
    { url: `${productionSiteUrl}/terms`, lastModified: new Date("2026-08-02"), changeFrequency: "yearly", priority: 0.4 },
    ...blogEntries,
  ];
}

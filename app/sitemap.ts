import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://www.interaims.com", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://www.interaims.com/contact", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://www.interaims.com/privacy", lastModified: new Date("2026-08-02"), changeFrequency: "yearly", priority: 0.4 },
    { url: "https://www.interaims.com/terms", lastModified: new Date("2026-08-02"), changeFrequency: "yearly", priority: 0.4 },
  ];
}

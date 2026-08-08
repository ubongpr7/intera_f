import type { MetadataRoute } from "next";

const privatePaths = [
  "/api/",
  "/accounts",
  "/dashboard",
  "/inventory",
  "/product",
  "/profile",
  "/settings",
  "/user/",
  "/admin",
  "/agent",
  "/pos",
  "/order",
  "/payment-admin",
  "/companies",
  "/notifications",
  "/audit",
  "/stream",
  "/features",
  "/activate/",
  "/invitations/",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/contact", "/terms", "/privacy", "/llms.txt"],
        disallow: privatePaths,
      },
      {
        userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "PerplexityBot", "Google-Extended"],
        allow: ["/", "/contact", "/terms", "/privacy", "/llms.txt"],
        disallow: privatePaths,
      },
    ],
    sitemap: "https://www.interaims.com/sitemap.xml",
  };
}

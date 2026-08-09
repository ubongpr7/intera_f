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

const publicPaths = ["/", "/contact", "/terms", "/privacy", "/llms.txt", "/llms-full.txt"];

const aiCrawlers = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "PerplexityBot",
  "Google-Extended",
  "Bytespider",
  "Applebot-Extended",
  "Amazonbot",
  "FacebookBot",
  "meta-externalagent",
  "CCBot",
  "cohere-ai",
  "Diffbot",
  "YouBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: publicPaths,
        disallow: privatePaths,
      },
      {
        userAgent: aiCrawlers,
        allow: publicPaths,
        disallow: privatePaths,
      },
    ],
    sitemap: "https://www.interaims.com/sitemap.xml",
  };
}

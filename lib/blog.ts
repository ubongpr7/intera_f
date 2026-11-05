import fs from "node:fs";
import path from "node:path";

export type BlogFrontmatter = {
  title: string;
  description: string;
  slug: string;
  category: string;
  publishedAt: string;
  updatedAt: string;
  author: string;
  readTime: string;
  featured: boolean;
  image?: string;
  imageAlt?: string;
};

export type BlogPost = BlogFrontmatter & { content: string };

const blogDirectory = path.join(process.cwd(), "content", "blog");

function parseFrontmatter(source: string): { data: Record<string, string>; content: string } {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return { data: {}, content: source };

  const data = Object.fromEntries(
    match[1].split("\n").flatMap((line) => {
      const separator = line.indexOf(":");
      if (separator === -1) return [];
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
      return [[key, value]];
    }),
  );

  return { data, content: match[2].trim() };
}

function readPost(filename: string): BlogPost {
  const source = fs.readFileSync(path.join(blogDirectory, filename), "utf8");
  const { data, content } = parseFrontmatter(source);
  return {
    title: data.title ?? "",
    description: data.description ?? "",
    slug: data.slug ?? filename.replace(/\.md$/, ""),
    category: data.category ?? "Inventory management",
    publishedAt: data.publishedAt ?? "",
    updatedAt: data.updatedAt ?? data.publishedAt ?? "",
    author: data.author ?? "Ubong Prosper",
    readTime: data.readTime ?? "6 min read",
    featured: data.featured === "true",
    image: data.image || undefined,
    imageAlt: data.imageAlt || undefined,
    content,
  };
}

export function getAllBlogPosts(): BlogPost[] {
  if (!fs.existsSync(blogDirectory)) return [];
  return fs
    .readdirSync(blogDirectory)
    .filter((filename) => filename.endsWith(".md"))
    .map(readPost)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return getAllBlogPosts().find((post) => post.slug === slug);
}

export function formatBlogDate(date: string): string {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "long" }).format(new Date(date));
}


import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { getAllBlogPosts } from "@/lib/blog";
import { DEFAULT_BRAND_AVATAR_SRC } from "@/lib/brandAssets";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { ProgressiveBlogGrid } from "@/components/blog/ProgressiveBlogGrid";

export const metadata: Metadata = {
  title: "Inventory Management Resources for Nigerian Businesses",
  description:
    "Practical inventory management, POS, purchasing, and stock control guides for Nigerian retailers, distributors, warehouses, and growing businesses.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Intera IMS Inventory Management Resources",
    description: "Practical guides for clearer inventory operations in Nigeria.",
    type: "website",
    url: "/blog",
  },
};

export default function BlogIndexPage() {
  const posts = getAllBlogPosts();
  const featured = posts.find((post) => post.featured) ?? posts[0];
  const remaining = posts.filter((post) => post.slug !== featured?.slug);

  return (
    <main className="blog-shell">
      <LandingHeader />

      <section className="blog-hero">
        <p className="blog-eyebrow"><BookOpen size={16} /> Intera IMS resources</p>
        <h1>Run a clearer stock operation.</h1>
        <p>
          Practical guides for Nigerian retailers, distributors, warehouses, and teams that need to know what is in stock, what is selling, and what to reorder next.
        </p>
      </section>

      {featured && (
        <section className="blog-featured-card" aria-labelledby="featured-article">
          <div>
            <p className="blog-eyebrow">Start here · {featured.category}</p>
            <h2 id="featured-article">{featured.title}</h2>
            <p>{featured.description}</p>
            <Link className="blog-button" href={`/blog/${featured.slug}`}>
              Read the guide <ArrowRight size={17} />
            </Link>
          </div>
          <div className="blog-featured-checks">
            <Image src={DEFAULT_BRAND_AVATAR_SRC} alt="Intera IMS assistant" width={64} height={64} className="blog-assistant-logo" />
            <p><CheckCircle2 size={18} /> Stock control</p>
            <p><CheckCircle2 size={18} /> Purchasing and replenishment</p>
            <p><CheckCircle2 size={18} /> Multi-location visibility</p>
          </div>
        </section>
      )}

      <ProgressiveBlogGrid posts={remaining} />

      <section className="blog-cta">
        <div>
          <p className="blog-eyebrow">See the product in context</p>
          <h2>Know your stock before it becomes a problem.</h2>
          <p>Intera IMS brings inventory, POS, purchasing, reporting, and accountability into one workspace.</p>
        </div>
        <Link className="blog-button" href="/contact">Book an Intera IMS demo <ArrowRight size={17} /></Link>
      </section>
    </main>
  );
}


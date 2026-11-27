"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { BlogPost } from "@/lib/blog";

type BlogCardData = Pick<BlogPost, "slug" | "title" | "description" | "category" | "publishedAt" | "readTime" | "image" | "imageAlt">;

function formatCardDate(date: string): string {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "long" }).format(new Date(date));
}

export function ProgressiveBlogGrid({ posts }: { posts: BlogCardData[] }) {
  const [visibleCount, setVisibleCount] = useState(6);
  const [hydrated, setHydrated] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHydrated(true);
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisibleCount((count) => Math.min(count + 3, posts.length));
      },
      { rootMargin: "420px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [posts.length]);

  return (
    <>
      <section className="blog-grid" aria-label="All inventory management articles">
        {posts.map((post, index) => (
          <article className={`blog-card${hydrated && index >= visibleCount ? " blog-card-paged-hidden" : ""}`} key={post.slug}>
            {post.image ? <Link href={`/blog/${post.slug}`} className="blog-card-image-link"><Image src={post.image} alt={post.imageAlt || post.title} width={900} height={520} className="blog-card-image" /></Link> : null}
            <p className="blog-card-category">{post.category}</p>
            <h2><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2>
            <p>{post.description}</p>
            <div className="blog-card-meta"><span>{formatCardDate(post.publishedAt)}</span><span>{post.readTime}</span></div>
            <Link className="blog-card-link" href={`/blog/${post.slug}`}>Read article <ArrowRight size={16} /></Link>
          </article>
        ))}
      </section>
      {visibleCount < posts.length ? <div ref={sentinelRef} className="blog-load-more" aria-live="polite"><Loader2 size={17} className="blog-load-spinner" /> Scroll for more resources</div> : null}
    </>
  );
}


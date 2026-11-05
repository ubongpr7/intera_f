import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { BlogMarkdown } from "@/components/blog/BlogMarkdown";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { formatBlogDate, getAllBlogPosts, getBlogPost } from "@/lib/blog";
import { productionSiteUrl } from "@/lib/seo";

export function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    authors: [{ name: post.author }],
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      images: post.image ? [{ url: post.image, alt: post.imageAlt || post.title }] : undefined,
    },
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();
  const related = getAllBlogPosts().filter((item) => item.slug !== post.slug).slice(0, 3);
  const articleUrl = `${productionSiteUrl}/blog/${post.slug}`;
  const wordCount = post.content.trim().split(/\s+/).filter(Boolean).length;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    articleSection: post.category,
    wordCount,
    image: post.image ? (post.image.startsWith("http") ? post.image : `${productionSiteUrl}${post.image}`) : undefined,
    keywords: [post.category, "inventory management", "Nigeria", "Intera IMS"],
    author: { "@type": "Person", name: post.author },
    publisher: { "@type": "Organization", name: "InteraProTech", url: "https://www.interapro.tech" },
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    inLanguage: "en-NG",
  };
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: productionSiteUrl },
      { "@type": "ListItem", position: 2, name: "Resources", item: `${productionSiteUrl}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: articleUrl },
    ],
  };

  return (
    <main className="blog-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }} />
      <LandingHeader />
      <article className="blog-article">
        <Link href="/blog" className="blog-back"><ArrowLeft size={16} /> All resources</Link>
        <p className="blog-eyebrow">{post.category} · {post.readTime}</p>
        <h1>{post.title}</h1>
        <p className="blog-lede">{post.description}</p>
        {post.image ? <Image src={post.image} alt={post.imageAlt || post.title} width={1400} height={800} className="blog-article-image" priority /> : null}
        <div className="blog-byline"><span>By {post.author}</span><span>Published {formatBlogDate(post.publishedAt)}</span><span>Updated {formatBlogDate(post.updatedAt)}</span></div>
        <BlogMarkdown content={post.content} />
      </article>
      <section className="blog-related" aria-labelledby="related-heading">
        <div className="blog-related-heading"><p className="blog-eyebrow">Keep learning</p><h2 id="related-heading">Related resources</h2></div>
        <div className="blog-related-grid">
          {related.map((item) => <Link className="blog-related-card" href={`/blog/${item.slug}`} key={item.slug}><span>{item.category}</span><strong>{item.title}</strong><ArrowRight size={17} /></Link>)}
        </div>
      </section>
      <section className="blog-cta blog-cta-article"><div><p className="blog-eyebrow">Ready for clearer operations?</p><h2>See Intera IMS with your workflow.</h2></div><Link className="blog-button" href="/contact">Book a demo <ArrowRight size={17} /></Link></section>
    </main>
  );
}


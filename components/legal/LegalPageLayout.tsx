import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, ScrollText, ShieldCheck } from "lucide-react";

import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";

type LegalPageLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  effectiveDate: string;
  children: ReactNode;
};

export function LegalPageLayout({
  eyebrow,
  title,
  description,
  effectiveDate,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="legal-page-shell landing-page min-h-screen">
      <LandingHeader />
      <main className="legal-page-main min-h-screen text-gray-950 dark:text-gray-50">
        <section className="legal-page-hero mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6 lg:px-8 lg:pb-16 lg:pt-24">
          <Link
            href="/"
            className="legal-page-back inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Intera IMS
          </Link>
          <div className="legal-page-intro mt-12 max-w-4xl">
            <p className="legal-page-eyebrow inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]">
              <ShieldCheck className="h-3.5 w-3.5" /> {eyebrow}
            </p>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">{title}</h1>
            <p className="legal-page-description mt-6 max-w-3xl text-lg leading-8">{description}</p>
            <div className="legal-page-meta mt-8 flex flex-wrap gap-3 text-sm">
              <span className="legal-page-effective inline-flex items-center gap-2 rounded-full px-4 py-2">
                <ScrollText className="h-4 w-4" /> Effective {effectiveDate}
              </span>
              <Link href="/terms" className="legal-page-policy-link inline-flex items-center gap-2 rounded-full px-4 py-2">
                <FileText className="h-4 w-4" />
                Terms and Conditions
              </Link>
              <Link href="/privacy" className="legal-page-policy-link inline-flex items-center gap-2 rounded-full px-4 py-2">
                <ShieldCheck className="h-4 w-4" />
                Privacy Policy
              </Link>
            </div>
          </div>
        </section>

        <article className="legal-page-article mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="legal-reading-frame">
            <span className="legal-reading-rail" aria-hidden="true" />
            <div className="legal-document rounded-3xl border p-6 backdrop-blur sm:p-10 lg:p-14">
              {children}
            </div>
          </div>
        </article>
      </main>
      <LandingFooter />
    </div>
  );
}

export function LegalSection({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <section className="legal-section">
      <p className="legal-section-number">{number}</p>
      <h2>{title}</h2>
      <div className="legal-section-body">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

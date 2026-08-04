import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";

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
    <div className="landing-page min-h-screen">
      <LandingHeader />
      <main className="landing-hero min-h-screen text-gray-950 dark:text-gray-50">
        <section className="mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6 lg:px-8 lg:pb-16 lg:pt-24">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-blue-700 dark:text-gray-300 dark:hover:text-blue-300"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Intera IMS
          </Link>
          <div className="mt-12 max-w-4xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-blue-700 dark:border-blue-300/20 dark:bg-blue-300/10 dark:text-blue-200">
              <ShieldCheck className="h-3.5 w-3.5" /> {eyebrow}
            </p>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">{title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-300">{description}</p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-300">
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-4 py-2 dark:border-white/10 dark:bg-white/5">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-300" /> Effective {effectiveDate}
              </span>
              <Link href="/terms" className="rounded-full border border-gray-200 bg-white/70 px-4 py-2 hover:border-blue-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-blue-300/50">
                Terms and Conditions
              </Link>
              <Link href="/privacy" className="rounded-full border border-gray-200 bg-white/70 px-4 py-2 hover:border-blue-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-blue-300/50">
                Privacy Policy
              </Link>
            </div>
          </div>
        </section>

        <article className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="legal-document rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-2xl shadow-blue-950/10 backdrop-blur sm:p-10 lg:p-14 dark:border-white/10 dark:bg-[#0d192e]/90">
            {children}
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

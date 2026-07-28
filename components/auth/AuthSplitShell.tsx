"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";

import { useAppSelector } from "@/redux/hooks";

type AuthSplitShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  layout?: "standard" | "reversed";
};

const authHighlights = [
  {
    icon: ShieldCheck,
    title: "Secure access",
    description: "Protect every workspace with MFA, invitations, and role-based access.",
  },
  {
    icon: BarChart3,
    title: "Operational visibility",
    description: "Track inventory, POS, and movement signals from one place.",
  },
  {
    icon: LockKeyhole,
    title: "Workspace aware",
    description: "Keep each session tied to the correct organization and plan.",
  },
] as const;

export default function AuthSplitShell({
  eyebrow = "Secure login",
  title,
  description,
  children,
  layout = "standard",
}: AuthSplitShellProps) {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const logoSrc = isDarkMode
    ? "/assets/img/logos/verticals/no-bg/INTERA-PRIMARY-LOGO-VERTICAL-WHITE-4.png"
    : "/assets/img/logos/verticals/no-bg/INTERA-PRIMARY-LOGO-VERTICAL-BLACK-3.png";

  return (
    <div className="auth-page min-h-screen text-[#101727] dark:text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <aside className={`auth-showcase relative hidden overflow-hidden px-10 py-10 lg:flex lg:flex-col ${layout === "reversed" ? "lg:order-2" : ""}`}>
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-120px] top-[-100px] h-72 w-72 rounded-full bg-[#3c83f7]/15 blur-3xl dark:bg-[#3c83f7]/20" />
            <div className="absolute bottom-[-120px] right-[-120px] h-80 w-80 rounded-full bg-[#98fcc2]/20 blur-3xl dark:bg-[#98fcc2]/10" />
          </div>

          <div className="relative z-10 flex h-full flex-col">
            <Link href="/" aria-label="Go to Intera home" className="inline-flex w-fit rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6ee7d2] focus-visible:ring-offset-4">
              <Image src={logoSrc} alt="Intera" width={480} height={144} priority className="h-44 w-auto max-w-[20rem] object-contain object-left" />
            </Link>

            <div className="mt-auto max-w-xl pb-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#3c83f7]/20 bg-[#3c83f7]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#3c83f7] dark:border-[#98fcc2]/20 dark:bg-[#98fcc2]/10 dark:text-[#98fcc2]">
                <Sparkles className="h-3.5 w-3.5" />
                {eyebrow}
              </span>
              <h1 className="mt-5 max-w-2xl text-5xl font-semibold leading-[1.08] tracking-[-0.04em] text-[#101727] dark:text-white">
                Built for the people who keep work moving.
              </h1>
              <p className="auth-showcase-copy mt-4 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                {description}
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {authHighlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_16px_32px_-28px_rgba(16,23,39,0.35)] backdrop-blur dark:border-white/10 dark:bg-white/5"
                    >
                      <Icon className="h-4 w-4 text-[#3c83f7] dark:text-[#98fcc2]" />
                      <p className="auth-highlight-title mt-3 text-sm font-semibold text-[#101727] dark:text-white">{item.title}</p>
                      <p className="auth-highlight-copy mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.description}</p>
                    </div>
                  );
                })}
              </div>

              <div className="auth-showcase-note mt-8 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-[0_16px_32px_-28px_rgba(16,23,39,0.35)] dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                <ArrowRight className="h-4 w-4 text-[#3c83f7] dark:text-[#98fcc2]" />
                Keep the sensitive parts isolated. Show context, not clutter.
              </div>
            </div>
          </div>
        </aside>

        <main className={`auth-main flex items-center justify-center px-4 py-8 sm:px-6 lg:px-12 ${layout === "reversed" ? "lg:order-1" : ""}`}>
          <div className="w-full max-w-lg">
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <Link href="/" aria-label="Go to Intera home" className="rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]">
                <Image src={logoSrc} alt="Intera" width={360} height={108} className="h-24 w-auto max-w-[12rem] object-contain object-left" />
              </Link>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#3c83f7]/20 bg-[#3c83f7]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#3c83f7] dark:border-[#98fcc2]/20 dark:bg-[#98fcc2]/10 dark:text-[#98fcc2]">
                <ShieldCheck className="h-3.5 w-3.5" />
                {eyebrow}
              </span>
            </div>

            <div className="mb-6 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#3c83f7] dark:text-[#98fcc2]">
                {eyebrow}
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#101727] dark:text-white">{title}</h2>
            </div>

            <div className="auth-description text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</div>

            <div className="mt-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

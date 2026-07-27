"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { ArrowRight, BarChart3, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";

import { useAppSelector } from "@/redux/hooks";

type AuthSplitShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
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
}: AuthSplitShellProps) {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const logoSrc = isDarkMode
    ? "/assets/img/logos/verticals/no-bg/INTERA-PRIMARY-LOGO-VERTICAL-WHITE-4.png"
    : "/assets/img/logos/verticals/no-bg/INTERA-PRIMARY-LOGO-VERTICAL-BLACK-3.png";

  return (
    <div className="min-h-screen bg-[#f4f7ff] text-[#101727] dark:bg-[#050816] dark:text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <aside className="relative hidden overflow-hidden border-r border-slate-200/80 bg-white px-10 py-10 dark:border-white/10 dark:bg-[#071022] lg:flex lg:flex-col">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-120px] top-[-100px] h-72 w-72 rounded-full bg-[#3c83f7]/15 blur-3xl dark:bg-[#3c83f7]/20" />
            <div className="absolute bottom-[-120px] right-[-120px] h-80 w-80 rounded-full bg-[#98fcc2]/20 blur-3xl dark:bg-[#98fcc2]/10" />
          </div>

          <div className="relative z-10 flex h-full flex-col">
            <Image
              src={logoSrc}
              alt="Intera logo"
              width={480}
              height={144}
              priority
              className="h-28 w-auto max-w-[24rem] object-contain object-left"
            />

            <div className="mt-auto max-w-xl pb-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#3c83f7]/20 bg-[#3c83f7]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#3c83f7] dark:border-[#98fcc2]/20 dark:bg-[#98fcc2]/10 dark:text-[#98fcc2]">
                <Sparkles className="h-3.5 w-3.5" />
                {eyebrow}
              </span>
              <h1 className="mt-5 max-w-2xl text-5xl font-semibold leading-tight text-[#101727] dark:text-white">
                Fast access for the people who run the workspace.
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
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
                      <p className="mt-3 text-sm font-semibold text-[#101727] dark:text-white">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.description}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-[0_16px_32px_-28px_rgba(16,23,39,0.35)] dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                <ArrowRight className="h-4 w-4 text-[#3c83f7] dark:text-[#98fcc2]" />
                Keep the sensitive parts isolated. Show context, not clutter.
              </div>
            </div>
          </div>
        </aside>

        <main className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-12">
          <div className="w-full max-w-lg">
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <Image
                src={logoSrc}
                alt="Intera logo"
                width={360}
                height={108}
                className="h-20 w-auto max-w-[18rem] object-contain object-left"
              />
              <span className="inline-flex items-center gap-2 rounded-full border border-[#3c83f7]/20 bg-[#3c83f7]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#3c83f7] dark:border-[#98fcc2]/20 dark:bg-[#98fcc2]/10 dark:text-[#98fcc2]">
                <ShieldCheck className="h-3.5 w-3.5" />
                {eyebrow}
              </span>
            </div>

            <div className="mb-6 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#3c83f7] dark:text-[#98fcc2]">
                {eyebrow}
              </p>
              <h2 className="text-3xl font-semibold text-[#101727] dark:text-white">{title}</h2>
            </div>

            <div className="text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</div>

            <div className="mt-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

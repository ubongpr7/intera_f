'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, LockKeyhole, LoaderCircle, ShieldCheck } from "lucide-react";
import { socialProviderFromSlug } from "@/lib/socialAuth";

const APP_CALLBACK = "interaims://oauth/google/callback";

export default function NativeSocialAuthCallbackPage() {
  const params = useParams<{ provider: string }>();
  const searchParams = useSearchParams();
  const provider = socialProviderFromSlug(`${params?.provider ?? ""}`);
  const [ticket, setTicket] = useState("");
  const [preflightError, setPreflightError] = useState("");
  const [preflightLoading, setPreflightLoading] = useState(false);
  const callbackUrl = useMemo(() => {
    if (provider !== "google-oauth2" || !ticket) return "";

    const target = new URL(APP_CALLBACK);
    target.searchParams.set("ticket", ticket);
    const state = searchParams.get("state");
    if (state) target.searchParams.set("state", state);
    return target.toString();
  }, [provider, searchParams, ticket]);
  const [handoffStarted, setHandoffStarted] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    if (provider !== "google-oauth2" || !code || !state || searchParams.get("error")) return;
    let cancelled = false;
    setPreflightLoading(true);
    const usersApi = process.env.NEXT_PUBLIC_BACKEND_HOST_URL || "https://users.api.interaims.com";
    fetch(`${usersApi}/auth/o/google-oauth2/native/` +
      `?state=${encodeURIComponent(state)}&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(window.location.origin + window.location.pathname)}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: "{}",
      })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.detail || payload.non_field_errors?.[0] || "Google sign-in could not be completed.");
        }
        if (!payload.ticket) throw new Error("Google sign-in could not be completed securely.");
        if (!cancelled) setTicket(payload.ticket);
      })
      .catch((error) => {
        if (!cancelled) setPreflightError(error instanceof Error ? error.message : "Google sign-in could not be completed.");
      })
      .finally(() => {
        if (!cancelled) setPreflightLoading(false);
      });
    return () => { cancelled = true; };
  }, [provider, searchParams]);

  const openNativeApp = useCallback(() => {
    if (!callbackUrl) return;
    setHandoffStarted(true);
    window.location.href = callbackUrl;
  }, [callbackUrl]);

  useEffect(() => {
    if (!callbackUrl) return;

    // Use a top-level navigation so the browser offers the registered native
    // handler instead of treating the callback as an ordinary web page.
    window.location.href = callbackUrl;
    // The callback has been dispatched to the native app. Keep this tab open,
    // but show the completed handoff instead of implying that it is still loading.
    setTimeout(() => setHandoffStarted(true), 0);
  }, [callbackUrl]);

  return (
    <main className="native-oauth-handoff min-h-screen overflow-hidden">
      <div className="relative min-h-screen bg-[#07101f]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-[#3978ed]/20 blur-3xl" />
          <div className="absolute -bottom-40 right-[-6rem] h-[30rem] w-[30rem] rounded-full bg-[#03dd7b]/10 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />
        </div>

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-10 sm:py-8">
          <header className="flex items-center justify-between">
            <Image
              src="/assets/intera/intera-wordmark-dark.png"
              alt="Intera IMS"
              width={3651}
              height={591}
              priority
              className="native-oauth-logo h-auto w-[15rem] object-contain object-left sm:w-[19rem]"
            />
            <span className="inline-flex items-center gap-2 rounded-full border border-[#98fcc2]/20 bg-[#98fcc2]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#98fcc2]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure handoff
            </span>
          </header>

          <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1fr_0.8fr] lg:gap-20">
            <section className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#3978ed]/30 bg-[#3978ed]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#8db4ff]">
                <LockKeyhole className="h-3.5 w-3.5" />
                Google sign-in
              </p>
              <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-6xl">
                Your workspace is ready for the next step.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-[#adbbd1] sm:text-lg">
                Google has verified your identity. We are handing the secure session back to the Intera IMS application so you can continue into your workspace.
              </p>
              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {[
                  ["Identity verified", "Google account accepted"],
                  ["Workspace aware", "Context stays protected"],
                  ["Operational access", "Return to your app"],
                ].map(([title, detail]) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                    <CheckCircle2 className="h-4 w-4 text-[#98fcc2]" />
                    <p className="mt-3 text-sm font-semibold text-white">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-[#adbbd1]">{detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="w-full max-w-lg justify-self-end rounded-[2rem] border border-white/10 bg-[#0d192e]/90 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#3978ed]/15 text-[#8db4ff]">
                  <LoaderCircle className="h-6 w-6 animate-spin" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#98fcc2]">{preflightError ? "Account setup required" : handoffStarted ? "Connected" : "Almost there"}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{preflightError ? "Create your account first" : handoffStarted ? "Connected to Intera IMS" : "Returning to Intera IMS"}</h2>
                  <p className="mt-3 text-sm leading-7 text-[#adbbd1]">
                    {preflightError
                      ? preflightError
                      : handoffStarted
                      ? "Your secure session has been sent to the Intera IMS application. You can continue there."
                      : preflightLoading ? "Verifying your Intera IMS account before opening the application." : "Complete the sign-in in the Intera IMS application."
                    }
                  </p>
                </div>
              </div>
              {preflightError ? (
                <a href="/accounts?social=signup_required" className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3978ed] px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-[#3978ed]/20 transition hover:bg-[#4b87f4]">
                  Create an Intera IMS account
                  <ArrowRight className="h-4 w-4" />
                </a>
              ) : callbackUrl && !handoffStarted ? (
                <a
                  href={callbackUrl}
                  onClick={(event) => {
                    event.preventDefault();
                    openNativeApp();
                  }}
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3978ed] px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-[#3978ed]/20 transition hover:bg-[#4b87f4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#98fcc2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d192e]"
                >
                  Open Intera IMS
                  <ArrowRight className="h-4 w-4" />
                </a>
              ) : null}
              <p className="mt-5 text-center text-xs leading-5 text-[#71829d]">
                {handoffStarted ? "" : "If the app does not open automatically, use the button above."}
              </p>
            </section>
          </div>

          <footer className="flex items-center gap-2 text-xs text-[#71829d]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#98fcc2]" />
            Intera IMS · secure workspace operations
          </footer>
        </div>
      </div>
    </main>
  );
}

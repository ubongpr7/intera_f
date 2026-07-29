'use client';

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  useMfaEmailRequestMutation,
  useMfaEmailVerifyMutation,
  useMfaVerifyMutation,
} from "@/redux/features/users/userApiSlice";
import { markMfaVerified } from "@/lib/mfaFlow";
import { deleteCookie, getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Loader2, MailCheck, ShieldCheck, Smartphone } from "lucide-react";
import { getCookieCandidates, readCookieValue } from "@/lib/authCookies";
import { persistAuthSession } from "@/redux/services/apiSlice";
import type { MfaVerifyResponse } from "@/redux/features/users/userTypes";

const RESEND_COOLDOWN_SECONDS = 60;

export default function MfaVerifyCard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [method, setMethod] = useState<"app" | "email">("app");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [verifyMfa, { isLoading }] = useMfaVerifyMutation();
  const [requestEmailCode, { isLoading: isSendingEmailCode }] = useMfaEmailRequestMutation();
  const [verifyEmailCode, { isLoading: isVerifyingEmailCode }] = useMfaEmailVerifyMutation();
  const codeDigits = Array.from({ length: 6 }, (_, index) => code[index] ?? "");
  const isLoadingAny = isLoading || isSendingEmailCode || isVerifyingEmailCode;

  useEffect(() => {
    if (cooldown <= 0) {
      return undefined;
    }
    const timerId = window.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [cooldown]);

  const handleSendEmailCode = async () => {
    setErrorMessage("");
    try {
      const response = await requestEmailCode().unwrap();
      setEmail(response.email);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success(response.detail);
    } catch (error: any) {
      setErrorMessage(error?.data?.detail || "Unable to send a verification code to your email.");
    }
  };

  const handleMethodChange = async (nextMethod: "app" | "email") => {
    setMethod(nextMethod);
    setCode("");
    setErrorMessage("");
    if (nextMethod === "email" && !email && !isSendingEmailCode) {
      await handleSendEmailCode();
    }
  };

  const handleVerify = async () => {
    if (!code || code.length < 6) {
      setErrorMessage(
        method === "email"
          ? "Please enter the 6-digit code we sent to your email."
          : "Please enter the 6-digit code from your authenticator app."
      );
      return;
    }
    setErrorMessage("");

    let response: MfaVerifyResponse | null = null;
    try {
      response = method === "email"
        ? await verifyEmailCode({ code }).unwrap()
        : await verifyMfa({ code }).unwrap();
    } catch (error: any) {
      setErrorMessage(
        error?.data?.detail || (method === "email" ? "Unable to verify email code." : "Unable to verify MFA code.")
      );
      return;
    }

    const nextPath = `${readCookieValue("mfaNextPath", getCookie) || "/dashboard"}`;

    try {
      if (response?.access || response?.refresh) {
        try {
          persistAuthSession(response as Parameters<typeof persistAuthSession>[0]);
        } catch {
          // The shared API layer also attempts persistence; do not block successful MFA navigation on local cookie write issues.
        }
      }
      markMfaVerified();
      for (const name of getCookieCandidates("mfaNextPath")) {
        deleteCookie(name);
      }
      toast.success(response?.detail || "MFA verified successfully.");
      router.replace(nextPath);
      router.refresh();
    } catch {
      if (typeof window !== "undefined") {
        window.location.assign(nextPath);
      }
    }
  };

  const handleCodeChange = (value: string) => {
    setErrorMessage("");
    setCode(value.replace(/\D/g, "").slice(0, 6));
  };

  return (
    <div className="auth-mfa-card relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-[#101727]/95">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[-80px] h-72 w-72 rounded-full bg-blue-500/12 blur-3xl dark:bg-blue-500/20" />
        <div className="absolute bottom-[-120px] right-[-120px] h-80 w-80 rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-500/15" />
      </div>

      <div className="relative">
        <div className="mb-6 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:border-[#98fcc2]/20 dark:bg-[#98fcc2]/10 dark:text-[#98fcc2]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure Login
          </span>
          {method === "email" ? <MailCheck className="h-4 w-4 text-slate-500 dark:text-slate-300" /> : <Smartphone className="h-4 w-4 text-slate-500 dark:text-slate-300" />}
        </div>

        <h2 className="text-3xl font-semibold text-slate-950 dark:text-white">Verify your code</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {method === "email"
            ? "Enter the 6-digit verification code we sent to your email."
            : "Enter the 6-digit code from your authenticator app to continue."}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-100 p-1 dark:border-white/10 dark:bg-white/5">
          <button
            type="button"
            onClick={() => void handleMethodChange("app")}
            className={`auth-mfa-tab rounded-xl px-3 py-2 text-sm font-semibold transition ${
              method === "app"
                ? "auth-mfa-tab-active border border-blue-200 bg-white text-blue-700 shadow-sm dark:border-[#98fcc2]/20 dark:bg-[#101727] dark:text-[#98fcc2]"
                : "auth-mfa-tab-idle text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
            }`}
          >
            Authenticator App
          </button>
          <button
            type="button"
            onClick={() => void handleMethodChange("email")}
            className={`auth-mfa-tab rounded-xl px-3 py-2 text-sm font-semibold transition ${
              method === "email"
                ? "auth-mfa-tab-active border border-blue-200 bg-white text-blue-700 shadow-sm dark:border-[#98fcc2]/20 dark:bg-[#101727] dark:text-[#98fcc2]"
                : "auth-mfa-tab-idle text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
            }`}
          >
            Email Code
          </button>
        </div>

        {method === "email" && email ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            Verification code sent to <span className="font-semibold">{email}</span>.
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.focus()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                inputRef.current?.focus();
              }
            }}
            className="grid grid-cols-6 gap-2 rounded-2xl border border-slate-200 p-3 dark:border-white/10"
          >
            {codeDigits.map((digit, index) => (
              <div
                key={`otp-digit-${index}`}
                className={`flex h-12 items-center justify-center rounded-xl border text-lg font-semibold transition ${
                  code.length === index
                    ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm dark:border-[#98fcc2]/20 dark:bg-[#98fcc2]/10 dark:text-[#98fcc2]"
                    : "border-slate-200 bg-white text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500"
                }`}
              >
                {digit || "•"}
              </div>
            ))}
          </div>

          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => handleCodeChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && code.length === 6) {
                event.preventDefault();
                void handleVerify();
              }
            }}
            className="sr-only"
            aria-label="MFA verification code"
          />
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => void handleVerify()}
          disabled={isLoadingAny || code.length < 6}
          className="auth-action-primary mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoadingAny ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying
            </>
          ) : (
            "Verify and Continue"
          )}
        </button>

        {method === "email" ? (
          <button
            type="button"
            onClick={() => void handleSendEmailCode()}
            disabled={isSendingEmailCode || cooldown > 0}
            className="auth-action-secondary mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            {isSendingEmailCode ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending
              </>
            ) : (
              cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend email code"
            )}
          </button>
        ) : null}

        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          {method === "email"
            ? "Use the latest code from your email inbox."
            : "Code refreshes every few seconds in your authenticator app."}
        </p>
        <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-300">
          Lost access to your authenticator?
          {" "}
          <Link
            href="/accounts/mfa/reset"
            className="auth-action-link font-semibold text-blue-700 underline underline-offset-4 transition hover:text-blue-800"
          >
            Reset MFA
          </Link>
        </p>
      </div>
    </div>
  );
}

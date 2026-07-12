'use client';

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { setCookie } from "cookies-next";
import { Loader2, MailCheck, RotateCcw, ShieldAlert } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

import { AUTH_COOKIE_NAMES } from "@/lib/authCookies";
import {
  useMfaResetConfirmMutation,
  useMfaResetRequestMutation,
} from "@/redux/features/users/userApiSlice";

const MFA_COOKIE_AGE = 60 * 60 * 24;
const RESEND_COOLDOWN_SECONDS = 60;

export default function MfaResetCard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [requestReset, { isLoading: isSending }] = useMfaResetRequestMutation();
  const [confirmReset, { isLoading: isConfirming }] = useMfaResetConfirmMutation();
  const codeDigits = Array.from({ length: 6 }, (_, index) => code[index] ?? "");

  const handleSendCode = useCallback(async () => {
    setErrorMessage("");
    try {
      const response = await requestReset().unwrap();
      setEmail(response.email);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success(response.detail);
    } catch (error: any) {
      setErrorMessage(error?.data?.detail || "Unable to send a recovery code right now.");
    }
  }, [requestReset]);

  useEffect(() => {
    if (cooldown <= 0) {
      return undefined;
    }
    const timerId = window.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [cooldown]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void handleSendCode();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [handleSendCode]);

  const handleConfirm = async () => {
    if (code.length < 6) {
      setErrorMessage("Enter the 6-digit recovery code sent to your email.");
      return;
    }

    setErrorMessage("");
    try {
      const response = await confirmReset({ code }).unwrap();
      setCookie(AUTH_COOKIE_NAMES.mfaSetupRequired, "true", { maxAge: MFA_COOKIE_AGE, path: "/" });
      toast.success(response.detail);
      router.replace("/accounts/mfa/setup");
    } catch (error: any) {
      setErrorMessage(error?.data?.detail || "Unable to verify that recovery code.");
    }
  };

  const handleCodeChange = (value: string) => {
    setErrorMessage("");
    setCode(value.replace(/\D/g, "").slice(0, 6));
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[-80px] h-72 w-72 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-120px] h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-white/95 p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-6 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
            <ShieldAlert className="h-3.5 w-3.5" />
            Recovery
          </span>
          <MailCheck className="h-4 w-4 text-slate-700" />
        </div>

        <h2 className="text-3xl font-semibold text-slate-950">Reset your MFA</h2>
        <p className="mt-2 text-sm text-slate-600">
          We will email a 6-digit recovery code to the address on this account. Verify it to remove the current MFA setup.
        </p>

        {email ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Recovery code sent to <span className="font-semibold">{email}</span>.
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
            className="grid grid-cols-6 gap-2 rounded-2xl border border-slate-200 p-3"
          >
            {codeDigits.map((digit, index) => (
              <div
                key={`mfa-reset-digit-${index}`}
                className={`flex h-12 items-center justify-center rounded-xl border text-lg font-semibold transition ${
                  code.length === index
                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-800"
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
                void handleConfirm();
              }
            }}
            className="sr-only"
            aria-label="MFA recovery code"
          />
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={isConfirming || code.length < 6}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black/20 px-4 py-3 text-sm font-semibold text-black transition hover:bg-black/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isConfirming ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying
            </>
          ) : (
            "Verify Recovery Code"
          )}
        </button>

        <button
          type="button"
          onClick={() => void handleSendCode()}
          disabled={isSending || cooldown > 0}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending
            </>
          ) : (
            <>
              <RotateCcw className="h-4 w-4" />
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend recovery code"}
            </>
          )}
        </button>

        <p className="mt-4 text-center text-sm text-slate-600">
          <Link
            href="/accounts/mfa/verify"
            className="font-semibold text-blue-700 underline underline-offset-4 transition hover:text-blue-800"
          >
            Back to MFA verification
          </Link>
        </p>
      </div>
    </div>
  );
}

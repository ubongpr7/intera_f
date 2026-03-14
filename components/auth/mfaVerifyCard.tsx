'use client';

import { useRef, useState } from "react";
import { useMfaVerifyMutation } from "@/redux/features/users/userApiSlice";
import { markMfaVerified } from "@/lib/mfaFlow";
import { deleteCookie, getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { getCookieCandidates, readCookieValue } from "@/lib/authCookies";

export default function MfaVerifyCard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [verifyMfa, { isLoading }] = useMfaVerifyMutation();
  const codeDigits = Array.from({ length: 6 }, (_, index) => code[index] ?? "");

  const handleVerify = async () => {
    if (!code || code.length < 6) {
      setErrorMessage("Please enter the 6-digit code from your authenticator app.");
      return;
    }
    setErrorMessage("");

    try {
      await verifyMfa({ code }).unwrap();
      markMfaVerified();
      const nextPath = `${readCookieValue("mfaNextPath", getCookie) || "/dashboard"}`;
      for (const name of getCookieCandidates("mfaNextPath")) {
        deleteCookie(name);
      }
      toast.success("MFA verified successfully.");
      router.push(nextPath);
    } catch (error: any) {
      setErrorMessage(error?.data?.detail || "Unable to verify MFA code.");
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
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure Login
          </span>
          <Smartphone className="h-4 w-4 " />
        </div>

        <h2 className="text-3xl font-semibold ">Verify your code</h2>
        <p className="mt-2 text-sm ">
          Enter the 6-digit code from your authenticator app to continue.
        </p>

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
            className="grid grid-cols-6 gap-2 rounded-2xl border border-slate-200  p-3"
          >
            {codeDigits.map((digit, index) => (
              <div
                key={`otp-digit-${index}`}
                className={`flex h-12 items-center justify-center rounded-xl border text-lg font-semibold transition ${
                  code.length === index
                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                    : "border-slate-200 bg-white "
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
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => void handleVerify()}
          disabled={isLoading || code.length < 6}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black/20 px-4 py-3 text-sm font-semibold text-black transition hover:bg-black/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying
            </>
          ) : (
            "Verify and Continue"
          )}
        </button>

        <p className="mt-4 text-center text-xs text-slate-500">
          Code refreshes every few seconds in your authenticator app.
        </p>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from "react";
import { useMfaSetupMutation } from "@/redux/features/users/userApiSlice";
import { useRouter } from "next/navigation";
import { setCookie } from "cookies-next";
import Image from "next/image";
import { useCallback } from "react";
import { AUTH_COOKIE_NAMES } from "@/lib/authCookies";

interface MfaSetupData {
  mfa_secret: string;
  qr_code: string;
  otpauth_url: string;
}

export default function MfaSetupCard() {
  const router = useRouter();
  const [setupMfa, { isLoading }] = useMfaSetupMutation();
  const [setupData, setSetupData] = useState<MfaSetupData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const loadSetup = useCallback(async (force = false) => {
    setErrorMessage("");
    try {
      const response = await setupMfa(force ? { force: true } : {}).unwrap();
      setSetupData(response);
      setCookie(AUTH_COOKIE_NAMES.mfaSetupRequired, "true", { maxAge: 60 * 60 * 24, path: "/" });
    } catch (error: any) {
      const detail = error?.data?.detail || "Unable to initialize MFA setup.";
      if (`${detail}`.toLowerCase().includes("already enabled")) {
        setCookie(AUTH_COOKIE_NAMES.mfaSetupRequired, "false", { maxAge: 60 * 60 * 24, path: "/" });
        router.replace("/accounts/mfa/verify");
        return;
      }
      setErrorMessage(detail);
    }
  }, [router, setupMfa]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSetup(false);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadSetup]);

  return (
    <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-[0_24px_70px_-40px_rgba(16,23,39,0.45)] backdrop-blur dark:border-white/10 dark:bg-[#101727]">
      <h2 className="text-center text-2xl font-bold text-slate-950 dark:text-white">Set Up Authenticator App</h2>
      <p className="text-center text-sm text-slate-600 dark:text-slate-300">
        MFA is required. Scan the QR code with your authenticator app and continue.
      </p>

      {isLoading && !setupData ? (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">Generating setup details...</p>
      ) : null}

      {errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          {errorMessage}
        </div>
      ) : null}

      {setupData ? (
        <>
          <div className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
            <Image
              src={setupData.qr_code}
              alt="MFA QR code"
              className="mx-auto h-48 w-48"
              width={192}
              height={192}
            />
          </div>
          <div className="rounded-md bg-slate-50 px-3 py-2 dark:bg-white/5">
            <p className="text-xs text-slate-500 dark:text-slate-400">Setup key</p>
            <p className="mt-1 break-all font-mono text-sm text-slate-800 dark:text-slate-100">{setupData.mfa_secret}</p>
          </div>
        </>
      ) : null}

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => {
            setCookie(AUTH_COOKIE_NAMES.mfaSetupRequired, "false", { maxAge: 60 * 60 * 24, path: "/" });
            router.push("/accounts/mfa/verify");
          }}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={!setupData || isLoading}
        >
          Continue to Verification
        </button>
        <button
          type="button"
          onClick={() => void loadSetup(true)}
          className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-white"
          disabled={isLoading}
        >
          Regenerate QR Code
        </button>
      </div>
    </div>
  );
}

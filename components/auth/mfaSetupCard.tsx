'use client';

import { useEffect, useState } from "react";
import { useMfaSetupMutation } from "@/redux/features/users/userApiSlice";
import { useRouter } from "next/navigation";
import { deleteCookie, setCookie } from "cookies-next";
import Image from "next/image";
import { useCallback } from "react";
import { toast } from "react-toastify";
import { useAppDispatch } from "@/redux/store";
import { clearPermissions } from "@/redux/features/permission/permissionSlice";
import { useLogoutMutation } from "@/redux/features/auth/authApiSlice";
import { logout as clearAuthState } from "@/redux/features/authSlice";
import { AUTH_COOKIE_KEYS, AUTH_COOKIE_NAMES, getCookieCandidates } from "@/lib/authCookies";
import { clearMfaCookies } from "@/lib/mfaFlow";

interface MfaSetupData {
  mfa_secret: string;
  qr_code: string;
  otpauth_url: string;
}

export default function MfaSetupCard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [setupMfa, { isLoading }] = useMfaSetupMutation();
  const [logoutMutation] = useLogoutMutation();
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

  const handleUseAnotherAccount = async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // Local cleanup must still complete if the pending session is expired or offline.
    }
    for (const key of AUTH_COOKIE_KEYS) {
      for (const name of getCookieCandidates(key)) {
        deleteCookie(name);
      }
    }
    clearMfaCookies();
    dispatch(clearAuthState());
    dispatch(clearPermissions());
    router.replace("/accounts/signin");
    toast.success("You can now sign in with another account.");
  };

  return (
    <div className="auth-card w-full max-w-md space-y-6 p-6 sm:p-8">
      <h2 className="text-center text-2xl font-bold tracking-[-0.03em] text-slate-950 dark:text-white">Set up your authenticator</h2>
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
          className="auth-button"
          disabled={!setupData || isLoading}
        >
          Continue to Verification
        </button>
        <button
          type="button"
          onClick={() => void loadSetup(true)}
          className="auth-secondary-button"
          disabled={isLoading}
        >
          Regenerate QR Code
        </button>
        <button
          type="button"
          onClick={() => void handleUseAnotherAccount()}
          className="auth-secondary-button border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50 dark:border-red-400/30 dark:text-red-200 dark:hover:bg-red-500/10"
        >
          Use another account
        </button>
      </div>
    </div>
  );
}

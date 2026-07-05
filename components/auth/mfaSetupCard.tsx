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
      if (response.mfa_enabled || response.has_setup_mfa) {
        setCookie(AUTH_COOKIE_NAMES.mfaSetupRequired, "false", { maxAge: 60 * 60 * 24, path: "/" });
        router.replace("/accounts/mfa/verify");
        return;
      }
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg space-y-6">
        <h2 className="text-center text-2xl font-bold text-gray-900">Set Up Authenticator App</h2>
        <p className="text-center text-sm text-gray-600">
          MFA is required. Scan the QR code with your authenticator app and continue.
        </p>

        {isLoading && !setupData ? (
          <p className="text-center text-sm text-gray-500">Generating setup details...</p>
        ) : null}

        {errorMessage ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {setupData ? (
          <>
            <div className="rounded-lg border border-gray-200 p-4">
              <Image
                src={setupData.qr_code}
                alt="MFA QR code"
                className="mx-auto h-48 w-48"
                width={192}
                height={192}
              />
            </div>
            <div className="rounded-md bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-500">Setup key</p>
              <p className="mt-1 break-all font-mono text-sm text-gray-800">{setupData.mfa_secret}</p>
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
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            disabled={isLoading}
          >
            Regenerate QR Code
          </button>
        </div>
      </div>
    </div>
  );
}

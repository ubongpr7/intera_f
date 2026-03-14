'use client';

import { useEffect, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSocialAuthenticateMutation } from "@/redux/features/authApiSlice";
import { initializeMfaChallenge } from "@/lib/mfaFlow";
import { socialProviderFromSlug, socialRedirectForProviderSlug } from "@/lib/socialAuth";

const decodeValue = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export default function SocialAuthCallbackPage() {
  const router = useRouter();
  const params = useParams<{ provider: string }>();
  const searchParams = useSearchParams();
  const didSubmitRef = useRef(false);
  const [socialAuthenticate, { isLoading, isSuccess, isError, error }] = useSocialAuthenticateMutation();

  const providerParam = `${params?.provider ?? ""}`;
  const providerSlug = socialProviderFromSlug(providerParam);
  const code = searchParams.get("code") ?? "";
  const state = searchParams.get("state") ?? "";
  const errorDescription = searchParams.get("error_description") ?? "";

  const redirectUri = useMemo(() => {
    if (!providerSlug) return "";
    return socialRedirectForProviderSlug(providerSlug);
  }, [providerSlug]);

  useEffect(() => {
    if (didSubmitRef.current) return;
    if (!providerSlug || !code || !state || !redirectUri) return;

    didSubmitRef.current = true;
    socialAuthenticate({ provider: providerSlug, code, state, redirectUri })
      .unwrap()
      .then(async (authResponse) => {
        const mfaRoute = initializeMfaChallenge("/dashboard", authResponse?.access);
        router.replace(mfaRoute);
      })
      .catch(() => {
      });
  }, [providerSlug, code, state, redirectUri, socialAuthenticate, router]);

  if (!providerSlug) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg space-y-2">
          <h1 className="text-xl font-semibold text-gray-900">Unsupported provider</h1>
          <p className="text-sm text-gray-600">Unable to determine social auth provider.</p>
        </div>
      </div>
    );
  }

  if (!code || !state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg space-y-2">
          <h1 className="text-xl font-semibold text-gray-900">Missing authorization data</h1>
          <p className="text-sm text-gray-600">Please restart social sign-in.</p>
        </div>
      </div>
    );
  }

  if (!redirectUri) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg space-y-2">
          <h1 className="text-xl font-semibold text-gray-900">Configuration error</h1>
          <p className="text-sm text-gray-600">Missing redirect URI for this provider.</p>
        </div>
      </div>
    );
  }

  if (errorDescription) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg space-y-2">
          <h1 className="text-xl font-semibold text-gray-900">Sign-in cancelled</h1>
          <p className="text-sm text-gray-600">{decodeValue(errorDescription)}</p>
        </div>
      </div>
    );
  }

  const mutationError =
    (error as any)?.data?.detail ||
    (error as any)?.data?.non_field_errors?.[0] ||
    "Unable to complete social sign-in.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">
          {isSuccess ? "Redirecting..." : `Signing in with ${providerParam}`}
        </h1>
        <p className="text-sm text-gray-600">
          {isLoading ? "Please wait while we complete authentication." : "Finalizing authentication."}
        </p>
        {isError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {mutationError}
          </div>
        ) : null}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSocialAuthenticateMutation } from "@/redux/features/auth/authApiSlice";
import { initializeMfaChallenge } from "@/lib/mfaFlow";
import { socialProviderFromSlug, socialRedirectForProviderSlug } from "@/lib/socialAuth";
import AuthSplitShell from "@/components/auth/AuthSplitShell";
import Link from "next/link";
import { ArrowRight, CircleAlert, Loader2 } from "lucide-react";

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
  const oauthError = searchParams.get("error") ?? "";
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
        const mfaRoute = initializeMfaChallenge("/dashboard", authResponse?.access, providerSlug);
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

  if (oauthError || errorDescription) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg space-y-2">
          <h1 className="text-xl font-semibold text-gray-900">
            {oauthError === "access_denied" ? "Sign-in cancelled" : "Google sign-in failed"}
          </h1>
          <p className="text-sm text-gray-600">
            {decodeValue(errorDescription || oauthError || "Please restart social sign-in.")}
          </p>
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

  const mutationError =
    (error as any)?.data?.detail ||
    (error as any)?.data?.non_field_errors?.[0] ||
    "Unable to complete social sign-in.";

  const signupRequired = (error as any)?.data?.code === "social_login_requires_signup";

  return (
    <AuthSplitShell
      eyebrow={signupRequired ? "Account setup required" : "Secure sign-in"}
      title={signupRequired ? "Create your Intera IMS account first" : isSuccess ? "Authentication complete" : "Completing sign-in"}
      description={signupRequired
        ? "This Google account is not registered with Intera IMS yet. Create your account first, then use Google sign-in whenever you return."
        : "We are securely completing your authentication and preparing your Intera IMS session."}
    >
      <div className="auth-card w-full space-y-5 p-6 sm:p-8">
        {isLoading ? (
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin text-[#3c83f7]" />
            Finalizing authentication...
          </div>
        ) : isError ? (
          <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm leading-6 text-red-800 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-200">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{mutationError}</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm text-emerald-700 dark:text-emerald-300">
            Authentication complete. Redirecting...
          </div>
        )}

        {signupRequired ? (
          <div className="space-y-3">
            <Link
              href="/accounts?social=signup_required"
              className="auth-button inline-flex w-full items-center justify-center gap-2"
            >
              Create an account with Google
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/accounts/signin" className="auth-link block text-center text-sm">
              Return to sign in
            </Link>
          </div>
        ) : null}
      </div>
    </AuthSplitShell>
  );
}

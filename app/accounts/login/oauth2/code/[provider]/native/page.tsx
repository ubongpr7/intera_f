'use client';

import { useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { socialProviderFromSlug } from "@/lib/socialAuth";

const APP_CALLBACK = "interaims://oauth/google/callback";

export default function NativeSocialAuthCallbackPage() {
  const params = useParams<{ provider: string }>();
  const searchParams = useSearchParams();
  const provider = socialProviderFromSlug(`${params?.provider ?? ""}`);
  const callbackUrl = useMemo(() => {
    if (provider !== "google-oauth2") return "";

    const target = new URL(APP_CALLBACK);
    for (const key of ["code", "state", "error", "error_description"]) {
      const value = searchParams.get(key);
      if (value) target.searchParams.set(key, value);
    }
    return target.toString();
  }, [provider, searchParams]);

  useEffect(() => {
    if (callbackUrl) window.location.assign(callbackUrl);
  }, [callbackUrl]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <section className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
        <h1 className="text-xl font-semibold text-gray-900">Returning to Intera IMS</h1>
        <p className="mt-2 text-sm text-gray-600">
          Complete the sign-in in the Intera IMS application.
        </p>
        {callbackUrl ? (
          <a
            href={callbackUrl}
            className="mt-6 inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Open Intera IMS
          </a>
        ) : null}
      </section>
    </main>
  );
}

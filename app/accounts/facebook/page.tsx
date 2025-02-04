"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import env from "@/env_file";

const FACEBOOK_APP_ID = env.FACEBOOK_APP_ID;
const REDIRECT_URI = `${env.FRONTEND_HOST_URL}/accounts/facebook/`;

export default function FacebookSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false); // ✅ Track client render

  useEffect(() => {
    setIsClient(true); // ✅ Mark as client-rendered
  }, []);

  const handleFacebookLogin = () => {
    if (typeof window !== "undefined") {
      const oauthURL = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
      )}&scope=ads_read,pages_read_engagement,ads_management&response_type=code`;

      window.location.href = oauthURL;
    }
  };

  useEffect(() => {
    if (!isClient) return; // ✅ Ensure client-side execution

    const code = searchParams.get("code");
    if (code) {
      fetch(`/api/facebook-auth?code=${code}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.access_token) {
            setToken(data.access_token);
            localStorage.setItem("facebook_token", data.access_token);
            router.replace("/accounts/facebook/");
          } else {
            setError(data.error || "Failed to get token");
          }
        })
        .catch(() => setError("Server error"));
    }
  }, [isClient, searchParams, router]);

  if (!isClient) return null; // ✅ Prevent mismatch during SSR

  return (
    <div className="p-5">
      <h1 className="text-xl font-bold">Facebook Setup</h1>
      <button
        onClick={handleFacebookLogin}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
      >
        Setup with Facebook
      </button>

      {token && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 rounded">
          <p className="text-green-700">Long-Lived Token:</p>
          <code className="text-sm break-all">{token}</code>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}

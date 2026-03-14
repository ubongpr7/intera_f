"use client";
import { useEffect, useState } from "react";
import VerificationForm from "../../../../components/auth/verificationForm";
import { getCookie } from "cookies-next";
import { readCookieValue } from "@/lib/authCookies";

export default function VerifyPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = readCookieValue("userID", getCookie);
    setUserId(storedUserId ?? null);

  }, []);

  if (!userId) {
    return <div>Invalid verification request</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <VerificationForm userId={userId} redirectTo={"/dashboard"} />
    </div>
  );
}

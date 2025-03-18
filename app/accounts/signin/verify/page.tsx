"use client";
import { useEffect, useState } from "react";
import VerificationForm from "@components/auth/verificationForm";
import { getCookie } from "cookies-next";

export default function VerifyPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = getCookie("userID") as string | null;
    setUserId(storedUserId);

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

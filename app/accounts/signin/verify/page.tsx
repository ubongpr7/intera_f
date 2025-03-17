'use client'
import VerificationForm from '@/components/auth/verificationForm';
import { setCookie, getCookie, deleteCookie } from "cookies-next";

export default function VerifyPage() {
    const userId = getCookie('userID');
    console.log(userId);

  if (!userId) {
    return <div>Invalid verification request</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <VerificationForm userId={userId} redirectTo={"/dashboard"}/>
    </div>
  );
}
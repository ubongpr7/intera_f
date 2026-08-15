import AuthSplitShell from "@/components/auth/AuthSplitShell";
import MfaVerifyCard from "@/components/auth/mfaVerifyCard";

export default function MfaVerifyPage() {
  return (
    <AuthSplitShell
      eyebrow="Secure login"
      title="Verify your code"
      description="Enter the 6-digit code from your authenticator app or email to continue."
    >
      <MfaVerifyCard />
    </AuthSplitShell>
  );
}

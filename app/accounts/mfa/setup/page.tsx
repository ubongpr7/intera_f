import AuthSplitShell from "@/components/auth/AuthSplitShell";
import MfaSetupCard from "@/components/auth/mfaSetupCard";

export default function MfaSetupPage() {
  return (
    <AuthSplitShell
      eyebrow="Secure login"
      title="Set up your authenticator"
      description="MFA is required. Scan the QR code with your authenticator app and continue."
    >
      <MfaSetupCard />
    </AuthSplitShell>
  );
}

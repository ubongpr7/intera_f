import AuthSplitShell from "@/components/auth/AuthSplitShell";
import MfaResetCard from "@/components/auth/mfaResetCard";

export default function MfaResetPage() {
  return (
    <AuthSplitShell
      eyebrow="Account recovery"
      title="Reset your MFA"
      description="If you lost access to your authenticator, use the recovery flow to restore access."
    >
      <MfaResetCard />
    </AuthSplitShell>
  );
}

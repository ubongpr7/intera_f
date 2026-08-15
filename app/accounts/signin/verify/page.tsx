import AuthSplitShell from "@/components/auth/AuthSplitShell";
import VerificationForm from "../../../../components/auth/verificationForm";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const { email, next } = await searchParams;
  const normalizedEmail = email?.trim();

  if (!normalizedEmail) {
    return <div>Invalid verification request</div>;
  }

  const redirectTo = next?.trim() || "/dashboard";

  return (
    <AuthSplitShell
      eyebrow="Email verification"
      title="Verify your email"
      description="Enter the code we sent to your inbox so you can continue into your workspace."
    >
      <div className="auth-card w-full p-6 sm:p-8">
        <VerificationForm email={normalizedEmail} redirectTo={redirectTo} />
      </div>
    </AuthSplitShell>
  );
}

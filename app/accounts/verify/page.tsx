import AuthSplitShell from "@/components/auth/AuthSplitShell";
import VerificationForm from "../../../components/auth/verificationForm";

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

  const redirectTo = normalizedEmail
    ? `/accounts/signin${next ? `?next=${encodeURIComponent(next)}` : ""}`
    : "/accounts/signin";

  return (
    <AuthSplitShell
      eyebrow="Email verification"
      title="Verify your email"
      description="Enter the code we sent to your inbox so you can continue into sign in."
    >
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_24px_70px_-40px_rgba(16,23,39,0.45)] dark:border-white/10 dark:bg-[#101727]">
        <VerificationForm email={normalizedEmail} redirectTo={redirectTo} />
      </div>
    </AuthSplitShell>
  );
}

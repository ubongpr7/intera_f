import AuthSplitShell from "@/components/auth/AuthSplitShell";
import ActivationSentCard from "@/components/auth/ActivationSentCard";

export default async function ActivationSentPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const { email, next } = await searchParams;
  const normalizedEmail = email?.trim();

  if (!normalizedEmail) {
    return <div>Invalid activation request</div>;
  }

  return (
    <AuthSplitShell
      eyebrow="Verify account"
      title="Check your email"
      description={`We sent an account activation link to ${normalizedEmail}. Open the email and activate your account to continue.`}
    >
      <ActivationSentCard email={normalizedEmail} nextPath={next?.trim()} />
    </AuthSplitShell>
  );
}

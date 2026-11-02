import AuthSplitShell from "@/components/auth/AuthSplitShell";
import RegisterForm from "../../components/auth/registerForm";
import { redirect } from "next/navigation";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ affiliate_invite?: string }> }) {
  const params = await searchParams;
  if (params.affiliate_invite) {
    redirect(`/accounts/affiliate-invite/${encodeURIComponent(params.affiliate_invite)}`);
  }

  return (
    <AuthSplitShell
      eyebrow="Create access"
      title="Create a new account"
      description="Set up your workspace access, verify your email, and continue into the platform."
      layout="reversed"
    >
      <div className="auth-card w-full p-6 sm:p-8">
        <RegisterForm />
      </div>
    </AuthSplitShell>
  );
}

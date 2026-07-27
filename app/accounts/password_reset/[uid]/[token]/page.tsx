import AuthSplitShell from "@/components/auth/AuthSplitShell";
import ResetPasswordConfirmForm from '@/components/auth/resetPasswordConfirmForm';

type PasswordResetConfirmPageProps = {
  params: Promise<{
    token: string;
    uid: string;
  }>;
};

export default async function PasswordResetConfirmPage({ params }: PasswordResetConfirmPageProps) {
  const { token, uid } = await params;

  return (
    <AuthSplitShell
      eyebrow="Account recovery"
      title="Choose a new password"
      description="Set a new password for your account and return to sign in."
    >
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_24px_70px_-40px_rgba(16,23,39,0.45)] dark:border-white/10 dark:bg-[#101727]">
        <ResetPasswordConfirmForm uid={uid} token={token} />
      </div>
    </AuthSplitShell>
  );
}

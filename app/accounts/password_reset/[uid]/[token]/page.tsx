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
      <div className="auth-card w-full p-6 sm:p-8">
        <ResetPasswordConfirmForm uid={uid} token={token} />
      </div>
    </AuthSplitShell>
  );
}

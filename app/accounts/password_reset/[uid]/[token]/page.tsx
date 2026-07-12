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
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <h2 className="text-center text-3xl font-bold text-gray-900">Choose a new password</h2>
        <ResetPasswordConfirmForm uid={uid} token={token} />
      </div>
    </div>
  );
}

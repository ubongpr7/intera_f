import AuthSplitShell from "@/components/auth/AuthSplitShell";
import ResetPasswordRequestForm from '@/components/auth/resetPasswordRequestForm';

export default function PasswordResetPage() {
  return (
    <AuthSplitShell
      eyebrow="Account recovery"
      title="Reset your password"
      description="Enter your account email and we will send you a secure reset link."
    >
      <div className="auth-card w-full p-6 sm:p-8">
        <ResetPasswordRequestForm />
      </div>
    </AuthSplitShell>
  );
}

import AuthSplitShell from "@/components/auth/AuthSplitShell";
import ResetPasswordRequestForm from '@/components/auth/resetPasswordRequestForm';

export default function PasswordResetPage() {
  return (
    <AuthSplitShell
      eyebrow="Account recovery"
      title="Reset your password"
      description="Enter your account email and we will send you a secure reset link."
    >
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_24px_70px_-40px_rgba(16,23,39,0.45)] dark:border-white/10 dark:bg-[#101727]">
        <ResetPasswordRequestForm />
      </div>
    </AuthSplitShell>
  );
}

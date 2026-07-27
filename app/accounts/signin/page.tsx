import AuthSplitShell from "@/components/auth/AuthSplitShell";
import LoginForm from "@/components/auth/loginForm";
export default function LoginPage() {
  return (
    <AuthSplitShell
      eyebrow="Welcome back"
      title="Sign in to your account"
      description="Use your email and password to continue into your workspace."
    >
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_24px_70px_-40px_rgba(16,23,39,0.45)] dark:border-white/10 dark:bg-[#101727]">
        <LoginForm />
      </div>
    </AuthSplitShell>
  );
}

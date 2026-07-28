import AuthSplitShell from "@/components/auth/AuthSplitShell";
import LoginForm from "@/components/auth/loginForm";
export default function LoginPage() {
  return (
    <AuthSplitShell
      eyebrow="Welcome back"
      title="Sign in to your account"
      description="Use your email and password to continue into your workspace."
    >
      <div className="auth-card w-full p-6 sm:p-8">
        <LoginForm />
      </div>
    </AuthSplitShell>
  );
}

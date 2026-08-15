import AuthSplitShell from "@/components/auth/AuthSplitShell";
import RegisterForm from "../../components/auth/registerForm";

export default function RegisterPage() {
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

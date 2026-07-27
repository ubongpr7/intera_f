import AuthSplitShell from "@/components/auth/AuthSplitShell";
import RegisterForm from "../../components/auth/registerForm";

export default function RegisterPage() {
  return (
    <AuthSplitShell
      eyebrow="Create access"
      title="Create a new account"
      description="Set up your workspace access, verify your email, and continue into the platform."
    >
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_24px_70px_-40px_rgba(16,23,39,0.45)] dark:border-white/10 dark:bg-[#101727]">
        <RegisterForm />
      </div>
    </AuthSplitShell>
  );
}

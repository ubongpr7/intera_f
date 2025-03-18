// app/login/page.tsx
import LoginForm from "../../../components/auth/loginForm";
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <h2 className="text-center text-3xl font-bold text-gray-900">Sign in to your account</h2>
        <LoginForm />
      </div>
    </div>
  );
}
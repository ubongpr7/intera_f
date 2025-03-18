import RegisterForm from '../../components/auth/registerForm';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <h2 className="text-center text-3xl font-bold text-gray-900">Create a new account</h2>
        <RegisterForm />
      </div>
    </div>
  );
}
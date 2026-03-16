import VerificationForm from "../../../../components/auth/verificationForm";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const { email, next } = await searchParams;
  const normalizedEmail = email?.trim();

  if (!normalizedEmail) {
    return <div>Invalid verification request</div>;
  }

  const redirectTo = next?.trim() || "/dashboard";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <VerificationForm email={normalizedEmail} redirectTo={redirectTo} />
    </div>
  );
}

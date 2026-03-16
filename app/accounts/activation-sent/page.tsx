import ActivationSentCard from "@/components/auth/ActivationSentCard";

export default async function ActivationSentPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const { email, next } = await searchParams;
  const normalizedEmail = email?.trim();

  if (!normalizedEmail) {
    return <div>Invalid activation request</div>;
  }

  return <ActivationSentCard email={normalizedEmail} nextPath={next?.trim()} />;
}

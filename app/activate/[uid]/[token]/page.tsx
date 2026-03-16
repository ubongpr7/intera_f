import ActivationResultCard from "@/components/auth/ActivationResultCard";

export default async function ActivationPage({
  params,
}: {
  params: Promise<{ uid: string; token: string }>;
}) {
  const { uid, token } = await params;

  return <ActivationResultCard uid={uid} token={token} />;
}

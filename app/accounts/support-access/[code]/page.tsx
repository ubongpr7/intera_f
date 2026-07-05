import SupportAccessInvitationCenter from "@/components/support-access/SupportAccessInvitationCenter";

export default async function SupportAccessReviewPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const code = (await params).code;

  return <SupportAccessInvitationCenter invitationCode={decodeURIComponent(code)} />;
}

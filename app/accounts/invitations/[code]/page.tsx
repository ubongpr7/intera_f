import CompanyInvitationCenter from "@/components/invitations/CompanyInvitationCenter";

export default async function InvitationReviewPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const code = (await params).code;

  return <CompanyInvitationCenter invitationCode={decodeURIComponent(code)} />;
}

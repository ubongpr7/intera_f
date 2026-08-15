import { redirect } from "next/navigation";

export default async function LegacyInvitationAcceptPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const code = (await searchParams).code?.trim();

  if (code) {
    redirect(`/accounts/invitations/${encodeURIComponent(code)}`);
  }

  redirect("/accounts/invitations");
}

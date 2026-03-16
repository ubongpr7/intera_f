"use client";

import Link from "next/link";
import { getCookie } from "cookies-next";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  LogIn,
  Mail,
  UserPlus,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";

import { readCookieValue } from "@/lib/authCookies";
import { extractErrorMessage, formatDate } from "@/lib/utils";
import { useSwitchCompanyMutation } from "@/redux/features/auth/authApiSlice";
import {
  useAcceptInvitationMutation,
  useDeclineInvitationMutation,
  useGetMyInvitationsQuery,
} from "@/redux/features/users/userApiSlice";
import type { CompanyInvitation } from "@/redux/features/management/companyProfileTypes";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type DecisionState = "accept" | "decline" | null;

interface CompanyInvitationCenterProps {
  invitationCode?: string | null;
}

function InvitationSummary({
  invitation,
  actionHref,
}: {
  invitation: CompanyInvitation;
  actionHref: string;
}) {
  return (
    <Card className="border-gray-200/80 bg-white/95 shadow-lg shadow-gray-200/50">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">{invitation.profile_name || "Company invitation"}</CardTitle>
              <CardDescription className="mt-1">
                You were invited as <span className="font-medium capitalize text-gray-700">{invitation.role}</span>.
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
            {invitation.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-gray-600">
        <div className="grid gap-3 rounded-2xl bg-gray-50 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Invite email</p>
            <p className="mt-1 font-medium text-gray-700">{invitation.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Invited by</p>
            <p className="mt-1 font-medium text-gray-700">{invitation.invited_by_email || "Administrator"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Created</p>
            <p className="mt-1 font-medium text-gray-700">{formatDate(invitation.created_at)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Expires</p>
            <p className="mt-1 font-medium text-gray-700">{formatDate(invitation.expires_at || undefined)}</p>
          </div>
        </div>

        {invitation.invitation_message ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-gray-700">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-500">Invitation note</p>
            <p className="mt-2 leading-6">{invitation.invitation_message}</p>
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="justify-end">
        <Button asChild className="rounded-xl">
          <Link href={actionHref}>
            Review invitation
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function CompanyInvitationCenter({
  invitationCode: invitationCodeProp,
}: CompanyInvitationCenterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryCode = searchParams.get("code")?.trim() ?? "";
  const invitationCode = invitationCodeProp?.trim() || queryCode;
  const hasAuthCookie = Boolean(
    readCookieValue("accessToken", getCookie) || readCookieValue("refreshToken", getCookie),
  );
  const [decision, setDecision] = useState<DecisionState>(null);
  const [declined, setDeclined] = useState(false);
  const [acceptInvitation, { isLoading: isAccepting }] = useAcceptInvitationMutation();
  const [declineInvitation, { isLoading: isDeclining }] = useDeclineInvitationMutation();
  const [switchCompany, { isLoading: isSwitchingCompany }] = useSwitchCompanyMutation();
  const {
    data: invitations = [],
    isLoading: invitationsLoading,
    isFetching: invitationsFetching,
    refetch,
  } = useGetMyInvitationsQuery(undefined, {
    skip: !hasAuthCookie,
  });

  const currentUrl = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const signInHref = `/accounts/signin?next=${encodeURIComponent(currentUrl)}`;
  const registerHref = `/accounts?next=${encodeURIComponent(currentUrl)}`;
  const currentInvitation = invitationCode
    ? invitations.find(
        (item) => (item.invitation_code || "").trim().toLowerCase() === invitationCode.trim().toLowerCase(),
      )
    : null;

  const handleAccept = async () => {
    if (!invitationCode) {
      toast.error("Invitation code is missing.");
      return;
    }

    setDecision("accept");
    try {
      const result = await acceptInvitation({ invitation_code: invitationCode }).unwrap();
      try {
        await switchCompany({ profile_id: result.profile_id }).unwrap();
      } catch {
        toast.info("Invitation accepted. We could not switch company context automatically.");
      }
      toast.success(`You joined ${currentInvitation?.profile_name || "the company"}.`);
      router.replace("/dashboard");
    } catch (error) {
      toast.error(extractErrorMessage(error, []));
    } finally {
      setDecision(null);
    }
  };

  const handleDecline = async () => {
    if (!invitationCode) {
      toast.error("Invitation code is missing.");
      return;
    }

    setDecision("decline");
    try {
      await declineInvitation({ invitation_code: invitationCode }).unwrap();
      setDeclined(true);
      await refetch();
      toast.success("Invitation declined.");
    } catch (error) {
      toast.error(extractErrorMessage(error, []));
    } finally {
      setDecision(null);
    }
  };

  const showBusyState = invitationsLoading || invitationsFetching;

  if (!hasAuthCookie) {
    return (
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-12">
        <Card className="w-full max-w-2xl border-gray-200/80 bg-white/95 shadow-xl shadow-gray-200/60">
          <CardHeader className="space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Mail className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                Company invitation
              </Badge>
              <CardTitle className="text-3xl">Review your company invite</CardTitle>
              <CardDescription className="max-w-xl text-base leading-7 text-gray-600">
                Sign in with the email address that received this invitation to accept or decline the request to join
                the organization.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-600">
            {invitationCode ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Invitation code</p>
                <p className="mt-2 break-all font-mono text-sm text-gray-700">{invitationCode}</p>
              </div>
            ) : null}

            <Alert className="rounded-2xl border-blue-100 bg-blue-50 text-blue-900">
              <Mail className="h-4 w-4" />
              <AlertTitle>Use the invited account</AlertTitle>
              <AlertDescription>
                If you do not have an account yet, create one with the same email address that received the invitation,
                then return to this page.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button asChild variant="outline" className="w-full rounded-xl sm:w-auto">
              <Link href={registerHref}>
                <UserPlus className="h-4 w-4" />
                Create account
              </Link>
            </Button>
            <Button asChild className="w-full rounded-xl sm:w-auto">
              <Link href={signInHref}>
                <LogIn className="h-4 w-4" />
                Sign in to review
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (showBusyState) {
    return (
      <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-12">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-sm font-medium text-gray-700">Loading your invitations...</span>
        </div>
      </div>
    );
  }

  if (!invitationCode) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-8 flex flex-col gap-3">
          <Badge variant="outline" className="w-fit border-blue-200 bg-blue-50 text-blue-700">
            Invitations
          </Badge>
          <h1 className="text-3xl font-semibold text-gray-900">Pending company invitations</h1>
          <p className="max-w-2xl text-sm leading-7 text-gray-600">
            Review the companies that have invited you and open any invitation to accept or decline it.
          </p>
        </div>

        {invitations.length === 0 ? (
          <Card className="border-dashed border-gray-300 bg-white/90">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
                <Mail className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-gray-900">No pending invitations</h2>
                <p className="text-sm text-gray-600">When a company invites you, it will appear here.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {invitations.map((invitation) => (
              <InvitationSummary
                key={invitation.id}
                invitation={invitation}
                actionHref={`/accounts/invitations/${encodeURIComponent(invitation.invitation_code || invitation.id)}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (declined) {
    return (
      <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-12">
        <Card className="w-full max-w-2xl border-gray-200/80 bg-white/95 shadow-xl shadow-gray-200/60">
          <CardHeader className="space-y-3">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <XCircle className="h-6 w-6" />
            </div>
            <CardTitle className="text-3xl">Invitation declined</CardTitle>
            <CardDescription className="text-base leading-7 text-gray-600">
              You have declined this invitation. You can still review any other pending invitations linked to your
              account.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-end">
            <Button asChild className="rounded-xl">
              <Link href="/accounts/invitations">View my invitations</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!currentInvitation) {
    return (
      <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-12">
        <Card className="w-full max-w-2xl border-gray-200/80 bg-white/95 shadow-xl shadow-gray-200/60">
          <CardHeader className="space-y-3">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Mail className="h-6 w-6" />
            </div>
            <CardTitle className="text-3xl">Invitation not available</CardTitle>
            <CardDescription className="text-base leading-7 text-gray-600">
              We could not find a pending invitation matching this code for your signed-in account. Make sure you are
              signed in with the invited email address, or that the invitation has not already expired or been used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="rounded-2xl border-amber-200 bg-amber-50 text-amber-900">
              <Mail className="h-4 w-4" />
              <AlertTitle>Invitation code</AlertTitle>
              <AlertDescription>
                <span className="font-mono text-xs text-amber-900">{invitationCode}</span>
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="justify-end">
            <Button asChild className="rounded-xl">
              <Link href="/accounts/invitations">View my invitations</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-12">
      <Card className="w-full overflow-hidden border-gray-200/80 bg-white/95 shadow-xl shadow-gray-200/60">
        <CardHeader className="space-y-6 border-b border-gray-100 bg-gradient-to-br from-blue-50 via-white to-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <Badge variant="outline" className="w-fit border-blue-200 bg-blue-50 text-blue-700">
                Pending invitation
              </Badge>
              <div>
                <CardTitle className="text-3xl">{currentInvitation.profile_name || "Company invitation"}</CardTitle>
                <CardDescription className="mt-2 max-w-2xl text-base leading-7 text-gray-600">
                  You have been invited to join this organization as{" "}
                  <span className="font-semibold capitalize text-gray-800">{currentInvitation.role}</span>.
                </CardDescription>
              </div>
            </div>

            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm ring-1 ring-blue-100">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Invited email</p>
              <p className="mt-2 font-medium text-gray-800">{currentInvitation.email}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Invited by</p>
              <p className="mt-2 font-medium text-gray-800">{currentInvitation.invited_by_email || "Administrator"}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Expires on</p>
              <p className="mt-2 font-medium text-gray-800">{formatDate(currentInvitation.expires_at || undefined)}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Invitation code</p>
              <p className="mt-2 break-all font-mono text-sm text-gray-800">
                {currentInvitation.invitation_code || invitationCode}
              </p>
            </div>
          </div>

          {currentInvitation.invitation_message ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-500">Invitation note</p>
              <p className="mt-3 text-sm leading-7 text-gray-700">{currentInvitation.invitation_message}</p>
            </div>
          ) : null}

          <Alert className="rounded-2xl border-gray-200 bg-gray-50 text-gray-800">
            <Mail className="h-4 w-4" />
            <AlertTitle>Before you continue</AlertTitle>
            <AlertDescription>
              Accepting this invitation will add you to the organization and switch the app into that company context.
              Declining it will close this request without creating a membership.
            </AlertDescription>
          </Alert>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/70 p-6 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={decision !== null}
            onClick={() => void handleDecline()}
            className="w-full rounded-xl sm:w-auto"
          >
            {isDeclining || decision === "decline" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Declining
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Decline invitation
              </>
            )}
          </Button>
          <Button
            type="button"
            disabled={decision !== null}
            onClick={() => void handleAccept()}
            className="w-full rounded-xl sm:w-auto"
          >
            {isAccepting || isSwitchingCompany || decision === "accept" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Joining company
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Accept and continue
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

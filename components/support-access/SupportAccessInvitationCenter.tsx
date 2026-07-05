"use client";

import Link from "next/link";
import { getCookie } from "cookies-next";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  LogIn,
  Mail,
  ShieldCheck,
  UserPlus,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";

import { readCookieValue } from "@/lib/authCookies";
import { formatMachineLabel } from "@/lib/displayLabels";
import { extractErrorMessage, formatDate } from "@/lib/utils";
import { useSwitchCompanyMutation } from "@/redux/features/auth/authApiSlice";
import {
  useAcceptSupportAccessRequestMutation,
  useDeclineSupportAccessRequestMutation,
  useGetMySupportAccessRequestsQuery,
} from "@/redux/features/supportAccess/supportAccessApiSlice";
import type { SupportAccessGrant } from "@/redux/features/supportAccess/supportAccessTypes";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type DecisionState = "accept" | "decline" | null;

interface SupportAccessInvitationCenterProps {
  invitationCode?: string | null;
}

function RequestSummary({
  grant,
  actionHref,
}: {
  grant: SupportAccessGrant;
  actionHref: string;
}) {
  return (
    <Card className="border-gray-200/80 bg-white/95 shadow-lg shadow-gray-200/50">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">{grant.profile_name || "Support access request"}</CardTitle>
              <CardDescription className="mt-1">
                Temporary access preset: <span className="font-medium text-gray-700">{formatMachineLabel(grant.permission_mode)}</span>
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
            {formatMachineLabel(grant.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-gray-600">
        <div className="grid gap-3 rounded-2xl bg-gray-50 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Requested for</p>
            <p className="mt-1 font-medium text-gray-700">{grant.grantee_email_snapshot}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Requested by</p>
            <p className="mt-1 font-medium text-gray-700">{grant.created_by?.email || "Administrator"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Starts</p>
            <p className="mt-1 font-medium text-gray-700">{formatDate(grant.starts_at)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Expires</p>
            <p className="mt-1 font-medium text-gray-700">{formatDate(grant.expires_at)}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-gray-700">
          <p className="text-xs font-medium uppercase tracking-wide text-blue-500">Reason</p>
          <p className="mt-2 leading-6">{grant.reason}</p>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button asChild className="rounded-xl">
          <Link href={actionHref}>
            Review request
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function SupportAccessInvitationCenter({
  invitationCode: invitationCodeProp,
}: SupportAccessInvitationCenterProps) {
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
  const [acceptRequest, { isLoading: isAccepting }] = useAcceptSupportAccessRequestMutation();
  const [declineRequest, { isLoading: isDeclining }] = useDeclineSupportAccessRequestMutation();
  const [switchCompany, { isLoading: isSwitchingCompany }] = useSwitchCompanyMutation();
  const {
    data: requests = [],
    isLoading: requestsLoading,
    isFetching: requestsFetching,
    refetch,
  } = useGetMySupportAccessRequestsQuery(undefined, {
    skip: !hasAuthCookie,
  });

  const currentUrl = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const signInHref = `/accounts/signin?next=${encodeURIComponent(currentUrl)}`;
  const registerHref = `/accounts?next=${encodeURIComponent(currentUrl)}`;
  const currentRequest = invitationCode
    ? requests.find(
        (item) => (item.invitation_code || "").trim().toLowerCase() === invitationCode.trim().toLowerCase(),
      )
    : null;

  const handleAccept = async () => {
    if (!invitationCode) {
      toast.error("Support access request code is missing.");
      return;
    }

    setDecision("accept");
    try {
      const result = await acceptRequest({ invitation_code: invitationCode }).unwrap();
      if (result.status === "active") {
        try {
          await switchCompany({
            profile_id: result.profile_id,
            support_access_grant_id: result.support_access_grant_id,
          }).unwrap();
        } catch {
          toast.info("Support access accepted. We could not switch workspace automatically.");
        }
        toast.success(`Support access accepted for ${currentRequest?.profile_name || "the workspace"}.`);
        router.replace("/dashboard");
        return;
      }

      toast.success("Support access request accepted. It will become usable when the start time is reached.");
      await refetch();
      router.replace("/accounts/support-access");
    } catch (error) {
      toast.error(extractErrorMessage(error, []));
    } finally {
      setDecision(null);
    }
  };

  const handleDecline = async () => {
    if (!invitationCode) {
      toast.error("Support access request code is missing.");
      return;
    }

    setDecision("decline");
    try {
      await declineRequest({ invitation_code: invitationCode }).unwrap();
      setDeclined(true);
      await refetch();
      toast.success("Support access request declined.");
    } catch (error) {
      toast.error(extractErrorMessage(error, []));
    } finally {
      setDecision(null);
    }
  };

  const showBusyState = requestsLoading || requestsFetching;

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
                Temporary support access
              </Badge>
              <CardTitle className="text-3xl">Review your access request</CardTitle>
              <CardDescription className="max-w-xl text-base leading-7 text-gray-600">
                Sign in with the email address that received this support access request to accept or decline it.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-600">
            {invitationCode ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Request code</p>
                <p className="mt-2 break-all font-mono text-sm text-gray-700">{invitationCode}</p>
              </div>
            ) : null}

            <Alert className="rounded-2xl border-blue-100 bg-blue-50 text-blue-900">
              <Mail className="h-4 w-4" />
              <AlertTitle>Use the invited account</AlertTitle>
              <AlertDescription>
                If you do not have an account yet, create one with the same email address that received this request,
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
          <span className="text-sm font-medium text-gray-700">Loading your support access requests...</span>
        </div>
      </div>
    );
  }

  if (!invitationCode) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-8 flex flex-col gap-3">
          <Badge variant="outline" className="w-fit border-blue-200 bg-blue-50 text-blue-700">
            Support access
          </Badge>
          <h1 className="text-3xl font-semibold text-gray-900">Pending support access requests</h1>
          <p className="max-w-2xl text-base leading-7 text-gray-600">
            Review the workspaces that requested temporary access from your account.
          </p>
        </div>

        {requests.length === 0 ? (
          <Card className="border-dashed border-gray-300 bg-white/90 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">No pending requests</h2>
                <p className="mt-1 text-sm text-gray-600">You do not have any temporary support access requests waiting for a decision.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {requests.map((grant) => (
              <RequestSummary
                key={grant.id}
                grant={grant}
                actionHref={`/accounts/support-access/${encodeURIComponent(grant.invitation_code || grant.id)}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (declined) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-12">
        <Card className="w-full border-gray-200/80 bg-white/95 shadow-xl shadow-gray-200/50">
          <CardHeader className="space-y-3">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <XCircle className="h-6 w-6" />
            </div>
            <CardTitle className="text-3xl">Support request declined</CardTitle>
            <CardDescription className="max-w-xl text-base leading-7 text-gray-600">
              You declined this temporary support access request. You can still review other pending requests linked to your account.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-end">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/accounts/support-access">View my requests</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!currentRequest) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-12">
        <Card className="w-full border-amber-200 bg-white/95 shadow-xl shadow-amber-100/40">
          <CardHeader className="space-y-3">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Clock3 className="h-6 w-6" />
            </div>
            <CardTitle className="text-3xl">Request not available</CardTitle>
            <CardDescription className="max-w-xl text-base leading-7 text-gray-600">
              We could not find a pending support access request matching this code for your signed-in account. Make sure you are signed in with the invited email address, or that the request has not already expired or been used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span className="font-medium">Request code:</span>{" "}
              <span className="font-mono text-xs">{invitationCode}</span>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/accounts/support-access">View my requests</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Card className="border-gray-200/80 bg-white/95 shadow-xl shadow-gray-200/50">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
              Pending support request
            </Badge>
            <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
              {formatMachineLabel(currentRequest.permission_mode)}
            </Badge>
          </div>
          <div>
            <CardTitle className="text-3xl">{currentRequest.profile_name || "Support access request"}</CardTitle>
            <CardDescription className="mt-2 max-w-2xl text-base leading-7 text-gray-600">
              Accepting this request authorizes your account to switch into the workspace with temporary preset-based access until the request expires or is revoked.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 rounded-3xl bg-gray-50 p-5 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Workspace</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{currentRequest.profile_name}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Requested for</p>
              <p className="mt-1 font-medium text-gray-700">{currentRequest.grantee_email_snapshot}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Requested by</p>
              <p className="mt-1 font-medium text-gray-700">{currentRequest.created_by?.email || "Administrator"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Role</p>
              <p className="mt-1 font-medium capitalize text-gray-700">{currentRequest.membership_role}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Starts</p>
              <p className="mt-1 font-medium text-gray-700">{formatDate(currentRequest.starts_at)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Expires</p>
              <p className="mt-1 font-medium text-gray-700">{formatDate(currentRequest.expires_at)}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-500">Reason</p>
            <p className="mt-2 text-sm leading-7 text-gray-700">{currentRequest.reason}</p>
          </div>

          <Alert className="rounded-3xl border-amber-100 bg-amber-50 text-amber-950">
            <Clock3 className="h-4 w-4" />
            <AlertTitle>Access stays temporary</AlertTitle>
            <AlertDescription>
              This request does not create a permanent workspace membership. Access only becomes usable after acceptance and remains bounded by the start and expiry times.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            className="w-full rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 sm:w-auto"
            onClick={() => void handleDecline()}
            disabled={decision !== null}
          >
            {isDeclining && decision === "decline" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Decline request
          </Button>
          <Button
            className="w-full rounded-xl sm:w-auto"
            onClick={() => void handleAccept()}
            disabled={decision !== null}
          >
            {isAccepting || isSwitchingCompany ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Accept request
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

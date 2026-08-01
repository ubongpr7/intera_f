"use client"

import { useMemo, useState } from "react"
import {
  AlertTriangle,
  Clock3,
  KeyRound,
  Loader2,
  Plus,
  ShieldCheck,
} from "lucide-react"
import { toast } from "react-toastify"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { hasPermission } from "@/lib/permissionsGuard"
import { formatMachineLabel } from "@/lib/displayLabels"
import { extractErrorMessage, formatDate, formatRelativeTime } from "@/lib/utils"
import { useGetUserCompaniesQuery } from "@/redux/features/auth/authApiSlice"
import {
  useCreateSupportAccessGrantMutation,
  useExtendSupportAccessGrantMutation,
  useListSupportAccessGrantsQuery,
  useListSupportAccessPresetsQuery,
  useRevokeSupportAccessGrantMutation,
} from "@/redux/features/supportAccess/supportAccessApiSlice"
import type {
  SupportAccessGrant,
  SupportAccessGrantCreatePayload,
} from "@/redux/features/supportAccess/supportAccessTypes"

type GrantDialogMode = "create" | "extend" | "revoke" | null

const defaultExpiryIso = () => {
  const date = new Date(Date.now() + 8 * 60 * 60 * 1000)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const toIsoDateTime = (value: string) => {
  if (!value) return ""
  const normalized = new Date(value)
  return Number.isNaN(normalized.getTime()) ? "" : normalized.toISOString()
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  declined: "bg-orange-50 text-orange-700 border-orange-200",
  revoked: "bg-rose-50 text-rose-700 border-rose-200",
  expired: "bg-slate-100 text-slate-700 border-slate-200",
  consumed: "bg-violet-50 text-violet-700 border-violet-200",
}

const ROLE_OPTIONS = [
  { value: "member", label: "Member" },
  { value: "admin", label: "Admin" },
] as const

const GrantStatusBadge = ({ status }: { status: string }) => (
  <Badge
    variant="outline"
    className={STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700 border-slate-200"}
  >
    {formatMachineLabel(status)}
  </Badge>
)

const WorkspaceSupportContextBanner = () => {
  const { data: companyMemberships } = useGetUserCompaniesQuery()
  const activeProfile = companyMemberships?.profiles?.find(
    (profile) => `${profile.id}` === `${companyMemberships.active_profile_id}`,
  )

  if (!activeProfile?.support_access) {
    return null
  }

  return (
    <Card className="border-amber-200 bg-amber-50 shadow-sm">
      <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Temporary support context
          </div>
          <p className="mt-3 text-sm leading-6 text-amber-900">
            You are viewing <span className="font-semibold">{activeProfile.name}</span> under a temporary support grant.
            {activeProfile.support_access_mode ? ` Preset: ${formatMachineLabel(activeProfile.support_access_mode)}.` : ""}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-amber-900">
          <div className="font-medium">Access expires</div>
          <div className="mt-1">{formatDate(activeProfile.support_access_expires_at ?? undefined, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SupportAccessWorkspace() {
  const canCreate = hasPermission("create_support_access_grant")
  const canRead = hasPermission("read_support_access_grant")
  const canUpdate = hasPermission("update_support_access_grant")
  const canRevoke = hasPermission("revoke_support_access_grant")

  const [dialogMode, setDialogMode] = useState<GrantDialogMode>(null)
  const [selectedGrant, setSelectedGrant] = useState<SupportAccessGrant | null>(null)
  const [customPermissionInput, setCustomPermissionInput] = useState("")
  const [createForm, setCreateForm] = useState<SupportAccessGrantCreatePayload>({
    grantee_email: "",
    reason: "",
    ticket_reference: "",
    permission_mode: "",
    membership_role: "member",
    expires_at: defaultExpiryIso(),
    notes: "",
    custom_permissions: [],
  })
  const [extendExpiry, setExtendExpiry] = useState(defaultExpiryIso())
  const [extendNotes, setExtendNotes] = useState("")
  const [revokeNotes, setRevokeNotes] = useState("")

  const { data: presets = [], isLoading: loadingPresets } = useListSupportAccessPresetsQuery(undefined, {
    skip: !canCreate && !canRead,
  })
  const {
    data: grants = [],
    isLoading: loadingGrants,
    refetch: refetchGrants,
    error: grantsError,
  } = useListSupportAccessGrantsQuery(undefined, {
    skip: !canRead,
  })

  const [createGrant, { isLoading: creatingGrant }] = useCreateSupportAccessGrantMutation()
  const [extendGrant, { isLoading: extendingGrant }] = useExtendSupportAccessGrantMutation()
  const [revokeGrant, { isLoading: revokingGrant }] = useRevokeSupportAccessGrantMutation()

  const activeGrants = useMemo(
    () => grants.filter((grant) => grant.status === "active" || grant.status === "pending"),
    [grants],
  )
  const historicalGrants = useMemo(
    () => grants.filter((grant) => grant.status !== "active" && grant.status !== "pending"),
    [grants],
  )

  const openCreateDialog = () => {
    setCustomPermissionInput("")
    setCreateForm({
      grantee_email: "",
      reason: "",
      ticket_reference: "",
      permission_mode: presets[0]?.key ?? "",
      membership_role: "member",
      expires_at: defaultExpiryIso(),
      notes: "",
      custom_permissions: [],
    })
    setDialogMode("create")
  }

  const handleCreate = async () => {
    if (!createForm.grantee_email.trim()) {
      toast.error("Enter the recipient email first.")
      return
    }

    const payload: SupportAccessGrantCreatePayload = {
      ...createForm,
      grantee_email: createForm.grantee_email.trim().toLowerCase(),
      permission_mode: createForm.permission_mode || presets[0]?.key || "",
      expires_at: toIsoDateTime(createForm.expires_at),
      custom_permissions: customPermissionInput
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    }

    try {
      const result = await createGrant(payload).unwrap()
      toast.success(
        result.grantee_user
          ? "Support access request sent to the invited account."
          : "Support access request sent. The recipient must register with that email before accepting.",
      )
      setDialogMode(null)
      if (canRead) {
        await refetchGrants()
      }
    } catch (error) {
      toast.error(extractErrorMessage(error, ["grantee_email", "expires_at", "permission_mode", "membership_role"]))
    }
  }

  const handleExtend = async () => {
    if (!selectedGrant) return
    try {
      await extendGrant({
        id: selectedGrant.id,
        data: {
          expires_at: toIsoDateTime(extendExpiry),
          notes: extendNotes.trim() || undefined,
        },
      }).unwrap()
      toast.success("Support access grant extended.")
      setDialogMode(null)
      if (canRead) {
        await refetchGrants()
      }
    } catch (error) {
      toast.error(extractErrorMessage(error, ["expires_at", "detail"]))
    }
  }

  const handleRevoke = async () => {
    if (!selectedGrant) return
    try {
      await revokeGrant({
        id: selectedGrant.id,
        data: { notes: revokeNotes.trim() || undefined },
      }).unwrap()
      toast.success("Support access grant revoked.")
      setDialogMode(null)
      if (canRead) {
        await refetchGrants()
      }
    } catch (error) {
      toast.error(extractErrorMessage(error, ["detail"]))
    }
  }

  const launchExtend = (grant: SupportAccessGrant) => {
    setSelectedGrant(grant)
    setExtendNotes("")
    setExtendExpiry(defaultExpiryIso())
    setDialogMode("extend")
  }

  const launchRevoke = (grant: SupportAccessGrant) => {
    setSelectedGrant(grant)
    setRevokeNotes("")
    setDialogMode("revoke")
  }

  return (
    <div className="support-access-workspace mx-auto w-full max-w-[1800px] space-y-6 px-4 py-6 lg:px-8 2xl:px-10">
      <WorkspaceSupportContextBanner />

      <Card className="support-access-hero border-gray-200 bg-white shadow-sm">
        <CardHeader className="gap-3 p-6 text-left">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            <KeyRound className="h-3.5 w-3.5" />
            Support Access
          </div>
          <CardTitle className="text-3xl font-semibold tracking-tight text-gray-900">
            Temporary workspace access by request
          </CardTitle>
          <CardDescription className="max-w-4xl text-sm leading-6 text-gray-600">
            Request short-lived access for any email address, let the recipient accept it, and keep every support session bounded by normal workspace switching.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 p-6 pt-0 md:grid-cols-3">
          <div className="rounded-[24px] border border-blue-100 bg-blue-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">Request</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Email-based request and acceptance</p>
          </div>
          <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Activation</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Access stays pending until the recipient accepts</p>
          </div>
          <div className="rounded-[24px] border border-amber-100 bg-amber-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Attribution</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Accepted access stays tied to the recipient account</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-col gap-4 p-6 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="text-2xl text-gray-900">Requests and active access</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6 text-gray-600">
                Review pending requests, accepted temporary access, and why each request exists.
              </CardDescription>
            </div>
            {canCreate ? (
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Create request
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4 p-6 pt-0">
            {!canRead ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                You can open this page, but reading the grant register requires <span className="font-mono font-semibold">read_support_access_grant</span>.
              </div>
            ) : loadingGrants ? (
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading support access grants...
              </div>
            ) : grantsError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {extractErrorMessage(grantsError, ["detail"])}
              </div>
            ) : activeGrants.length ? (
              activeGrants.map((grant) => (
                <div key={grant.id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <GrantStatusBadge status={grant.status} />
                        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                          {formatMachineLabel(grant.permission_mode)}
                        </Badge>
                        <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                          role: {formatMachineLabel(grant.membership_role)}
                        </Badge>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {grant.grantee_user?.get_full_name || `${grant.grantee_user?.first_name ?? ""} ${grant.grantee_user?.last_name ?? ""}`.trim() || grant.grantee_email_snapshot}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">{grant.grantee_email_snapshot}</p>
                        {!grant.grantee_user ? (
                          <p className="mt-2 text-xs font-medium text-amber-700">
                            Account not registered yet. The recipient must sign up with this email before accepting.
                          </p>
                        ) : null}
                      </div>
                      <p className="max-w-3xl text-sm leading-6 text-slate-700">{grant.reason}</p>
                      <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                        <div>
                          <div className="font-medium text-slate-900">Created</div>
                          <div>{formatDate(grant.created_at, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
                          <div className="text-xs text-slate-500">by {grant.created_by?.get_full_name || grant.created_by?.email || "System"}</div>
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">Expires</div>
                          <div>{formatDate(grant.expires_at, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
                          <div className="text-xs text-slate-500">{formatRelativeTime(grant.expires_at)}</div>
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">Ticket reference</div>
                          <div>{grant.ticket_reference || "Not set"}</div>
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">Last used</div>
                          <div>{grant.last_used_at ? formatDate(grant.last_used_at, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : grant.status === "pending" ? "Awaiting acceptance or first use" : "Not yet used"}</div>
                        </div>
                      </div>
                      {grant.custom_permissions?.length ? (
                        <div>
                          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Custom permission additions</div>
                          <div className="flex flex-wrap gap-2">
                            {grant.custom_permissions.map((permission) => (
                              <Badge key={permission} variant="outline" className="border-slate-200 bg-white text-slate-700">
                                {permission}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2 lg:w-52 lg:flex-col">
                      {canUpdate ? (
                        <Button variant="outline" onClick={() => launchExtend(grant)}>
                          Extend grant
                        </Button>
                      ) : null}
                      {canRevoke && grant.status !== "revoked" ? (
                        <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => launchRevoke(grant)}>
                          Revoke access
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
                No active or pending support access requests are attached to this workspace.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="p-6 text-left">
              <CardTitle className="text-xl text-gray-900">Preset catalog</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6 text-gray-600">
                These are the support access presets currently available in phase one.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-6 pt-0">
              {loadingPresets ? (
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading support presets...
                </div>
              ) : presets.map((preset) => (
                <div key={preset.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900">{preset.name}</div>
                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                      {preset.key}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{preset.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {preset.permissions.slice(0, 6).map((permission) => (
                      <Badge key={permission} variant="outline" className="border-slate-200 bg-white text-slate-700">
                        {permission}
                      </Badge>
                    ))}
                    {preset.permissions.length > 6 ? (
                      <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                        +{preset.permissions.length - 6} more
                      </Badge>
                    ) : null}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="p-6 text-left">
              <CardTitle className="text-xl text-gray-900">Grant history</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6 text-gray-600">
                Declined, revoked, and expired records stay visible here for workspace review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-6 pt-0">
              {!canRead ? null : historicalGrants.length ? (
                historicalGrants.map((grant) => (
                  <div key={grant.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{grant.grantee_email_snapshot}</div>
                        <div className="mt-1 text-xs text-slate-500">{grant.reason}</div>
                      </div>
                      <GrantStatusBadge status={grant.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>Ended: {formatDate(grant.revoked_at || grant.expires_at, { year: "numeric", month: "short", day: "numeric" })}</span>
                      <span>Preset: {formatMachineLabel(grant.permission_mode)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  No concluded support requests yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50 shadow-sm">
            <CardHeader className="p-6 text-left">
              <CardTitle className="flex items-center gap-2 text-xl text-amber-950">
                <AlertTriangle className="h-5 w-5 text-amber-700" />
                Phase-one guardrails
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-6 pt-0 text-sm leading-6 text-amber-900">
              <p>Support access remains temporary, limited to this workspace, and tied to the accepting account.</p>
              <p>Every grant starts as a request and stays unusable until the recipient accepts it.</p>
              <p>Owner role is never available through this flow.</p>
              <p>Revocation blocks future refresh and workspace re-entry for support-scoped tokens.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogMode === "create"} onOpenChange={(open) => setDialogMode(open ? "create" : null)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-h-[min(88dvh,760px)]">
          <DialogHeader className="border-b border-slate-200 px-5 py-5 pr-12 sm:px-6">
            <DialogTitle className="text-xl">Create temporary support access request</DialogTitle>
            <DialogDescription className="mt-2 max-w-xl leading-6 text-slate-600">
              Send a time-bound workspace access request to an email address. The recipient must sign in or register with that email, then accept the request before the access becomes usable.
            </DialogDescription>
          </DialogHeader>
          <div className="grid min-h-0 gap-5 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="space-y-2">
              <Label htmlFor="support-grantee-email">Recipient email</Label>
              <Input
                id="support-grantee-email"
                type="email"
                value={createForm.grantee_email}
                onChange={(event) => setCreateForm((current) => ({ ...current, grantee_email: event.target.value }))}
                placeholder="name@example.com"
              />
              <p className="text-xs text-slate-500">
                If this email already belongs to an account, that user can accept immediately. Otherwise the same email must be used during registration first.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="support-ticket-reference">Ticket reference</Label>
                <Input
                  id="support-ticket-reference"
                  value={createForm.ticket_reference || ""}
                  onChange={(event) => setCreateForm((current) => ({ ...current, ticket_reference: event.target.value }))}
                  placeholder="Optional external or internal ticket id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-membership-role">Workspace role</Label>
                <select
                  id="support-membership-role"
                  value={createForm.membership_role}
                  onChange={(event) => setCreateForm((current) => ({ ...current, membership_role: event.target.value as "member" | "admin" }))}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white"
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-permission-mode">Support preset</Label>
                <select
                  id="support-permission-mode"
                  value={createForm.permission_mode}
                  onChange={(event) => setCreateForm((current) => ({ ...current, permission_mode: event.target.value }))}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white"
                >
                  {presets.map((preset) => (
                    <option key={preset.key} value={preset.key}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-expires-at">Expires at</Label>
                <Input
                  id="support-expires-at"
                  type="datetime-local"
                  value={createForm.expires_at}
                  onChange={(event) => setCreateForm((current) => ({ ...current, expires_at: event.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-reason">Reason</Label>
              <Textarea
                id="support-reason"
                value={createForm.reason}
                onChange={(event) => setCreateForm((current) => ({ ...current, reason: event.target.value }))}
                placeholder="Explain why temporary support access is needed."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-custom-permissions">Optional custom permission additions</Label>
              <Input
                id="support-custom-permissions"
                value={customPermissionInput}
                onChange={(event) => setCustomPermissionInput(event.target.value)}
                placeholder="Comma-separated permission codenames, e.g. read_company, view_inventory_reports"
              />
              <p className="text-xs text-slate-500">
                Optional. Only additive permissions allowed by backend validation will be accepted.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-notes">Notes</Label>
              <Textarea
                id="support-notes"
                value={createForm.notes || ""}
                onChange={(event) => setCreateForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Optional internal note for this request"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
            <Button variant="outline" onClick={() => setDialogMode(null)}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()} disabled={creatingGrant} className="sm:min-w-36">
              {creatingGrant ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
              Send request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogMode === "extend"} onOpenChange={(open) => setDialogMode(open ? "extend" : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend support grant</DialogTitle>
            <DialogDescription>
              Move the expiry window forward for {selectedGrant?.grantee_email_snapshot || "this support user"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="extend-expires-at">New expiry</Label>
              <Input
                id="extend-expires-at"
                type="datetime-local"
                value={extendExpiry}
                onChange={(event) => setExtendExpiry(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="extend-notes">Notes</Label>
              <Textarea
                id="extend-notes"
                value={extendNotes}
                onChange={(event) => setExtendNotes(event.target.value)}
                rows={4}
                placeholder="Optional note explaining the extension"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)}>
              Cancel
            </Button>
            <Button onClick={() => void handleExtend()} disabled={extendingGrant}>
              {extendingGrant ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock3 className="mr-2 h-4 w-4" />}
              Extend grant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogMode === "revoke"} onOpenChange={(open) => setDialogMode(open ? "revoke" : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke support grant</DialogTitle>
            <DialogDescription>
              This immediately blocks future refresh and workspace re-entry for the selected support context.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              Grant target: <span className="font-semibold">{selectedGrant?.grantee_email_snapshot || "Unknown user"}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="revoke-notes">Notes</Label>
              <Textarea
                id="revoke-notes"
                value={revokeNotes}
                onChange={(event) => setRevokeNotes(event.target.value)}
                rows={4}
                placeholder="Optional reason for revocation"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => void handleRevoke()}
              disabled={revokingGrant}
            >
              {revokingGrant ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
              Revoke access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

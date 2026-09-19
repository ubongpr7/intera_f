"use client"

import { usePathname } from "next/navigation"
import { ShieldAlert } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDecodedToken } from "./utils"
import { store, useAppSelector } from "@/redux/store"

type DecodedToken = {
  is_staff?: boolean | string | number | null
  is_superuser?: boolean | string | number | null
  email?: string | null
  owner_id?: string | number | null
  id?: string | number | null
  sub?: string | number | null
  user_id?: string | number | null
  membership_role?: string | null
  role?: string | null
}

type RouteGuardRule = {
  pattern: RegExp
  anyPermissions?: string[]
  ownerOnly?: boolean
  staffOnly?: boolean
  ownerBypass?: boolean
  message: string
  resource: string
}

type AccessResult = {
  allowed: boolean
  message: string
  resource: string
  requiredPermissions: string[]
  ownerOnly: boolean
  staffOnly: boolean
  ownerBypass: boolean
}

const normalizeId = (value: string | number | null | undefined): string | null => {
  if (value === null || value === undefined) return null
  const normalized = `${value}`.trim()
  return normalized.length ? normalized : null
}

export const truthyAccessClaim = (value: unknown): boolean => {
  if (value === true || value === 1) return true
  if (typeof value === "string") {
    return ["true", "1", "yes"].includes(value.trim().toLowerCase())
  }
  return false
}

export const getPermissionSnapshot = () => {
  const token = getDecodedToken() as DecodedToken | null
  const hydrated = store.getState().permission

  return {
    permissions: new Set(hydrated.permissions),
    isOwner: hydrated.isOwner,
    isStaff: hydrated.isStaff || truthyAccessClaim(token?.is_staff) || truthyAccessClaim(token?.is_superuser),
    status: hydrated.status,
    profileId: hydrated.profileId,
  }
}

export const hasPermission = (permission: string) => {
  const snapshot = getPermissionSnapshot()
  return snapshot.isOwner || snapshot.permissions.has(permission)
}

export const hasAnyPermission = (requiredPermissions: string[]) => {
  const snapshot = getPermissionSnapshot()
  return snapshot.isOwner || requiredPermissions.some((permission) => snapshot.permissions.has(permission))
}

const ROUTE_GUARDS: RouteGuardRule[] = [
  {
    pattern: /^\/product\/global-catalog-admin(?:\/|$)/,
    staffOnly: true,
    ownerBypass: false,
    message: "Only Intera IMS staff can curate the platform-owned global product catalog.",
    resource: "Global catalog administration",
  },
  {
    pattern: /^\/admin(?:\/|$)/,
    staffOnly: true,
    ownerBypass: false,
    message: "Only Intera IMS staff or superusers can access the admin hub.",
    resource: "Admin hub",
  },
  {
    pattern: /^\/payment-admin(?:\/|$)/,
    staffOnly: true,
    ownerBypass: false,
    message: "Only Intera IMS staff or superusers can access payment administration.",
    resource: "Payment administration",
  },
  {
    pattern: /^\/audit(?:\/|$)/,
    anyPermissions: ["view_audit_trail"],
    message: "You need audit-trail permission to inspect the workspace audit history.",
    resource: "Audit trail",
  },
  {
    pattern: /^\/profile\/support-access(?:\/|$)/,
    anyPermissions: [
      "read_support_access_grant",
      "create_support_access_grant",
      "update_support_access_grant",
      "revoke_support_access_grant",
    ],
    message: "You need support-access permission to review or manage temporary workspace support grants.",
    resource: "Support access",
  },
  {
    pattern: /^\/settings(?:\/|$)/,
    ownerOnly: true,
    message: "Only the workspace owner can access the workspace settings hub.",
    resource: "Workspace settings",
  },
  {
    pattern: /^\/subscription(?:\/|$)/,
    ownerOnly: true,
    message: "Only the workspace owner can manage institution billing and subscription limits.",
    resource: "Institution subscription",
  },
  {
    pattern: /^\/profile\/staff(?:\/|$)/,
    anyPermissions: ["manage_company_settings"],
    message: "You need company-settings permission to manage staff, roles, and workspace access.",
    resource: "Staff and roles",
  },
  {
    pattern: /^\/profile(?:\/|$)/,
    anyPermissions: ["read_company"],
    message: "You do not have access to the company profile workspace.",
    resource: "Company profile",
  },
  {
    pattern: /^\/agent\/settings(?:\/|$)/,
    anyPermissions: ["manage_agent_settings"],
    message: "You need agent-settings permission to manage workspace agents.",
    resource: "Agent settings",
  },
  {
    pattern: /^\/pos\/settings(?:\/|$)/,
    anyPermissions: ["manage_pos_settings"],
    message: "You need POS-settings permission to manage POS configuration.",
    resource: "POS settings",
  },
  {
    pattern: /^\/pos\/remittances(?:\/|$)/,
    anyPermissions: ["manage_pos_remittances"],
    message: "You do not have access to the remittance workspace.",
    resource: "POS remittances",
  },
]

const OPEN_ACCESS: AccessResult = {
  allowed: true,
  message: "",
  resource: "",
  requiredPermissions: [],
  ownerOnly: false,
  staffOnly: false,
  ownerBypass: true,
}

export const getPermissionRequirementLabel = (access: Pick<AccessResult, "ownerOnly" | "requiredPermissions" | "staffOnly">) => {
  if (access.staffOnly) {
    return "is_staff or is_superuser"
  }
  if (access.ownerOnly) {
    return "workspace_owner"
  }
  if (access.requiredPermissions.length === 1) {
    return access.requiredPermissions[0]
  }
  if (access.requiredPermissions.length > 1) {
    return `one_of: ${access.requiredPermissions.join(", ")}`
  }
  return ""
}

export const canAccessPath = (pathname: string): AccessResult => {
  const snapshot = getPermissionSnapshot()
  if (/^\/profile\/create(?:\/|$)/.test(pathname)) {
    return OPEN_ACCESS
  }
  const matchedRule = ROUTE_GUARDS.find((rule) => rule.pattern.test(pathname))
  if (!matchedRule) {
    return OPEN_ACCESS
  }
  if (matchedRule.staffOnly && !snapshot.isStaff) {
    return {
      allowed: false,
      message: matchedRule.message,
      resource: matchedRule.resource,
      requiredPermissions: [],
      ownerOnly: false,
      staffOnly: true,
      ownerBypass: matchedRule.ownerBypass ?? true,
    }
  }
  if (snapshot.isOwner && matchedRule.ownerBypass !== false) {
    return OPEN_ACCESS
  }
  if (matchedRule.ownerOnly) {
    return {
      allowed: false,
      message: matchedRule.message,
      resource: matchedRule.resource,
      requiredPermissions: [],
      ownerOnly: true,
      staffOnly: false,
      ownerBypass: matchedRule.ownerBypass ?? true,
    }
  }
  if (matchedRule.anyPermissions?.length) {
    const allowed = matchedRule.anyPermissions.some((permission) => snapshot.permissions.has(permission))
    return {
      allowed,
      message: allowed ? "" : matchedRule.message,
      resource: matchedRule.resource,
      requiredPermissions: matchedRule.anyPermissions,
      ownerOnly: false,
      staffOnly: false,
      ownerBypass: matchedRule.ownerBypass ?? true,
    }
  }
  return OPEN_ACCESS
}

function AccessDeniedPanel({ access }: { access: AccessResult }) {
  const token = getDecodedToken() as DecodedToken | null
  const principal =
    [token?.email, normalizeId(token?.user_id), normalizeId(token?.sub)].find(
      (value): value is string => typeof value === "string" && value.trim().length > 0,
    ) ?? "current_user"
  const requirementLabel = getPermissionRequirementLabel(access)
  return (
    <div className="space-y-6">
      <Card className="border-amber-200 bg-amber-50 shadow-sm">
        <CardHeader className="p-6 text-left">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
            <ShieldAlert className="h-3.5 w-3.5" />
            Access Restricted
          </div>
          <CardTitle className="text-3xl font-semibold tracking-tight text-amber-950">You do not have access to this resource.</CardTitle>
          <CardDescription className="max-w-3xl text-sm leading-6 text-amber-900/80">
            {access.message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6 pt-0 text-sm text-amber-900/80">
          <div className="rounded-2xl border border-amber-200 bg-white/70 p-4">
            <p className="font-medium text-amber-950">
              User <span className="font-semibold">{principal}</span> does not have access to{" "}
              <span className="font-semibold">{access.resource || "this resource"}</span>.
            </p>
            <p className="mt-2 text-sm text-amber-900/80">
              Required permission:
            </p>
            <div className="mt-3 inline-flex items-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 font-mono text-xs font-semibold text-red-700">
              {requirementLabel || "permission_required"}
            </div>
          </div>
          <p>
            Least privilege is enforced here: the workspace owner can access everything, and every other user must
            have the explicit permission for the route they are trying to open.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export function RouteAccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const permissionState = useAppSelector((state) => state.permission)
  const access = canAccessPath(pathname)

  if (permissionState.status === "loading") {
    return <PermissionLoadingPanel />
  }
  if (permissionState.status === "failed") {
    return <PermissionErrorPanel />
  }

  if (access.allowed) {
    return <>{children}</>
  }

  return <AccessDeniedPanel access={access} />
}

function PermissionLoadingPanel() {
  return <div className="mx-auto flex min-h-[35vh] max-w-2xl items-center justify-center p-8 text-center"><div className="w-full space-y-4"><div className="mx-auto h-5 w-48 animate-pulse rounded-full bg-gray-200" /><div className="mx-auto h-4 w-72 animate-pulse rounded-full bg-gray-100" /><div className="mx-auto h-24 max-w-md animate-pulse rounded-2xl border border-gray-200 bg-gray-50" /></div></div>
}

function PermissionErrorPanel() {
  return <div className="mx-auto flex min-h-[35vh] max-w-2xl flex-col items-center justify-center gap-3 p-8 text-center"><ShieldAlert className="h-10 w-10 text-amber-600" /><h1 className="text-xl font-semibold">Workspace permissions unavailable</h1><p className="text-sm text-gray-600">Refresh the page to retry loading your workspace access.</p></div>
}

type PermissionGuardProps = {
  anyOf?: string[]
  ownerOnly?: boolean
  fallback?: React.ReactNode
  resource?: string
  message?: string
  children: React.ReactNode
}

export default function PermissionGuard({
  anyOf = [],
  ownerOnly = false,
  fallback = null,
  resource = "this resource",
  message = "You do not have access to this resource.",
  children,
}: PermissionGuardProps) {
  const permissionState = useAppSelector((state) => state.permission)
  const snapshot = getPermissionSnapshot()
  if (permissionState.status === "loading") return <PermissionLoadingPanel />
  if (permissionState.status === "failed") return fallback !== null ? <>{fallback}</> : <PermissionErrorPanel />
  if (snapshot.isOwner) {
    return <>{children}</>
  }
  if (ownerOnly) {
    return fallback !== null ? (
      <>{fallback}</>
    ) : (
      <AccessDeniedPanel
      access={{
          allowed: false,
          message,
          resource,
          requiredPermissions: [],
          ownerOnly: true,
          staffOnly: false,
          ownerBypass: true,
        }}
      />
    )
  }
  if (anyOf.length > 0 && !anyOf.some((permission) => snapshot.permissions.has(permission))) {
    return fallback !== null ? (
      <>{fallback}</>
    ) : (
      <AccessDeniedPanel
      access={{
          allowed: false,
          message,
          resource,
          requiredPermissions: anyOf,
          ownerOnly: false,
          staffOnly: false,
          ownerBypass: true,
        }}
      />
    )
  }
  return <>{children}</>
}

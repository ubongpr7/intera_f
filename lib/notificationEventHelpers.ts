import type { NotificationRecord } from "@/redux/features/notification/notificationTypes"

type NotificationTone = {
  badgeClassName: string
  panelClassName: string
}

type NotificationMetadataRow = {
  label: string
  value: string
}

export type NotificationPresentation = {
  tone: NotificationTone
  categoryLabel: string
  subjectLabel: string
  workspaceLabel: string
  targetLabel: string
  recipientNames: string[]
  grantedPermissions: string[]
  revokedPermissions: string[]
  metadataRows: NotificationMetadataRow[]
}

const hiddenMetadataKeys = new Set([
  "affected_users",
  "after_permissions",
  "before_permissions",
  "event_name",
  "reference_number",
  "target",
  "user_id",
  "user_email",
  "user_name",
  "workspace_name",
])

const asText = (value: unknown) => String(value ?? "").trim()

const asObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}

const asTextArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value.map((item) => asText(item)).filter(Boolean)
}

const titleCase = (value: string) =>
  value
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")

const getTone = (category: string): NotificationTone => {
  const normalized = asText(category).toLowerCase()
  if (normalized === "security" || normalized === "support_access") {
    return {
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-800",
      panelClassName: "border-amber-200 bg-amber-50/70",
    }
  }
  if (normalized === "approval_required") {
    return {
      badgeClassName: "border-rose-200 bg-rose-50 text-rose-700",
      panelClassName: "border-rose-200 bg-rose-50/70",
    }
  }
  if (normalized === "purchase_order" || normalized === "sales_order") {
    return {
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
      panelClassName: "border-amber-200 bg-amber-50/70",
    }
  }
  if (normalized === "stock_alert" || normalized === "pos_activity") {
    return {
      badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
      panelClassName: "border-emerald-200 bg-emerald-50/70",
    }
  }
  return {
    badgeClassName: "border-blue-200 bg-blue-50 text-blue-700",
    panelClassName: "border-slate-200 bg-slate-50/80",
  }
}

const buildRecipientNames = (metadata: Record<string, unknown>) => {
  const affectedUsers = Array.isArray(metadata.affected_users) ? metadata.affected_users : []
  const names = affectedUsers
    .map((item) => asObject(item))
    .map((item) => asText(item.user_name || item.display_name || item.user_email))
    .filter(Boolean)
  if (names.length) {
    return Array.from(new Set(names))
  }
  const primaryName = asText(metadata.user_name || metadata.display_name || metadata.user_email)
  return primaryName ? [primaryName] : []
}

const buildMetadataRows = (metadata: Record<string, unknown>): NotificationMetadataRow[] =>
  Object.entries(metadata)
    .filter(([key, value]) => !hiddenMetadataKeys.has(key) && value !== null && value !== undefined && asText(value))
    .map(([key, value]) => ({
      label: titleCase(key),
      value: Array.isArray(value) ? value.map((item) => asText(item)).filter(Boolean).join(", ") : asText(value),
    }))
    .slice(0, 8)

export const getNotificationPresentation = (notification: NotificationRecord): NotificationPresentation => {
  const metadata = asObject(notification.metadata_json)
  const beforePermissions = asTextArray(metadata.before_permissions)
  const afterPermissions = asTextArray(metadata.after_permissions)
  const beforeSet = new Set(beforePermissions)
  const afterSet = new Set(afterPermissions)
  const grantedPermissions = afterPermissions.filter((permission) => !beforeSet.has(permission))
  const revokedPermissions = beforePermissions.filter((permission) => !afterSet.has(permission))
  const target = asObject(metadata.target)
  const targetLabel =
    asText(target.label) ||
    asText(metadata.goods_receipt_reference) ||
    asText(metadata.purchase_order_reference) ||
    asText(metadata.reference_number) ||
    asText(metadata.order_number) ||
    asText(metadata.role_name) ||
    asText(metadata.group_name) ||
    asText(metadata.user_name) ||
    asText(metadata.membership_id) ||
    "Workspace access"
  const workspaceLabel = asText(metadata.workspace_name) || asText(notification.workspace_id) || "Current workspace"

  return {
    tone: getTone(notification.category),
    categoryLabel: titleCase(notification.category || "system"),
    subjectLabel: targetLabel,
    workspaceLabel,
    targetLabel,
    recipientNames: buildRecipientNames(metadata),
    grantedPermissions,
    revokedPermissions,
    metadataRows: buildMetadataRows(metadata),
  }
}

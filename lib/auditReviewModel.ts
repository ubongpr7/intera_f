import { extractGoodsReceiptEntries, extractPosSaleEntries, safeObject, type GoodsReceiptEntry, type PosSaleEntry } from "@/lib/auditEventHelpers"
import type { AuditEventRecord } from "@/redux/features/audit/auditTypes"

type AuditReviewStat = {
  label: string
  value: string
  helper?: string
}

type AuditReviewReference = {
  label: string
  value: string
}

export type AuditReviewModel = {
  domain:
    | "pos"
    | "goods_receipt"
    | "purchase_order"
    | "identity"
    | "support_access"
    | "catalog"
    | "inventory"
    | "generic"
  label: string
  badgeClassName: string
  cardClassName: string
  summary: string
  statCards: AuditReviewStat[]
  referenceRows: AuditReviewReference[]
  focusPoints: string[]
  highlightedLines: Array<{
    title: string
    subtitle: string
    trailing: string
  }>
}

const asText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value)
    }
  }
  return ""
}

const asNumber = (...values: unknown[]) => {
  for (const value of values) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return 0
}

const asTextArray = (...values: unknown[]) => {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value.map((item) => asText(item)).filter(Boolean)
    }
  }
  return []
}

const titleCase = (value?: string | null) =>
  String(value || "")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())

const afterSnapshot = (event: AuditEventRecord) => safeObject(safeObject(event.changes_json).after)

const beforeSnapshot = (event: AuditEventRecord) => safeObject(safeObject(event.changes_json).before)

const getPermissionDiff = (event: AuditEventRecord) => {
  const metadata = safeObject(event.metadata_json)
  const after = afterSnapshot(event)
  const before = beforeSnapshot(event)
  const changes = safeObject(event.changes_json)
  const permissionChange = safeObject(changes.permissions)
  const beforePermissions = asTextArray(
    metadata.before_permissions,
    permissionChange.before,
    before.permissions,
  )
  const afterPermissions = asTextArray(
    metadata.after_permissions,
    permissionChange.after,
    after.permissions,
  )
  const beforeSet = new Set(beforePermissions)
  const afterSet = new Set(afterPermissions)
  return {
    granted: afterPermissions.filter((permission) => !beforeSet.has(permission)),
    revoked: beforePermissions.filter((permission) => !afterSet.has(permission)),
    beforePermissions,
    afterPermissions,
  }
}

const getGroupDiff = (event: AuditEventRecord) => {
  const metadata = safeObject(event.metadata_json)
  const changes = safeObject(event.changes_json)
  const groupChange = safeObject(changes.groups)
  const beforeGroups = asTextArray(metadata.before_groups, groupChange.before)
  const afterGroups = asTextArray(metadata.after_groups, groupChange.after)
  const beforeSet = new Set(beforeGroups)
  const afterSet = new Set(afterGroups)
  return {
    added: afterGroups.filter((group) => !beforeSet.has(group)),
    removed: beforeGroups.filter((group) => !afterSet.has(group)),
  }
}

const buildGoodsReceiptLineReview = (event: AuditEventRecord): AuditReviewModel => {
  const entry = extractGoodsReceiptEntries(event)[0]
  const summary = entry
    ? `${entry.inventoryName} was received into ${entry.stockLocationName || "a stock location"} on ${entry.goodsReceiptReference || "the goods receipt"}.`
    : event.summary
  return {
    domain: "goods_receipt",
    label: "Receiving",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    cardClassName: "border-emerald-200 bg-emerald-50/80",
    summary,
    statCards: [
      {
        label: "Received now",
        value: entry ? `${entry.receivedQuantity}` : "—",
        helper: entry ? "Units posted in this receipt line" : "No quantity snapshot",
      },
      {
        label: "To date",
        value: entry ? `${entry.quantityReceivedToDate}` : "—",
        helper: entry ? "Total received for the purchase line" : "No cumulative quantity",
      },
      {
        label: "Remaining",
        value: entry ? `${entry.remainingQuantity}` : "—",
        helper: entry ? "Units still expected on the purchase line" : "No remaining quantity",
      },
      {
        label: "Warehouse node",
        value: entry?.stockLocationName || "Unknown",
        helper: entry?.purchaseOrderReference || "No purchase-order reference",
      },
    ],
    referenceRows: [
      { label: "Goods receipt", value: entry?.goodsReceiptReference || "—" },
      { label: "Purchase order", value: entry?.purchaseOrderReference || "—" },
      { label: "Item", value: entry?.inventoryName || event.target_label || "—" },
      { label: "SKU / barcode", value: asText(entry?.sku, entry?.barcode) || "—" },
      { label: "Lot trace", value: entry?.lotNumber || "No lot recorded" },
      { label: "Operator", value: entry?.actorName || event.actor_name || event.actor_email || "System actor" },
    ],
    focusPoints: [
      "Confirm the received quantity matches the physical inbound quantity and the purchase document.",
      "Verify the warehouse location is correct because this event affects stock placement and downstream availability.",
      "If remaining quantity is still open, check whether more supplier deliveries are expected or the order should be closed later.",
    ],
    highlightedLines: entry
      ? [
          {
            title: entry.inventoryName,
            subtitle: `${entry.purchaseOrderReference || "No PO"} • ${entry.goodsReceiptReference || "No GR"} • ${entry.stockLocationName || "No location"}`,
            trailing: `+${entry.receivedQuantity}`,
          },
        ]
      : [],
  }
}

const buildGoodsReceiptReview = (event: AuditEventRecord): AuditReviewModel => {
  const metadata = safeObject(event.metadata_json)
  const after = afterSnapshot(event)
  const receiptLines = Array.isArray(metadata.receipt_lines) ? metadata.receipt_lines : []
  return {
    domain: "goods_receipt",
    label: "Receiving",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    cardClassName: "border-emerald-200 bg-emerald-50/80",
    summary: event.summary || `Goods receipt ${asText(after.reference, event.reference_number)} was created.`,
    statCards: [
      {
        label: "Receipt lines",
        value: String(asNumber(metadata.received_count, receiptLines.length)),
        helper: "Inbound lines captured in this receipt",
      },
      {
        label: "Units received",
        value: asText(metadata.total_quantity_received) || "—",
        helper: "Total units posted in the receipt",
      },
      {
        label: "Serials",
        value: String(asNumber(metadata.total_serials_received)),
        helper: "Serial numbers recorded across received lines",
      },
      {
        label: "Supplier",
        value: asText(after.supplier_name) || "Unknown",
        helper: asText(after.purchase_order_reference) || "No purchase-order reference",
      },
    ],
    referenceRows: [
      { label: "Goods receipt", value: asText(after.reference, event.reference_number) || "—" },
      { label: "Purchase order", value: asText(after.purchase_order_reference, metadata.purchase_order_reference) || "—" },
      { label: "Supplier", value: asText(after.supplier_name) || "—" },
      { label: "Received at", value: asText(after.received_at, event.occurred_at) || "—" },
    ],
    focusPoints: [
      "Review whether every expected inbound line from the supplier was captured in this receipt.",
      "Check the warehouse placements and trace data on each highlighted line before treating the receipt as settled.",
      "Use the linked purchase-order events to confirm whether this receipt should move the order toward completed status.",
    ],
    highlightedLines: receiptLines.slice(0, 5).map((line) => {
      const item = safeObject(line)
      return {
        title: asText(item.inventory_name) || "Received item",
        subtitle: `${asText(item.stock_location_name) || "No location"} • ${asText(item.goods_receipt_reference) || "No receipt reference"}`,
        trailing: `+${asText(item.quantity_received) || "0"}`,
      }
    }),
  }
}

const buildPurchaseOrderReview = (event: AuditEventRecord): AuditReviewModel => {
  const metadata = safeObject(event.metadata_json)
  const after = afterSnapshot(event)
  const before = beforeSnapshot(event)
  const receiptLines = Array.isArray(metadata.receipt_lines) ? metadata.receipt_lines : []
  return {
    domain: "purchase_order",
    label: "Purchase order",
    badgeClassName: "border-cyan-200 bg-cyan-50 text-cyan-700",
    cardClassName: "border-cyan-200 bg-cyan-50/80",
    summary:
      event.summary ||
      `Purchase order ${asText(after.reference, before.reference, event.reference_number)} was updated.`,
    statCards: [
      {
        label: "Status",
        value: titleCase(asText(after.status, metadata.status) || "Unknown"),
        helper: titleCase(asText(after.workflow_state) || "No workflow snapshot"),
      },
      {
        label: "Supplier",
        value: asText(after.supplier_name) || "Unknown",
        helper: asText(after.supplier_reference) || "No supplier reference",
      },
      {
        label: "Receipt lines",
        value: String(asNumber(metadata.received_count, receiptLines.length)),
        helper: event.event_name.includes("received") ? "Inbound line count on this audit event" : "No receipt lines on this event",
      },
      {
        label: "Order value",
        value: asText(after.total_price) || "—",
        helper: asText(after.delivery_date, after.received_date, after.approved_at) || "No operational milestone",
      },
    ],
    referenceRows: [
      { label: "Purchase order", value: asText(after.reference, before.reference, event.reference_number) || "—" },
      { label: "Supplier", value: asText(after.supplier_name) || "—" },
      { label: "Workflow state", value: titleCase(asText(after.workflow_state) || "Not supplied") },
      { label: "Issue date", value: asText(after.issue_date) || "—" },
      { label: "Delivery date", value: asText(after.delivery_date) || "—" },
      { label: "Received date", value: asText(after.received_date, metadata.goods_receipt_reference) || "—" },
    ],
    focusPoints: [
      "Check whether the supplier, order value, and lifecycle state reflect the actual procurement milestone.",
      "If this event involves receiving, confirm the receipt references and line counts before closing or escalating the order.",
      "For approval, issue, cancel, and completion events, compare before/after fields to confirm the workflow moved intentionally.",
    ],
    highlightedLines: receiptLines.slice(0, 5).map((line) => {
      const item = safeObject(line)
      return {
        title: asText(item.inventory_name) || "Receipt line",
        subtitle: `${asText(item.stock_location_name) || "No location"} • ${asText(item.goods_receipt_reference) || "No receipt reference"}`,
        trailing: `+${asText(item.quantity_received) || "0"}`,
      }
    }),
  }
}

const buildPosReview = (event: AuditEventRecord): AuditReviewModel => {
  const after = afterSnapshot(event)
  const sales = extractPosSaleEntries(event)
  const totalUnits = sales.reduce((sum, sale) => sum + sale.quantity, 0)
  return {
    domain: "pos",
    label: "POS",
    badgeClassName: "border-violet-200 bg-violet-50 text-violet-700",
    cardClassName: "border-violet-200 bg-violet-50/80",
    summary: event.summary || `POS order ${asText(after.order_number, event.reference_number)} was updated.`,
    statCards: [
      {
        label: "Order number",
        value: asText(after.order_number, event.reference_number) || "—",
        helper: titleCase(asText(after.status) || "No order status"),
      },
      {
        label: "Items",
        value: String(sales.length || asNumber(safeObject(event.metadata_json).item_count)),
        helper: `${totalUnits} unit${totalUnits === 1 ? "" : "s"} across the visible sale lines`,
      },
      {
        label: "Total amount",
        value: asText(after.total_amount, safeObject(event.metadata_json).total_amount) || "—",
        helper: titleCase(asText(after.payment_status) || "No payment status"),
      },
      {
        label: "Terminal",
        value: asText(after.terminal_name, safeObject(event.metadata_json).terminal_name) || "Unknown",
        helper: asText(after.terminal_location_name, safeObject(event.metadata_json).terminal_location_name) || "No terminal location",
      },
    ],
    referenceRows: [
      { label: "POS order", value: asText(after.order_number, event.reference_number) || "—" },
      { label: "Operator", value: asText(after.actor_name, event.actor_name, event.actor_email) || "System actor" },
      { label: "Payment status", value: titleCase(asText(after.payment_status) || "Unknown") },
      { label: "Inventory status", value: titleCase(asText(after.inventory_status) || "Unknown") },
      { label: "Terminal", value: asText(after.terminal_name) || "—" },
      { label: "Location", value: asText(after.terminal_location_name) || "—" },
    ],
    focusPoints: [
      "For paid orders, verify payment, inventory, and terminal context together because that is the accountable sales record.",
      "If line quantities or totals look wrong, inspect the sale lines and compare against the raw order payload in the trace tab.",
      "Use terminal and location data to isolate whether the issue belongs to one cashier, one branch, or the broader POS flow.",
    ],
    highlightedLines: sales.slice(0, 6).map((sale: PosSaleEntry) => ({
      title: sale.productName,
      subtitle: `${sale.variantName || "Base product"} • ${sale.terminalName || sale.terminalLocationName || "No terminal"} • ${sale.actorName}`,
      trailing: `${sale.quantity} sold`,
    })),
  }
}

const buildIdentityReview = (event: AuditEventRecord): AuditReviewModel => {
  const metadata = safeObject(event.metadata_json)
  const permissionDiff = getPermissionDiff(event)
  const groupDiff = getGroupDiff(event)
  const affectedUsers = Array.isArray(metadata.affected_users) ? metadata.affected_users : []
  const affectedUserIds = Array.isArray(metadata.affected_user_ids) ? metadata.affected_user_ids : []
  const userNames = affectedUsers
    .map((item) => safeObject(item))
    .map((item) => asText(item.user_name, item.user_email))
    .filter(Boolean)
  return {
    domain: "identity",
    label: "Access control",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-800",
    cardClassName: "border-amber-200 bg-amber-50/80",
    summary: event.summary || `Access-control event recorded for ${event.target_label || titleCase(event.target_type) || "a workspace identity object"}.`,
    statCards: [
      {
        label: "Granted",
        value: String(permissionDiff.granted.length),
        helper: permissionDiff.granted.join(", ") || "No permissions added",
      },
      {
        label: "Revoked",
        value: String(permissionDiff.revoked.length),
        helper: permissionDiff.revoked.join(", ") || "No permissions removed",
      },
      {
        label: "Groups added",
        value: String(groupDiff.added.length),
        helper: groupDiff.added.join(", ") || "No group additions",
      },
      {
        label: "People impacted",
        value: String(userNames.length || affectedUserIds.length),
        helper: userNames.slice(0, 3).join(", ") || asText(metadata.user_name, event.target_label) || "No user snapshot",
      },
    ],
    referenceRows: [
      { label: "Target", value: event.target_label || titleCase(event.target_type) || "—" },
      { label: "Workspace", value: asText(metadata.workspace_name, event.workspace_id) || "—" },
      { label: "Role", value: asText(metadata.role_name, metadata.role) || "—" },
      { label: "Group", value: asText(metadata.group_name) || "—" },
      { label: "User", value: asText(metadata.user_name, metadata.user_email) || "—" },
    ],
    focusPoints: [
      "Review who initiated the change and which user, role, or group absorbed the new access scope.",
      "Confirm that granted permissions align with the intended least-privilege design before treating the event as safe.",
      "If many users were affected indirectly through a role or group, use the trace tab to validate the full impacted set.",
    ],
    highlightedLines: [
      ...permissionDiff.granted.slice(0, 4).map((permission) => ({
        title: "Granted permission",
        subtitle: permission,
        trailing: "added",
      })),
      ...permissionDiff.revoked.slice(0, 4).map((permission) => ({
        title: "Revoked permission",
        subtitle: permission,
        trailing: "removed",
      })),
      ...userNames.slice(0, 4).map((name) => ({
        title: "Affected user",
        subtitle: name,
        trailing: "impacted",
      })),
    ],
  }
}

const buildSupportAccessReview = (event: AuditEventRecord): AuditReviewModel => {
  const metadata = safeObject(event.metadata_json)
  const payload = safeObject(event.changes_json)
  const after = afterSnapshot(event)
  const grant = safeObject(after.grant)
  return {
    domain: "support_access",
    label: "Support access",
    badgeClassName: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
    cardClassName: "border-fuchsia-200 bg-fuchsia-50/80",
    summary: event.summary || `Temporary support-access event recorded for ${asText(after.grantee_email, after.grantee_name)}.`,
    statCards: [
      {
        label: "Status",
        value: titleCase(asText(after.status, grant.status) || "Unknown"),
        helper: titleCase(asText(after.permission_mode, metadata.permission_mode) || "No permission mode"),
      },
      {
        label: "Grantee",
        value: asText(after.grantee_email, after.grantee_name) || "Unknown",
        helper: asText(after.grantee_name) || "No full name snapshot",
      },
      {
        label: "Membership role",
        value: titleCase(asText(after.membership_role, metadata.membership_role) || "None"),
        helper: asText(after.ticket_reference, event.reference_number) || "No ticket reference",
      },
      {
        label: "Effective permissions",
        value: String(asTextArray(after.effective_permissions).length || asTextArray(metadata.effective_permissions).length),
        helper: "Temporary access scope on this grant",
      },
    ],
    referenceRows: [
      { label: "Ticket", value: asText(after.ticket_reference, event.reference_number) || "—" },
      { label: "Workspace", value: asText(safeObject(after.profile).display_name, event.workspace_id) || "—" },
      { label: "Starts", value: asText(after.starts_at, grant.starts_at) || "—" },
      { label: "Expires", value: asText(after.expires_at, grant.expires_at) || "—" },
      { label: "Invitation code", value: asText(after.invitation_code, grant.invitation_code) || "—" },
    ],
    focusPoints: [
      "Support access should stay temporary and explicitly scoped, so confirm the expiry and effective permissions.",
      "For activation, revoke, and expiry events, verify that the user session state matches the grant state.",
      "Use the grant ticket and workspace snapshot to correlate this event with the support case that triggered it.",
    ],
    highlightedLines: asTextArray(after.effective_permissions)
      .slice(0, 6)
      .map((permission) => ({
        title: "Effective permission",
        subtitle: permission,
        trailing: "temporary",
      })),
  }
}

const buildCatalogReview = (event: AuditEventRecord): AuditReviewModel => {
  const after = afterSnapshot(event)
  const before = beforeSnapshot(event)
  return {
    domain: "catalog",
    label: "Catalog",
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
    cardClassName: "border-sky-200 bg-sky-50/80",
    summary: event.summary || `Catalog record ${event.target_label || "unknown"} changed.`,
    statCards: [
      {
        label: "Record",
        value: event.target_label || titleCase(event.target_type) || "Unknown",
        helper: titleCase(event.action || event.event_name),
      },
      {
        label: "SKU",
        value: asText(event.entity_sku, after.variant_sku, after.inventory_sku) || "—",
        helper: asText(event.entity_barcode, after.variant_barcode, after.inventory_barcode) || "No barcode",
      },
      {
        label: "Category",
        value: asText(after.category_name, before.category_name) || "Unknown",
        helper: asText(after.variant_name, before.variant_name) || "No variant snapshot",
      },
      {
        label: "Fields touched",
        value: String(Object.keys(safeObject(event.changes_json)).length),
        helper: "Structured payload keys on this event",
      },
    ],
    referenceRows: [
      { label: "Product", value: asText(after.product_name, before.product_name, event.target_label) || "—" },
      { label: "Variant", value: asText(after.variant_name, before.variant_name) || "—" },
      { label: "SKU", value: asText(event.entity_sku, after.variant_sku, after.inventory_sku) || "—" },
      { label: "Barcode", value: asText(event.entity_barcode, after.variant_barcode, after.inventory_barcode) || "—" },
    ],
    focusPoints: [
      "Confirm the correct catalog object was changed using SKU, barcode, and target label together.",
      "If this change affects sellable or purchasable products, inspect the downstream POS or inventory activity for side effects.",
      "Use the changes tab to confirm that pricing, names, categories, or media were updated intentionally.",
    ],
    highlightedLines: [],
  }
}

const buildInventoryReview = (event: AuditEventRecord): AuditReviewModel => ({
  domain: "inventory",
  label: "Inventory",
  badgeClassName: "border-lime-200 bg-lime-50 text-lime-700",
  cardClassName: "border-lime-200 bg-lime-50/80",
  summary: event.summary || `Inventory event recorded for ${event.target_label || titleCase(event.target_type) || "an inventory record"}.`,
  statCards: [
    {
      label: "Reference",
      value: event.reference_number || event.entity_sku || "—",
      helper: event.entity_barcode || "No barcode",
    },
    {
      label: "Location",
      value: event.location_id || "Unknown",
      helper: titleCase(event.feature_area || "inventory"),
    },
  ],
  referenceRows: [
    { label: "Target", value: event.target_label || titleCase(event.target_type) || "—" },
    { label: "Reference", value: event.reference_number || "—" },
    { label: "Location", value: event.location_id || "—" },
  ],
  focusPoints: [
    "Review stock movement, quantity, and location together before drawing conclusions from the event.",
    "If the event looks unexpected, correlate it with nearby purchase, POS, or adjustment events by reference and timestamp.",
  ],
  highlightedLines: [],
})

const buildGenericReview = (event: AuditEventRecord): AuditReviewModel => ({
  domain: "generic",
  label: "General audit",
  badgeClassName: "border-slate-200 bg-slate-100 text-slate-700",
  cardClassName: "border-slate-200 bg-slate-50/90",
  summary: event.summary || `${titleCase(event.event_name)} was recorded.`,
  statCards: [
    {
      label: "Service",
      value: event.source_service || "Unknown",
      helper: titleCase(event.feature_area || "No feature area"),
    },
    {
      label: "Reference",
      value: event.reference_number || "—",
      helper: event.entity_barcode || event.entity_sku || "No item trace",
    },
  ],
  referenceRows: [
    { label: "Event", value: titleCase(event.event_name) || "—" },
    { label: "Actor", value: event.actor_name || event.actor_email || "System actor" },
    { label: "Target", value: event.target_label || titleCase(event.target_type) || "—" },
  ],
  focusPoints: [
    "Start with actor, target, and reference to verify the right object was touched.",
    "Use the changes tab if data moved, and the trace tab only when you need lower-level machine context.",
  ],
  highlightedLines: [],
})

export const getAuditReviewModel = (event: AuditEventRecord): AuditReviewModel => {
  if (event.event_name.startsWith("goods_receipt.line.")) {
    return buildGoodsReceiptLineReview(event)
  }
  if (event.event_name.startsWith("goods_receipt.")) {
    return buildGoodsReceiptReview(event)
  }
  if (event.event_name.startsWith("purchase_order.")) {
    return buildPurchaseOrderReview(event)
  }
  if (event.event_name.startsWith("pos.")) {
    return buildPosReview(event)
  }
  if (event.event_name.startsWith("identity.")) {
    return buildIdentityReview(event)
  }
  if (event.event_name.startsWith("support_access.")) {
    return buildSupportAccessReview(event)
  }
  if (event.event_name.startsWith("catalog.") || event.event_name.startsWith("product.")) {
    return buildCatalogReview(event)
  }
  if (event.event_name.startsWith("inventory.") || event.event_name.startsWith("stock.")) {
    return buildInventoryReview(event)
  }
  return buildGenericReview(event)
}

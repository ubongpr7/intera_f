import type { AuditEventRecord } from "@/redux/features/audit/auditTypes"

const PRODUCT_BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_PRODUCT_BACKEND_URL || "http://localhost:7003").replace(/\/+$/, "")

export type PosSaleEntry = {
  id: string
  eventId: string
  orderNumber: string
  occurredAt: string
  actorName: string
  terminalName: string
  terminalLocationName: string
  structuralLocationId: string
  productName: string
  variantName: string
  sku: string
  barcode: string
  imageUrl: string
  quantity: number
  isRealtime: boolean
}

export type GoodsReceiptEntry = {
  id: string
  eventId: string
  goodsReceiptReference: string
  purchaseOrderReference: string
  occurredAt: string
  actorName: string
  inventoryName: string
  sku: string
  barcode: string
  imageUrl: string
  stockLocationName: string
  receivedQuantity: number
  quantityReceivedToDate: number
  remainingQuantity: number
  lotNumber: string
  isRealtime: boolean
}

export const safeObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }
  return value as Record<string, unknown>
}

const readString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }
  return ""
}

const readNumber = (...values: unknown[]) => {
  for (const value of values) {
    const numericValue = Number(value)
    if (Number.isFinite(numericValue)) {
      return numericValue
    }
  }
  return 0
}

export const resolveAuditAssetUrl = (value: unknown) => {
  const raw = readString(value)
  if (!raw) {
    return ""
  }
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw
  }
  if (raw.startsWith("//")) {
    return `https:${raw}`
  }
  if (raw.startsWith("/")) {
    return `${PRODUCT_BACKEND_BASE_URL}${raw}`
  }
  return `${PRODUCT_BACKEND_BASE_URL}/${raw.replace(/^\/+/, "")}`
}

const getAfterSnapshot = (event: AuditEventRecord) => safeObject(safeObject(event.changes_json).after)

const getBeforeSnapshot = (event: AuditEventRecord) => safeObject(safeObject(event.changes_json).before)

export const getAuditEventImageUrl = (event: AuditEventRecord) => {
  const metadata = safeObject(event.metadata_json)
  const after = getAfterSnapshot(event)
  const before = getBeforeSnapshot(event)
  const afterItems = Array.isArray(after.items) ? after.items : []
  const firstItem = safeObject(afterItems[0])

  return resolveAuditAssetUrl(
    readString(
      metadata.display_image,
      metadata.image_url,
      metadata.main_image,
      metadata.file_url,
      after.display_image,
      after.image_url,
      after.main_image,
      after.file_url,
      before.display_image,
      before.image_url,
      before.main_image,
      before.file_url,
      firstItem.display_image,
      firstItem.image_url,
    ),
  )
}

export const getAuditEventProductContext = (event: AuditEventRecord) => {
  const metadata = safeObject(event.metadata_json)
  const after = getAfterSnapshot(event)
  const saleEntries = extractPosSaleEntries(event)

  if (saleEntries.length) {
    const primarySale = saleEntries[0]
    const additionalLines = saleEntries.length - 1
    return {
      title: primarySale.productName,
      subtitle: [
        primarySale.variantName || "",
        `${primarySale.quantity} sold`,
        additionalLines > 0 ? `+${additionalLines} more line${additionalLines === 1 ? "" : "s"}` : "",
      ]
        .filter(Boolean)
        .join(" • "),
    }
  }

  return {
    title: readString(
      metadata.product_name,
      after.product_name,
      metadata.display_name,
      after.display_name,
      event.target_label,
    ),
    subtitle: [
      readString(metadata.variant_name, after.variant_name),
      readString(metadata.category_name, after.category_name),
      readString(event.entity_sku) ? `SKU ${event.entity_sku}` : "",
    ]
      .filter(Boolean)
      .join(" • "),
  }
}

export const extractPosSaleEntries = (event: AuditEventRecord): PosSaleEntry[] => {
  if (event.event_name !== "pos.order.paid") {
    return []
  }

  const metadata = safeObject(event.metadata_json)
  const after = getAfterSnapshot(event)
  const items = Array.isArray(after.items) ? after.items : []

  return items
    .map((rawItem, index) => {
      const item = safeObject(rawItem)
      const productName = readString(item.product_name, metadata.product_name, event.target_label)
      if (!productName) {
        return null
      }

      return {
        id: `${event.id}:${index}:${readString(item.item_id, item.catalog_variant_id, item.inventory_item_id, productName)}`,
        eventId: event.id,
        orderNumber: readString(after.order_number, event.reference_number),
        occurredAt: event.occurred_at,
        actorName: readString(after.actor_name, event.actor_name, event.actor_email, "System actor"),
        terminalName: readString(after.terminal_name, metadata.terminal_name),
        terminalLocationName: readString(after.terminal_location_name, metadata.terminal_location_name),
        structuralLocationId: readString(after.terminal_structural_location_id, metadata.terminal_structural_location_id),
        productName,
        variantName: readString(item.variant_name),
        sku: readString(item.sku_snapshot, item.variant_sku, event.entity_sku),
        barcode: readString(item.barcode_snapshot, item.variant_barcode, event.entity_barcode),
        imageUrl: resolveAuditAssetUrl(readString(item.display_image, item.image_url)),
        quantity: readNumber(item.requested_quantity, item.ordered_quantity, item.fulfilled_quantity, item.quantity, 0),
        isRealtime: Boolean(metadata.realtime),
      }
    })
    .filter((entry): entry is PosSaleEntry => Boolean(entry))
}

export const extractGoodsReceiptEntries = (event: AuditEventRecord): GoodsReceiptEntry[] => {
  if (event.event_name !== "goods_receipt.line.received") {
    return []
  }

  const metadata = safeObject(event.metadata_json)
  const after = getAfterSnapshot(event)
  const receivedQuantity = readNumber(
    after.received_quantity,
    metadata.quantity_received,
    0,
  )

  return [
    {
      id: `${event.id}:${readString(after.goods_receipt_line_id, event.target_id, event.reference_number)}`,
      eventId: event.id,
      goodsReceiptReference: readString(after.goods_receipt_reference, metadata.goods_receipt_reference, event.reference_number),
      purchaseOrderReference: readString(after.purchase_order_reference, metadata.purchase_order_reference),
      occurredAt: event.occurred_at,
      actorName: readString(event.actor_name, event.actor_email, "System actor"),
      inventoryName: readString(after.inventory_name, metadata.inventory_name, event.target_label),
      sku: readString(after.inventory_sku, metadata.inventory_sku, event.entity_sku),
      barcode: readString(after.inventory_barcode, metadata.inventory_barcode, event.entity_barcode),
      imageUrl: resolveAuditAssetUrl(readString(after.display_image, after.image_url, metadata.display_image, metadata.image_url)),
      stockLocationName: readString(after.stock_location_name, metadata.stock_location_name),
      receivedQuantity,
      quantityReceivedToDate: readNumber(after.quantity_received_to_date, metadata.quantity_received_to_date, receivedQuantity),
      remainingQuantity: readNumber(after.remaining_quantity, metadata.remaining_quantity),
      lotNumber: readString(after.lot_number, metadata.lot_number),
      isRealtime: Boolean(metadata.realtime),
    },
  ].filter((entry) => Boolean(entry.inventoryName))
}

"use client"

import Link from "next/link"
import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { toast } from "react-toastify"
import { ArrowDownToLine, ArrowUpRight, Building2, Layers3, LockKeyhole, MapPin, MoveRight, ReceiptText, ScanLine, ShieldCheck, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { extractErrorMessage, formatDate } from "@/lib/utils"
import {
  useCompletePurchaseOrderMutation,
  useCompleteSalesOrderMutation,
  useGetPurchaseOrderQuery,
  useGetSalesOrderQuery,
  useListGoodsReceiptsQuery,
  useListPurchaseOrdersQuery,
  useListSalesOrderShipmentsQuery,
  useListSalesOrdersQuery,
  useReceivePurchaseOrderItemsMutation,
  useShipSalesOrderMutation,
} from "@/redux/features/orders/orderAPISlice"
import {
  PurchaseOrderStatus,
  SalesOrderStatus,
  type PurchaseOrderInterface,
  type PurchaseOrderLineItem,
  type SalesOrderInterface,
  type SalesOrderLineItem,
} from "@/redux/features/orders/orderTypes"
import {
  useFulfillReservationMutation,
  useListReservationsQuery,
  useListStockBalancesQuery,
  useListStockLotsQuery,
  useListStockMovementsQuery,
  useListStockSerialsQuery,
  useReleaseReservationMutation,
} from "@/redux/features/stock/stockAPISlice"
import type { StockLocationSummary, StockMovement, StockReservation } from "@/redux/features/stock/stockTypes"

type NamedOption = {
  id: string | number
  name: string
}

type InventoryOperationalInsightsProps = {
  inventoryOptions: NamedOption[]
  locationOptions: NamedOption[]
  locations: StockLocationSummary[]
}

type LocationOperationalRow = {
  id: string
  name: string
  code: string
  parentName: string
  locationTypeName: string
  operationalMode: string
  operationalTone: string
  stockCount: number
  quantityOnHand: number
  quantityReserved: number
  quantityAvailable: number
  netFlow: number
  routeCount: number
  recentMovementAt?: string | null
  physicalAddress?: string | null
}

type ReservationActionEntry = {
  quantity: string
  notes: string
}

type ReceiptWorkbenchEntry = {
  quantity_received: string
  location_id: string
  lot_number: string
  manufactured_date: string
  expiry_date: string
  notes: string
}

type ShipmentWorkbenchEntry = {
  quantity: string
  location_id: string
  notes: string
}

type ShipmentWorkbenchReservationEntry = {
  quantity: string
  notes: string
}

type ShipmentWorkbenchMeta = {
  shipment_date: string
  delivery_date: string
  tracking_number: string
  invoice_number: string
  link: string
  notes: string
}

type FlowEvent = {
  key: string
  locationId: string
  locationName: string
  referenceType: string
  referenceId: string
  occurredAt?: string | null
  totalQuantity: number
  itemCount: number
  itemLabels: string[]
  lotCount: number
  serialCount: number
  movementCount: number
  note: string
}

const OPEN_RESERVATION_STATUSES = new Set(["active", "partially_fulfilled"])

const quantityFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
})

const reservationStatusOptions = [
  { value: "open", label: "Open reservations" },
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active only" },
  { value: "partially_fulfilled", label: "Partially fulfilled" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "released", label: "Released" },
]

const ledgerMovementOptions = [
  { value: "all", label: "All movement types" },
  { value: "receipt", label: "Receipts" },
  { value: "issue", label: "Issues" },
  { value: "transfer", label: "Transfers" },
  { value: "reservation", label: "Reservations" },
  { value: "release", label: "Releases" },
  { value: "adjustment", label: "Adjustments" },
  { value: "return_in", label: "Return in" },
  { value: "return_out", label: "Return out" },
]

const toNumber = (value: string | number | null | undefined) => {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatQuantity = (value: string | number | null | undefined) => quantityFormatter.format(toNumber(value))

const formatSignedQuantity = (value: number) => {
  const normalized = quantityFormatter.format(Math.abs(value))
  if (value > 0) {
    return `+${normalized}`
  }
  if (value < 0) {
    return `-${normalized}`
  }
  return normalized
}

const formatReferenceType = (value?: string | null) =>
  String(value || "unscoped")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

const truncateReferenceId = (value?: string | null) => {
  const reference = String(value || "").trim()
  if (!reference) {
    return "No reference"
  }
  return reference.length > 12 ? `${reference.slice(0, 12)}...` : reference
}

const buildFlowEvents = (rows: StockMovement[], direction: "inbound" | "outbound"): FlowEvent[] => {
  const grouped = new Map<
    string,
    {
      locationId: string
      locationName: string
      referenceType: string
      referenceId: string
      occurredAt?: string | null
      totalQuantity: number
      itemIds: Set<string>
      itemLabels: Set<string>
      lotKeys: Set<string>
      serialKeys: Set<string>
      movementCount: number
      note: string
    }
  >()

  for (const row of rows) {
    const locationId = String(
      direction === "inbound"
        ? row.to_location_id || ""
        : row.from_location_id || row.to_location_id || "",
    )
    const locationName =
      direction === "inbound"
        ? row.to_location_name || "Unknown destination"
        : row.from_location_name || row.to_location_name || "Unknown source"
    const referenceType = String(row.reference_type || "unscoped")
    const referenceId = String(row.reference_id || row.id)
    const groupKey = `${referenceType}::${referenceId}::${locationId || locationName}`
    const current =
      grouped.get(groupKey) ||
      {
        locationId,
        locationName,
        referenceType,
        referenceId,
        occurredAt: row.occurred_at,
        totalQuantity: 0,
        itemIds: new Set<string>(),
        itemLabels: new Set<string>(),
        lotKeys: new Set<string>(),
        serialKeys: new Set<string>(),
        movementCount: 0,
        note: row.notes || "",
      }

    current.totalQuantity += toNumber(row.quantity)
    current.movementCount += 1
    if (row.inventory_item) {
      current.itemIds.add(String(row.inventory_item))
    } else if (row.inventory_item_name) {
      current.itemIds.add(String(row.inventory_item_name))
    }
    if (row.inventory_item_name) {
      current.itemLabels.add(String(row.inventory_item_name))
    }
    if (row.lot_number) {
      current.lotKeys.add(String(row.lot_number))
    }
    if (row.serial_number) {
      current.serialKeys.add(String(row.serial_number))
    }
    if (!current.note && row.notes) {
      current.note = row.notes
    }
    if (row.occurred_at && (!current.occurredAt || row.occurred_at > current.occurredAt)) {
      current.occurredAt = row.occurred_at
    }

    grouped.set(groupKey, current)
  }

  return Array.from(grouped.entries())
    .map(([key, value]) => ({
      key,
      locationId: value.locationId,
      locationName: value.locationName,
      referenceType: value.referenceType,
      referenceId: value.referenceId,
      occurredAt: value.occurredAt,
      totalQuantity: value.totalQuantity,
      itemCount: value.itemIds.size,
      itemLabels: Array.from(value.itemLabels).slice(0, 3),
      lotCount: value.lotKeys.size,
      serialCount: value.serialKeys.size,
      movementCount: value.movementCount,
      note: value.note,
    }))
    .sort((left, right) => String(right.occurredAt || "").localeCompare(String(left.occurredAt || "")))
}

const formatStatusLabel = (value?: string | null) =>
  String(value || "unknown")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

const formatUserDetails = (value?: { first_name?: string; last_name?: string; email?: string } | null, fallback = "Unknown user") => {
  const fullName = [value?.first_name, value?.last_name].filter(Boolean).join(" ").trim()
  return fullName || value?.email || fallback
}

const buildReservationActionEntry = (reservation: StockReservation): ReservationActionEntry => ({
  quantity: String(Math.max(toNumber(reservation.remaining_quantity), 0)),
  notes: "",
})

const buildReceiptWorkbenchEntry = (lineItem: PurchaseOrderLineItem): ReceiptWorkbenchEntry => ({
  quantity_received: String(Math.max(toNumber(lineItem.quantity) - toNumber(lineItem.quantity_received), 0)),
  location_id: "",
  lot_number: lineItem.batch_number || "",
  manufactured_date: lineItem.manufactured_date || "",
  expiry_date: lineItem.expiry_date || "",
  notes: "",
})

const buildShipmentWorkbenchEntry = (lineItem: SalesOrderLineItem): ShipmentWorkbenchEntry => ({
  quantity: String(Math.max(toNumber(lineItem.remaining_quantity), 0)),
  location_id: "",
  notes: "",
})

const buildShipmentWorkbenchReservationEntry = (reservation: StockReservation): ShipmentWorkbenchReservationEntry => ({
  quantity: String(
    Math.max(
      toNumber(reservation.remaining_quantity ?? toNumber(reservation.reserved_quantity) - toNumber(reservation.fulfilled_quantity)),
      0,
    ),
  ),
  notes: "",
})

const emptyShipmentWorkbenchMeta: ShipmentWorkbenchMeta = {
  shipment_date: "",
  delivery_date: "",
  tracking_number: "",
  invoice_number: "",
  link: "",
  notes: "",
}

const getLocationMode = (location: StockLocationSummary) => {
  if (location.structural) {
    return {
      label: "Structural",
      tone: "border-indigo-200 bg-indigo-50 text-indigo-800",
    }
  }
  if (location.external) {
    return {
      label: "External",
      tone: "border-amber-200 bg-amber-50 text-amber-900",
    }
  }
  return {
    label: "Operational",
    tone: "border-green-200 bg-green-50 text-green-800",
  }
}

const getStatusTone = (value?: string | null) => {
  const normalized = String(value || "").toLowerCase()
  if (["active", "available", "open", "completed", "fulfilled", "received"].includes(normalized)) {
    return "border-green-200 bg-green-50 text-green-800"
  }
  if (["in_progress", "shipped"].includes(normalized)) {
    return "border-blue-200 bg-blue-50 text-blue-800"
  }
  if (["reserved", "quarantined", "attention_needed", "expiring", "partially_fulfilled"].includes(normalized)) {
    return "border-amber-200 bg-amber-50 text-amber-900"
  }
  if (["pending", "issued", "partially_received"].includes(normalized)) {
    return "border-orange-200 bg-orange-50 text-orange-900"
  }
  if (["damaged", "destroyed", "rejected", "lost", "depleted", "archived"].includes(normalized)) {
    return "border-red-200 bg-red-50 text-red-800"
  }
  return "border-gray-200 bg-gray-50 text-gray-700"
}

const renderEmpty = (message: string) => (
  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-sm text-gray-600">
    {message}
  </div>
)

const buildReservationRoute = (reservation: StockReservation) => {
  if (reservation.external_order_type === "sales_order_line" && reservation.external_order_id) {
    return `/order/sales/${reservation.external_order_id}`
  }
  return null
}

export default function InventoryOperationalInsights({
  inventoryOptions,
  locationOptions,
  locations,
}: InventoryOperationalInsightsProps) {
  const [search, setSearch] = useState("")
  const [inventoryItemId, setInventoryItemId] = useState("all")
  const [locationId, setLocationId] = useState("all")
  const [reservationStatus, setReservationStatus] = useState("open")
  const [ledgerMovementType, setLedgerMovementType] = useState("all")
  const [selectedReceivingOrderId, setSelectedReceivingOrderId] = useState<string | null>(null)
  const [selectedShippingOrderId, setSelectedShippingOrderId] = useState<string | null>(null)
  const [reservationActionEntries, setReservationActionEntries] = useState<Record<string, ReservationActionEntry>>({})
  const [receiptWorkbenchEntries, setReceiptWorkbenchEntries] = useState<Record<string, ReceiptWorkbenchEntry>>({})
  const [shipmentWorkbenchEntries, setShipmentWorkbenchEntries] = useState<Record<string, ShipmentWorkbenchEntry>>({})
  const [shipmentWorkbenchReservationEntries, setShipmentWorkbenchReservationEntries] = useState<Record<string, ShipmentWorkbenchReservationEntry>>({})
  const [shipmentWorkbenchMeta, setShipmentWorkbenchMeta] = useState<ShipmentWorkbenchMeta>(emptyShipmentWorkbenchMeta)
  const [activeReservationAction, setActiveReservationAction] = useState<{
    reservationId: string
    type: "release" | "fulfill"
  } | null>(null)
  const deferredSearch = useDeferredValue(search.trim())

  const sharedInventoryFilter = inventoryItemId === "all" ? undefined : inventoryItemId
  const sharedLocationFilter = locationId === "all" ? undefined : locationId

  const balanceQuery = useMemo(
    () => ({
      search: deferredSearch || undefined,
      inventory_item: sharedInventoryFilter,
      stock_location: sharedLocationFilter,
      ordering: "stock_location__name",
    }),
    [deferredSearch, sharedInventoryFilter, sharedLocationFilter],
  )

  const lotQuery = useMemo(
    () => ({
      search: deferredSearch || undefined,
      inventory_item: sharedInventoryFilter,
      ordering: "expiry_date",
    }),
    [deferredSearch, sharedInventoryFilter],
  )

  const serialQuery = useMemo(
    () => ({
      search: deferredSearch || undefined,
      inventory_item: sharedInventoryFilter,
      stock_location: sharedLocationFilter,
      ordering: "serial_number",
    }),
    [deferredSearch, sharedInventoryFilter, sharedLocationFilter],
  )

  const movementQuery = useMemo(
    () => ({
      search: deferredSearch || undefined,
      inventory_item: sharedInventoryFilter,
      stock_location: sharedLocationFilter,
      ordering: "-occurred_at",
    }),
    [deferredSearch, sharedInventoryFilter, sharedLocationFilter],
  )

  const reservationQuery = useMemo(
    () => ({
      inventory_item: sharedInventoryFilter,
      stock_location: sharedLocationFilter,
    }),
    [sharedInventoryFilter, sharedLocationFilter],
  )

  const goodsReceiptQuery = useMemo(
    () => ({
      search: deferredSearch || undefined,
      inventory_item: sharedInventoryFilter,
      stock_location: sharedLocationFilter,
      ordering: "-received_at",
    }),
    [deferredSearch, sharedInventoryFilter, sharedLocationFilter],
  )

  const shipmentQuery = useMemo(
    () => ({
      search: deferredSearch || undefined,
      inventory_item: sharedInventoryFilter,
      stock_location: sharedLocationFilter,
      ordering: "-shipment_date",
    }),
    [deferredSearch, sharedInventoryFilter, sharedLocationFilter],
  )

  const purchaseOrderQuery = useMemo(
    () => ({
      status_filter: "active",
      search: deferredSearch || undefined,
      ordering: "-created_at",
    }),
    [deferredSearch],
  )

  const salesOrderQuery = useMemo(
    () => ({
      search: deferredSearch || undefined,
      ordering: "-created_at",
    }),
    [deferredSearch],
  )

  const { data: balances = [], isLoading: loadingBalances, refetch: refetchBalances } = useListStockBalancesQuery(balanceQuery)
  const { data: lots = [], isLoading: loadingLots, refetch: refetchLots } = useListStockLotsQuery(lotQuery)
  const { data: serials = [], isLoading: loadingSerials, refetch: refetchSerials } = useListStockSerialsQuery(serialQuery)
  const { data: movements = [], isLoading: loadingMovements, refetch: refetchMovements } = useListStockMovementsQuery(movementQuery)
  const { data: goodsReceipts = [], isLoading: loadingGoodsReceipts, refetch: refetchGoodsReceipts } = useListGoodsReceiptsQuery(goodsReceiptQuery)
  const { data: shipments = [], isLoading: loadingShipments, refetch: refetchShipments } = useListSalesOrderShipmentsQuery(shipmentQuery)
  const { data: purchaseOrders = [], isLoading: loadingPurchaseOrders, refetch: refetchPurchaseOrders } = useListPurchaseOrdersQuery(purchaseOrderQuery)
  const { data: salesOrders = [], isLoading: loadingSalesOrders, refetch: refetchSalesOrders } = useListSalesOrdersQuery(salesOrderQuery)
  const {
    data: reservations = [],
    isLoading: loadingReservations,
    refetch: refetchReservations,
  } = useListReservationsQuery(reservationQuery)
  const {
    data: selectedReceivingOrder,
    isLoading: loadingSelectedReceivingOrder,
    refetch: refetchSelectedReceivingOrder,
  } = useGetPurchaseOrderQuery(selectedReceivingOrderId || "", {
    skip: !selectedReceivingOrderId,
  })
  const {
    data: selectedShippingOrder,
    isLoading: loadingSelectedShippingOrder,
    refetch: refetchSelectedShippingOrder,
  } = useGetSalesOrderQuery(selectedShippingOrderId || "", {
    skip: !selectedShippingOrderId,
  })
  const {
    data: selectedShippingReservations = [],
    isLoading: loadingSelectedShippingReservations,
    refetch: refetchSelectedShippingReservations,
  } = useListReservationsQuery(
    {
      external_order_type: "sales_order_line",
      external_order_id: selectedShippingOrderId || "",
    },
    {
      skip: !selectedShippingOrderId,
    },
  )
  const [releaseReservation, { isLoading: releasingReservation }] = useReleaseReservationMutation()
  const [fulfillReservation, { isLoading: fulfillingReservation }] = useFulfillReservationMutation()
  const [receivePurchaseOrderItems, { isLoading: receivingItems }] = useReceivePurchaseOrderItemsMutation()
  const [completePurchaseOrder, { isLoading: completingPurchaseOrder }] = useCompletePurchaseOrderMutation()
  const [shipSalesOrder, { isLoading: shippingOrder }] = useShipSalesOrderMutation()
  const [completeSalesOrder, { isLoading: completingSalesOrder }] = useCompleteSalesOrderMutation()

  useEffect(() => {
    setReservationActionEntries((current) => {
      let changed = false
      const next = { ...current }
      for (const reservation of reservations) {
        if (!next[String(reservation.id)]) {
          next[String(reservation.id)] = buildReservationActionEntry(reservation)
          changed = true
        }
      }
      return changed ? next : current
    })
  }, [reservations])

  const activeBalanceCount = balances.filter((row) => toNumber(row.quantity_available) > 0).length
  const trackedLotCount = lots.length
  const activeSerialCount = serials.filter((row) => row.status === "available").length
  const openReservationRows = reservations.filter((reservation) => OPEN_RESERVATION_STATUSES.has(String(reservation.status)))
  const openReservationCount = openReservationRows.length
  const committedLocationCount = new Set(openReservationRows.map((row) => String(row.stock_location || ""))).size
  const receiptMovements = movements.filter((row) => row.movement_type === "receipt")
  const issueMovements = movements.filter((row) => row.movement_type === "issue")
  const receiptEvents = buildFlowEvents(receiptMovements, "inbound")
  const shipmentEvents = buildFlowEvents(issueMovements, "outbound")
  const receiptQuantity = receiptMovements.reduce((sum, row) => sum + toNumber(row.quantity), 0)
  const issueQuantity = issueMovements.reduce((sum, row) => sum + toNumber(row.quantity), 0)
  const receiptLocationCount = new Set(
    receiptMovements
      .map((row) => String(row.to_location_id || ""))
      .filter(Boolean),
  ).size
  const issueLocationCount = new Set(
    issueMovements
      .map((row) => String(row.from_location_id || row.to_location_id || ""))
      .filter(Boolean),
  ).size
  const inboundAttentionOrders = purchaseOrders.filter((order) =>
    [PurchaseOrderStatus.issued, PurchaseOrderStatus.partially_received, PurchaseOrderStatus.received].includes(order.status as never),
  )
  const outboundAttentionOrders = salesOrders.filter((order) =>
    [SalesOrderStatus.pending, SalesOrderStatus.in_progress, SalesOrderStatus.shipped].includes(order.status as never),
  )
  const pendingInboundOrders = inboundAttentionOrders.filter((order) =>
    [PurchaseOrderStatus.issued, PurchaseOrderStatus.partially_received].includes(order.status as never),
  )
  const readyToCloseInboundOrders = inboundAttentionOrders.filter((order) => order.status === PurchaseOrderStatus.received)
  const pendingOutboundOrders = outboundAttentionOrders.filter((order) =>
    [SalesOrderStatus.pending, SalesOrderStatus.in_progress].includes(order.status as never),
  )
  const readyToCloseOutboundOrders = outboundAttentionOrders.filter((order) => order.status === SalesOrderStatus.shipped)
  const goodsReceiptCount = goodsReceipts.length
  const goodsReceiptTotalQuantity = goodsReceipts.reduce((sum, receipt) => sum + toNumber(receipt.total_quantity), 0)
  const goodsReceiptSupplierCount = new Set(goodsReceipts.map((receipt) => String(receipt.supplier || receipt.supplier_name || "")).filter(Boolean)).size
  const goodsReceiptPurchaseOrderCount = new Set(goodsReceipts.map((receipt) => String(receipt.purchase_order || "")).filter(Boolean)).size
  const shipmentCount = shipments.length
  const shipmentTotalQuantity = shipments.reduce((sum, shipment) => sum + toNumber(shipment.total_quantity), 0)
  const shipmentOrderCount = new Set(shipments.map((shipment) => String(shipment.order || "")).filter(Boolean)).size
  const trackedShipmentCount = shipments.filter((shipment) => shipment.tracking_number || shipment.invoice_number).length
  const shipmentCustomerCount = new Set(shipments.map((shipment) => String(shipment.customer_name || "")).filter(Boolean)).size

  const receiptHistoryByOrder = useMemo(() => {
    const grouped = new Map<string, typeof goodsReceipts>()
    for (const receipt of goodsReceipts) {
      const orderKey = String(receipt.purchase_order || "")
      if (!orderKey) {
        continue
      }
      const current = grouped.get(orderKey) || []
      current.push(receipt)
      grouped.set(orderKey, current)
    }
    return grouped
  }, [goodsReceipts])

  const receiptAttentionRows = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10)

    return pendingInboundOrders
      .map((order) => {
        const receiptsForOrder = receiptHistoryByOrder.get(String(order.id)) || []
        const lastReceiptAt =
          receiptsForOrder
            .map((receipt) => String(receipt.received_at || ""))
            .filter(Boolean)
            .sort((left, right) => right.localeCompare(left))[0] || null
        const hasReceipts = receiptsForOrder.length > 0
        const isPartial = order.status === PurchaseOrderStatus.partially_received
        const isOverdue = Boolean(order.delivery_date && String(order.delivery_date) < todayKey)

        let exceptionLabel = "Receipt activity in progress"
        let exceptionTone = "border-blue-200 bg-blue-50 text-blue-800"
        let priority = 0
        let exceptionCode = "in_progress"

        if (isOverdue && !hasReceipts) {
          exceptionLabel = "Overdue without receipt"
          exceptionTone = "border-red-200 bg-red-50 text-red-800"
          priority = 4
          exceptionCode = "overdue_without_receipt"
        } else if (isOverdue && isPartial) {
          exceptionLabel = "Overdue partial receipt"
          exceptionTone = "border-red-200 bg-red-50 text-red-800"
          priority = 3
          exceptionCode = "overdue_partial_receipt"
        } else if (!hasReceipts) {
          exceptionLabel = "Awaiting first receipt"
          exceptionTone = "border-amber-200 bg-amber-50 text-amber-900"
          priority = 2
          exceptionCode = "awaiting_first_receipt"
        } else if (isPartial) {
          exceptionLabel = "Partial receipt follow-up"
          exceptionTone = "border-blue-200 bg-blue-50 text-blue-800"
          priority = 1
          exceptionCode = "partial_receipt_follow_up"
        }

        return {
          ...order,
          receiptCount: receiptsForOrder.length,
          lastReceiptAt,
          exceptionLabel,
          exceptionTone,
          exceptionCode,
          priority,
        }
      })
      .sort(
        (left, right) =>
          right.priority - left.priority ||
          String(right.delivery_date || "").localeCompare(String(left.delivery_date || "")) ||
          String(right.created_at || "").localeCompare(String(left.created_at || "")),
      )
  }, [pendingInboundOrders, receiptHistoryByOrder])

  const awaitingFirstReceiptCount = receiptAttentionRows.filter((row) => row.exceptionCode === "awaiting_first_receipt").length
  const partialReceiptFollowUpCount = receiptAttentionRows.filter((row) =>
    ["partial_receipt_follow_up", "overdue_partial_receipt"].includes(row.exceptionCode),
  ).length
  const overdueReceivingCount = receiptAttentionRows.filter((row) =>
    ["overdue_without_receipt", "overdue_partial_receipt"].includes(row.exceptionCode),
  ).length
  const receiptWorkbenchCandidates = useMemo(() => {
    const next = new Map<string, PurchaseOrderInterface>()
    for (const order of [...receiptAttentionRows, ...readyToCloseInboundOrders]) {
      next.set(String(order.id), order)
    }
    return Array.from(next.values())
  }, [receiptAttentionRows, readyToCloseInboundOrders])
  const shipmentWorkbenchCandidates = useMemo(() => {
    const next = new Map<string, SalesOrderInterface>()
    for (const order of [...pendingOutboundOrders, ...readyToCloseOutboundOrders]) {
      next.set(String(order.id), order)
    }
    return Array.from(next.values())
  }, [pendingOutboundOrders, readyToCloseOutboundOrders])
  const receivingLineItems = useMemo(() => selectedReceivingOrder?.line_items || [], [selectedReceivingOrder])
  const shippingLineItems = useMemo(() => selectedShippingOrder?.line_items || [], [selectedShippingOrder])
  const directShipmentLineItems = useMemo(
    () =>
      shippingLineItems.filter(
        (lineItem) => toNumber(lineItem.remaining_quantity) > 0 && toNumber(lineItem.reserved_quantity) <= 0,
      ),
    [shippingLineItems],
  )

  useEffect(() => {
    if (!receiptWorkbenchCandidates.length) {
      setSelectedReceivingOrderId(null)
      return
    }
    if (!selectedReceivingOrderId || !receiptWorkbenchCandidates.some((order) => String(order.id) === selectedReceivingOrderId)) {
      setSelectedReceivingOrderId(String(receiptWorkbenchCandidates[0].id))
    }
  }, [receiptWorkbenchCandidates, selectedReceivingOrderId])

  useEffect(() => {
    if (!shipmentWorkbenchCandidates.length) {
      setSelectedShippingOrderId(null)
      return
    }
    if (!selectedShippingOrderId || !shipmentWorkbenchCandidates.some((order) => String(order.id) === selectedShippingOrderId)) {
      setSelectedShippingOrderId(String(shipmentWorkbenchCandidates[0].id))
    }
  }, [selectedShippingOrderId, shipmentWorkbenchCandidates])

  useEffect(() => {
    setReceiptWorkbenchEntries((current) => (Object.keys(current).length > 0 ? {} : current))
  }, [selectedReceivingOrderId])

  useEffect(() => {
    setShipmentWorkbenchEntries((current) => (Object.keys(current).length > 0 ? {} : current))
    setShipmentWorkbenchReservationEntries((current) => (Object.keys(current).length > 0 ? {} : current))
    setShipmentWorkbenchMeta(emptyShipmentWorkbenchMeta)
  }, [selectedShippingOrderId])

  useEffect(() => {
    setReceiptWorkbenchEntries((current) => {
      let changed = false
      const next = { ...current }
      for (const lineItem of receivingLineItems) {
        if (lineItem.id !== undefined && !next[String(lineItem.id)]) {
          next[String(lineItem.id)] = buildReceiptWorkbenchEntry(lineItem)
          changed = true
        }
      }
      return changed ? next : current
    })
  }, [receivingLineItems])

  useEffect(() => {
    setShipmentWorkbenchEntries((current) => {
      let changed = false
      const next = { ...current }
      for (const lineItem of directShipmentLineItems) {
        if (lineItem.id !== undefined && !next[String(lineItem.id)]) {
          next[String(lineItem.id)] = buildShipmentWorkbenchEntry(lineItem)
          changed = true
        }
      }
      return changed ? next : current
    })
  }, [directShipmentLineItems])

  useEffect(() => {
    setShipmentWorkbenchReservationEntries((current) => {
      let changed = false
      const next = { ...current }
      for (const reservation of selectedShippingReservations) {
        if (!next[String(reservation.id)]) {
          next[String(reservation.id)] = buildShipmentWorkbenchReservationEntry(reservation)
          changed = true
        }
      }
      return changed ? next : current
    })
  }, [selectedShippingReservations])

  const locationRows = useMemo<LocationOperationalRow[]>(() => {
    const normalizedSearch = deferredSearch.toLowerCase()
    const scopedLocations = sharedLocationFilter
      ? locations.filter((location) => String(location.id) === sharedLocationFilter)
      : locations

    return scopedLocations
      .filter((location) => {
        if (!normalizedSearch) {
          return true
        }

        const haystack = [
          location.name,
          location.code,
          location.parent_name,
          location.location_type_name,
          location.physical_address,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()

        return haystack.includes(normalizedSearch)
      })
      .map((location) => {
        const locationKey = String(location.id)
        const locationBalances = balances.filter((row) => String(row.stock_location_id ?? "") === locationKey)
        const locationMovements = movements.filter(
          (row) =>
            String(row.from_location_id ?? "") === locationKey || String(row.to_location_id ?? "") === locationKey,
        )

        const distinctInventoryItems = new Set(
          locationBalances.map((row) => row.inventory_item_id).filter((itemId): itemId is string => Boolean(itemId)),
        )

        const quantityOnHand = locationBalances.reduce((sum, row) => sum + toNumber(row.quantity_on_hand), 0)
        const quantityReserved = locationBalances.reduce((sum, row) => sum + toNumber(row.quantity_reserved), 0)
        const quantityAvailable = locationBalances.reduce((sum, row) => sum + toNumber(row.quantity_available), 0)
        const netFlow = locationMovements.reduce((sum, row) => {
          const quantity = toNumber(row.quantity)
          let next = sum
          if (String(row.to_location_id ?? "") === locationKey) {
            next += quantity
          }
          if (String(row.from_location_id ?? "") === locationKey) {
            next -= quantity
          }
          return next
        }, 0)
        const routeCount = new Set(
          locationMovements.map(
            (row) =>
              `${row.from_location_id || row.from_location_name || "unknown"}:${row.to_location_id || row.to_location_name || "unknown"}`,
          ),
        ).size
        const mode = getLocationMode(location)

        return {
          id: locationKey,
          name: location.name,
          code: location.code || "",
          parentName: location.parent_name || "No parent",
          locationTypeName: location.location_type_name || "Unclassified",
          operationalMode: mode.label,
          operationalTone: mode.tone,
          stockCount: sharedInventoryFilter ? distinctInventoryItems.size : Math.max(distinctInventoryItems.size, Number(location.stock_count ?? 0)),
          quantityOnHand,
          quantityReserved,
          quantityAvailable,
          netFlow,
          routeCount,
          recentMovementAt: locationMovements[0]?.occurred_at ?? null,
          physicalAddress: location.physical_address || null,
        }
      })
      .sort(
        (left, right) =>
          right.quantityAvailable - left.quantityAvailable ||
          right.stockCount - left.stockCount ||
          left.name.localeCompare(right.name),
      )
  }, [balances, deferredSearch, locations, movements, sharedInventoryFilter, sharedLocationFilter])

  const filteredReservations = useMemo(() => {
    const normalizedSearch = deferredSearch.toLowerCase()

    return reservations
      .filter((reservation) => {
        if (reservationStatus === "open") {
          if (!OPEN_RESERVATION_STATUSES.has(String(reservation.status))) {
            return false
          }
        } else if (reservationStatus !== "all" && reservation.status !== reservationStatus) {
          return false
        }

        if (!normalizedSearch) {
          return true
        }

        const haystack = [
          reservation.inventory_item_name,
          reservation.location_name,
          reservation.external_order_type,
          reservation.external_order_id,
          reservation.external_order_line_id,
          reservation.lot_number,
          reservation.serial_number,
          reservation.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()

        return haystack.includes(normalizedSearch)
      })
      .sort((left, right) => {
        const leftRemaining = toNumber(left.remaining_quantity)
        const rightRemaining = toNumber(right.remaining_quantity)
        if (rightRemaining !== leftRemaining) {
          return rightRemaining - leftRemaining
        }
        return String(left.location_name || "").localeCompare(String(right.location_name || ""))
      })
  }, [deferredSearch, reservationStatus, reservations])

  const filteredLedgerRows = useMemo(() => {
    if (ledgerMovementType === "all") {
      return movements
    }
    return movements.filter((row) => row.movement_type === ledgerMovementType)
  }, [ledgerMovementType, movements])

  const ledgerReferenceCount = new Set(
    filteredLedgerRows
      .map((row) => `${row.reference_type || "unscoped"}:${row.reference_id || row.id}`)
      .filter(Boolean),
  ).size
  const ledgerItemCount = new Set(
    filteredLedgerRows
      .map((row) => String(row.inventory_item || row.inventory_item_name || ""))
      .filter(Boolean),
  ).size
  const ledgerBranchCount = new Set(
    filteredLedgerRows
      .flatMap((row) => [
        String(row.from_location_id || row.from_location_name || ""),
        String(row.to_location_id || row.to_location_name || ""),
      ])
      .filter(Boolean),
  ).size
  const ledgerTotalQuantity = filteredLedgerRows.reduce((sum, row) => sum + toNumber(row.quantity), 0)

  const activeTransferLocations = locationRows.filter((row) => row.routeCount > 0).length
  const structuralLocationCount = locations.filter((location) => location.structural).length
  const externalLocationCount = locations.filter((location) => location.external).length
  const operationalLocationCount = locations.filter((location) => !location.structural && !location.external).length
  const filteredReservationRemaining = filteredReservations.reduce((sum, reservation) => sum + toNumber(reservation.remaining_quantity), 0)
  const filteredReservationCommitted = filteredReservations.reduce((sum, reservation) => sum + toNumber(reservation.reserved_quantity), 0)

  const setReservationActionField = (reservationId: string, field: keyof ReservationActionEntry, value: string) => {
    const reservation = reservations.find((entry) => String(entry.id) === reservationId)
    if (!reservation) {
      return
    }
    setReservationActionEntries((current) => ({
      ...current,
      [reservationId]: {
        ...(current[reservationId] || buildReservationActionEntry(reservation)),
        [field]: value,
      },
    }))
  }

  const setReceiptWorkbenchField = (lineItemId: string, field: keyof ReceiptWorkbenchEntry, value: string) => {
    const lineItem = receivingLineItems.find((entry) => String(entry.id) === lineItemId)
    if (!lineItem) {
      return
    }
    setReceiptWorkbenchEntries((current) => ({
      ...current,
      [lineItemId]: {
        ...(current[lineItemId] || buildReceiptWorkbenchEntry(lineItem)),
        [field]: value,
      },
    }))
  }

  const setShipmentWorkbenchField = (lineItemId: string, field: keyof ShipmentWorkbenchEntry, value: string) => {
    const lineItem = directShipmentLineItems.find((entry) => String(entry.id) === lineItemId)
    if (!lineItem) {
      return
    }
    setShipmentWorkbenchEntries((current) => ({
      ...current,
      [lineItemId]: {
        ...(current[lineItemId] || buildShipmentWorkbenchEntry(lineItem)),
        [field]: value,
      },
    }))
  }

  const setShipmentWorkbenchReservationField = (
    reservationId: string,
    field: keyof ShipmentWorkbenchReservationEntry,
    value: string,
  ) => {
    const reservation = selectedShippingReservations.find((entry) => String(entry.id) === reservationId)
    if (!reservation) {
      return
    }
    setShipmentWorkbenchReservationEntries((current) => ({
      ...current,
      [reservationId]: {
        ...(current[reservationId] || buildShipmentWorkbenchReservationEntry(reservation)),
        [field]: value,
      },
    }))
  }

  const refreshReceivingWorkbench = async () => {
    await Promise.all([
      refetchSelectedReceivingOrder(),
      refetchBalances(),
      refetchLots(),
      refetchSerials(),
      refetchMovements(),
      refetchGoodsReceipts(),
      refetchPurchaseOrders(),
    ])
  }

  const refreshShippingWorkbench = async () => {
    await Promise.all([
      refetchSelectedShippingOrder(),
      refetchSelectedShippingReservations(),
      refetchBalances(),
      refetchLots(),
      refetchSerials(),
      refetchMovements(),
      refetchShipments(),
      refetchSalesOrders(),
      refetchReservations(),
    ])
  }

  const handleReceiveWorkbench = async () => {
    if (!selectedReceivingOrder) {
      return
    }

    const received_items = receivingLineItems.flatMap((lineItem) => {
      if (lineItem.id === undefined) {
        return []
      }
      const entry = receiptWorkbenchEntries[String(lineItem.id)] || buildReceiptWorkbenchEntry(lineItem)
      const quantity = Number(entry.quantity_received || "0")
      if (quantity <= 0 || !entry.location_id) {
        return []
      }
      return [
        {
          line_item_id: lineItem.id,
          quantity_received: quantity,
          location_id: entry.location_id,
          lot_number: entry.lot_number || undefined,
          manufactured_date: entry.manufactured_date || undefined,
          expiry_date: entry.expiry_date || undefined,
          notes: entry.notes || undefined,
        },
      ]
    })

    if (!received_items.length) {
      toast.error("Enter at least one received quantity and receiving branch before posting receipt work.")
      return
    }

    try {
      await receivePurchaseOrderItems({
        id: selectedReceivingOrder.id,
        data: { received_items },
      }).unwrap()
      toast.success("Receipt work posted")
      setReceiptWorkbenchEntries({})
      await refreshReceivingWorkbench()
    } catch (error) {
      toast.error(extractErrorMessage(error, ["error", "received_items", "detail"]))
    }
  }

  const handleCompleteReceivingOrder = async () => {
    if (!selectedReceivingOrder) {
      return
    }

    try {
      await completePurchaseOrder(selectedReceivingOrder.id).unwrap()
      toast.success("Purchase order completed")
      await refreshReceivingWorkbench()
    } catch (error) {
      toast.error(extractErrorMessage(error, ["error", "detail"]))
    }
  }

  const handleShipWorkbench = async () => {
    if (!selectedShippingOrder) {
      return
    }

    const reservedShipments = selectedShippingReservations.flatMap((reservation) => {
      const entry =
        shipmentWorkbenchReservationEntries[String(reservation.id)] || buildShipmentWorkbenchReservationEntry(reservation)
      const quantity = Number(entry.quantity || "0")
      if (quantity <= 0) {
        return []
      }
      return [
        {
          reservation_id: reservation.id,
          quantity,
          notes: entry.notes || undefined,
        },
      ]
    })

    const directShipments = directShipmentLineItems.flatMap((lineItem) => {
      if (lineItem.id === undefined) {
        return []
      }
      const entry = shipmentWorkbenchEntries[String(lineItem.id)] || buildShipmentWorkbenchEntry(lineItem)
      const quantity = Number(entry.quantity || "0")
      if (quantity <= 0 || !entry.location_id) {
        return []
      }
      return [
        {
          line_item_id: lineItem.id,
          location_id: entry.location_id,
          quantity,
          notes: entry.notes || undefined,
        },
      ]
    })

    const shipment_items = [...reservedShipments, ...directShipments]
    if (!shipment_items.length) {
      toast.error("Enter reserved or direct shipment quantities before posting shipment work.")
      return
    }

    try {
      await shipSalesOrder({
        id: selectedShippingOrder.id,
        data: {
          shipment_items,
          shipment_date: shipmentWorkbenchMeta.shipment_date || undefined,
          delivery_date: shipmentWorkbenchMeta.delivery_date || undefined,
          tracking_number: shipmentWorkbenchMeta.tracking_number || undefined,
          invoice_number: shipmentWorkbenchMeta.invoice_number || undefined,
          link: shipmentWorkbenchMeta.link || undefined,
          notes: shipmentWorkbenchMeta.notes || undefined,
        },
      }).unwrap()
      toast.success("Shipment recorded")
      setShipmentWorkbenchEntries({})
      setShipmentWorkbenchReservationEntries({})
      setShipmentWorkbenchMeta(emptyShipmentWorkbenchMeta)
      await refreshShippingWorkbench()
    } catch (error) {
      toast.error(extractErrorMessage(error, ["error", "shipment_items", "detail"]))
    }
  }

  const handleCompleteShippingOrder = async () => {
    if (!selectedShippingOrder) {
      return
    }

    try {
      await completeSalesOrder(selectedShippingOrder.id).unwrap()
      toast.success("Sales order completed")
      await refreshShippingWorkbench()
    } catch (error) {
      toast.error(extractErrorMessage(error, ["error", "detail"]))
    }
  }

  const handleReservationAction = async (reservation: StockReservation, actionType: "release" | "fulfill") => {
    const reservationId = String(reservation.id)
    const entry = reservationActionEntries[reservationId] || buildReservationActionEntry(reservation)
    const quantity = Number(entry.quantity || "0")
    const remainingQuantity = toNumber(reservation.remaining_quantity)

    if (quantity <= 0) {
      toast.error(`Enter a positive quantity to ${actionType}.`)
      return
    }

    if (quantity > remainingQuantity) {
      toast.error(`Cannot ${actionType} ${formatQuantity(quantity)} when only ${formatQuantity(remainingQuantity)} remains.`)
      return
    }

    setActiveReservationAction({ reservationId, type: actionType })

    try {
      const updatedReservation =
        actionType === "release"
          ? await releaseReservation({
              id: reservation.id,
              data: {
                quantity,
                notes: entry.notes || undefined,
              },
            }).unwrap()
          : await fulfillReservation({
              id: reservation.id,
              data: {
                quantity,
                notes: entry.notes || undefined,
              },
            }).unwrap()

      setReservationActionEntries((current) => ({
        ...current,
        [reservationId]: buildReservationActionEntry(updatedReservation),
      }))
      toast.success(actionType === "release" ? "Reservation released" : "Reservation fulfilled")
      await refetchReservations()
    } catch (error) {
      toast.error(extractErrorMessage(error, ["error", "detail", "quantity", "notes"]))
    } finally {
      setActiveReservationAction(null)
    }
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-100 p-6 text-left text-inherit">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <CardTitle className="text-xl">Operational stock insight</CardTitle>
            <CardDescription className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Browse branch posture, reservations, receiving, shipment history, tracked lots, tracked serials, and stock ledger history from one place. This is the
              workspace view that lets multi-location teams compare stock and intervene in branch operations without opening one order at a time.
            </CardDescription>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Live balances</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingBalances ? "..." : activeBalanceCount}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Tracked lots</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingLots ? "..." : trackedLotCount}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Available serials</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingSerials ? "..." : activeSerialCount}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Open reservations</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingReservations ? "..." : openReservationCount}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Transfer-active locations</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingMovements ? "..." : activeTransferLocations}</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
          <div className="space-y-2">
            <Label htmlFor="inventory-operational-search">Search stock-state records</Label>
            <Input
              id="inventory-operational-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search item, location, lot, serial, or reference"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inventory-operational-item">Inventory item</Label>
            <Select value={inventoryItemId} onValueChange={setInventoryItemId}>
              <SelectTrigger id="inventory-operational-item" className="h-11">
                <SelectValue placeholder="All inventory items" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All inventory items</SelectItem>
                {inventoryOptions.map((item) => (
                  <SelectItem key={String(item.id)} value={String(item.id)}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="inventory-operational-location">Location</Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger id="inventory-operational-location" className="h-11">
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {locationOptions.map((item) => (
                  <SelectItem key={String(item.id)} value={String(item.id)}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="locations" className="w-full">
          <TabsList className="h-auto flex-wrap justify-start gap-2 rounded-2xl bg-gray-100 p-2">
            <TabsTrigger value="locations" className="rounded-xl bg-white px-4 py-2.5">
              <Building2 className="mr-2 h-4 w-4" />
              Locations
            </TabsTrigger>
            <TabsTrigger value="inbound" className="rounded-xl bg-white px-4 py-2.5">
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Inbound
            </TabsTrigger>
            <TabsTrigger value="receipts" className="rounded-xl bg-white px-4 py-2.5">
              <ReceiptText className="mr-2 h-4 w-4" />
              Receipts
            </TabsTrigger>
            <TabsTrigger value="outbound" className="rounded-xl bg-white px-4 py-2.5">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Outbound
            </TabsTrigger>
            <TabsTrigger value="shipments" className="rounded-xl bg-white px-4 py-2.5">
              <Truck className="mr-2 h-4 w-4" />
              Shipments
            </TabsTrigger>
            <TabsTrigger value="reservations" className="rounded-xl bg-white px-4 py-2.5">
              <LockKeyhole className="mr-2 h-4 w-4" />
              Reservations
            </TabsTrigger>
            <TabsTrigger value="balances" className="rounded-xl bg-white px-4 py-2.5">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Balances
            </TabsTrigger>
            <TabsTrigger value="lots" className="rounded-xl bg-white px-4 py-2.5">
              <Layers3 className="mr-2 h-4 w-4" />
              Lots
            </TabsTrigger>
            <TabsTrigger value="serials" className="rounded-xl bg-white px-4 py-2.5">
              <ScanLine className="mr-2 h-4 w-4" />
              Serials
            </TabsTrigger>
            <TabsTrigger value="ledger" className="rounded-xl bg-white px-4 py-2.5">
              <MapPin className="mr-2 h-4 w-4" />
              Ledger
            </TabsTrigger>
          </TabsList>

          <TabsContent value="locations" className="overflow-hidden rounded-2xl border border-gray-200">
            <div className="grid gap-4 border-b border-gray-100 bg-gray-50 p-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Operational locations</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{operationalLocationCount}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Structural nodes</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{structuralLocationCount}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">External points</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{externalLocationCount}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Transfer-active</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingMovements ? "..." : activeTransferLocations}</div>
              </div>
            </div>

            {locationRows.length === 0 ? (
              renderEmpty("No locations match the current filters.")
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Hierarchy</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Tracked items</TableHead>
                    <TableHead className="text-right">On hand</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Reserved</TableHead>
                    <TableHead className="text-right">Net flow</TableHead>
                    <TableHead>Last movement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locationRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="font-medium text-gray-900">{row.name}</div>
                        <div className="text-xs text-gray-500">
                          {row.code || "No code"}
                          {row.physicalAddress ? ` • ${row.physicalAddress}` : ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${row.operationalTone}`}>
                          {row.operationalMode}
                        </span>
                        {row.routeCount > 0 ? (
                          <div className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500">
                            <MoveRight className="h-3.5 w-3.5" />
                            {row.routeCount} active routes
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>{row.parentName}</TableCell>
                      <TableCell>{row.locationTypeName}</TableCell>
                      <TableCell className="text-right">{row.stockCount}</TableCell>
                      <TableCell className="text-right">{formatQuantity(row.quantityOnHand)}</TableCell>
                      <TableCell className="text-right">{formatQuantity(row.quantityAvailable)}</TableCell>
                      <TableCell className="text-right">{formatQuantity(row.quantityReserved)}</TableCell>
                      <TableCell className="text-right">
                        <span className={row.netFlow > 0 ? "text-green-700" : row.netFlow < 0 ? "text-red-700" : "text-gray-700"}>
                          {formatSignedQuantity(row.netFlow)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {row.recentMovementAt
                          ? formatDate(row.recentMovementAt, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "No movement"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="inbound" className="overflow-hidden rounded-2xl border border-gray-200">
            <div className="grid gap-4 border-b border-gray-100 bg-gray-50 p-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Receipt quantity</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingMovements ? "..." : formatQuantity(receiptQuantity)}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Receipt-active branches</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingMovements ? "..." : receiptLocationCount}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">POs awaiting receipt</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingPurchaseOrders ? "..." : pendingInboundOrders.length}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Received awaiting close</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingPurchaseOrders ? "..." : readyToCloseInboundOrders.length}</div>
              </div>
            </div>

            <div className="grid gap-4 p-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-white">
                  <div className="border-b border-gray-100 px-4 py-4">
                    <div className="text-sm font-semibold text-gray-900">Receipt movement events</div>
                    <div className="mt-1 text-sm text-gray-600">
                      Receipt movements are grouped into branch events so supervisors can see what landed, where it landed, and how much stock was posted in each receiving action.
                    </div>
                  </div>
                  {loadingMovements ? (
                    renderEmpty("Loading receipt activity...")
                  ) : receiptEvents.length === 0 ? (
                    renderEmpty("No receipt movements match the current filters.")
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Receipt event</TableHead>
                          <TableHead>Branch</TableHead>
                          <TableHead>Tracking</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead>When</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {receiptEvents.slice(0, 10).map((event) => (
                          <TableRow key={event.key}>
                            <TableCell>
                              <div className="font-medium text-gray-900">
                                {event.itemLabels.join(", ") || "Receipt event"}
                                {event.itemCount > event.itemLabels.length ? ` +${event.itemCount - event.itemLabels.length} more` : ""}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatReferenceType(event.referenceType)} • {truncateReferenceId(event.referenceId)}
                              </div>
                            </TableCell>
                            <TableCell>{event.locationName}</TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-900">
                                {event.itemCount} items • {event.movementCount} rows
                              </div>
                              <div className="text-xs text-gray-500">
                                {event.lotCount} lots • {event.serialCount} serials
                                {event.note ? ` • ${event.note}` : ""}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{formatQuantity(event.totalQuantity)}</TableCell>
                            <TableCell>
                              {event.occurredAt
                                ? formatDate(event.occurredAt, {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "No timestamp"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-sm font-semibold text-gray-900">Purchase orders awaiting receipt</div>
                  <div className="mt-1 text-sm text-gray-600">Issued and partially received purchase orders that still need branch receiving action.</div>
                  <div className="mt-4 space-y-3">
                    {loadingPurchaseOrders ? (
                      renderEmpty("Loading purchase-order queue...")
                    ) : pendingInboundOrders.length === 0 ? (
                      renderEmpty("No purchase orders are currently waiting for receipt.")
                    ) : (
                      pendingInboundOrders.slice(0, 6).map((order) => (
                        <Link key={String(order.id)} href={`/order/purchase/${order.id}`} className="block rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 hover:border-gray-300">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-gray-900">{order.reference || `Purchase order ${order.id}`}</div>
                              <div className="mt-1 text-sm text-gray-600">{order.supplier_name || "Unknown supplier"}</div>
                            </div>
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusTone(order.status)}`}>
                              {formatStatusLabel(order.status)}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Issue {order.issue_date || "not set"} • Delivery {order.delivery_date || "not set"} • Line items {order.line_items_count ?? 0}
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-sm font-semibold text-gray-900">Received awaiting completion</div>
                  <div className="mt-1 text-sm text-gray-600">Purchase orders that already received stock and now need operational closure.</div>
                  <div className="mt-4 space-y-3">
                    {loadingPurchaseOrders ? (
                      renderEmpty("Loading received purchase orders...")
                    ) : readyToCloseInboundOrders.length === 0 ? (
                      renderEmpty("No purchase orders are waiting for closure after receipt.")
                    ) : (
                      readyToCloseInboundOrders.slice(0, 6).map((order) => (
                        <Link key={String(order.id)} href={`/order/purchase/${order.id}`} className="block rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 hover:border-gray-300">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-gray-900">{order.reference || `Purchase order ${order.id}`}</div>
                              <div className="mt-1 text-sm text-gray-600">{order.supplier_name || "Unknown supplier"}</div>
                            </div>
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusTone(order.status)}`}>
                              {formatStatusLabel(order.status)}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">Line items {order.line_items_count ?? 0} • Workflow {order.workflow_state || "No workflow state"}</div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="receipts" className="overflow-hidden rounded-2xl border border-gray-200">
            <div className="grid gap-4 border-b border-gray-100 bg-gray-50 p-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Receipt records</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingGoodsReceipts ? "..." : goodsReceiptCount}</div>
                <div className="mt-1 text-xs text-gray-500">
                  {loadingGoodsReceipts ? "..." : `${goodsReceiptSupplierCount} suppliers across ${goodsReceiptPurchaseOrderCount} purchase orders`}
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Received quantity</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">
                  {loadingGoodsReceipts ? "..." : formatQuantity(goodsReceiptTotalQuantity)}
                </div>
                <div className="mt-1 text-xs text-gray-500">{loadingMovements ? "..." : `${receiptLocationCount} receipt-active branches`}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Awaiting first receipt</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">
                  {loadingPurchaseOrders ? "..." : awaitingFirstReceiptCount}
                </div>
                <div className="mt-1 text-xs text-gray-500">{loadingPurchaseOrders ? "..." : `${partialReceiptFollowUpCount} partial follow-ups`}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Overdue receiving</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">
                  {loadingPurchaseOrders ? "..." : overdueReceivingCount}
                </div>
                <div className="mt-1 text-xs text-gray-500">{loadingPurchaseOrders ? "..." : `${receiptAttentionRows.length} active receipt tasks`}</div>
              </div>
            </div>

            <div className="grid gap-4 p-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-gray-200 bg-white">
                <div className="border-b border-gray-100 px-4 py-4">
                  <div className="text-sm font-semibold text-gray-900">Goods receipt history</div>
                  <div className="mt-1 text-sm text-gray-600">
                    Receipt entities are now visible directly so supervisors can audit what was received, which purchase order it closed against, and which branches absorbed the stock.
                  </div>
                </div>
                {loadingGoodsReceipts ? (
                  renderEmpty("Loading goods receipts...")
                ) : goodsReceipts.length === 0 ? (
                  renderEmpty("No goods receipts match the current filters.")
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Purchase order</TableHead>
                        <TableHead>Stock profile</TableHead>
                        <TableHead>Received by</TableHead>
                        <TableHead>Received at</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {goodsReceipts.map((receipt) => (
                        <TableRow key={String(receipt.id)}>
                          <TableCell>
                            <div className="font-medium text-gray-900">{receipt.reference || `Goods receipt ${receipt.id}`}</div>
                            <div className="text-xs text-gray-500">{receipt.notes || "No notes"}</div>
                          </TableCell>
                          <TableCell>{receipt.supplier_name || "Unknown supplier"}</TableCell>
                          <TableCell>
                            {receipt.purchase_order ? (
                              <Link
                                href={`/order/purchase/${receipt.purchase_order}`}
                                className="text-sm font-medium text-blue-700 hover:text-blue-900"
                              >
                                {receipt.purchase_order_reference || `Purchase order ${receipt.purchase_order}`}
                              </Link>
                            ) : (
                              receipt.purchase_order_reference || "No purchase order"
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-900">
                              {receipt.line_count ?? 0} lines • {formatQuantity(receipt.total_quantity)} units
                            </div>
                            <div className="text-xs text-gray-500">
                              {(receipt.inventory_preview || []).join(", ") || "No item preview"}
                              {receipt.location_preview?.length ? ` • ${receipt.location_preview.join(", ")}` : ""}
                              {(receipt.location_count || 0) > (receipt.location_preview?.length || 0)
                                ? ` +${(receipt.location_count || 0) - (receipt.location_preview?.length || 0)} more locations`
                                : ""}
                            </div>
                          </TableCell>
                          <TableCell>{formatUserDetails(receipt.received_by_details)}</TableCell>
                          <TableCell>
                            {receipt.received_at
                              ? formatDate(receipt.received_at, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "No timestamp"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-sm font-semibold text-gray-900">Receiving exceptions</div>
                  <div className="mt-1 text-sm text-gray-600">
                    Active purchase orders are prioritized by missing receipts, partial receipts, and overdue delivery commitments so branch supervisors know exactly where to intervene next.
                  </div>
                  <div className="mt-4 space-y-3">
                    {loadingPurchaseOrders ? (
                      renderEmpty("Loading receiving exceptions...")
                    ) : receiptAttentionRows.length === 0 ? (
                      renderEmpty("No active receiving exceptions match the current filters.")
                    ) : (
                      receiptAttentionRows.slice(0, 6).map((order) => (
                        <div key={String(order.id)} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-gray-900">{order.reference || `Purchase order ${order.id}`}</div>
                              <div className="mt-1 text-sm text-gray-600">{order.supplier_name || "Unknown supplier"}</div>
                            </div>
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${order.exceptionTone}`}>
                              {order.exceptionLabel}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Status {formatStatusLabel(order.status)} • Receipts {order.receiptCount} • Delivery {order.delivery_date || "not set"}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            Last receipt{" "}
                            {order.lastReceiptAt
                              ? formatDate(order.lastReceiptAt, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "not recorded"}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              variant={selectedReceivingOrderId === String(order.id) ? "default" : "outline"}
                              className="h-9"
                              onClick={() => setSelectedReceivingOrderId(String(order.id))}
                            >
                              {selectedReceivingOrderId === String(order.id) ? "Workbench selected" : "Work this order"}
                            </Button>
                            <Link
                              href={`/order/purchase/${order.id}`}
                              className="inline-flex h-9 items-center rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:border-gray-300 hover:text-gray-900"
                            >
                              Open order
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-sm font-semibold text-gray-900">Receiving closure queue</div>
                  <div className="mt-1 text-sm text-gray-600">Purchase orders that already received stock and now need operational closure.</div>
                  <div className="mt-4 space-y-3">
                    {loadingPurchaseOrders ? (
                      renderEmpty("Loading received purchase orders...")
                    ) : readyToCloseInboundOrders.length === 0 ? (
                      renderEmpty("No purchase orders are waiting for closure after receipt.")
                    ) : (
                      readyToCloseInboundOrders.slice(0, 6).map((order) => (
                        <div key={String(order.id)} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-gray-900">{order.reference || `Purchase order ${order.id}`}</div>
                              <div className="mt-1 text-sm text-gray-600">{order.supplier_name || "Unknown supplier"}</div>
                            </div>
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusTone(order.status)}`}>
                              {formatStatusLabel(order.status)}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">Line items {order.line_items_count ?? 0} • Workflow {order.workflow_state || "No workflow state"}</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              variant={selectedReceivingOrderId === String(order.id) ? "default" : "outline"}
                              className="h-9"
                              onClick={() => setSelectedReceivingOrderId(String(order.id))}
                            >
                              {selectedReceivingOrderId === String(order.id) ? "Workbench selected" : "Prepare closure"}
                            </Button>
                            <Link
                              href={`/order/purchase/${order.id}`}
                              className="inline-flex h-9 items-center rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:border-gray-300 hover:text-gray-900"
                            >
                              Open order
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Receiving workbench</div>
                      <div className="mt-1 text-sm text-gray-600">
                        Post received quantities directly from the supervisor board, then close the order when the receiving work is complete.
                      </div>
                    </div>
                    <div className="w-full max-w-sm space-y-2">
                      <Label htmlFor="receiving-workbench-order">Selected purchase order</Label>
                      <Select value={selectedReceivingOrderId || ""} onValueChange={setSelectedReceivingOrderId}>
                        <SelectTrigger id="receiving-workbench-order" className="h-11">
                          <SelectValue placeholder="Select purchase order" />
                        </SelectTrigger>
                        <SelectContent>
                          {receiptWorkbenchCandidates.map((order) => (
                            <SelectItem key={String(order.id)} value={String(order.id)}>
                              {order.reference || `Purchase order ${order.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {!selectedReceivingOrderId ? (
                    <div className="mt-4">{renderEmpty("No purchase order is selected for receiving work.")}</div>
                  ) : loadingSelectedReceivingOrder ? (
                    <div className="mt-4">{renderEmpty("Loading receiving workbench...")}</div>
                  ) : !selectedReceivingOrder ? (
                    <div className="mt-4">{renderEmpty("The selected purchase order is unavailable.")}</div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-gray-900">{selectedReceivingOrder.reference || `Purchase order ${selectedReceivingOrder.id}`}</div>
                            <div className="mt-1 text-sm text-gray-600">
                              {selectedReceivingOrder.supplier_name || selectedReceivingOrder.supplier_details?.name || "Unknown supplier"}
                            </div>
                          </div>
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusTone(selectedReceivingOrder.status)}`}>
                            {formatStatusLabel(selectedReceivingOrder.status)}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Delivery {selectedReceivingOrder.delivery_date || "not set"} • Workflow {selectedReceivingOrder.workflow_state || "No workflow state"}
                        </div>
                      </div>

                      {receivingLineItems.length === 0 ? (
                        renderEmpty("This purchase order has no line items available for receiving.")
                      ) : (
                        <div className="space-y-3">
                          {receivingLineItems.map((lineItem) => {
                            const lineItemId = String(lineItem.id)
                            const entry = receiptWorkbenchEntries[lineItemId] || buildReceiptWorkbenchEntry(lineItem)
                            const remainingQuantity = Math.max(toNumber(lineItem.quantity) - toNumber(lineItem.quantity_received), 0)

                            return (
                              <div key={lineItemId} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <div className="font-semibold text-gray-900">{lineItem.inventory_item_name || `Line ${lineItem.id}`}</div>
                                    <div className="mt-1 text-xs text-gray-500">
                                      Ordered {formatQuantity(lineItem.quantity)} • Received {formatQuantity(lineItem.quantity_received)} • Remaining {formatQuantity(remainingQuantity)}
                                    </div>
                                  </div>
                                  {lineItem.fully_received ? (
                                    <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-800">
                                      Fully received
                                    </span>
                                  ) : null}
                                </div>

                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label htmlFor={`receipt-line-location-${lineItemId}`}>Receiving branch</Label>
                                    <Select value={entry.location_id || "unselected"} onValueChange={(value) => setReceiptWorkbenchField(lineItemId, "location_id", value === "unselected" ? "" : value)}>
                                      <SelectTrigger id={`receipt-line-location-${lineItemId}`} className="h-10 bg-white">
                                        <SelectValue placeholder="Select branch" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="unselected">Select branch</SelectItem>
                                        {locationOptions.map((location) => (
                                          <SelectItem key={String(location.id)} value={String(location.id)}>
                                            {location.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`receipt-line-quantity-${lineItemId}`}>Receive quantity</Label>
                                    <Input
                                      id={`receipt-line-quantity-${lineItemId}`}
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={entry.quantity_received}
                                      onChange={(event) => setReceiptWorkbenchField(lineItemId, "quantity_received", event.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`receipt-line-lot-${lineItemId}`}>Lot number</Label>
                                    <Input
                                      id={`receipt-line-lot-${lineItemId}`}
                                      value={entry.lot_number}
                                      onChange={(event) => setReceiptWorkbenchField(lineItemId, "lot_number", event.target.value)}
                                      placeholder="Optional lot or batch"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`receipt-line-manufactured-${lineItemId}`}>Manufactured date</Label>
                                    <Input
                                      id={`receipt-line-manufactured-${lineItemId}`}
                                      type="date"
                                      value={entry.manufactured_date}
                                      onChange={(event) => setReceiptWorkbenchField(lineItemId, "manufactured_date", event.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`receipt-line-expiry-${lineItemId}`}>Expiry date</Label>
                                    <Input
                                      id={`receipt-line-expiry-${lineItemId}`}
                                      type="date"
                                      value={entry.expiry_date}
                                      onChange={(event) => setReceiptWorkbenchField(lineItemId, "expiry_date", event.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor={`receipt-line-notes-${lineItemId}`}>Receiving note</Label>
                                    <Textarea
                                      id={`receipt-line-notes-${lineItemId}`}
                                      value={entry.notes}
                                      onChange={(event) => setReceiptWorkbenchField(lineItemId, "notes", event.target.value)}
                                      rows={2}
                                      placeholder="Optional receiving note"
                                    />
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3">
                        <Button onClick={handleReceiveWorkbench} disabled={receivingItems || !receivingLineItems.length}>
                          {receivingItems ? "Posting receipt..." : "Post received quantities"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCompleteReceivingOrder}
                          disabled={completingPurchaseOrder || selectedReceivingOrder.status !== PurchaseOrderStatus.received}
                        >
                          {completingPurchaseOrder ? "Completing..." : "Complete purchase order"}
                        </Button>
                        <Link
                          href={`/order/purchase/${selectedReceivingOrder.id}`}
                          className="inline-flex h-10 items-center rounded-md border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:border-gray-300 hover:text-gray-900"
                        >
                          Open full workbench
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="outbound" className="overflow-hidden rounded-2xl border border-gray-200">
            <div className="grid gap-4 border-b border-gray-100 bg-gray-50 p-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Shipped quantity</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingMovements ? "..." : formatQuantity(issueQuantity)}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Shipment-active branches</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingMovements ? "..." : issueLocationCount}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Orders awaiting shipment</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingSalesOrders ? "..." : pendingOutboundOrders.length}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Shipped awaiting close</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingSalesOrders ? "..." : readyToCloseOutboundOrders.length}</div>
              </div>
            </div>

            <div className="grid gap-4 p-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-white">
                  <div className="border-b border-gray-100 px-4 py-4">
                    <div className="text-sm font-semibold text-gray-900">Shipment movement events</div>
                    <div className="mt-1 text-sm text-gray-600">
                      Shipment movements are grouped into branch events so supervisors can see what left, from where, and how much stock was issued in each outbound action.
                    </div>
                  </div>
                  {loadingMovements ? (
                    renderEmpty("Loading shipment activity...")
                  ) : shipmentEvents.length === 0 ? (
                    renderEmpty("No shipment issue movements match the current filters.")
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Shipment event</TableHead>
                          <TableHead>Branch</TableHead>
                          <TableHead>Tracking</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead>When</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shipmentEvents.slice(0, 10).map((event) => (
                          <TableRow key={event.key}>
                            <TableCell>
                              <div className="font-medium text-gray-900">
                                {event.itemLabels.join(", ") || "Shipment event"}
                                {event.itemCount > event.itemLabels.length ? ` +${event.itemCount - event.itemLabels.length} more` : ""}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatReferenceType(event.referenceType)} • {truncateReferenceId(event.referenceId)}
                              </div>
                            </TableCell>
                            <TableCell>{event.locationName}</TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-900">
                                {event.itemCount} items • {event.movementCount} rows
                              </div>
                              <div className="text-xs text-gray-500">
                                {event.lotCount} lots • {event.serialCount} serials
                                {event.note ? ` • ${event.note}` : ""}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{formatQuantity(event.totalQuantity)}</TableCell>
                            <TableCell>
                              {event.occurredAt
                                ? formatDate(event.occurredAt, {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "No timestamp"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-sm font-semibold text-gray-900">Sales orders awaiting shipment</div>
                  <div className="mt-1 text-sm text-gray-600">Pending and in-progress sales orders that still need branch shipment action.</div>
                  <div className="mt-4 space-y-3">
                    {loadingSalesOrders ? (
                      renderEmpty("Loading sales-order queue...")
                    ) : pendingOutboundOrders.length === 0 ? (
                      renderEmpty("No sales orders are currently waiting for shipment.")
                    ) : (
                      pendingOutboundOrders.slice(0, 6).map((order) => (
                        <Link key={String(order.id)} href={`/order/sales/${order.id}`} className="block rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 hover:border-gray-300">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-gray-900">{order.reference || `Sales order ${order.id}`}</div>
                              <div className="mt-1 text-sm text-gray-600">{order.customer_name || "Unknown customer"}</div>
                            </div>
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusTone(order.status)}`}>
                              {formatStatusLabel(order.status)}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Shipment date {order.shipment_date || "not set"} • Delivery {order.delivery_date || "not set"} • Line items {order.line_items_count ?? 0}
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-sm font-semibold text-gray-900">Shipped awaiting closure</div>
                  <div className="mt-1 text-sm text-gray-600">Sales orders that already moved stock and now need final operational closure.</div>
                  <div className="mt-4 space-y-3">
                    {loadingSalesOrders ? (
                      renderEmpty("Loading shipped sales orders...")
                    ) : readyToCloseOutboundOrders.length === 0 ? (
                      renderEmpty("No shipped sales orders are waiting for closure.")
                    ) : (
                      readyToCloseOutboundOrders.slice(0, 6).map((order) => (
                        <Link key={String(order.id)} href={`/order/sales/${order.id}`} className="block rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 hover:border-gray-300">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-gray-900">{order.reference || `Sales order ${order.id}`}</div>
                              <div className="mt-1 text-sm text-gray-600">{order.customer_name || "Unknown customer"}</div>
                            </div>
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusTone(order.status)}`}>
                              {formatStatusLabel(order.status)}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Shipment date {order.shipment_date || "not set"} • Delivery {order.delivery_date || "not set"} • Line items {order.line_items_count ?? 0}
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="shipments" className="overflow-hidden rounded-2xl border border-gray-200">
            <div className="grid gap-4 border-b border-gray-100 bg-gray-50 p-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Shipment records</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingShipments ? "..." : shipmentCount}</div>
                <div className="mt-1 text-xs text-gray-500">
                  {loadingShipments ? "..." : `${shipmentCustomerCount} customers across ${shipmentOrderCount} sales orders`}
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Shipped quantity</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingShipments ? "..." : formatQuantity(shipmentTotalQuantity)}</div>
                <div className="mt-1 text-xs text-gray-500">{loadingMovements ? "..." : `${issueLocationCount} shipment-active branches`}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Tracked consignments</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingShipments ? "..." : trackedShipmentCount}</div>
                <div className="mt-1 text-xs text-gray-500">Shipment records carrying tracking or invoice references</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Awaiting shipment closure</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingSalesOrders ? "..." : readyToCloseOutboundOrders.length}</div>
                <div className="mt-1 text-xs text-gray-500">{loadingSalesOrders ? "..." : `${pendingOutboundOrders.length} shipment tasks still open`}</div>
              </div>
            </div>

            <div className="space-y-4 p-4">
              {loadingShipments ? (
                renderEmpty("Loading shipment history...")
              ) : shipments.length === 0 ? (
                renderEmpty("No shipment records match the current filters.")
              ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Shipment</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Sales order</TableHead>
                        <TableHead>Stock profile</TableHead>
                        <TableHead>Dispatch context</TableHead>
                        <TableHead>Shipped at</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shipments.map((shipment) => (
                        <TableRow key={String(shipment.id)}>
                          <TableCell>
                            <div className="font-medium text-gray-900">{shipment.reference || `Shipment ${shipment.id}`}</div>
                            <div className="text-xs text-gray-500">
                              {shipment.tracking_number || shipment.invoice_number || shipment.notes || "No tracking or notes"}
                            </div>
                          </TableCell>
                          <TableCell>{shipment.customer_name || "Unknown customer"}</TableCell>
                          <TableCell>
                            <Link href={`/order/sales/${shipment.order}`} className="text-sm font-medium text-blue-700 hover:text-blue-900">
                              {shipment.order_reference || `Sales order ${shipment.order}`}
                            </Link>
                            <div className="mt-1 text-xs text-gray-500">{shipment.order_status ? formatStatusLabel(shipment.order_status) : "No order status"}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-900">
                              {shipment.line_count ?? 0} lines • {formatQuantity(shipment.total_quantity)} units
                            </div>
                            <div className="text-xs text-gray-500">
                              {(shipment.inventory_preview || []).join(", ") || "No item preview"}
                              {shipment.location_preview?.length ? ` • ${shipment.location_preview.join(", ")}` : ""}
                              {(shipment.location_count || 0) > (shipment.location_preview?.length || 0)
                                ? ` +${(shipment.location_count || 0) - (shipment.location_preview?.length || 0)} more locations`
                                : ""}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-900">{formatUserDetails(shipment.checked_by_details, "Unchecked")}</div>
                            <div className="text-xs text-gray-500">
                              {shipment.delivery_date ? `Delivery ${shipment.delivery_date}` : "Delivery date not set"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {shipment.shipment_date
                              ? formatDate(shipment.shipment_date, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "No shipment date"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-sm font-semibold text-gray-900">Orders awaiting shipment</div>
                    <div className="mt-1 text-sm text-gray-600">Open sales orders that still need branch shipment work.</div>
                    <div className="mt-4 space-y-3">
                      {loadingSalesOrders ? (
                        renderEmpty("Loading shipment queue...")
                      ) : pendingOutboundOrders.length === 0 ? (
                        renderEmpty("No sales orders are currently waiting for shipment.")
                      ) : (
                        pendingOutboundOrders.slice(0, 6).map((order) => (
                          <div key={String(order.id)} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-semibold text-gray-900">{order.reference || `Sales order ${order.id}`}</div>
                                <div className="mt-1 text-sm text-gray-600">{order.customer_name || "Unknown customer"}</div>
                              </div>
                              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusTone(order.status)}`}>
                                {formatStatusLabel(order.status)}
                              </span>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              Shipment date {order.shipment_date || "not set"} • Delivery {order.delivery_date || "not set"} • Line items {order.line_items_count ?? 0}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button
                                variant={selectedShippingOrderId === String(order.id) ? "default" : "outline"}
                                className="h-9"
                                onClick={() => setSelectedShippingOrderId(String(order.id))}
                              >
                                {selectedShippingOrderId === String(order.id) ? "Workbench selected" : "Work this order"}
                              </Button>
                              <Link
                                href={`/order/sales/${order.id}`}
                                className="inline-flex h-9 items-center rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:border-gray-300 hover:text-gray-900"
                              >
                                Open order
                              </Link>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-sm font-semibold text-gray-900">Shipment closure queue</div>
                    <div className="mt-1 text-sm text-gray-600">Sales orders that already shipped stock and now need operational closure.</div>
                    <div className="mt-4 space-y-3">
                      {loadingSalesOrders ? (
                        renderEmpty("Loading shipped sales orders...")
                      ) : readyToCloseOutboundOrders.length === 0 ? (
                        renderEmpty("No shipped sales orders are waiting for closure.")
                      ) : (
                        readyToCloseOutboundOrders.slice(0, 6).map((order) => (
                          <div key={String(order.id)} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-semibold text-gray-900">{order.reference || `Sales order ${order.id}`}</div>
                                <div className="mt-1 text-sm text-gray-600">{order.customer_name || "Unknown customer"}</div>
                              </div>
                              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusTone(order.status)}`}>
                                {formatStatusLabel(order.status)}
                              </span>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              Shipment date {order.shipment_date || "not set"} • Delivery {order.delivery_date || "not set"} • Line items {order.line_items_count ?? 0}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button
                                variant={selectedShippingOrderId === String(order.id) ? "default" : "outline"}
                                className="h-9"
                                onClick={() => setSelectedShippingOrderId(String(order.id))}
                              >
                                {selectedShippingOrderId === String(order.id) ? "Workbench selected" : "Prepare closure"}
                              </Button>
                              <Link
                                href={`/order/sales/${order.id}`}
                                className="inline-flex h-9 items-center rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:border-gray-300 hover:text-gray-900"
                              >
                                Open order
                              </Link>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Shipment workbench</div>
                      <div className="mt-1 text-sm text-gray-600">
                        Record shipments directly from the branch workspace, then complete the sales order once outbound work is resolved.
                      </div>
                    </div>
                    <div className="w-full max-w-sm space-y-2">
                      <Label htmlFor="shipment-workbench-order">Selected sales order</Label>
                      <Select value={selectedShippingOrderId || ""} onValueChange={setSelectedShippingOrderId}>
                        <SelectTrigger id="shipment-workbench-order" className="h-11">
                          <SelectValue placeholder="Select sales order" />
                        </SelectTrigger>
                        <SelectContent>
                          {shipmentWorkbenchCandidates.map((order) => (
                            <SelectItem key={String(order.id)} value={String(order.id)}>
                              {order.reference || `Sales order ${order.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {!selectedShippingOrderId ? (
                    <div className="mt-4">{renderEmpty("No sales order is selected for shipment work.")}</div>
                  ) : loadingSelectedShippingOrder ? (
                    <div className="mt-4">{renderEmpty("Loading shipment workbench...")}</div>
                  ) : !selectedShippingOrder ? (
                    <div className="mt-4">{renderEmpty("The selected sales order is unavailable.")}</div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-gray-900">{selectedShippingOrder.reference || `Sales order ${selectedShippingOrder.id}`}</div>
                            <div className="mt-1 text-sm text-gray-600">{selectedShippingOrder.customer_name || "Unknown customer"}</div>
                          </div>
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusTone(selectedShippingOrder.status)}`}>
                            {formatStatusLabel(selectedShippingOrder.status)}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Delivery {selectedShippingOrder.delivery_date || "not set"} • Customer ref {selectedShippingOrder.customer_reference || "not set"}
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="shipment-meta-date">Shipment date</Label>
                          <Input
                            id="shipment-meta-date"
                            type="date"
                            value={shipmentWorkbenchMeta.shipment_date}
                            onChange={(event) => setShipmentWorkbenchMeta((current) => ({ ...current, shipment_date: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="shipment-meta-delivery">Delivery date</Label>
                          <Input
                            id="shipment-meta-delivery"
                            type="date"
                            value={shipmentWorkbenchMeta.delivery_date}
                            onChange={(event) => setShipmentWorkbenchMeta((current) => ({ ...current, delivery_date: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="shipment-meta-tracking">Tracking number</Label>
                          <Input
                            id="shipment-meta-tracking"
                            value={shipmentWorkbenchMeta.tracking_number}
                            onChange={(event) => setShipmentWorkbenchMeta((current) => ({ ...current, tracking_number: event.target.value }))}
                            placeholder="Optional tracking reference"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="shipment-meta-invoice">Invoice number</Label>
                          <Input
                            id="shipment-meta-invoice"
                            value={shipmentWorkbenchMeta.invoice_number}
                            onChange={(event) => setShipmentWorkbenchMeta((current) => ({ ...current, invoice_number: event.target.value }))}
                            placeholder="Optional invoice reference"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="shipment-meta-link">Dispatch link</Label>
                          <Input
                            id="shipment-meta-link"
                            value={shipmentWorkbenchMeta.link}
                            onChange={(event) => setShipmentWorkbenchMeta((current) => ({ ...current, link: event.target.value }))}
                            placeholder="Optional courier or dispatch link"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="shipment-meta-notes">Shipment note</Label>
                          <Textarea
                            id="shipment-meta-notes"
                            value={shipmentWorkbenchMeta.notes}
                            onChange={(event) => setShipmentWorkbenchMeta((current) => ({ ...current, notes: event.target.value }))}
                            rows={2}
                            placeholder="Optional outbound note"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-gray-900">Reserved allocations ready to ship</div>
                        {loadingSelectedShippingReservations ? (
                          renderEmpty("Loading reserved allocations...")
                        ) : selectedShippingReservations.length === 0 ? (
                          renderEmpty("No active reservations are currently attached to this sales order.")
                        ) : (
                          selectedShippingReservations.map((reservation) => {
                            const reservationId = String(reservation.id)
                            const entry =
                              shipmentWorkbenchReservationEntries[reservationId] || buildShipmentWorkbenchReservationEntry(reservation)

                            return (
                              <div key={reservationId} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <div className="font-semibold text-gray-900">{reservation.inventory_item_name || `Reservation ${reservation.id}`}</div>
                                    <div className="mt-1 text-xs text-gray-500">
                                      {reservation.location_name || reservation.stock_location} • Reserved {formatQuantity(reservation.reserved_quantity)} • Fulfilled {formatQuantity(reservation.fulfilled_quantity)} • Remaining {formatQuantity(reservation.remaining_quantity)}
                                    </div>
                                  </div>
                                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusTone(reservation.status)}`}>
                                    {formatStatusLabel(reservation.status)}
                                  </span>
                                </div>
                                <div className="mt-3 grid gap-3 md:grid-cols-[160px_1fr]">
                                  <div className="space-y-2">
                                    <Label htmlFor={`shipment-reservation-quantity-${reservationId}`}>Ship quantity</Label>
                                    <Input
                                      id={`shipment-reservation-quantity-${reservationId}`}
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={entry.quantity}
                                      onChange={(event) => setShipmentWorkbenchReservationField(reservationId, "quantity", event.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`shipment-reservation-note-${reservationId}`}>Reservation note</Label>
                                    <Input
                                      id={`shipment-reservation-note-${reservationId}`}
                                      value={entry.notes}
                                      onChange={(event) => setShipmentWorkbenchReservationField(reservationId, "notes", event.target.value)}
                                      placeholder="Optional note for this reserved shipment"
                                    />
                                  </div>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-gray-900">Direct shipment lines</div>
                        {directShipmentLineItems.length === 0 ? (
                          renderEmpty("No direct shipment lines remain outside the reservation flow.")
                        ) : (
                          directShipmentLineItems.map((lineItem) => {
                            const lineItemId = String(lineItem.id)
                            const entry = shipmentWorkbenchEntries[lineItemId] || buildShipmentWorkbenchEntry(lineItem)

                            return (
                              <div key={lineItemId} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                                <div className="font-semibold text-gray-900">{lineItem.inventory_name || `Line ${lineItem.id}`}</div>
                                <div className="mt-1 text-xs text-gray-500">
                                  Ordered {formatQuantity(lineItem.quantity)} • Shipped {formatQuantity(lineItem.shipped_quantity)} • Remaining {formatQuantity(lineItem.remaining_quantity)}
                                </div>
                                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_160px_1fr]">
                                  <div className="space-y-2">
                                    <Label htmlFor={`shipment-direct-location-${lineItemId}`}>Shipping branch</Label>
                                    <Select value={entry.location_id || "unselected"} onValueChange={(value) => setShipmentWorkbenchField(lineItemId, "location_id", value === "unselected" ? "" : value)}>
                                      <SelectTrigger id={`shipment-direct-location-${lineItemId}`} className="h-10 bg-white">
                                        <SelectValue placeholder="Select branch" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="unselected">Select branch</SelectItem>
                                        {locationOptions.map((location) => (
                                          <SelectItem key={String(location.id)} value={String(location.id)}>
                                            {location.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`shipment-direct-quantity-${lineItemId}`}>Ship quantity</Label>
                                    <Input
                                      id={`shipment-direct-quantity-${lineItemId}`}
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={entry.quantity}
                                      onChange={(event) => setShipmentWorkbenchField(lineItemId, "quantity", event.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`shipment-direct-note-${lineItemId}`}>Line note</Label>
                                    <Input
                                      id={`shipment-direct-note-${lineItemId}`}
                                      value={entry.notes}
                                      onChange={(event) => setShipmentWorkbenchField(lineItemId, "notes", event.target.value)}
                                      placeholder="Optional direct shipment note"
                                    />
                                  </div>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button onClick={handleShipWorkbench} disabled={shippingOrder || (!selectedShippingReservations.length && !directShipmentLineItems.length)}>
                          {shippingOrder ? "Posting shipment..." : "Post shipment work"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCompleteShippingOrder}
                          disabled={completingSalesOrder || selectedShippingOrder.status !== SalesOrderStatus.shipped}
                        >
                          {completingSalesOrder ? "Completing..." : "Complete sales order"}
                        </Button>
                        <Link
                          href={`/order/sales/${selectedShippingOrder.id}`}
                          className="inline-flex h-10 items-center rounded-md border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:border-gray-300 hover:text-gray-900"
                        >
                          Open full workbench
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reservations" className="overflow-hidden rounded-2xl border border-gray-200">
            <div className="grid gap-4 border-b border-gray-100 bg-gray-50 p-4 md:grid-cols-[1fr_220px]">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Open reservations</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingReservations ? "..." : openReservationCount}</div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Committed quantity</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900">
                    {loadingReservations ? "..." : formatQuantity(filteredReservationCommitted)}
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Remaining to resolve</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900">
                    {loadingReservations ? "..." : formatQuantity(filteredReservationRemaining)}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {loadingReservations ? "..." : `${committedLocationCount} committed locations`}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inventory-reservation-status">Reservation status</Label>
                <Select value={reservationStatus} onValueChange={setReservationStatus}>
                  <SelectTrigger id="inventory-reservation-status" className="h-11 bg-white">
                    <SelectValue placeholder="Filter reservation status" />
                  </SelectTrigger>
                  <SelectContent>
                    {reservationStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loadingReservations ? (
              renderEmpty("Loading branch reservations...")
            ) : filteredReservations.length === 0 ? (
              renderEmpty("No reservations match the current filters.")
            ) : (
              <div className="grid gap-4 p-4 xl:grid-cols-2">
                {filteredReservations.map((reservation) => {
                  const reservationId = String(reservation.id)
                  const entry = reservationActionEntries[reservationId] || buildReservationActionEntry(reservation)
                  const remainingQuantity = toNumber(reservation.remaining_quantity)
                  const canAct = remainingQuantity > 0 && !["released", "fulfilled"].includes(String(reservation.status))
                  const orderRoute = buildReservationRoute(reservation)
                  const isReleasing = activeReservationAction?.reservationId === reservationId && activeReservationAction.type === "release" && releasingReservation
                  const isFulfilling = activeReservationAction?.reservationId === reservationId && activeReservationAction.type === "fulfill" && fulfillingReservation

                  return (
                    <div key={reservation.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {reservation.inventory_item_name || `Reservation ${reservation.id}`}
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            {reservation.location_name || reservation.stock_location} • Reserved {formatQuantity(reservation.reserved_quantity)} • Fulfilled{" "}
                            {formatQuantity(reservation.fulfilled_quantity)} • Remaining {formatQuantity(reservation.remaining_quantity)}
                          </div>
                        </div>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusTone(reservation.status)}`}>
                          {formatStatusLabel(reservation.status)}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Order context</div>
                          <div className="mt-2 text-sm font-semibold text-gray-900">
                            {reservation.external_order_type || "Unscoped"}:{reservation.external_order_id || "Unknown"}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            Line {reservation.external_order_line_id || "N/A"}
                            {reservation.lot_number ? ` • Lot ${reservation.lot_number}` : ""}
                            {reservation.serial_number ? ` • Serial ${reservation.serial_number}` : ""}
                          </div>
                          {orderRoute ? (
                            <Link href={orderRoute} className="mt-2 inline-flex text-xs font-medium text-blue-700 hover:text-blue-900">
                              Open source sales order
                            </Link>
                          ) : null}
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Expiry and timeline</div>
                          <div className="mt-2 text-sm font-semibold text-gray-900">
                            {reservation.expires_at
                              ? formatDate(reservation.expires_at, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "No expiry set"}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            Created{" "}
                            {reservation.created_at
                              ? formatDate(reservation.created_at, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "unknown"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-[140px_1fr]">
                        <div className="space-y-2">
                          <Label htmlFor={`reservation-quantity-${reservationId}`}>Action quantity</Label>
                          <Input
                            id={`reservation-quantity-${reservationId}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={entry.quantity}
                            onChange={(event) => setReservationActionField(reservationId, "quantity", event.target.value)}
                            disabled={!canAct}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`reservation-notes-${reservationId}`}>Supervisor note</Label>
                          <Input
                            id={`reservation-notes-${reservationId}`}
                            value={entry.notes}
                            onChange={(event) => setReservationActionField(reservationId, "notes", event.target.value)}
                            placeholder="Optional note for release or fulfillment"
                            disabled={!canAct}
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button
                          variant="outline"
                          onClick={() => handleReservationAction(reservation, "release")}
                          disabled={!canAct || isFulfilling || isReleasing}
                        >
                          {isReleasing ? "Releasing..." : "Release quantity"}
                        </Button>
                        <Button onClick={() => handleReservationAction(reservation, "fulfill")} disabled={!canAct || isFulfilling || isReleasing}>
                          {isFulfilling ? "Fulfilling..." : "Fulfill quantity"}
                        </Button>
                        {!canAct ? (
                          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                            This reservation no longer has actionable remaining quantity.
                          </span>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="balances" className="rounded-2xl border border-gray-200">
            {loadingBalances ? (
              renderEmpty("Loading stock balances...")
            ) : balances.length === 0 ? (
              renderEmpty("No balance rows match the current filters.")
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inventory item</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Lot</TableHead>
                    <TableHead className="text-right">On hand</TableHead>
                    <TableHead className="text-right">Reserved</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium text-gray-900">{row.inventory_item_name || "Unknown item"}</TableCell>
                      <TableCell>{row.stock_location_name || "Unknown location"}</TableCell>
                      <TableCell>{row.lot_number || "No lot"}</TableCell>
                      <TableCell className="text-right">{formatQuantity(row.quantity_on_hand)}</TableCell>
                      <TableCell className="text-right">{formatQuantity(row.quantity_reserved)}</TableCell>
                      <TableCell className="text-right">{formatQuantity(row.quantity_available)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="lots" className="rounded-2xl border border-gray-200">
            {loadingLots ? (
              renderEmpty("Loading tracked lots...")
            ) : lots.length === 0 ? (
              renderEmpty("No tracked lots match the current filters.")
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inventory item</TableHead>
                    <TableHead>Lot number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lots.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium text-gray-900">{row.inventory_item_name || "Unknown item"}</TableCell>
                      <TableCell>{row.lot_number}</TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusTone(row.status)}`}>
                          {row.status || "unknown"}
                        </span>
                      </TableCell>
                      <TableCell>{row.expiry_date ? formatDate(row.expiry_date) : "No expiry"}</TableCell>
                      <TableCell className="text-right">{formatQuantity(row.remaining_quantity)}</TableCell>
                      <TableCell className="text-right">{formatQuantity(row.received_quantity)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="serials" className="rounded-2xl border border-gray-200">
            {loadingSerials ? (
              renderEmpty("Loading tracked serials...")
            ) : serials.length === 0 ? (
              renderEmpty("No tracked serials match the current filters.")
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inventory item</TableHead>
                    <TableHead>Serial number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Lot</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serials.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium text-gray-900">{row.inventory_item_name || "Unknown item"}</TableCell>
                      <TableCell>{row.serial_number}</TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusTone(row.status)}`}>
                          {row.status || "unknown"}
                        </span>
                      </TableCell>
                      <TableCell>{row.stock_location_name || "Not assigned"}</TableCell>
                      <TableCell>{row.lot_number || "No lot"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="ledger" className="rounded-2xl border border-gray-200">
            <div className="grid gap-4 border-b border-gray-100 bg-gray-50 p-4 md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_220px]">
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Ledger rows</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingMovements ? "..." : filteredLedgerRows.length}</div>
                <div className="mt-1 text-xs text-gray-500">
                  {loadingMovements ? "..." : `${formatQuantity(ledgerTotalQuantity)} units in scope`}
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Distinct references</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingMovements ? "..." : ledgerReferenceCount}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Touched items</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingMovements ? "..." : ledgerItemCount}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Touched branches</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingMovements ? "..." : ledgerBranchCount}</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inventory-ledger-movement-type">Movement type</Label>
                <Select value={ledgerMovementType} onValueChange={setLedgerMovementType}>
                  <SelectTrigger id="inventory-ledger-movement-type" className="h-11 bg-white">
                    <SelectValue placeholder="All movement types" />
                  </SelectTrigger>
                  <SelectContent>
                    {ledgerMovementOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loadingMovements ? (
              renderEmpty("Loading movement ledger...")
            ) : filteredLedgerRows.length === 0 ? (
              renderEmpty("No stock movements match the current filters.")
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inventory item</TableHead>
                    <TableHead>Movement</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Lot / serial</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLedgerRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium text-gray-900">{row.inventory_item_name || "Unknown item"}</TableCell>
                      <TableCell>{row.movement_type_display || row.movement_type}</TableCell>
                      <TableCell>{row.reference_id ? `${row.reference_type || "ref"}:${row.reference_id}` : row.reference_type || "No reference"}</TableCell>
                      <TableCell>
                        {(row.from_location_name || "Unknown source")} to {(row.to_location_name || "Unknown destination")}
                      </TableCell>
                      <TableCell>
                        {row.lot_number || "No lot"}
                        {row.serial_number ? ` • ${row.serial_number}` : ""}
                      </TableCell>
                      <TableCell className="text-right">{formatQuantity(row.quantity)}</TableCell>
                      <TableCell>
                        {row.occurred_at
                          ? formatDate(row.occurred_at, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "No timestamp"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  PackagePlus,
  ReceiptText,
  Truck,
  Undo2,
  XCircle,
} from "lucide-react"
import { toast } from "react-toastify"
import OperationalStepSection from "@/components/setup/OperationalStepSection"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { CURRENCY_CODES } from "@/lib/currencyCode"
import { formatCurrencyCompact } from "@/lib/currency-utils"
import { extractErrorMessage } from "@/lib/utils"
import { useGetCustomerQuery } from "@/redux/features/company/companyAPISlice"
import {
  SalesOrderStatus,
  type SalesOrderInterface,
  type SalesOrderLineItem,
} from "@/redux/features/orders/orderTypes"
import {
  useCancelSalesOrderMutation,
  useCompleteSalesOrderMutation,
  useCreateSalesOrderLineItemMutation,
  useGetSalesOrderQuery,
  useReserveSalesOrderStockMutation,
  useReleaseSalesOrderStockMutation,
  useShipSalesOrderMutation,
  useUpdateSalesOrderLineItemMutation,
  useUpdateSalesOrderMutation,
  useDeleteSalesOrderLineItemMutation,
} from "@/redux/features/orders/orderAPISlice"
import {
  useGetInventoryDataQuery,
} from "@/redux/features/inventory/inventoryAPiSlice"
import {
  useGetStockItemDataLocationQuery,
  useListReservationsQuery,
} from "@/redux/features/stock/stockAPISlice"
import type { StockReservation } from "@/redux/features/stock/stockTypes"
import { useGetCompanyUsersQuery } from "@/redux/features/users/userApiSlice"

const statusStyles: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  in_progress: "border-blue-200 bg-blue-50 text-blue-800",
  shipped: "border-indigo-200 bg-indigo-50 text-indigo-800",
  completed: "border-green-200 bg-green-50 text-green-800",
  cancelled: "border-gray-200 bg-gray-50 text-gray-700",
}

type SalesOrderOperationsWorkspaceProps = {
  salesOrderId: string
}

type SalesOrderHeaderForm = {
  customer: string
  responsible: string
  order_currency: string
  customer_reference: string
  description: string
  notes: string
  link: string
  delivery_date: string
}

type LineItemForm = {
  inventory_item: string
  quantity: string
  unit_price: string
  discount_rate: string
  tax_rate: string
  description: string
}

type ReservationEntry = {
  quantity: string
  location_id: string
  notes: string
}

type ReservationActionEntry = {
  quantity: string
  notes: string
}

type ShipmentEntry = {
  quantity: string
  location_id: string
  notes: string
}

type ShipmentMeta = {
  shipment_date: string
  delivery_date: string
  tracking_number: string
  invoice_number: string
  link: string
  notes: string
}

const formatStatus = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

const asNumber = (value: string | number | undefined | null) => Number(value ?? 0)

const buildHeaderForm = (order?: SalesOrderInterface | null): SalesOrderHeaderForm => ({
  customer: order?.customer ? String(order.customer) : "",
  responsible: order?.responsible ? String(order.responsible) : "",
  order_currency: order?.order_currency || "NGN",
  customer_reference: order?.customer_reference || "",
  description: order?.description || "",
  notes: order?.notes || "",
  link: order?.link || "",
  delivery_date: order?.delivery_date || "",
})

const emptyLineItemForm: LineItemForm = {
  inventory_item: "",
  quantity: "1",
  unit_price: "0",
  discount_rate: "0",
  tax_rate: "0",
  description: "",
}

const emptyShipmentMeta: ShipmentMeta = {
  shipment_date: "",
  delivery_date: "",
  tracking_number: "",
  invoice_number: "",
  link: "",
  notes: "",
}

const buildReservationEntry = (lineItem: SalesOrderLineItem): ReservationEntry => ({
  quantity: String(Math.max(asNumber(lineItem.reservable_quantity), 0)),
  location_id: "",
  notes: "",
})

const buildReservationActionEntry = (reservation: StockReservation): ReservationActionEntry => ({
  quantity: String(Math.max(asNumber(reservation.reserved_quantity) - asNumber(reservation.fulfilled_quantity), 0)),
  notes: "",
})

const buildShipmentEntry = (lineItem: SalesOrderLineItem): ShipmentEntry => ({
  quantity: String(Math.max(asNumber(lineItem.remaining_quantity), 0)),
  location_id: "",
  notes: "",
})

export default function SalesOrderOperationsWorkspace({ salesOrderId }: SalesOrderOperationsWorkspaceProps) {
  const [headerForm, setHeaderForm] = useState<SalesOrderHeaderForm>(buildHeaderForm())
  const [lineItemForm, setLineItemForm] = useState<LineItemForm>(emptyLineItemForm)
  const [editingLineItemId, setEditingLineItemId] = useState<string | null>(null)
  const [reservationEntries, setReservationEntries] = useState<Record<string, ReservationEntry>>({})
  const [reservationActionEntries, setReservationActionEntries] = useState<Record<string, ReservationActionEntry>>({})
  const [shipmentEntries, setShipmentEntries] = useState<Record<string, ShipmentEntry>>({})
  const [shipmentMeta, setShipmentMeta] = useState<ShipmentMeta>(emptyShipmentMeta)
  const [cancelNotes, setCancelNotes] = useState("")

  const { data: order, isLoading, refetch } = useGetSalesOrderQuery(salesOrderId)
  const { data: customers = [] } = useGetCustomerQuery()
  const { data: users = [] } = useGetCompanyUsersQuery()
  const { data: inventoryItems = [] } = useGetInventoryDataQuery()
  const { data: locations = [] } = useGetStockItemDataLocationQuery()
  const { data: reservations = [], refetch: refetchReservations } = useListReservationsQuery(
    {
      external_order_type: "sales_order_line",
      external_order_id: String(order?.id || ""),
    },
    {
      skip: !order?.id,
    },
  )

  const [updateSalesOrder, { isLoading: savingHeader }] = useUpdateSalesOrderMutation()
  const [createLineItem, { isLoading: creatingLineItem }] = useCreateSalesOrderLineItemMutation()
  const [updateLineItem, { isLoading: updatingLineItem }] = useUpdateSalesOrderLineItemMutation()
  const [deleteLineItem, { isLoading: deletingLineItem }] = useDeleteSalesOrderLineItemMutation()
  const [reserveSalesOrderStock, { isLoading: reservingStock }] = useReserveSalesOrderStockMutation()
  const [releaseSalesOrderStock, { isLoading: releasingReservations }] = useReleaseSalesOrderStockMutation()
  const [shipSalesOrder, { isLoading: shippingOrder }] = useShipSalesOrderMutation()
  const [completeSalesOrder, { isLoading: completingOrder }] = useCompleteSalesOrderMutation()
  const [cancelSalesOrder, { isLoading: cancellingOrder }] = useCancelSalesOrderMutation()

  const lineItems = order?.line_items || []
  const shipments = order?.shipments || []
  const activeCurrency = order?.order_currency || headerForm.order_currency || "NGN"
  const totalQuantity = lineItems.reduce((sum, lineItem) => sum + asNumber(lineItem.quantity), 0)
  const reservedQuantity = lineItems.reduce((sum, lineItem) => sum + asNumber(lineItem.reserved_quantity), 0)
  const shippedQuantity = lineItems.reduce((sum, lineItem) => sum + asNumber(lineItem.shipped_quantity), 0)
  const remainingQuantity = lineItems.reduce((sum, lineItem) => sum + asNumber(lineItem.remaining_quantity), 0)

  const lineItemMap = useMemo(
    () =>
      Object.fromEntries(
        lineItems.map((lineItem) => [
          String(lineItem.id),
          lineItem,
        ]),
      ) as Record<string, SalesOrderLineItem>,
    [lineItems],
  )

  const groupedReservations = useMemo(() => {
    const groups: Record<string, StockReservation[]> = {}
    for (const reservation of reservations) {
      if (!reservation.external_order_line_id) {
        continue
      }
      const key = String(reservation.external_order_line_id)
      groups[key] = [...(groups[key] || []), reservation]
    }
    return groups
  }, [reservations])

  const directShipmentLineItems = useMemo(
    () =>
      lineItems.filter(
        (lineItem) => asNumber(lineItem.remaining_quantity) > 0 && asNumber(lineItem.reserved_quantity) <= 0,
      ),
    [lineItems],
  )

  const selectedInventoryItem = useMemo(
    () => inventoryItems.find((item) => String(item.id) === lineItemForm.inventory_item),
    [inventoryItems, lineItemForm.inventory_item],
  )

  useEffect(() => {
    if (order) {
      setHeaderForm(buildHeaderForm(order))
    }
  }, [order])

  useEffect(() => {
    setReservationEntries((current) => {
      const next = { ...current }
      for (const lineItem of lineItems) {
        if (!next[String(lineItem.id)]) {
          next[String(lineItem.id)] = buildReservationEntry(lineItem)
        }
      }
      return next
    })

    setShipmentEntries((current) => {
      const next = { ...current }
      for (const lineItem of lineItems) {
        if (!next[String(lineItem.id)]) {
          next[String(lineItem.id)] = buildShipmentEntry(lineItem)
        }
      }
      return next
    })
  }, [lineItems])

  useEffect(() => {
    setReservationActionEntries((current) => {
      const next = { ...current }
      for (const reservation of reservations) {
        if (!next[String(reservation.id)]) {
          next[String(reservation.id)] = buildReservationActionEntry(reservation)
        }
      }
      return next
    })
  }, [reservations])

  const setReservationField = (lineItemId: string, field: keyof ReservationEntry, value: string) => {
    setReservationEntries((current) => ({
      ...current,
      [lineItemId]: {
        ...(current[lineItemId] || buildReservationEntry(lineItemMap[lineItemId])),
        [field]: value,
      },
    }))
  }

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

  const setShipmentField = (lineItemId: string, field: keyof ShipmentEntry, value: string) => {
    setShipmentEntries((current) => ({
      ...current,
      [lineItemId]: {
        ...(current[lineItemId] || buildShipmentEntry(lineItemMap[lineItemId])),
        [field]: value,
      },
    }))
  }

  const refreshOrderScope = async () => {
    await Promise.all([refetch(), refetchReservations()])
  }

  const runWorkflowAction = async (action: () => Promise<unknown>, successMessage: string, fields: string[] = ["error", "detail"]) => {
    try {
      await action()
      toast.success(successMessage)
      await refreshOrderScope()
    } catch (error) {
      toast.error(extractErrorMessage(error, fields))
    }
  }

  const handleSaveHeader = async () => {
    if (!order) {
      return
    }

    try {
      await updateSalesOrder({
        id: order.id,
        data: {
          customer: headerForm.customer || undefined,
          responsible: headerForm.responsible || undefined,
          order_currency: headerForm.order_currency || undefined,
          customer_reference: headerForm.customer_reference || undefined,
          description: headerForm.description || undefined,
          notes: headerForm.notes || undefined,
          link: headerForm.link || undefined,
          delivery_date: headerForm.delivery_date || undefined,
        },
      }).unwrap()
      toast.success("Sales order updated")
      await refreshOrderScope()
    } catch (error) {
      toast.error(extractErrorMessage(error, ["customer", "delivery_date", "description"]))
    }
  }

  const handleSubmitLineItem = async () => {
    if (!order) {
      return
    }

    if (!lineItemForm.inventory_item) {
      toast.error("Select an inventory item before saving the line item.")
      return
    }

    const payload = {
      inventory_item: lineItemForm.inventory_item,
      quantity: Number(lineItemForm.quantity || "0"),
      unit_price: Number(lineItemForm.unit_price || "0"),
      discount_rate: Number(lineItemForm.discount_rate || "0"),
      tax_rate: Number(lineItemForm.tax_rate || "0"),
      description: lineItemForm.description || undefined,
    }

    try {
      if (editingLineItemId) {
        await updateLineItem({
          id: order.id,
          line_item_id: editingLineItemId,
          data: payload,
        }).unwrap()
        toast.success("Line item updated")
      } else {
        await createLineItem({
          id: order.id,
          data: payload,
        }).unwrap()
        toast.success("Line item added")
      }
      setEditingLineItemId(null)
      setLineItemForm(emptyLineItemForm)
      await refreshOrderScope()
    } catch (error) {
      toast.error(extractErrorMessage(error, ["inventory_item", "quantity", "unit_price"]))
    }
  }

  const handleEditLineItem = (lineItem: SalesOrderLineItem) => {
    setEditingLineItemId(String(lineItem.id))
    setLineItemForm({
      inventory_item: lineItem.inventory_item ? String(lineItem.inventory_item) : "",
      quantity: String(lineItem.quantity ?? "1"),
      unit_price: String(lineItem.unit_price ?? "0"),
      discount_rate: String(lineItem.discount_rate ?? "0"),
      tax_rate: String(lineItem.tax_rate ?? "0"),
      description: lineItem.description || "",
    })
  }

  const handleDeleteLineItem = async (lineItemId: string) => {
    if (!order) {
      return
    }

    try {
      await deleteLineItem({
        id: order.id,
        line_item_id: lineItemId,
      }).unwrap()
      toast.success("Line item removed")
      await refreshOrderScope()
    } catch (error) {
      toast.error(extractErrorMessage(error, ["line_item_id", "error", "detail"]))
    }
  }

  const handleReserveStock = async () => {
    if (!order) {
      return
    }

    const reservation_items = lineItems.flatMap((lineItem) => {
        if (lineItem.id === undefined) {
          return []
        }
        const entry = reservationEntries[String(lineItem.id)]
        const quantity = Number(entry?.quantity || "0")
        if (!entry || quantity <= 0 || !entry.location_id) {
          return []
        }
        return [{
          line_item_id: lineItem.id,
          location_id: entry.location_id,
          quantity,
          notes: entry.notes || undefined,
        }]
      })

    if (!reservation_items.length) {
      toast.error("Enter at least one reservation quantity and stock location.")
      return
    }

    await runWorkflowAction(
      () =>
        reserveSalesOrderStock({
          id: order.id,
          data: {
            reservation_items,
            notes: shipmentMeta.notes || undefined,
          },
        }).unwrap(),
      "Stock reserved for sales order",
      ["error", "reservation_items", "detail"],
    )
  }

  const handleReleaseReservations = async () => {
    if (!order) {
      return
    }

    const reservation_items = reservations.flatMap((reservation) => {
        const entry = reservationActionEntries[String(reservation.id)]
        const quantity = Number(entry?.quantity || "0")
        if (!entry || quantity <= 0) {
          return []
        }
        return [{
          reservation_id: reservation.id,
          quantity,
          notes: entry.notes || undefined,
        }]
      })

    if (!reservation_items.length) {
      toast.error("Enter at least one reservation quantity to release.")
      return
    }

    await runWorkflowAction(
      () =>
        releaseSalesOrderStock({
          id: order.id,
          data: {
            reservation_items,
            notes: shipmentMeta.notes || undefined,
          },
        }).unwrap(),
      "Reservations released",
      ["error", "reservation_items", "detail"],
    )
  }

  const handleShipOrder = async () => {
    if (!order) {
      return
    }

    const reservedShipments = reservations.flatMap((reservation) => {
        const entry = reservationActionEntries[String(reservation.id)]
        const quantity = Number(entry?.quantity || "0")
        if (!entry || quantity <= 0) {
          return []
        }
        return [{
          reservation_id: reservation.id,
          quantity,
          notes: entry.notes || undefined,
        }]
      })

    const directShipments = directShipmentLineItems.flatMap((lineItem) => {
        if (lineItem.id === undefined) {
          return []
        }
        const entry = shipmentEntries[String(lineItem.id)]
        const quantity = Number(entry?.quantity || "0")
        if (!entry || quantity <= 0 || !entry.location_id) {
          return []
        }
        return [{
          line_item_id: lineItem.id,
          location_id: entry.location_id,
          quantity,
          notes: entry.notes || undefined,
        }]
      })

    const shipment_items = [...reservedShipments, ...directShipments]
    if (!shipment_items.length) {
      toast.error("Enter reservation or direct shipment quantities before shipping.")
      return
    }

    await runWorkflowAction(
      () =>
        shipSalesOrder({
          id: order.id,
          data: {
            shipment_items,
            shipment_date: shipmentMeta.shipment_date || undefined,
            delivery_date: shipmentMeta.delivery_date || undefined,
            tracking_number: shipmentMeta.tracking_number || undefined,
            invoice_number: shipmentMeta.invoice_number || undefined,
            link: shipmentMeta.link || undefined,
            notes: shipmentMeta.notes || undefined,
          },
        }).unwrap(),
      "Shipment recorded",
      ["error", "shipment_items", "detail"],
    )
  }

  if (isLoading || !order) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-10 text-center text-sm text-gray-500">Loading sales order workbench...</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 lg:px-8">
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100 p-6 text-left text-inherit">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Link href="/order/sales" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4" />
                Back to sales orders
              </Link>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <CardTitle className="text-3xl tracking-tight">{order.reference || `Sales order ${order.id}`}</CardTitle>
                  <Badge variant="outline" className={statusStyles[order.status] || "border-gray-200 bg-gray-50 text-gray-700"}>
                    {formatStatus(order.status)}
                  </Badge>
                </div>
                <CardDescription className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                  Manage the customer order, line items, reservation flow, shipment, and completion from one operational workbench.
                </CardDescription>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Line items</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{lineItems.length}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Reserved</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{reservedQuantity}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Total value</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">
                  {formatCurrencyCompact(activeCurrency, asNumber(order.total_price))}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-6 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Customer</div>
            <div className="mt-2 text-lg font-semibold text-gray-900">{order.customer_name || "Not assigned"}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Delivery date</div>
            <div className="mt-2 text-lg font-semibold text-gray-900">{order.delivery_date || "Not scheduled"}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Shipped quantity</div>
            <div className="mt-2 text-lg font-semibold text-gray-900">{shippedQuantity}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Remaining</div>
            <div className="mt-2 text-lg font-semibold text-gray-900">{remainingQuantity}</div>
          </div>
        </CardContent>
      </Card>

      <OperationalStepSection
        id="header"
        step={1}
        title="Maintain the customer and ownership context"
        description="Keep the customer, owner, delivery target, and commercial notes current before changing operational stock state."
        helper="This header should stay trustworthy while the order moves through reservation and shipping."
        status={order.customer ? "complete" : "in_progress"}
        facts={[
          { label: "Customer", value: order.customer_name || "Not assigned" },
          { label: "Responsible", value: order.responsible_details?.first_name || "Unassigned" },
          { label: "Currency", value: activeCurrency },
        ]}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="so-customer">Customer</Label>
            <Select value={headerForm.customer} onValueChange={(value) => setHeaderForm((current) => ({ ...current, customer: value }))}>
              <SelectTrigger id="so-customer">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={String(customer.id)}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="so-responsible">Responsible owner</Label>
            <Select value={headerForm.responsible} onValueChange={(value) => setHeaderForm((current) => ({ ...current, responsible: value }))}>
              <SelectTrigger id="so-responsible">
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {[user.user?.first_name, user.user?.last_name].filter(Boolean).join(" ") || user.user?.email || "Unknown user"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="so-currency">Order currency</Label>
            <Select value={headerForm.order_currency} onValueChange={(value) => setHeaderForm((current) => ({ ...current, order_currency: value }))}>
              <SelectTrigger id="so-currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_CODES.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="so-customer-reference">Customer reference</Label>
            <Input
              id="so-customer-reference"
              value={headerForm.customer_reference}
              onChange={(event) => setHeaderForm((current) => ({ ...current, customer_reference: event.target.value }))}
            />
          </div>
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="so-description">Description</Label>
            <Input
              id="so-description"
              value={headerForm.description}
              onChange={(event) => setHeaderForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="What is this order for?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="so-delivery-date">Expected delivery date</Label>
            <Input
              id="so-delivery-date"
              type="date"
              value={headerForm.delivery_date}
              onChange={(event) => setHeaderForm((current) => ({ ...current, delivery_date: event.target.value }))}
            />
          </div>
          <div className="space-y-2 xl:col-span-3">
            <Label htmlFor="so-link">External link</Label>
            <Input
              id="so-link"
              value={headerForm.link}
              onChange={(event) => setHeaderForm((current) => ({ ...current, link: event.target.value }))}
              placeholder="Optional sales portal or quote link"
            />
          </div>
          <div className="space-y-2 xl:col-span-3">
            <Label htmlFor="so-notes">Internal notes</Label>
            <Textarea
              id="so-notes"
              rows={4}
              value={headerForm.notes}
              onChange={(event) => setHeaderForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Capture fulfillment instructions, customer notes, or delivery context"
            />
          </div>
        </div>
        <div className="mt-6">
          <Button onClick={handleSaveHeader} disabled={savingHeader}>
            {savingHeader ? "Saving..." : "Save sales order header"}
          </Button>
        </div>
      </OperationalStepSection>

      <OperationalStepSection
        id="line-items"
        step={2}
        title="Add the inventory items that need to be fulfilled"
        description="Build the commercial order against the real inventory items that will be reserved, shipped, and completed downstream."
        helper="Line items should be stable before you reserve or ship stock."
        status={lineItems.length > 0 ? "complete" : "in_progress"}
        facts={[
          { label: "Line items", value: lineItems.length },
          { label: "Ordered quantity", value: totalQuantity },
          { label: "Shipped quantity", value: shippedQuantity },
        ]}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="sales-inventory-item">Inventory item</Label>
            <Select
              value={lineItemForm.inventory_item}
              onValueChange={(value) => setLineItemForm((current) => ({ ...current, inventory_item: value }))}
            >
              <SelectTrigger id="sales-inventory-item">
                <SelectValue placeholder="Select inventory item" />
              </SelectTrigger>
              <SelectContent>
                {inventoryItems.map((inventoryItem) => (
                  <SelectItem key={inventoryItem.id} value={String(inventoryItem.id)}>
                    {inventoryItem.name || inventoryItem.sku_snapshot || inventoryItem.barcode_snapshot || String(inventoryItem.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sales-line-quantity">Quantity</Label>
            <Input
              id="sales-line-quantity"
              type="number"
              min="1"
              step="0.01"
              value={lineItemForm.quantity}
              onChange={(event) => setLineItemForm((current) => ({ ...current, quantity: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sales-line-unit-price">Unit price</Label>
            <Input
              id="sales-line-unit-price"
              type="number"
              min="0"
              step="0.01"
              value={lineItemForm.unit_price}
              onChange={(event) => setLineItemForm((current) => ({ ...current, unit_price: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sales-line-tax-rate">Tax rate (%)</Label>
            <Input
              id="sales-line-tax-rate"
              type="number"
              min="0"
              step="0.01"
              value={lineItemForm.tax_rate}
              onChange={(event) => setLineItemForm((current) => ({ ...current, tax_rate: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sales-line-discount-rate">Discount rate (%)</Label>
            <Input
              id="sales-line-discount-rate"
              type="number"
              min="0"
              step="0.01"
              value={lineItemForm.discount_rate}
              onChange={(event) => setLineItemForm((current) => ({ ...current, discount_rate: event.target.value }))}
            />
          </div>
          <div className="space-y-2 xl:col-span-4">
            <Label htmlFor="sales-line-description">Line description</Label>
            <Textarea
              id="sales-line-description"
              rows={3}
              value={lineItemForm.description}
              onChange={(event) => setLineItemForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Optional line-specific note"
            />
          </div>
        </div>

        {selectedInventoryItem ? (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            Selected inventory item:
            {" "}
            <span className="font-semibold text-gray-900">{selectedInventoryItem.name}</span>
            {" "}
            · Current stock
            {" "}
            <span className="font-semibold text-gray-900">{selectedInventoryItem.current_stock_level ?? selectedInventoryItem.current_stock ?? 0}</span>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={handleSubmitLineItem} disabled={creatingLineItem || updatingLineItem}>
            {editingLineItemId ? "Save line item" : "Add line item"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setEditingLineItemId(null)
              setLineItemForm(emptyLineItemForm)
            }}
            disabled={creatingLineItem || updatingLineItem}
          >
            {editingLineItemId ? "Cancel edit" : "Reset form"}
          </Button>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Inventory item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Reserved</TableHead>
                <TableHead>Shipped</TableHead>
                <TableHead>Unit price</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-gray-500">
                    No line items yet. Add the inventory items that need to be reserved and shipped for this customer.
                  </TableCell>
                </TableRow>
              ) : (
                lineItems.map((lineItem) => (
                  <TableRow key={lineItem.id}>
                    <TableCell className="font-medium text-gray-900">{lineItem.inventory_name || lineItem.inventory_item || `Line ${lineItem.id}`}</TableCell>
                    <TableCell>{lineItem.quantity}</TableCell>
                    <TableCell>{lineItem.reserved_quantity ?? 0}</TableCell>
                    <TableCell>{lineItem.shipped_quantity ?? 0}</TableCell>
                    <TableCell>{formatCurrencyCompact(activeCurrency, asNumber(lineItem.unit_price))}</TableCell>
                    <TableCell>{formatCurrencyCompact(activeCurrency, asNumber(lineItem.total_price))}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditLineItem(lineItem)}>
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteLineItem(String(lineItem.id))} disabled={deletingLineItem}>
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </OperationalStepSection>

      <OperationalStepSection
        id="reserve-ship"
        step={3}
        title="Reserve inventory, release reservations, and ship"
        description="Move the order through its stock lifecycle from reservation to shipment. Use reservation for traceability, or direct ship only when nothing is reserved."
        helper="The order will move into progress as soon as reservation or shipment begins."
        status={
          order.status === SalesOrderStatus.completed
            ? "complete"
            : [SalesOrderStatus.in_progress, SalesOrderStatus.shipped].includes(order.status as never)
              ? "in_progress"
              : "pending"
        }
        facts={[
          { label: "Reservations", value: reservations.length },
          { label: "Shipments", value: shipments.length },
          { label: "Remaining quantity", value: remainingQuantity },
        ]}
      >
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-gray-200 shadow-none">
            <CardHeader className="text-left text-inherit">
              <CardTitle className="text-lg">Reserve stock</CardTitle>
              <CardDescription>Assign a stock location and reserve the quantities that should be held for this customer order.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {lineItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                  Add line items before reserving stock.
                </div>
              ) : (
                lineItems.map((lineItem) => {
                  const entry = reservationEntries[String(lineItem.id)] || buildReservationEntry(lineItem)
                  return (
                    <div key={lineItem.id} className="rounded-2xl border border-gray-200 p-4">
                      <div className="font-semibold text-gray-900">{lineItem.inventory_name || lineItem.inventory_item || `Line ${lineItem.id}`}</div>
                      <div className="mt-1 text-sm text-gray-600">
                        Reservable {lineItem.reservable_quantity ?? 0} · Already reserved {lineItem.reserved_quantity ?? 0}
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Reserve quantity</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={entry.quantity}
                            onChange={(event) => setReservationField(String(lineItem.id), "quantity", event.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Stock location</Label>
                          <Select value={entry.location_id} onValueChange={(value) => setReservationField(String(lineItem.id), "location_id", value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                              {locations.map((location) => (
                                <SelectItem key={location.id} value={String(location.id)}>
                                  {location.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Reservation note</Label>
                          <Input
                            value={entry.notes}
                            onChange={(event) => setReservationField(String(lineItem.id), "notes", event.target.value)}
                            placeholder="Optional reservation note"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <Button onClick={handleReserveStock} disabled={reservingStock || lineItems.length === 0}>
                <PackagePlus className="mr-2 h-4 w-4" />
                {reservingStock ? "Reserving..." : "Reserve selected stock"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-none">
            <CardHeader className="text-left text-inherit">
              <CardTitle className="text-lg">Ship or release reservations</CardTitle>
              <CardDescription>Ship from active reservations when available. If a line has no reservation, it can ship directly from a stock location.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2">
                  <Label>Shipment date</Label>
                  <Input
                    type="date"
                    value={shipmentMeta.shipment_date}
                    onChange={(event) => setShipmentMeta((current) => ({ ...current, shipment_date: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Delivery date</Label>
                  <Input
                    type="date"
                    value={shipmentMeta.delivery_date}
                    onChange={(event) => setShipmentMeta((current) => ({ ...current, delivery_date: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tracking number</Label>
                  <Input
                    value={shipmentMeta.tracking_number}
                    onChange={(event) => setShipmentMeta((current) => ({ ...current, tracking_number: event.target.value }))}
                    placeholder="Optional tracking number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Invoice number</Label>
                  <Input
                    value={shipmentMeta.invoice_number}
                    onChange={(event) => setShipmentMeta((current) => ({ ...current, invoice_number: event.target.value }))}
                    placeholder="Optional invoice number"
                  />
                </div>
                <div className="space-y-2 xl:col-span-2">
                  <Label>External link</Label>
                  <Input
                    value={shipmentMeta.link}
                    onChange={(event) => setShipmentMeta((current) => ({ ...current, link: event.target.value }))}
                    placeholder="Optional carrier or fulfillment link"
                  />
                </div>
                <div className="space-y-2 md:col-span-2 xl:col-span-3">
                  <Label>Shipment note</Label>
                  <Textarea
                    rows={3}
                    value={shipmentMeta.notes}
                    onChange={(event) => setShipmentMeta((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Shared note for release or shipment actions"
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-gray-200 p-4">
                <div className="text-sm font-semibold text-gray-900">Active reservations</div>
                {reservations.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                    No active reservations yet. Reserve stock first or ship directly from the lines below.
                  </div>
                ) : (
                  reservations.map((reservation) => {
                    const entry = reservationActionEntries[String(reservation.id)] || buildReservationActionEntry(reservation)
                    const lineItem = reservation.external_order_line_id ? lineItemMap[String(reservation.external_order_line_id)] : undefined
                    return (
                      <div key={reservation.id} className="rounded-2xl border border-gray-200 p-4">
                        <div className="font-semibold text-gray-900">{lineItem?.inventory_name || reservation.inventory_item_name || `Reservation ${reservation.id}`}</div>
                        <div className="mt-1 text-sm text-gray-600">
                          {reservation.location_name || reservation.stock_location} · Reserved {reservation.reserved_quantity} · Fulfilled {reservation.fulfilled_quantity}
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={entry.quantity}
                              onChange={(event) => setReservationActionField(String(reservation.id), "quantity", event.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Action note</Label>
                            <Input
                              value={entry.notes}
                              onChange={(event) => setReservationActionField(String(reservation.id), "notes", event.target.value)}
                              placeholder="Optional note"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="space-y-4 rounded-2xl border border-gray-200 p-4">
                <div className="text-sm font-semibold text-gray-900">Direct shipping (no reservation)</div>
                {directShipmentLineItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                    No direct-shipment lines available. Lines with reservations should ship from the reservation list above.
                  </div>
                ) : (
                  directShipmentLineItems.map((lineItem) => {
                    const entry = shipmentEntries[String(lineItem.id)] || buildShipmentEntry(lineItem)
                    return (
                      <div key={lineItem.id} className="rounded-2xl border border-gray-200 p-4">
                        <div className="font-semibold text-gray-900">{lineItem.inventory_name || lineItem.inventory_item || `Line ${lineItem.id}`}</div>
                        <div className="mt-1 text-sm text-gray-600">
                          Remaining {lineItem.remaining_quantity} · Reserved {lineItem.reserved_quantity ?? 0}
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Ship quantity</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={entry.quantity}
                              onChange={(event) => setShipmentField(String(lineItem.id), "quantity", event.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Stock location</Label>
                            <Select value={entry.location_id} onValueChange={(value) => setShipmentField(String(lineItem.id), "location_id", value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select location" />
                              </SelectTrigger>
                              <SelectContent>
                                {locations.map((location) => (
                                  <SelectItem key={location.id} value={String(location.id)}>
                                    {location.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>Shipment note</Label>
                            <Input
                              value={entry.notes}
                              onChange={(event) => setShipmentField(String(lineItem.id), "notes", event.target.value)}
                              placeholder="Optional line shipment note"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={handleReleaseReservations} disabled={releasingReservations || reservations.length === 0}>
                  <Undo2 className="mr-2 h-4 w-4" />
                  {releasingReservations ? "Releasing..." : "Release selected reservations"}
                </Button>
                <Button onClick={handleShipOrder} disabled={shippingOrder || (reservations.length === 0 && directShipmentLineItems.length === 0)}>
                  <Truck className="mr-2 h-4 w-4" />
                  {shippingOrder ? "Shipping..." : "Ship selected items"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </OperationalStepSection>

      <OperationalStepSection
        id="close-order"
        step={4}
        title="Review shipment history and close the order"
        description="Finish the sales order only when everything has shipped. Cancellation is still available until stock has been shipped."
        helper="Shipment history below is the operational audit trail for the order."
        status={order.status === SalesOrderStatus.completed ? "complete" : shippedQuantity > 0 ? "in_progress" : "pending"}
        facts={[
          { label: "Shipments", value: shipments.length },
          { label: "Current status", value: formatStatus(order.status) },
          { label: "Remaining quantity", value: remainingQuantity },
        ]}
      >
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-gray-200 shadow-none">
            <CardHeader className="text-left text-inherit">
              <CardTitle className="text-lg">Shipment history</CardTitle>
              <CardDescription>Every shipment against this order is captured here.</CardDescription>
            </CardHeader>
            <CardContent>
              {shipments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                  No shipments have been recorded yet.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Shipment date</TableHead>
                        <TableHead>Tracking</TableHead>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Lines</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shipments.map((shipment) => (
                        <TableRow key={shipment.id}>
                          <TableCell className="font-medium text-gray-900">{shipment.reference}</TableCell>
                          <TableCell>{shipment.shipment_date || "Not set"}</TableCell>
                          <TableCell>{shipment.tracking_number || "—"}</TableCell>
                          <TableCell>{shipment.invoice_number || "—"}</TableCell>
                          <TableCell>{shipment.lines?.length ?? 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-none">
            <CardHeader className="text-left text-inherit">
              <CardTitle className="text-lg">Completion and cancellation</CardTitle>
              <CardDescription>Close the order only when every line item is fully shipped.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sales-cancel-notes">Cancellation notes</Label>
                <Textarea
                  id="sales-cancel-notes"
                  rows={4}
                  value={cancelNotes}
                  onChange={(event) => setCancelNotes(event.target.value)}
                  placeholder="Explain why the order is being cancelled"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => runWorkflowAction(() => completeSalesOrder(order.id).unwrap(), "Sales order completed")}
                  disabled={order.status !== SalesOrderStatus.shipped || completingOrder}
                >
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  {completingOrder ? "Completing..." : "Complete sales order"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    runWorkflowAction(
                      () => cancelSalesOrder({ id: order.id, notes: cancelNotes || undefined }).unwrap(),
                      "Sales order cancelled",
                    )
                  }
                  disabled={[SalesOrderStatus.completed, SalesOrderStatus.cancelled].includes(order.status as never) || cancellingOrder}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {cancellingOrder ? "Cancelling..." : "Cancel sales order"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </OperationalStepSection>
    </div>
  )
}

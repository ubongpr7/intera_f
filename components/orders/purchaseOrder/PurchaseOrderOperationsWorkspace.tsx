"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, CheckCircle2, ClipboardCheck, Mail, PackagePlus, ReceiptText, Truck, Undo2, XCircle } from "lucide-react"
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
import { useGetSupplersQuery } from "@/redux/features/company/companyAPISlice"
import {
  type PurchaseOrderInterface,
  type PurchaseOrderLineItem,
  PurchaseOrderStatus,
} from "@/redux/features/orders/orderTypes"
import {
  useApprovePurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  useCompletePurchaseOrderMutation,
  useCreateReturnOrderFromPurchaseOrderMutation,
  useCreatePurchaseOrderLineItemMutation,
  useGetPurchaseOrderQuery,
  useIssuePurchaseOrderMutation,
  useLazyDownloadPurchaseOrderPdfQuery,
  useReceivePurchaseOrderItemsMutation,
  useResendPurchaseOrderEmailMutation,
  useUpdatePurchaseOrderMutation,
  useUpdatePurchaseOrderLineItemMutation,
  useDeletePurchaseOrderLineItemMutation,
} from "@/redux/features/orders/orderAPISlice"
import { useGetStockItemDataLocationQuery, useGetStockItemDataQuery } from "@/redux/features/stock/stockAPISlice"
import { useGetCompanyUsersQuery } from "@/redux/features/users/userApiSlice"

const statusStyles: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  approved: "border-blue-200 bg-blue-50 text-blue-800",
  issued: "border-indigo-200 bg-indigo-50 text-indigo-800",
  received: "border-violet-200 bg-violet-50 text-violet-800",
  completed: "border-green-200 bg-green-50 text-green-800",
  cancelled: "border-gray-200 bg-gray-50 text-gray-700",
}

type PurchaseOrderOperationsWorkspaceProps = {
  purchaseOrderId: string
}

type PurchaseOrderHeaderForm = {
  supplier: string
  responsible: string
  order_currency: string
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
  expiry_date: string
  manufactured_date: string
}

type ReceiveEntry = {
  quantity_received: string
  location_id: string
  lot_number: string
  manufactured_date: string
  expiry_date: string
  notes: string
}

type ReturnEntry = {
  quantity: string
  reason: string
}

const formatStatus = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

const asNumber = (value: string | number | undefined | null) => Number(value ?? 0)

const buildHeaderForm = (order?: PurchaseOrderInterface | null): PurchaseOrderHeaderForm => ({
  supplier: order?.supplier ? String(order.supplier) : "",
  responsible: order?.responsible ? String(order.responsible) : "",
  order_currency: order?.order_currency || "NGN",
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
  expiry_date: "",
  manufactured_date: "",
}

const buildReceiveEntry = (lineItem: PurchaseOrderLineItem): ReceiveEntry => ({
  quantity_received: String(Math.max(asNumber(lineItem.quantity) - asNumber(lineItem.quantity_received), 0)),
  location_id: "",
  lot_number: lineItem.batch_number || "",
  manufactured_date: lineItem.manufactured_date || "",
  expiry_date: lineItem.expiry_date || "",
  notes: "",
})

const buildReturnEntry = (lineItem: PurchaseOrderLineItem): ReturnEntry => ({
  quantity: String(Math.max(asNumber(lineItem.quantity_received), 0)),
  reason: "",
})

export default function PurchaseOrderOperationsWorkspace({ purchaseOrderId }: PurchaseOrderOperationsWorkspaceProps) {
  const router = useRouter()
  const [headerForm, setHeaderForm] = useState<PurchaseOrderHeaderForm>(buildHeaderForm())
  const [lineItemForm, setLineItemForm] = useState<LineItemForm>(emptyLineItemForm)
  const [editingLineItemId, setEditingLineItemId] = useState<string | null>(null)
  const [receiveEntries, setReceiveEntries] = useState<Record<string, ReceiveEntry>>({})
  const [returnEntries, setReturnEntries] = useState<Record<string, ReturnEntry>>({})
  const [notifySupplier, setNotifySupplier] = useState(true)
  const [cancelNotes, setCancelNotes] = useState("")
  const [returnReason, setReturnReason] = useState("")

  const { data: order, isLoading, refetch } = useGetPurchaseOrderQuery(purchaseOrderId)
  const { data: suppliers = [] } = useGetSupplersQuery()
  const { data: users = [] } = useGetCompanyUsersQuery()
  const { data: inventoryItems = [] } = useGetStockItemDataQuery()
  const { data: locations = [] } = useGetStockItemDataLocationQuery()

  const [updatePurchaseOrder, { isLoading: savingHeader }] = useUpdatePurchaseOrderMutation()
  const [createLineItem, { isLoading: creatingLineItem }] = useCreatePurchaseOrderLineItemMutation()
  const [updateLineItem, { isLoading: updatingLineItem }] = useUpdatePurchaseOrderLineItemMutation()
  const [deleteLineItem, { isLoading: deletingLineItem }] = useDeletePurchaseOrderLineItemMutation()
  const [approvePurchaseOrder, { isLoading: approvingOrder }] = useApprovePurchaseOrderMutation()
  const [issuePurchaseOrder, { isLoading: issuingOrder }] = useIssuePurchaseOrderMutation()
  const [receivePurchaseOrderItems, { isLoading: receivingItems }] = useReceivePurchaseOrderItemsMutation()
  const [completePurchaseOrder, { isLoading: completingOrder }] = useCompletePurchaseOrderMutation()
  const [cancelPurchaseOrder, { isLoading: cancellingOrder }] = useCancelPurchaseOrderMutation()
  const [createReturnOrderFromPurchaseOrder, { isLoading: creatingReturnOrder }] = useCreateReturnOrderFromPurchaseOrderMutation()
  const [downloadPurchaseOrderPdf, { isFetching: isDownloadingPdf }] = useLazyDownloadPurchaseOrderPdfQuery()
  const [resendPurchaseOrderEmail, { isLoading: resendingEmail }] = useResendPurchaseOrderEmailMutation()

  const lineItems = order?.line_items || []
  const activeCurrency = order?.order_currency || headerForm.order_currency || "NGN"
  const totalQuantity = lineItems.reduce((sum, lineItem) => sum + asNumber(lineItem.quantity), 0)
  const receivedQuantity = lineItems.reduce((sum, lineItem) => sum + asNumber(lineItem.quantity_received), 0)
  const remainingQuantity = Math.max(totalQuantity - receivedQuantity, 0)

  useEffect(() => {
    if (order) {
      setHeaderForm(buildHeaderForm(order))
      setReceiveEntries((current) => {
        const next = { ...current }
        for (const lineItem of lineItems) {
          if (!next[String(lineItem.id)]) {
            next[String(lineItem.id)] = buildReceiveEntry(lineItem)
          }
        }
        return next
      })
      setReturnEntries((current) => {
        const next = { ...current }
        for (const lineItem of lineItems) {
          if (!next[String(lineItem.id)]) {
            next[String(lineItem.id)] = buildReturnEntry(lineItem)
          }
        }
        return next
      })
    }
  }, [lineItems, order])

  const editableLineItems = useMemo(
    () =>
      lineItems.map((lineItem) => ({
        ...lineItem,
        displayName:
          lineItem.inventory_item_name ||
          lineItem.inventory_item_details?.name ||
          `Line ${lineItem.id}`,
      })),
    [lineItems],
  )

  const setReceiveField = (lineItemId: string, field: keyof ReceiveEntry, value: string) => {
    setReceiveEntries((current) => ({
      ...current,
      [lineItemId]: {
        ...(current[lineItemId] || buildReceiveEntry(lineItems.find((item) => String(item.id) === lineItemId) as PurchaseOrderLineItem)),
        [field]: value,
      },
    }))
  }

  const setReturnField = (lineItemId: string, field: keyof ReturnEntry, value: string) => {
    setReturnEntries((current) => ({
      ...current,
      [lineItemId]: {
        ...(current[lineItemId] || buildReturnEntry(lineItems.find((item) => String(item.id) === lineItemId) as PurchaseOrderLineItem)),
        [field]: value,
      },
    }))
  }

  const handleSaveHeader = async () => {
    if (!order) {
      return
    }

    try {
      await updatePurchaseOrder({
        id: order.id,
        data: {
          supplier: headerForm.supplier || undefined,
          responsible: headerForm.responsible || undefined,
          order_currency: headerForm.order_currency || undefined,
          description: headerForm.description || undefined,
          notes: headerForm.notes || undefined,
          link: headerForm.link || undefined,
          delivery_date: headerForm.delivery_date || undefined,
        },
      }).unwrap()
      toast.success("Purchase order updated")
      await refetch()
    } catch (error) {
      toast.error(extractErrorMessage(error, ["supplier", "delivery_date", "description"]))
    }
  }

  const handleSubmitLineItem = async () => {
    if (!order) {
      return
    }

    if (!lineItemForm.inventory_item) {
      toast.error("Select an inventory item before saving.")
      return
    }

    const payload = {
      inventory_item: lineItemForm.inventory_item,
      quantity: Number(lineItemForm.quantity || "0"),
      unit_price: Number(lineItemForm.unit_price || "0"),
      discount_rate: Number(lineItemForm.discount_rate || "0"),
      tax_rate: Number(lineItemForm.tax_rate || "0"),
      description: lineItemForm.description || undefined,
      expiry_date: lineItemForm.expiry_date || undefined,
      manufactured_date: lineItemForm.manufactured_date || undefined,
    }

    try {
      if (editingLineItemId) {
        await updateLineItem({
          reference: order.id,
          id: editingLineItemId,
          data: payload,
        }).unwrap()
        toast.success("Line item updated")
      } else {
        await createLineItem({
          purchase_order_id: order.id,
          data: payload,
        }).unwrap()
        toast.success("Line item added")
      }
      setEditingLineItemId(null)
      setLineItemForm(emptyLineItemForm)
      await refetch()
    } catch (error) {
      toast.error(extractErrorMessage(error, ["inventory_item", "quantity", "unit_price"]))
    }
  }

  const handleEditLineItem = (lineItem: PurchaseOrderLineItem) => {
    setEditingLineItemId(String(lineItem.id))
    setLineItemForm({
      inventory_item: lineItem.inventory_item ? String(lineItem.inventory_item) : "",
      quantity: String(lineItem.quantity ?? "1"),
      unit_price: String(lineItem.unit_price ?? "0"),
      discount_rate: String(lineItem.discount_rate ?? "0"),
      tax_rate: String(lineItem.tax_rate ?? "0"),
      description: lineItem.description || "",
      expiry_date: lineItem.expiry_date || "",
      manufactured_date: lineItem.manufactured_date || "",
    })
  }

  const handleDeleteLineItem = async (lineItemId: string) => {
    if (!order) {
      return
    }

    try {
      await deleteLineItem({
        reference: order.id,
        id: lineItemId,
      }).unwrap()
      toast.success("Line item removed")
      await refetch()
    } catch (error) {
      toast.error(extractErrorMessage(error, ["line_item_id"]))
    }
  }

  const runWorkflowAction = async (action: () => Promise<unknown>, successMessage: string, fieldErrors: string[] = ["error", "detail"]) => {
    try {
      await action()
      toast.success(successMessage)
      await refetch()
    } catch (error) {
      toast.error(extractErrorMessage(error, fieldErrors))
    }
  }

  const handleReceiveItems = async () => {
    if (!order) {
      return
    }

    const received_items = lineItems.flatMap((lineItem) => {
        if (lineItem.id === undefined) {
          return []
        }
        const entry = receiveEntries[String(lineItem.id)]
        const quantity = Number(entry?.quantity_received || "0")
        if (!entry || quantity <= 0 || !entry.location_id) {
          return []
        }
        return [{
          line_item_id: lineItem.id,
          quantity_received: quantity,
          location_id: entry.location_id,
          lot_number: entry.lot_number || undefined,
          manufactured_date: entry.manufactured_date || undefined,
          expiry_date: entry.expiry_date || undefined,
          notes: entry.notes || undefined,
        }]
      })

    if (!received_items.length) {
      toast.error("Enter at least one received quantity and receiving location.")
      return
    }

    await runWorkflowAction(
      () =>
        receivePurchaseOrderItems({
          id: order.id,
          data: { received_items },
        }).unwrap(),
      "Items received and stock updated",
      ["error", "received_items", "detail"],
    )
  }

  const handleDownloadPdf = async () => {
    if (!order) {
      return
    }

    try {
      const blob = await downloadPurchaseOrderPdf(order.id).unwrap()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = `${order.reference || `purchase-order-${order.id}`}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
      toast.success("Purchase order PDF downloaded")
    } catch (error) {
      toast.error(extractErrorMessage(error, ["error", "detail"]))
    }
  }

  const handleResendEmail = async () => {
    if (!order) {
      return
    }

    await runWorkflowAction(
      () => resendPurchaseOrderEmail({ order_id: order.id }).unwrap(),
      "Supplier email resent",
      ["error", "detail"],
    )
  }

  const handleCreateReturnOrder = async () => {
    if (!order) {
      return
    }

    const return_items = lineItems.flatMap((lineItem) => {
        if (lineItem.id === undefined) {
          return []
        }
        const entry = returnEntries[String(lineItem.id)]
        const quantity = Number(entry?.quantity || "0")
        if (!entry || quantity <= 0) {
          return []
        }

        return [{
          line_item_id: lineItem.id,
          quantity,
          reason: entry.reason || "Returned from purchase order",
        }]
      })

    if (!return_items.length) {
      toast.error("Enter at least one return quantity before creating a return order.")
      return
    }

    try {
      const response = await createReturnOrderFromPurchaseOrder({
        id: order.id,
        data: {
          return_items,
          return_reason: returnReason || undefined,
        },
      }).unwrap()

      toast.success("Return order created")
      setReturnReason("")
      setReturnEntries(Object.fromEntries(lineItems.map((lineItem) => [String(lineItem.id), buildReturnEntry(lineItem)])))
      await refetch()

      const returnOrderId =
        typeof response === "object" && response !== null && "return_order_id" in response
          ? String(response.return_order_id)
          : null
      if (returnOrderId) {
        router.push(`/order/returns/${returnOrderId}`)
      }
    } catch (error) {
      toast.error(extractErrorMessage(error, ["error", "return_items", "detail"]))
    }
  }

  const returnableLineItems = editableLineItems.filter((lineItem) => asNumber(lineItem.quantity_received) > 0)

  if (isLoading || !order) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-10 text-center text-sm text-gray-500">Loading purchase order workbench...</CardContent>
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
              <Link href="/order/purchase" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4" />
                Back to purchase orders
              </Link>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <CardTitle className="text-3xl tracking-tight">{order.reference || `Purchase order ${order.id}`}</CardTitle>
                  <Badge variant="outline" className={statusStyles[order.status] || "border-gray-200 bg-gray-50 text-gray-700"}>
                    {formatStatus(order.status)}
                  </Badge>
                </div>
                <CardDescription className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                  Manage the order header, line items, approval lifecycle, and receiving from one operations workbench.
                </CardDescription>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Line items</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{lineItems.length}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Ordered quantity</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{totalQuantity}</div>
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
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Supplier</div>
            <div className="mt-2 text-lg font-semibold text-gray-900">{order.supplier_name || order.supplier_details?.name || "Not assigned"}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Delivery date</div>
            <div className="mt-2 text-lg font-semibold text-gray-900">{order.delivery_date || "Not scheduled"}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Received quantity</div>
            <div className="mt-2 text-lg font-semibold text-gray-900">{receivedQuantity}</div>
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
        title="Maintain the order header and ownership context"
        description="Keep the supplier, expected delivery date, order currency, and internal notes accurate before driving the workflow forward."
        helper="This information should be stable before the order is approved or issued."
        status={order.supplier ? "complete" : "in_progress"}
        facts={[
          { label: "Supplier", value: order.supplier_name || "Not assigned" },
          { label: "Responsible", value: order.responsible_details?.first_name || "Unassigned" },
          { label: "Currency", value: activeCurrency },
        ]}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="po-supplier">Supplier</Label>
            <Select value={headerForm.supplier} onValueChange={(value) => setHeaderForm((current) => ({ ...current, supplier: value }))}>
              <SelectTrigger id="po-supplier">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={String(supplier.id)}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="po-responsible">Responsible owner</Label>
            <Select
              value={headerForm.responsible}
              onValueChange={(value) => setHeaderForm((current) => ({ ...current, responsible: value }))}
            >
              <SelectTrigger id="po-responsible">
                <SelectValue placeholder="Select responsible owner" />
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
            <Label htmlFor="po-currency">Order currency</Label>
            <Select
              value={headerForm.order_currency}
              onValueChange={(value) => setHeaderForm((current) => ({ ...current, order_currency: value }))}
            >
              <SelectTrigger id="po-currency">
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
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="po-description">Description</Label>
            <Input
              id="po-description"
              value={headerForm.description}
              onChange={(event) => setHeaderForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="What is the order for?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="po-delivery-date">Expected delivery date</Label>
            <Input
              id="po-delivery-date"
              type="date"
              value={headerForm.delivery_date}
              onChange={(event) => setHeaderForm((current) => ({ ...current, delivery_date: event.target.value }))}
            />
          </div>
          <div className="space-y-2 xl:col-span-3">
            <Label htmlFor="po-link">External link</Label>
            <Input
              id="po-link"
              value={headerForm.link}
              onChange={(event) => setHeaderForm((current) => ({ ...current, link: event.target.value }))}
              placeholder="Optional supplier portal or quote link"
            />
          </div>
          <div className="space-y-2 xl:col-span-3">
            <Label htmlFor="po-notes">Internal notes</Label>
            <Textarea
              id="po-notes"
              value={headerForm.notes}
              onChange={(event) => setHeaderForm((current) => ({ ...current, notes: event.target.value }))}
              rows={4}
              placeholder="Capture receiving instructions, price notes, or approval context"
            />
          </div>
        </div>
        <div className="mt-6">
          <Button onClick={handleSaveHeader} disabled={savingHeader}>
            {savingHeader ? "Saving..." : "Save purchase order header"}
          </Button>
        </div>
      </OperationalStepSection>

      <OperationalStepSection
        id="line-items"
        step={2}
        title="Add and refine the purchase order line items"
        description="Populate the goods being ordered, then keep the quantities, pricing, taxes, and receiving dates accurate."
        helper="The workflow actions below should only happen after the line items are complete."
        status={lineItems.length > 0 ? "complete" : "in_progress"}
        facts={[
          { label: "Line items", value: lineItems.length },
          { label: "Ordered quantity", value: totalQuantity },
          { label: "Average unit price", value: formatCurrencyCompact(activeCurrency, asNumber(order.order_analytics?.average_unit_price)) },
        ]}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="line-inventory-item">Inventory item</Label>
            <Select
              value={lineItemForm.inventory_item}
              onValueChange={(value) => setLineItemForm((current) => ({ ...current, inventory_item: value }))}
            >
              <SelectTrigger id="line-inventory-item">
                <SelectValue placeholder="Select inventory item" />
              </SelectTrigger>
              <SelectContent>
                {inventoryItems.map((inventoryItem) => (
                  <SelectItem key={inventoryItem.id} value={String(inventoryItem.id)}>
                    {inventoryItem.name || inventoryItem.inventory_name || String(inventoryItem.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="line-quantity">Quantity</Label>
            <Input
              id="line-quantity"
              type="number"
              min="1"
              value={lineItemForm.quantity}
              onChange={(event) => setLineItemForm((current) => ({ ...current, quantity: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="line-unit-price">Unit price</Label>
            <Input
              id="line-unit-price"
              type="number"
              min="0"
              step="0.01"
              value={lineItemForm.unit_price}
              onChange={(event) => setLineItemForm((current) => ({ ...current, unit_price: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="line-tax-rate">Tax rate (%)</Label>
            <Input
              id="line-tax-rate"
              type="number"
              min="0"
              step="0.01"
              value={lineItemForm.tax_rate}
              onChange={(event) => setLineItemForm((current) => ({ ...current, tax_rate: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="line-discount-rate">Discount rate (%)</Label>
            <Input
              id="line-discount-rate"
              type="number"
              min="0"
              step="0.01"
              value={lineItemForm.discount_rate}
              onChange={(event) => setLineItemForm((current) => ({ ...current, discount_rate: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="line-manufactured-date">Manufactured date</Label>
            <Input
              id="line-manufactured-date"
              type="date"
              value={lineItemForm.manufactured_date}
              onChange={(event) => setLineItemForm((current) => ({ ...current, manufactured_date: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="line-expiry-date">Expiry date</Label>
            <Input
              id="line-expiry-date"
              type="date"
              value={lineItemForm.expiry_date}
              onChange={(event) => setLineItemForm((current) => ({ ...current, expiry_date: event.target.value }))}
            />
          </div>
          <div className="space-y-2 xl:col-span-4">
            <Label htmlFor="line-description">Line description</Label>
            <Textarea
              id="line-description"
              value={lineItemForm.description}
              onChange={(event) => setLineItemForm((current) => ({ ...current, description: event.target.value }))}
              rows={3}
              placeholder="Optional line-specific note"
            />
          </div>
        </div>

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
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Unit price</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {editableLineItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-gray-500">
                    No line items yet. Add the goods you plan to purchase before approving or issuing the order.
                  </TableCell>
                </TableRow>
              ) : (
                editableLineItems.map((lineItem) => (
                  <TableRow key={lineItem.id}>
                    <TableCell className="font-medium text-gray-900">{lineItem.displayName}</TableCell>
                    <TableCell>{lineItem.quantity_w_unit || lineItem.quantity}</TableCell>
                    <TableCell>{lineItem.quantity_received ?? 0}</TableCell>
                    <TableCell>{formatCurrencyCompact(activeCurrency, asNumber(lineItem.unit_price))}</TableCell>
                    <TableCell>{formatCurrencyCompact(activeCurrency, asNumber(lineItem.total_price))}</TableCell>
                    <TableCell>{lineItem.batch_number || "Generated on receive"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditLineItem(lineItem)}>
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteLineItem(String(lineItem.id))}
                          disabled={deletingLineItem}
                        >
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
        id="workflow"
        step={3}
        title="Move the order through approval, issue, receiving, and completion"
        description="Run the actual purchase-order lifecycle and receive goods into stock locations when they arrive."
        helper="Approval and issue are management actions; receiving updates stock. Completion should happen after the goods are fully received."
        status={
          order.status === PurchaseOrderStatus.completed
            ? "complete"
            : order.status === PurchaseOrderStatus.received || order.status === PurchaseOrderStatus.issued || order.status === PurchaseOrderStatus.approved
              ? "in_progress"
              : "pending"
        }
        facts={[
          { label: "Current status", value: formatStatus(order.status) },
          { label: "Remaining quantity", value: remainingQuantity },
          { label: "Receiving locations", value: locations.length },
        ]}
      >
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-gray-200 shadow-none">
            <CardHeader className="text-left text-inherit">
              <CardTitle className="text-lg">Lifecycle actions</CardTitle>
              <CardDescription>Drive the order to the next valid state based on its current progress.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => runWorkflowAction(() => approvePurchaseOrder(order.id).unwrap(), "Purchase order approved")}
                  disabled={order.status !== PurchaseOrderStatus.pending || lineItems.length === 0 || approvingOrder}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    runWorkflowAction(
                      () => issuePurchaseOrder({ id: order.id, data: { notify_supplier: notifySupplier } }).unwrap(),
                      "Purchase order issued",
                    )
                  }
                  disabled={order.status !== PurchaseOrderStatus.approved || issuingOrder}
                >
                  <Truck className="mr-2 h-4 w-4" />
                  Issue
                </Button>
                <Button
                  variant="outline"
                  onClick={() => runWorkflowAction(() => completePurchaseOrder(order.id).unwrap(), "Purchase order completed")}
                  disabled={order.status !== PurchaseOrderStatus.received || completingOrder}
                >
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Complete
                </Button>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={notifySupplier}
                  onChange={(event) => setNotifySupplier(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Send supplier notification when the order is issued
              </label>

              <div className="space-y-2">
                <Label htmlFor="cancel-notes">Cancellation notes</Label>
                <Textarea
                  id="cancel-notes"
                  rows={4}
                  value={cancelNotes}
                  onChange={(event) => setCancelNotes(event.target.value)}
                  placeholder="Explain why the order is being cancelled"
                />
              </div>

              <Button
                variant="outline"
                onClick={() =>
                  runWorkflowAction(
                    () => cancelPurchaseOrder({ id: order.id, notes: cancelNotes || undefined }).unwrap(),
                    "Purchase order cancelled",
                  )
                }
                disabled={[PurchaseOrderStatus.completed, PurchaseOrderStatus.cancelled].includes(order.status as never) || cancellingOrder}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel order
              </Button>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-none">
            <CardHeader className="text-left text-inherit">
              <CardTitle className="text-lg">Receive items into stock</CardTitle>
              <CardDescription>
                Capture what arrived and which stock location received it. This is what updates stock, quantities received, and receiving
                status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editableLineItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                  Add line items before attempting to receive goods.
                </div>
              ) : (
                editableLineItems.map((lineItem) => {
                  const entry = receiveEntries[String(lineItem.id)] || buildReceiveEntry(lineItem)
                  const lineRemaining = Math.max(asNumber(lineItem.quantity) - asNumber(lineItem.quantity_received), 0)

                  return (
                    <div key={lineItem.id} className="rounded-2xl border border-gray-200 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-gray-900">{lineItem.displayName}</div>
                          <div className="mt-1 text-sm text-gray-600">
                            Ordered {lineItem.quantity} • Received {lineItem.quantity_received ?? 0} • Remaining {lineRemaining}
                          </div>
                        </div>
                        {lineItem.fully_received ? (
                          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800">
                            Fully received
                          </Badge>
                        ) : null}
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Quantity received now</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={entry.quantity_received}
                            onChange={(event) => setReceiveField(String(lineItem.id), "quantity_received", event.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Receiving location</Label>
                          <Select
                            value={entry.location_id}
                            onValueChange={(value) => setReceiveField(String(lineItem.id), "location_id", value)}
                          >
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
                        <div className="space-y-2">
                          <Label>Lot / batch number</Label>
                          <Input
                            value={entry.lot_number}
                            onChange={(event) => setReceiveField(String(lineItem.id), "lot_number", event.target.value)}
                            placeholder="Optional lot reference"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Manufactured date</Label>
                          <Input
                            type="date"
                            value={entry.manufactured_date}
                            onChange={(event) => setReceiveField(String(lineItem.id), "manufactured_date", event.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Expiry date</Label>
                          <Input
                            type="date"
                            value={entry.expiry_date}
                            onChange={(event) => setReceiveField(String(lineItem.id), "expiry_date", event.target.value)}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2 xl:col-span-3">
                          <Label>Receiving notes</Label>
                          <Input
                            value={entry.notes}
                            onChange={(event) => setReceiveField(String(lineItem.id), "notes", event.target.value)}
                            placeholder="Optional receiving note"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleReceiveItems}
                  disabled={![PurchaseOrderStatus.issued, PurchaseOrderStatus.received].includes(order.status as never) || receivingItems}
                >
                  <PackagePlus className="mr-2 h-4 w-4" />
                  Receive selected items
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    setReceiveEntries(
                      Object.fromEntries(lineItems.map((lineItem) => [String(lineItem.id), buildReceiveEntry(lineItem)])),
                    )
                  }
                  disabled={receivingItems}
                >
                  <Undo2 className="mr-2 h-4 w-4" />
                  Reset receiving form
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </OperationalStepSection>

      <OperationalStepSection
        id="documents"
        step={4}
        title="Share documents, follow up with suppliers, and manage returns"
        description="Download the purchase-order PDF, resend supplier email when appropriate, and create supplier return orders after goods have been received."
        helper="Returns are only valid after stock has been received. Supplier email resend is available once the order is approved or issued."
        status={
          [PurchaseOrderStatus.completed, PurchaseOrderStatus.received].includes(order.status as never)
            ? "in_progress"
            : [PurchaseOrderStatus.approved, PurchaseOrderStatus.issued].includes(order.status as never)
              ? "in_progress"
              : "pending"
        }
        facts={[
          { label: "Returnable lines", value: returnableLineItems.length },
          {
            label: "Email resend",
            value: [PurchaseOrderStatus.approved, PurchaseOrderStatus.issued].includes(order.status as never) ? "Available" : "Locked",
          },
          { label: "PDF", value: "Available" },
        ]}
      >
        <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
          <Card className="border-gray-200 shadow-none">
            <CardHeader className="text-left text-inherit">
              <CardTitle className="text-lg">Documents and supplier follow-up</CardTitle>
              <CardDescription>Use these actions to share or reissue the order without leaving the operations page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" onClick={handleDownloadPdf} disabled={isDownloadingPdf}>
                <ReceiptText className="mr-2 h-4 w-4" />
                {isDownloadingPdf ? "Preparing PDF..." : "Download purchase order PDF"}
              </Button>
              <Button
                variant="outline"
                onClick={handleResendEmail}
                disabled={![PurchaseOrderStatus.approved, PurchaseOrderStatus.issued].includes(order.status as never) || resendingEmail}
              >
                <Mail className="mr-2 h-4 w-4" />
                {resendingEmail ? "Resending..." : "Resend supplier email"}
              </Button>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                Use the PDF for offline review or printing. Use email resend only after approval or issue, when the order is actually ready for supplier communication.
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-none">
            <CardHeader className="text-left text-inherit">
              <CardTitle className="text-lg">Create a supplier return order</CardTitle>
              <CardDescription>
                Select received quantities that need to go back to the supplier because of damage, mismatch, or quality issues.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {returnableLineItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                  No received line items are currently available for return.
                </div>
              ) : (
                <>
                  {returnableLineItems.map((lineItem) => {
                    const entry = returnEntries[String(lineItem.id)] || buildReturnEntry(lineItem)
                    return (
                      <div key={lineItem.id} className="rounded-2xl border border-gray-200 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-gray-900">{lineItem.displayName}</div>
                            <div className="mt-1 text-sm text-gray-600">
                              Received {lineItem.quantity_received ?? 0} of {lineItem.quantity}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Return quantity</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              max={String(lineItem.quantity_received ?? 0)}
                              value={entry.quantity}
                              onChange={(event) => setReturnField(String(lineItem.id), "quantity", event.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Line reason</Label>
                            <Input
                              value={entry.reason}
                              onChange={(event) => setReturnField(String(lineItem.id), "reason", event.target.value)}
                              placeholder="Damaged, incomplete, wrong item..."
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  <div className="space-y-2">
                    <Label htmlFor="return-reason">Overall return note</Label>
                    <Textarea
                      id="return-reason"
                      rows={4}
                      value={returnReason}
                      onChange={(event) => setReturnReason(event.target.value)}
                      placeholder="Summarize why these goods are being returned to the supplier"
                    />
                  </div>
                </>
              )}

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={handleCreateReturnOrder}
                  disabled={![PurchaseOrderStatus.received, PurchaseOrderStatus.completed].includes(order.status as never) || creatingReturnOrder || returnableLineItems.length === 0}
                >
                  <Undo2 className="mr-2 h-4 w-4" />
                  {creatingReturnOrder ? "Creating return..." : "Create return order"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setReturnReason("")
                    setReturnEntries(Object.fromEntries(lineItems.map((lineItem) => [String(lineItem.id), buildReturnEntry(lineItem)])))
                  }}
                  disabled={creatingReturnOrder}
                >
                  Reset return form
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </OperationalStepSection>
    </div>
  )
}

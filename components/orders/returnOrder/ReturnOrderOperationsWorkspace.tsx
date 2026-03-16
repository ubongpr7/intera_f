"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, ClipboardCheck, PackageX, Truck, XCircle } from "lucide-react"
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
import { formatCurrencyCompact } from "@/lib/currency-utils"
import { extractErrorMessage } from "@/lib/utils"
import {
  useCancelReturnOrderMutation,
  useCompleteReturnOrderMutation,
  useDispatchReturnOrderMutation,
  useGetReturnOrderQuery,
} from "@/redux/features/orders/orderAPISlice"
import { ReturnOrderStatus, type ReturnOrderInterface, type ReturnOrderLineItem } from "@/redux/features/orders/orderTypes"
import { useGetStockItemDataLocationQuery } from "@/redux/features/stock/stockAPISlice"

const statusStyles: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  awaiting_pickup: "border-sky-200 bg-sky-50 text-sky-800",
  in_transit: "border-indigo-200 bg-indigo-50 text-indigo-800",
  completed: "border-green-200 bg-green-50 text-green-800",
  cancelled: "border-gray-200 bg-gray-50 text-gray-700",
}

type ReturnOrderOperationsWorkspaceProps = {
  returnOrderId: string
}

type DispatchEntry = {
  quantity: string
  location_id: string
  notes: string
}

const formatStatus = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

const asNumber = (value: string | number | undefined | null) => Number(value ?? 0)

const buildDispatchEntry = (lineItem: ReturnOrderLineItem): DispatchEntry => ({
  quantity: String(Math.max(asNumber(lineItem.remaining_quantity ?? lineItem.quantity_returned), 0)),
  location_id: "",
  notes: "",
})

export default function ReturnOrderOperationsWorkspace({ returnOrderId }: ReturnOrderOperationsWorkspaceProps) {
  const [dispatchEntries, setDispatchEntries] = useState<Record<string, DispatchEntry>>({})
  const [dispatchNotes, setDispatchNotes] = useState("")
  const [cancelNotes, setCancelNotes] = useState("")

  const { data: order, isLoading, refetch } = useGetReturnOrderQuery(returnOrderId)
  const { data: locations = [] } = useGetStockItemDataLocationQuery()

  const [dispatchReturnOrder, { isLoading: dispatchingOrder }] = useDispatchReturnOrderMutation()
  const [completeReturnOrder, { isLoading: completingOrder }] = useCompleteReturnOrderMutation()
  const [cancelReturnOrder, { isLoading: cancellingOrder }] = useCancelReturnOrderMutation()

  const lineItems = order?.line_items || []
  const activeCurrency = order?.order_currency || "NGN"
  const totalReturnedQuantity = lineItems.reduce((sum, lineItem) => sum + asNumber(lineItem.quantity_returned), 0)
  const processedQuantity = lineItems.reduce((sum, lineItem) => sum + asNumber(lineItem.quantity_processed), 0)
  const remainingQuantity = lineItems.reduce((sum, lineItem) => sum + asNumber(lineItem.remaining_quantity), 0)
  const dispatchableLineItems = useMemo(
    () => lineItems.filter((lineItem) => asNumber(lineItem.remaining_quantity) > 0),
    [lineItems],
  )

  useEffect(() => {
    setDispatchEntries((current) => {
      const next = { ...current }
      for (const lineItem of lineItems) {
        if (!next[String(lineItem.id)]) {
          next[String(lineItem.id)] = buildDispatchEntry(lineItem)
        }
      }
      return next
    })
  }, [lineItems])

  const setDispatchField = (lineItemId: string, field: keyof DispatchEntry, value: string) => {
    const lineItem = lineItems.find((entry) => String(entry.id) === lineItemId)
    if (!lineItem) {
      return
    }

    setDispatchEntries((current) => ({
      ...current,
      [lineItemId]: {
        ...(current[lineItemId] || buildDispatchEntry(lineItem)),
        [field]: value,
      },
    }))
  }

  const runWorkflowAction = async (action: () => Promise<unknown>, successMessage: string, fields: string[] = ["error", "detail"]) => {
    try {
      await action()
      toast.success(successMessage)
      await refetch()
    } catch (error) {
      toast.error(extractErrorMessage(error, fields))
    }
  }

  const handleDispatch = async () => {
    if (!order) {
      return
    }

    const return_items = dispatchableLineItems.flatMap((lineItem) => {
        const entry = dispatchEntries[String(lineItem.id)]
        const quantity = Number(entry?.quantity || "0")
        if (!entry || quantity <= 0 || !entry.location_id) {
          return []
        }

        return [{
          return_line_item_id: lineItem.id,
          location_id: entry.location_id,
          quantity,
          notes: entry.notes || undefined,
        }]
      })

    if (!return_items.length) {
      toast.error("Enter at least one dispatch quantity and stock location.")
      return
    }

    await runWorkflowAction(
      () =>
        dispatchReturnOrder({
          id: order.id,
          data: {
            return_items,
            notes: dispatchNotes || undefined,
          },
        }).unwrap(),
      "Return order dispatched",
      ["error", "return_items", "detail"],
    )
  }

  if (isLoading || !order) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-10 text-center text-sm text-gray-500">Loading return order workbench...</CardContent>
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
              <Link href="/order/returns" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4" />
                Back to supplier returns
              </Link>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <CardTitle className="text-3xl tracking-tight">{order.reference || `Return ${order.id}`}</CardTitle>
                  <Badge variant="outline" className={statusStyles[order.status] || "border-gray-200 bg-gray-50 text-gray-700"}>
                    {formatStatus(order.status)}
                  </Badge>
                </div>
                <CardDescription className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                  Dispatch returned stock out from internal locations, then complete the supplier return when every line is processed.
                </CardDescription>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Returned quantity</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{totalReturnedQuantity}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Processed</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{processedQuantity}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Return value</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">
                  {formatCurrencyCompact(activeCurrency, asNumber(order.total_price))}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-6 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Purchase order</div>
            <div className="mt-2 text-lg font-semibold text-gray-900">{order.purchase_order_reference || "Not linked"}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Supplier</div>
            <div className="mt-2 text-lg font-semibold text-gray-900">{order.supplier_name || "Not set"}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Issue date</div>
            <div className="mt-2 text-lg font-semibold text-gray-900">{order.issue_date || "Not dispatched"}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Complete date</div>
            <div className="mt-2 text-lg font-semibold text-gray-900">{order.complete_date || "Not completed"}</div>
          </div>
        </CardContent>
      </Card>

      <OperationalStepSection
        id="review-return"
        step={1}
        title="Review the lines created from the purchase order"
        description="These return lines were generated from purchase-order receipts. Validate quantities and reasons before you issue stock out."
        helper="New return orders are still created from the purchase-order workflow, not from this page."
        status={lineItems.length > 0 ? "complete" : "pending"}
        facts={[
          { label: "Line items", value: lineItems.length },
          { label: "Remaining quantity", value: remainingQuantity },
          { label: "Status", value: formatStatus(order.status) },
        ]}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-600">
            Source purchase order:{" "}
            {order.purchase_order ? (
              <Link href={`/order/purchase/${order.purchase_order}`} className="font-semibold text-gray-900 underline-offset-4 hover:underline">
                {order.purchase_order_reference || order.purchase_order}
              </Link>
            ) : (
              <span className="font-semibold text-gray-900">{order.purchase_order_reference || "Not linked"}</span>
            )}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Inventory item</TableHead>
                <TableHead>Returned</TableHead>
                <TableHead>Processed</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-gray-500">
                    No return lines are attached to this order.
                  </TableCell>
                </TableRow>
              ) : (
                lineItems.map((lineItem) => (
                  <TableRow key={lineItem.id}>
                    <TableCell className="font-medium text-gray-900">{lineItem.inventory_item_name || `Line ${lineItem.id}`}</TableCell>
                    <TableCell>{lineItem.quantity_returned}</TableCell>
                    <TableCell>{lineItem.quantity_processed ?? 0}</TableCell>
                    <TableCell>{lineItem.remaining_quantity ?? 0}</TableCell>
                    <TableCell>{lineItem.return_reason || "—"}</TableCell>
                    <TableCell>{formatCurrencyCompact(activeCurrency, asNumber(lineItem.unit_price) * asNumber(lineItem.quantity_returned))}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </OperationalStepSection>

      <OperationalStepSection
        id="dispatch-return"
        step={2}
        title="Dispatch returned stock out from internal locations"
        description="Select the location holding the returnable stock and issue the quantity out against each return line."
        helper="Dispatch moves the return into transit. Every line can be issued incrementally until the remaining quantity reaches zero."
        status={order.status === ReturnOrderStatus.in_transit || order.status === ReturnOrderStatus.completed ? "complete" : "in_progress"}
        facts={[
          { label: "Dispatchable lines", value: dispatchableLineItems.length },
          { label: "Processed", value: processedQuantity },
          { label: "Remaining", value: remainingQuantity },
        ]}
      >
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-gray-200 shadow-none">
            <CardHeader className="text-left text-inherit">
              <CardTitle className="text-lg">Dispatch return lines</CardTitle>
              <CardDescription>Every processed line needs a location and quantity before you dispatch the supplier return.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dispatchableLineItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                  All return lines have already been processed.
                </div>
              ) : (
                dispatchableLineItems.map((lineItem) => {
                  const entry = dispatchEntries[String(lineItem.id)] || buildDispatchEntry(lineItem)
                  return (
                    <div key={lineItem.id} className="rounded-2xl border border-gray-200 p-4">
                      <div className="font-semibold text-gray-900">{lineItem.inventory_item_name || `Line ${lineItem.id}`}</div>
                      <div className="mt-1 text-sm text-gray-600">
                        Remaining {lineItem.remaining_quantity ?? 0} · Already processed {lineItem.quantity_processed ?? 0}
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Dispatch quantity</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={entry.quantity}
                            onChange={(event) => setDispatchField(String(lineItem.id), "quantity", event.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Stock location</Label>
                          <Select value={entry.location_id} onValueChange={(value) => setDispatchField(String(lineItem.id), "location_id", value)}>
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
                          <Label>Dispatch note</Label>
                          <Input
                            value={entry.notes}
                            onChange={(event) => setDispatchField(String(lineItem.id), "notes", event.target.value)}
                            placeholder="Optional line-specific note"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-none">
            <CardHeader className="text-left text-inherit">
              <CardTitle className="text-lg">Dispatch summary</CardTitle>
              <CardDescription>Use a shared note if several lines belong to the same supplier pickup or courier movement.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="return-dispatch-notes">Shared dispatch note</Label>
                <Textarea
                  id="return-dispatch-notes"
                  rows={5}
                  value={dispatchNotes}
                  onChange={(event) => setDispatchNotes(event.target.value)}
                  placeholder="Optional shared note for this outbound supplier return"
                />
              </div>
              <Button onClick={handleDispatch} disabled={dispatchingOrder || dispatchableLineItems.length === 0}>
                <Truck className="mr-2 h-4 w-4" />
                {dispatchingOrder ? "Dispatching..." : "Dispatch return order"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </OperationalStepSection>

      <OperationalStepSection
        id="close-return"
        step={3}
        title="Complete or cancel the supplier return"
        description="Complete the return once every line has been fully dispatched. Cancellation remains possible until stock has started moving out."
        helper="Cancellation after partial dispatch is blocked by the backend to protect stock integrity."
        status={order.status === ReturnOrderStatus.completed ? "complete" : remainingQuantity === 0 ? "in_progress" : "pending"}
        facts={[
          { label: "Processed", value: processedQuantity },
          { label: "Remaining", value: remainingQuantity },
          { label: "Status", value: formatStatus(order.status) },
        ]}
      >
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-gray-200 shadow-none">
            <CardHeader className="text-left text-inherit">
              <CardTitle className="text-lg">Operational reminders</CardTitle>
              <CardDescription>Use completion only when every return line has been fully processed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-gray-600">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="font-semibold text-gray-900">Complete after dispatch</p>
                <p className="mt-1">The backend only accepts completion when the remaining quantity on every return line is zero.</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="font-semibold text-gray-900">Cancel before movement</p>
                <p className="mt-1">Once stock has started moving out for this supplier return, cancellation is blocked to protect inventory history.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-none">
            <CardHeader className="text-left text-inherit">
              <CardTitle className="text-lg">Closeout actions</CardTitle>
              <CardDescription>Finalize or cancel the return order.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="return-cancel-notes">Cancellation notes</Label>
                <Textarea
                  id="return-cancel-notes"
                  rows={4}
                  value={cancelNotes}
                  onChange={(event) => setCancelNotes(event.target.value)}
                  placeholder="Explain why the supplier return is being cancelled"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => runWorkflowAction(() => completeReturnOrder(order.id).unwrap(), "Return order completed")}
                  disabled={order.status !== ReturnOrderStatus.in_transit || remainingQuantity > 0 || completingOrder}
                >
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  {completingOrder ? "Completing..." : "Complete return order"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    runWorkflowAction(
                      () => cancelReturnOrder({ id: order.id, notes: cancelNotes || undefined }).unwrap(),
                      "Return order cancelled",
                    )
                  }
                  disabled={[ReturnOrderStatus.completed, ReturnOrderStatus.cancelled].includes(order.status as never) || processedQuantity > 0 || cancellingOrder}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {cancellingOrder ? "Cancelling..." : "Cancel return order"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </OperationalStepSection>
    </div>
  )
}

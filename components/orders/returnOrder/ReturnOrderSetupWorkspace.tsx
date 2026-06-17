"use client"

import Link from "next/link"
import { useDeferredValue, useState } from "react"
import { ArrowRight, CheckCircle2, ClipboardCheck, PackageX, ReceiptText, Undo2 } from "lucide-react"
import { useWorkspaceSetupProgress } from "@/components/onboarding/WorkspaceSetupShell"
import OperationalStepSection from "@/components/setup/OperationalStepSection"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrencyCompact } from "@/lib/currency-utils"
import { useListReturnOrdersQuery } from "@/redux/features/orders/orderAPISlice"
import { ReturnOrderStatus, type ReturnOrderInterface } from "@/redux/features/orders/orderTypes"

const statusStyles: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  awaiting_pickup: "border-sky-200 bg-sky-50 text-sky-800",
  in_transit: "border-indigo-200 bg-indigo-50 text-indigo-800",
  completed: "border-green-200 bg-green-50 text-green-800",
  cancelled: "border-gray-200 bg-gray-50 text-gray-700",
}

const formatStatus = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

const asNumber = (value: string | number | undefined | null) => Number(value ?? 0)

export default function ReturnOrderSetupWorkspace() {
  const { activeMembership, isOwner } = useWorkspaceSetupProgress()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const deferredSearchQuery = useDeferredValue(searchQuery.trim())

  const { data: returnOrders = [], isLoading: loadingOrders } = useListReturnOrdersQuery({
    search: deferredSearchQuery || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  })

  const totalOrders = returnOrders.length
  const pendingOrders = returnOrders.filter((order) => order.status === ReturnOrderStatus.pending).length
  const pickupOrders = returnOrders.filter((order) => order.status === ReturnOrderStatus.awaiting_pickup).length
  const inTransitOrders = returnOrders.filter((order) => order.status === ReturnOrderStatus.in_transit).length
  const completedOrders = returnOrders.filter((order) => order.status === ReturnOrderStatus.completed).length
  const totalValue = returnOrders.reduce((sum, order) => sum + asNumber(order.total_price), 0)

  const recentOrders = returnOrders.slice(0, 8)
  const attentionOrders = returnOrders.filter((order) =>
    [ReturnOrderStatus.pending, ReturnOrderStatus.awaiting_pickup, ReturnOrderStatus.in_transit].includes(order.status as never),
  )

  const createStepReady = totalOrders > 0
  const dispatchStepReady = returnOrders.some((order) => order.status === ReturnOrderStatus.in_transit)
  const completeStepReady = completedOrders > 0
  const nextStepId = !createStepReady ? "initiate-returns" : !dispatchStepReady ? "dispatch-returns" : !completeStepReady ? "close-returns" : null

  if (!activeMembership) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="p-6 text-left text-inherit">
            <CardTitle className="text-3xl tracking-tight">Create a workspace before managing supplier returns</CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6 text-gray-600">
              Return orders depend on an active company workspace with purchasing, products, and inventory already configured.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {isOwner ? (
              <Button asChild>
                <Link href="/profile">
                  Go to workspace setup
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <p className="text-sm text-gray-600">Ask the workspace owner to complete the company setup before supplier returns continue.</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={isOwner ? "mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[310px_1fr] lg:px-8" : "mx-auto w-full max-w-7xl space-y-6 px-4 py-6 lg:px-8"}>
      {isOwner ? <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="p-5 text-left text-inherit">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              <Undo2 className="h-3.5 w-3.5" />
              Supplier returns
            </div>
            <CardTitle className="mt-3 text-xl">Track supplier returns from creation to completion</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-600">
              Return orders begin from received purchase orders, then move through dispatch and closure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0">
            {[
              {
                id: "initiate-returns",
                title: "Initiate from purchase orders",
                description: "Create returns only after goods have been received into stock.",
                complete: createStepReady,
                icon: ReceiptText,
              },
              {
                id: "dispatch-returns",
                title: "Dispatch returned stock",
                description: "Move returned quantity out from locations and mark the return in transit.",
                complete: dispatchStepReady,
                icon: PackageX,
              },
              {
                id: "close-returns",
                title: "Complete the supplier return",
                description: "Close the return once every return line has been fully processed.",
                complete: completeStepReady,
                icon: ClipboardCheck,
              },
            ].map((step, index) => (
              <a
                key={step.id}
                href={`#${step.id}`}
                className={`block rounded-2xl border p-4 transition-colors ${
                  step.complete
                    ? "border-green-200 bg-green-50"
                    : nextStepId === step.id
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 rounded-xl p-2 ${
                      step.complete
                        ? "bg-green-100 text-green-700"
                        : nextStepId === step.id
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {step.complete ? <CheckCircle2 className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Step {index + 1}: {step.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-gray-600">{step.description}</p>
                  </div>
                </div>
              </a>
            ))}
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="p-5 text-left text-inherit">
            <CardTitle className="text-base">Dependency notes</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-600">
              Returns are downstream of purchasing and stock receiving.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-0 text-sm text-gray-600">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="font-medium text-gray-900">Created from purchase orders</p>
              <p className="mt-1">Use the purchase-order workbench whenever you need to create a new supplier return.</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="font-medium text-gray-900">Dispatch from valid stock locations</p>
              <p className="mt-1">Every returned line must be dispatched out from a tracked stock location before completion.</p>
            </div>
          </CardContent>
        </Card>
      </aside> : null}

      <div className="space-y-6">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 p-6 text-left text-inherit">
            <CardTitle className="text-3xl tracking-tight">Supplier return control room</CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6 text-gray-600">
              Keep supplier returns visible from creation through dispatch, completion, and exception handling.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Total returns</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{totalOrders}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Pending</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{pendingOrders}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Awaiting pickup</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{pickupOrders}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">In transit</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{inTransitOrders}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Return value</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{formatCurrencyCompact("NGN", totalValue)}</div>
            </div>
          </CardContent>
        </Card>

        <OperationalStepSection
          id="initiate-returns"
          step={1}
          title="Create returns from received purchase orders"
          description="Return orders should always originate from the purchase-order workbench so the system can validate returnable quantities."
          helper="This page does not create returns directly because the backend only allows return creation from purchase orders."
          status={createStepReady ? "complete" : "in_progress"}
          facts={[
            { label: "Open returns", value: attentionOrders.length },
            { label: "Completed", value: completedOrders },
            { label: "Value tracked", value: formatCurrencyCompact("NGN", totalValue) },
          ]}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <div className="max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-900">Start from the purchase-order workbench</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Go to purchase orders, open a received or completed order, and create the supplier return from the operations panel. The return then becomes visible here for dispatch and completion.
              </p>
            </div>
            <Button asChild>
              <Link href="/order/purchase">
                Open purchase orders
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </OperationalStepSection>

        <OperationalStepSection
          id="dispatch-returns"
          step={2}
          title="Review and dispatch active supplier returns"
          description="Filter the return queue, then open the operational detail page to issue stock out from locations and move the return into transit."
          helper="Pending, awaiting pickup, and in-transit returns all require active monitoring."
          status={attentionOrders.length === 0 ? "complete" : "in_progress"}
          facts={[
            { label: "Attention", value: attentionOrders.length },
            { label: "In transit", value: inTransitOrders },
            { label: "Awaiting pickup", value: pickupOrders },
          ]}
        >
          <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="space-y-2">
                <Label htmlFor="return-search">Search returns</Label>
                <Input
                  id="return-search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by reference"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="return-status">Status filter</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="return-status">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value={ReturnOrderStatus.pending}>Pending</SelectItem>
                    <SelectItem value={ReturnOrderStatus.awaiting_pickup}>Awaiting pickup</SelectItem>
                    <SelectItem value={ReturnOrderStatus.in_transit}>In transit</SelectItem>
                    <SelectItem value={ReturnOrderStatus.completed}>Completed</SelectItem>
                    <SelectItem value={ReturnOrderStatus.cancelled}>Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Purchase order</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingOrders ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-gray-500">
                        Loading return orders...
                      </TableCell>
                    </TableRow>
                  ) : recentOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-gray-500">
                        No return orders match the current filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentOrders.map((order: ReturnOrderInterface) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium text-gray-900">{order.reference}</TableCell>
                        <TableCell>{order.purchase_order_reference || "—"}</TableCell>
                        <TableCell>{order.supplier_name || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusStyles[order.status] || "border-gray-200 bg-gray-50 text-gray-700"}>
                            {formatStatus(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrencyCompact(order.order_currency || "NGN", asNumber(order.total_price))}</TableCell>
                        <TableCell>{order.issue_date || "Not issued"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/order/returns/${order.id}`}>Open</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </OperationalStepSection>

        <OperationalStepSection
          id="close-returns"
          step={3}
          title="Close the return after dispatch"
          description="Once each return line has been fully processed and shipped back to the supplier, complete the return to close the loop."
          helper="Returns remain visible here after completion for auditing and supplier follow-up."
          status={attentionOrders.length === 0 && totalOrders > 0 ? "complete" : "pending"}
          facts={[
            { label: "Completed", value: completedOrders },
            { label: "Cancelled", value: returnOrders.filter((order) => order.status === ReturnOrderStatus.cancelled).length },
            { label: "Recent", value: recentOrders.length },
          ]}
        >
          <div className="grid gap-4 md:grid-cols-2">
            {attentionOrders.length === 0 ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-sm leading-6 text-green-800 md:col-span-2">
                No active supplier returns need action right now. New returns created from purchase orders will appear here automatically.
              </div>
            ) : (
              attentionOrders.slice(0, 4).map((order) => (
                <div key={order.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold uppercase tracking-wide text-gray-500">{order.reference}</div>
                      <h3 className="mt-2 text-lg font-semibold text-gray-900">{order.supplier_name || "Supplier return"}</h3>
                    </div>
                    <Badge variant="outline" className={statusStyles[order.status] || "border-gray-200 bg-gray-50 text-gray-700"}>
                      {formatStatus(order.status)}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    Purchase order {order.purchase_order_reference || "—"} · Total return value{" "}
                    <span className="font-semibold text-gray-900">
                      {formatCurrencyCompact(order.order_currency || "NGN", asNumber(order.total_price))}
                    </span>
                  </p>
                  <div className="mt-4">
                    <Button variant="outline" asChild>
                      <Link href={`/order/returns/${order.id}`}>Open return workbench</Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </OperationalStepSection>
      </div>
    </div>
  )
}

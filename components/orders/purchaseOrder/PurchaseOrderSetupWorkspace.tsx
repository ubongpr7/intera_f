"use client"

import Link from "next/link"
import { useDeferredValue, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileClock,
  PackageCheck,
  ReceiptText,
  ShoppingCart,
  TriangleAlert,
  Truck,
} from "lucide-react"
import { toast } from "react-toastify"
import { useWorkspaceSetupProgress } from "@/components/onboarding/WorkspaceSetupShell"
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
  PurchaseOrderStatus,
  type PurchaseOrderAnalyticsResponse,
  type PurchaseOrderDashboardSummary,
  type PurchaseOrderInterface,
} from "@/redux/features/orders/orderTypes"
import {
  useCreatePurchaseOrderMutation,
  useGetPurchaseOrderAnalyticsQuery,
  useGetPurchaseOrderDashboardSummaryQuery,
  useListPurchaseOrdersQuery,
} from "@/redux/features/orders/orderAPISlice"
import { useGetCompanyUsersQuery } from "@/redux/features/users/userApiSlice"

const purchaseOrderStatuses = [
  PurchaseOrderStatus.pending,
  PurchaseOrderStatus.approved,
  PurchaseOrderStatus.issued,
  PurchaseOrderStatus.received,
  PurchaseOrderStatus.completed,
  PurchaseOrderStatus.cancelled,
] as const

const statusStyles: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  approved: "border-blue-200 bg-blue-50 text-blue-800",
  issued: "border-indigo-200 bg-indigo-50 text-indigo-800",
  received: "border-violet-200 bg-violet-50 text-violet-800",
  completed: "border-green-200 bg-green-50 text-green-800",
  cancelled: "border-gray-200 bg-gray-50 text-gray-700",
}

type PurchaseOrderFormState = {
  supplier: string
  responsible: string
  order_currency: string
  description: string
  notes: string
  link: string
  delivery_date: string
}

const formatStatus = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

const asNumber = (value: string | number | undefined | null) => Number(value ?? 0)

const buildInitialForm = (currency: string): PurchaseOrderFormState => ({
  supplier: "",
  responsible: "",
  order_currency: currency,
  description: "",
  notes: "",
  link: "",
  delivery_date: "",
})

const quickSummary = (summary?: PurchaseOrderDashboardSummary, analytics?: PurchaseOrderAnalyticsResponse) => ({
  totalOrders: asNumber(summary?.total_orders as string | number | undefined) || analytics?.total_purchase_orders || 0,
  pendingApproval: asNumber(summary?.pending_approval as string | number | undefined) || analytics?.pending_orders || 0,
  overdueOrders: asNumber(summary?.overdue_orders as string | number | undefined),
  ordersThisWeek: asNumber(summary?.orders_this_week as string | number | undefined),
  totalValueThisMonth: asNumber(summary?.total_value_this_month as string | number | undefined),
})

export default function PurchaseOrderSetupWorkspace() {
  const router = useRouter()
  const { activeMembership, profile } = useWorkspaceSetupProgress()
  const defaultCurrency = profile?.currency || "NGN"
  const [formState, setFormState] = useState<PurchaseOrderFormState>(() => buildInitialForm(defaultCurrency))
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const deferredSearchQuery = useDeferredValue(searchQuery.trim())

  const { data: suppliers = [] } = useGetSupplersQuery()
  const { data: users = [] } = useGetCompanyUsersQuery()
  const { data: summary } = useGetPurchaseOrderDashboardSummaryQuery()
  const { data: analytics } = useGetPurchaseOrderAnalyticsQuery()
  const {
    data: purchaseOrders = [],
    isLoading: loadingOrders,
    refetch: refetchOrders,
  } = useListPurchaseOrdersQuery({
    search: deferredSearchQuery || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  })
  const [createPurchaseOrder, { isLoading: creatingOrder }] = useCreatePurchaseOrderMutation()

  const quickMetrics = quickSummary(summary, analytics)
  const issuedCount = analytics?.issued_orders ?? purchaseOrders.filter((order) => order.status === PurchaseOrderStatus.issued).length
  const receivedCount = analytics?.received_orders ?? purchaseOrders.filter((order) => order.status === PurchaseOrderStatus.received).length
  const completedCount =
    analytics?.completed_orders ?? purchaseOrders.filter((order) => order.status === PurchaseOrderStatus.completed).length
  const workflowReadyCount = (analytics?.approved_orders ?? 0) + issuedCount + receivedCount + completedCount
  const hasOrders = quickMetrics.totalOrders > 0
  const createStepReady = hasOrders
  const issueStepReady = workflowReadyCount > 0
  const receiveStepReady = receivedCount > 0 || completedCount > 0

  const nextStepId = !createStepReady ? "create-orders" : !issueStepReady ? "active-orders" : !receiveStepReady ? "attention" : null

  const recentOrders = useMemo(() => purchaseOrders.slice(0, 8), [purchaseOrders])
  const attentionStatuses = useMemo(() => new Set(Object.values(PurchaseOrderStatus)), [])
  const attentionOrders = useMemo(
    () => purchaseOrders.filter((order) => attentionStatuses.has(String(order.status) as (typeof PurchaseOrderStatus)[keyof typeof PurchaseOrderStatus])),
    [attentionStatuses, purchaseOrders],
  )

  const handleCreateOrder = async () => {
    if (!formState.supplier) {
      toast.error("Select a supplier before creating a purchase order.")
      return
    }

    try {
      const payload = {
        supplier: formState.supplier,
        responsible: formState.responsible || undefined,
        order_currency: formState.order_currency || defaultCurrency,
        description: formState.description || undefined,
        notes: formState.notes || undefined,
        link: formState.link || undefined,
        delivery_date: formState.delivery_date || undefined,
      }
      const created = await createPurchaseOrder(payload).unwrap()
      toast.success("Purchase order created")
      setFormState(buildInitialForm(defaultCurrency))
      await refetchOrders()
      router.push(`/order/purchase/${created.id}`)
    } catch (error) {
      toast.error(extractErrorMessage(error, ["supplier", "delivery_date", "description"]))
    }
  }

  if (!activeMembership) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="p-6 text-left text-inherit">
            <CardTitle className="text-3xl tracking-tight">Create a workspace before managing purchase orders</CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6 text-gray-600">
              Purchase ordering depends on an active company workspace. Complete workspace setup first, then come back here to manage
              suppliers, receiving, and stock replenishment.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <Button asChild>
              <Link href="/profile/create">
                Go to workspace setup
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[310px_1fr] lg:px-8">
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="p-5 text-left text-inherit">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              <ReceiptText className="h-3.5 w-3.5" />
              Purchase orders
            </div>
            <CardTitle className="mt-3 text-xl">Run replenishment from request to receiving</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-600">
              Start supplier-backed orders, add the required lines, then move each order through approval, issue, receiving, and closure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0">
            <div className="space-y-3">
              {[
                {
                  id: "create-orders",
                  title: "Create supplier orders",
                  description: "Open the purchase order and capture the basic supplier commitment.",
                  complete: createStepReady,
                  icon: ShoppingCart,
                },
                {
                  id: "active-orders",
                  title: "Add lines and issue",
                  description: "Review active orders, add line items, then approve and issue to the supplier.",
                  complete: issueStepReady,
                  icon: Truck,
                },
                {
                  id: "attention",
                  title: "Receive and close",
                  description: "Track what still needs attention until the order is fully received and completed.",
                  complete: receiveStepReady,
                  icon: PackageCheck,
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
            </div>

            {nextStepId ? (
              <a
                href={`#${nextStepId}`}
                className="flex w-full items-center justify-between rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Continue the purchase flow
                <ArrowRight className="h-4 w-4" />
              </a>
            ) : (
              <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                Purchase-order foundations are in place. Your team can now keep replenishment moving from order to receiving.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="p-5 text-left text-inherit">
            <CardTitle className="text-base">Dependency notes</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-600">
              Keep the flow smooth by setting up supplier and team context before pushing orders out.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-0 text-sm text-gray-600">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="font-medium text-gray-900">Suppliers first</p>
              <p className="mt-1">Create supplier companies before opening purchase orders so the order can be issued cleanly.</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="font-medium text-gray-900">Order lines before approval</p>
              <p className="mt-1">Approval should happen after quantity, price, and receiving expectations are already on the order.</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="font-medium text-gray-900">Receiving closes the loop</p>
              <p className="mt-1">Stock only becomes operational after the issued order is received into a stock location.</p>
            </div>
          </CardContent>
        </Card>
      </aside>

      <main className="min-w-0 space-y-6">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 p-6 text-left text-inherit">
            <CardTitle className="text-3xl tracking-tight">Purchase order operations</CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6 text-gray-600">
              This page now follows the real replenishment journey: open supplier orders, keep the active queue visible, then move each order
              through approval, issue, receiving, and completion.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total orders</p>
                <ReceiptText className="h-4 w-4 text-gray-400" />
              </div>
              <div className="mt-3 text-3xl font-semibold text-gray-900">{quickMetrics.totalOrders}</div>
              <p className="mt-2 text-sm text-gray-600">All supplier purchase orders in the current workspace.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Pending approval</p>
                <FileClock className="h-4 w-4 text-gray-400" />
              </div>
              <div className="mt-3 text-3xl font-semibold text-gray-900">{quickMetrics.pendingApproval}</div>
              <p className="mt-2 text-sm text-gray-600">Orders waiting for review before supplier issuance.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Overdue</p>
                <TriangleAlert className="h-4 w-4 text-gray-400" />
              </div>
              <div className="mt-3 text-3xl font-semibold text-gray-900">{quickMetrics.overdueOrders}</div>
              <p className="mt-2 text-sm text-gray-600">Issued or approved orders past their expected delivery date.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Month value</p>
                <ClipboardCheck className="h-4 w-4 text-gray-400" />
              </div>
              <div className="mt-3 text-3xl font-semibold text-gray-900">
                {formatCurrencyCompact(defaultCurrency, quickMetrics.totalValueThisMonth)}
              </div>
              <p className="mt-2 text-sm text-gray-600">{quickMetrics.ordersThisWeek} orders were opened in the last 7 days.</p>
            </div>
          </CardContent>
        </Card>

        <OperationalStepSection
          id="create-orders"
          step={1}
          title="Open the purchase order with supplier and ownership context"
          description="Capture the supplier, internal owner, expected delivery date, and purchasing notes before moving deeper into line items."
          helper="Creating the order first gives the team a stable reference to populate and track through the rest of the workflow."
          status={createStepReady ? "complete" : "in_progress"}
          facts={[
            { label: "Suppliers", value: suppliers.length },
            { label: "Team members", value: users.length },
            { label: "Default currency", value: defaultCurrency },
          ]}
          notice={
            suppliers.length === 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                No suppliers are available yet. Add supplier companies in{" "}
                <Link href="/companies" className="font-semibold underline underline-offset-2">
                  Companies
                </Link>{" "}
                before opening purchase orders.
              </div>
            ) : null
          }
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Select value={formState.supplier} onValueChange={(value) => setFormState((current) => ({ ...current, supplier: value }))}>
                <SelectTrigger id="supplier">
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
              <Label htmlFor="responsible">Responsible team member</Label>
              <Select
                value={formState.responsible}
                onValueChange={(value) => setFormState((current) => ({ ...current, responsible: value }))}
              >
                <SelectTrigger id="responsible">
                  <SelectValue placeholder="Assign responsible owner" />
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
              <Label htmlFor="order-currency">Order currency</Label>
              <Select
                value={formState.order_currency}
                onValueChange={(value) => setFormState((current) => ({ ...current, order_currency: value }))}
              >
                <SelectTrigger id="order-currency">
                  <SelectValue placeholder="Select order currency" />
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
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formState.description}
                onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
                placeholder="What are you ordering and why?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery-date">Expected delivery date</Label>
              <Input
                id="delivery-date"
                type="date"
                value={formState.delivery_date}
                onChange={(event) => setFormState((current) => ({ ...current, delivery_date: event.target.value }))}
              />
            </div>
            <div className="space-y-2 xl:col-span-3">
              <Label htmlFor="link">Reference link</Label>
              <Input
                id="link"
                value={formState.link}
                onChange={(event) => setFormState((current) => ({ ...current, link: event.target.value }))}
                placeholder="Optional supplier portal or quote link"
              />
            </div>
            <div className="space-y-2 xl:col-span-3">
              <Label htmlFor="notes">Internal notes</Label>
              <Textarea
                id="notes"
                value={formState.notes}
                onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Capture context, vendor instructions, or receiving notes"
                rows={4}
              />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={handleCreateOrder} disabled={creatingOrder || suppliers.length === 0}>
              {creatingOrder ? "Creating order..." : "Create order and continue"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormState(buildInitialForm(defaultCurrency))}
              disabled={creatingOrder}
            >
              Reset form
            </Button>
          </div>
        </OperationalStepSection>

        <OperationalStepSection
          id="active-orders"
          step={2}
          title="Keep the active supplier queue visible and actionable"
          description="Filter the active order queue, then open the right order to manage line items, approval, issue, and receiving."
          helper="The detail workbench is where you will maintain the header, add line items, and run workflow actions."
          status={issueStepReady ? "complete" : "in_progress"}
          facts={[
            { label: "Active orders", value: attentionOrders.length },
            { label: "Approved or beyond", value: workflowReadyCount },
            { label: "Search results", value: loadingOrders ? "..." : purchaseOrders.length },
          ]}
        >
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div className="space-y-2">
              <Label htmlFor="po-search">Search purchase orders</Label>
              <Input
                id="po-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by reference, description, or supplier"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="po-status">Filter by status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="po-status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {purchaseOrderStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatStatus(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Delivery date</TableHead>
                  <TableHead className="text-right">Next action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingOrders ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-gray-500">
                      Loading purchase orders...
                    </TableCell>
                  </TableRow>
                ) : recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-gray-500">
                      No purchase orders match the current filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium text-gray-900">{order.reference || `Order ${order.id}`}</TableCell>
                      <TableCell>{order.supplier_name || order.supplier_details?.name || "Unassigned supplier"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusStyles[order.status] || "border-gray-200 bg-gray-50 text-gray-700"}>
                          {formatStatus(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrencyCompact(order.order_currency || defaultCurrency, asNumber(order.total_price))}</TableCell>
                      <TableCell>{order.delivery_date || "Not scheduled"}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/order/purchase/${order.id}`}>Open workbench</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </OperationalStepSection>

        <OperationalStepSection
          id="attention"
          step={3}
          title="Track what still needs receiving or closure"
          description="Use this queue to focus on orders that are waiting for approval, already issued, or still unfinished after receiving."
          helper="The goal is to stop orders from getting stuck between approval, receiving, and completion."
          status={receiveStepReady ? "complete" : "in_progress"}
          facts={[
            { label: "Issued", value: issuedCount },
            { label: "Received", value: receivedCount },
            { label: "Completed", value: completedCount },
          ]}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border-gray-200 shadow-none">
              <CardHeader className="pb-3 text-left text-inherit">
                <CardTitle className="text-base">Pending approval</CardTitle>
                <CardDescription>Orders waiting on an internal decision before issue.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {purchaseOrders.filter((order) => order.status === PurchaseOrderStatus.pending).slice(0, 4).map((order) => (
                  <Link
                    key={order.id}
                    href={`/order/purchase/${order.id}`}
                    className="block rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-colors hover:border-blue-300"
                  >
                    <div className="font-medium text-gray-900">{order.reference || `Order ${order.id}`}</div>
                    <div className="mt-1 text-gray-600">{order.supplier_name || "No supplier"}</div>
                  </Link>
                ))}
                {purchaseOrders.filter((order) => order.status === PurchaseOrderStatus.pending).length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">Nothing is waiting for approval.</div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-none">
              <CardHeader className="pb-3 text-left text-inherit">
                <CardTitle className="text-base">Issued and in transit</CardTitle>
                <CardDescription>Orders that should soon move into receiving.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {purchaseOrders.filter((order) => order.status === PurchaseOrderStatus.issued).slice(0, 4).map((order) => (
                  <Link
                    key={order.id}
                    href={`/order/purchase/${order.id}`}
                    className="block rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-colors hover:border-blue-300"
                  >
                    <div className="font-medium text-gray-900">{order.reference || `Order ${order.id}`}</div>
                    <div className="mt-1 text-gray-600">Delivery date: {order.delivery_date || "Not scheduled"}</div>
                  </Link>
                ))}
                {purchaseOrders.filter((order) => order.status === PurchaseOrderStatus.issued).length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">No issued orders need follow-up.</div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-none">
              <CardHeader className="pb-3 text-left text-inherit">
                <CardTitle className="text-base">Overdue or blocked</CardTitle>
                <CardDescription>Orders that deserve immediate attention from the operations team.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {attentionOrders
                  .filter((order) => order.status === PurchaseOrderStatus.received || order.status === PurchaseOrderStatus.approved)
                  .slice(0, 4)
                  .map((order) => (
                    <Link
                      key={order.id}
                      href={`/order/purchase/${order.id}`}
                      className="block rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-colors hover:border-blue-300"
                    >
                      <div className="font-medium text-gray-900">{order.reference || `Order ${order.id}`}</div>
                      <div className="mt-1 text-gray-600">{formatStatus(order.status)} and still needs action.</div>
                    </Link>
                  ))}
                {attentionOrders.filter((order) => order.status === PurchaseOrderStatus.received || order.status === PurchaseOrderStatus.approved)
                  .length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                    No blocked orders right now.
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </OperationalStepSection>
      </main>
    </div>
  )
}

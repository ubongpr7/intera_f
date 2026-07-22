"use client"

import Link from "next/link"
import { useDeferredValue, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  ClipboardCheck,
  PackageCheck,
  ReceiptText,
  ShoppingBag,
  Truck,
  Users2,
} from "lucide-react"
import { toast } from "react-toastify"
import { WorkspaceSetupLoadingCard, useWorkspaceSetupProgress } from "@/components/onboarding/WorkspaceSetupShell"
import CollapsibleSetupGuide from "@/components/setup/CollapsibleSetupGuide"
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
} from "@/redux/features/orders/orderTypes"
import {
  useCreateSalesOrderMutation,
  useListSalesOrdersQuery,
} from "@/redux/features/orders/orderAPISlice"
import { useGetCompanyUsersQuery } from "@/redux/features/users/userApiSlice"

const statusStyles: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  in_progress: "border-blue-200 bg-blue-50 text-blue-800",
  shipped: "border-indigo-200 bg-indigo-50 text-indigo-800",
  completed: "border-green-200 bg-green-50 text-green-800",
  cancelled: "border-gray-200 bg-gray-50 text-gray-700",
}

type SalesOrderFormState = {
  customer: string
  responsible: string
  order_currency: string
  customer_reference: string
  description: string
  notes: string
  link: string
  delivery_date: string
}

const buildInitialForm = (currency: string): SalesOrderFormState => ({
  customer: "",
  responsible: "",
  order_currency: currency,
  customer_reference: "",
  description: "",
  notes: "",
  link: "",
  delivery_date: "",
})

const formatStatus = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

const asNumber = (value: string | number | undefined | null) => Number(value ?? 0)

export default function SalesOrderSetupWorkspace() {
  const router = useRouter()
  const { activeMembership, isWorkspaceContextLoading: loadingWorkspaceSetup, isOwner, profile } = useWorkspaceSetupProgress()
  const defaultCurrency = profile?.currency || "NGN"
  const [formState, setFormState] = useState<SalesOrderFormState>(() => buildInitialForm(defaultCurrency))
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const deferredSearchQuery = useDeferredValue(searchQuery.trim())

  const { data: customers = [] } = useGetCustomerQuery()
  const { data: users = [] } = useGetCompanyUsersQuery()
  const {
    data: salesOrders = [],
    isLoading: loadingOrders,
    refetch: refetchOrders,
  } = useListSalesOrdersQuery({
    search: deferredSearchQuery || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  })
  const [createSalesOrder, { isLoading: creatingOrder }] = useCreateSalesOrderMutation()

  const totalOrders = salesOrders.length
  const pendingOrders = salesOrders.filter((order) => order.status === SalesOrderStatus.pending).length
  const inProgressOrders = salesOrders.filter((order) => order.status === SalesOrderStatus.in_progress).length
  const shippedOrders = salesOrders.filter((order) => order.status === SalesOrderStatus.shipped).length
  const completedOrders = salesOrders.filter((order) => order.status === SalesOrderStatus.completed).length
  const totalValue = salesOrders.reduce((sum, order) => sum + asNumber(order.total_price), 0)

  const createStepReady = totalOrders > 0
  const reserveStepReady = salesOrders.some((order) =>
    [SalesOrderStatus.in_progress, SalesOrderStatus.shipped, SalesOrderStatus.completed].includes(order.status as never),
  )
  const shipStepReady = shippedOrders > 0 || completedOrders > 0
  const nextStepId = !createStepReady ? "create-orders" : !reserveStepReady ? "active-orders" : !shipStepReady ? "shipping" : null

  const recentOrders = salesOrders.slice(0, 8)
  const attentionOrders = salesOrders.filter((order) =>
    [SalesOrderStatus.pending, SalesOrderStatus.in_progress, SalesOrderStatus.shipped].includes(order.status as never),
  )
  const setupGuideSteps = [
    {
      id: "create-orders",
      title: "Create customer orders",
      description: "Capture the commercial commitment and customer context.",
      complete: createStepReady,
      icon: ShoppingBag,
    },
    {
      id: "active-orders",
      title: "Reserve and prepare stock",
      description: "Add the lines and assign inventory before fulfillment.",
      complete: reserveStepReady,
      icon: Users2,
    },
    {
      id: "shipping",
      title: "Ship and complete",
      description: "Turn reservations into shipments and close the order cleanly.",
      complete: shipStepReady,
      icon: Truck,
    },
  ] as const
  const showWorkspaceLoading = loadingWorkspaceSetup && !activeMembership

  const handleCreateOrder = async () => {
    if (!formState.customer) {
      toast.error("Select a customer before creating a sales order.")
      return
    }

    try {
      const created = await createSalesOrder({
        customer: formState.customer,
        responsible: formState.responsible || undefined,
        order_currency: formState.order_currency || defaultCurrency,
        customer_reference: formState.customer_reference || undefined,
        description: formState.description || undefined,
        notes: formState.notes || undefined,
        link: formState.link || undefined,
        delivery_date: formState.delivery_date || undefined,
      }).unwrap()
      toast.success("Sales order created")
      setFormState(buildInitialForm(defaultCurrency))
      await refetchOrders()
      router.push(`/order/sales/${created.id}`)
    } catch (error) {
      toast.error(extractErrorMessage(error, ["customer", "delivery_date", "description"]))
    }
  }

  if (!activeMembership && !showWorkspaceLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="p-6 text-left text-inherit">
            <CardTitle className="text-3xl tracking-tight">Create a workspace before managing sales orders</CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6 text-gray-600">
              Sales orders depend on an active company workspace with products, inventory, and customers already configured.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {isOwner ? (
              <Button asChild>
                <Link href="/profile/">
                  Go to workspace setup
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <p className="text-sm text-gray-600">Ask the workspace owner to complete the company setup before sales-order workflows continue.</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 lg:px-8">
      {showWorkspaceLoading ? <WorkspaceSetupLoadingCard /> : null}
      {isOwner ? (
        <CollapsibleSetupGuide
          eyebrow="Sales orders"
          title="Move customer demand into reservation and shipment"
          description="Create the order, reserve stock, then ship and close from one workflow."
          steps={setupGuideSteps}
          nextStep={nextStepId ? { href: `#${nextStepId}`, label: "Continue sales workflow" } : null}
          completeMessage="Sales-order foundations are in place. You can move demand through reservation, shipment, and completion."
          notes={[
            {
              title: "Inventory-backed fulfillment",
              description: "Reservation and shipment both depend on stock locations and inventory items already existing.",
            },
            {
              title: "Customers first",
              description: "Create or sync customer companies before the commercial team starts building sales orders.",
            },
            {
              title: "Operational handoff",
              description: "The workbench route is where stock reservation, shipment, and completion actually happen.",
            },
          ]}
        />
      ) : null}

      <main className="min-w-0 space-y-6">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 p-6 text-left text-inherit">
            <CardTitle className="text-3xl tracking-tight">Sales order operations</CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6 text-gray-600">
              Build the customer order here, then open each workbench to manage stock reservation, shipment, and completion.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Sales orders</div>
              <div className="mt-3 text-3xl font-semibold text-gray-900">{loadingOrders ? "..." : totalOrders}</div>
              <p className="mt-2 text-sm text-gray-600">Customer orders currently in the system.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Pending</div>
              <div className="mt-3 text-3xl font-semibold text-gray-900">{loadingOrders ? "..." : pendingOrders}</div>
              <p className="mt-2 text-sm text-gray-600">Orders still waiting for stock reservation or issue.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">In progress</div>
              <div className="mt-3 text-3xl font-semibold text-gray-900">{loadingOrders ? "..." : inProgressOrders}</div>
              <p className="mt-2 text-sm text-gray-600">Orders with active reservation or partial shipment activity.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Order value</div>
              <div className="mt-3 text-3xl font-semibold text-gray-900">{loadingOrders ? "..." : formatCurrencyCompact(defaultCurrency, totalValue)}</div>
              <p className="mt-2 text-sm text-gray-600">Total current value across the filtered sales order list.</p>
            </div>
          </CardContent>
        </Card>

        <OperationalStepSection
          id="create-orders"
          step={1}
          title="Create the customer order and ownership context"
          description="Capture the customer, owner, delivery target, and commercial note before operational fulfillment begins."
          helper="The workbench route takes over after the order record exists."
          status={createStepReady ? "complete" : "in_progress"}
          facts={[
            { label: "Customers", value: customers.length },
            { label: "Sales reps", value: users.length },
            { label: "Next outcome", value: createStepReady ? "Open order workbench" : "Create first sales order" },
          ]}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="sales-customer">Customer</Label>
              <Select value={formState.customer} onValueChange={(value) => setFormState((current) => ({ ...current, customer: value }))}>
                <SelectTrigger id="sales-customer">
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
              <Label htmlFor="sales-responsible">Responsible owner</Label>
              <Select value={formState.responsible} onValueChange={(value) => setFormState((current) => ({ ...current, responsible: value }))}>
                <SelectTrigger id="sales-responsible">
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
              <Label htmlFor="sales-currency">Order currency</Label>
              <Select
                value={formState.order_currency}
                onValueChange={(value) => setFormState((current) => ({ ...current, order_currency: value }))}
              >
                <SelectTrigger id="sales-currency">
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
              <Label htmlFor="sales-customer-reference">Customer reference</Label>
              <Input
                id="sales-customer-reference"
                value={formState.customer_reference}
                onChange={(event) => setFormState((current) => ({ ...current, customer_reference: event.target.value }))}
                placeholder="Optional customer PO / sales reference"
              />
            </div>
            <div className="space-y-2 xl:col-span-2">
              <Label htmlFor="sales-description">Description</Label>
              <Input
                id="sales-description"
                value={formState.description}
                onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
                placeholder="What is this sales order for?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sales-delivery-date">Expected delivery date</Label>
              <Input
                id="sales-delivery-date"
                type="date"
                value={formState.delivery_date}
                onChange={(event) => setFormState((current) => ({ ...current, delivery_date: event.target.value }))}
              />
            </div>
            <div className="space-y-2 xl:col-span-3">
              <Label htmlFor="sales-link">External link</Label>
              <Input
                id="sales-link"
                value={formState.link}
                onChange={(event) => setFormState((current) => ({ ...current, link: event.target.value }))}
                placeholder="Optional customer portal or deal reference"
              />
            </div>
            <div className="space-y-2 xl:col-span-3">
              <Label htmlFor="sales-notes">Internal notes</Label>
              <Textarea
                id="sales-notes"
                rows={4}
                value={formState.notes}
                onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Capture fulfillment instructions, commercial notes, or customer context"
              />
            </div>
          </div>
          <div className="mt-6">
            <Button onClick={handleCreateOrder} disabled={creatingOrder}>
              {creatingOrder ? "Creating..." : "Create sales order"}
            </Button>
          </div>
        </OperationalStepSection>

        <OperationalStepSection
          id="active-orders"
          step={2}
          title="Review open orders and continue into the workbench"
          description="Filter the current order book, open the relevant workbench, and move the order into reservation and shipment operations."
          helper="Reservation and shipment do not happen here. This is the control surface for opening the right order."
          status={reserveStepReady ? "complete" : createStepReady ? "in_progress" : "pending"}
          facts={[
            { label: "Active orders", value: attentionOrders.length },
            { label: "Search results", value: loadingOrders ? "..." : salesOrders.length },
            { label: "Completed", value: completedOrders },
          ]}
        >
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sales-search">Search orders</Label>
                  <Input
                    id="sales-search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by reference or customer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sales-status-filter">Status filter</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="sales-status-filter">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {Object.values(SalesOrderStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {formatStatus(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <ClipboardCheck className="h-4 w-4 text-blue-600" />
                Operational reminder
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Open the workbench as soon as an order needs inventory allocation. That route owns line items, reservation, shipment, and closure.
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery date</TableHead>
                  <TableHead>Total value</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-gray-500">
                      No sales orders yet. Create the first order above to start the fulfillment flow.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentOrders.map((order: SalesOrderInterface) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium text-gray-900">{order.reference || order.id}</TableCell>
                      <TableCell>{order.customer_name || "No customer assigned"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusStyles[order.status] || "border-gray-200 bg-gray-50 text-gray-700"}>
                          {formatStatus(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.delivery_date || "Not scheduled"}</TableCell>
                      <TableCell>{formatCurrencyCompact(defaultCurrency, asNumber(order.total_price))}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/order/sales/${order.id}`}>Open workbench</Link>
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
          id="shipping"
          step={3}
          title="Track which orders still need reservation, shipment, or closure"
          description="Use these attention queues to decide which sales order needs stock allocation, shipping, or completion next."
          helper="The order workbench route exposes the stock-reservation and shipping controls."
          status={shipStepReady ? "complete" : reserveStepReady ? "in_progress" : "pending"}
          facts={[
            { label: "Pending", value: pendingOrders },
            { label: "In progress", value: inProgressOrders },
            { label: "Shipped", value: shippedOrders },
          ]}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <PackageCheck className="h-4 w-4 text-blue-600" />
                Ready for reservation
              </div>
              <div className="mt-3 space-y-3">
                {attentionOrders.filter((order) => order.status === SalesOrderStatus.pending).slice(0, 4).map((order) => (
                  <Link key={order.id} href={`/order/sales/${order.id}`} className="block rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 hover:border-blue-300">
                    <div className="font-semibold text-gray-900">{order.reference || order.id}</div>
                    <div className="mt-1">{order.customer_name || "No customer"}</div>
                  </Link>
                ))}
                {!attentionOrders.some((order) => order.status === SalesOrderStatus.pending) ? (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-white px-3 py-4 text-sm text-gray-500">
                    No pending orders right now.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Truck className="h-4 w-4 text-blue-600" />
                Ready for shipping
              </div>
              <div className="mt-3 space-y-3">
                {attentionOrders.filter((order) => order.status === SalesOrderStatus.in_progress).slice(0, 4).map((order) => (
                  <Link key={order.id} href={`/order/sales/${order.id}`} className="block rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 hover:border-blue-300">
                    <div className="font-semibold text-gray-900">{order.reference || order.id}</div>
                    <div className="mt-1">{order.customer_name || "No customer"}</div>
                  </Link>
                ))}
                {!attentionOrders.some((order) => order.status === SalesOrderStatus.in_progress) ? (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-white px-3 py-4 text-sm text-gray-500">
                    No in-progress orders right now.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <ReceiptText className="h-4 w-4 text-blue-600" />
                Ready to close
              </div>
              <div className="mt-3 space-y-3">
                {attentionOrders.filter((order) => order.status === SalesOrderStatus.shipped).slice(0, 4).map((order) => (
                  <Link key={order.id} href={`/order/sales/${order.id}`} className="block rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 hover:border-blue-300">
                    <div className="font-semibold text-gray-900">{order.reference || order.id}</div>
                    <div className="mt-1">{order.customer_name || "No customer"}</div>
                  </Link>
                ))}
                {!attentionOrders.some((order) => order.status === SalesOrderStatus.shipped) ? (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-white px-3 py-4 text-sm text-gray-500">
                    No shipped orders waiting for closure.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </OperationalStepSection>
      </main>
    </div>
  )
}

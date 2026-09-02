"use client"

import Link from "next/link"
import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowRight,
  ClipboardCheck,
  FileClock,
  PackageCheck,
  ReceiptText,
  ShoppingCart,
  TriangleAlert,
  Truck,
} from "lucide-react"
import { toast } from "react-toastify"
import { WorkspaceSetupLoadingCard, useWorkspaceSetupProgress } from "@/components/onboarding/WorkspaceSetupShell"
import CollapsibleSetupGuide from "@/components/setup/CollapsibleSetupGuide"
import OperationalStepSection from "@/components/setup/OperationalStepSection"
import StructuralLocationScopeSelect from "@/components/stock/StructuralLocationScopeSelect"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Pagination } from "@/components/ui/pagination"
import { CURRENCY_CODES } from "@/lib/currencyCode"
import { formatCurrencyCompact } from "@/lib/currency-utils"
import { buildStructuralLocationScopeParams } from "@/lib/structuralLocationScope"
import { useStructuralLocationScope } from "@/hooks/useStructuralLocationScope"
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

type PurchaseOrderListState = {
  searchQuery: string
  statusFilter: string
  supplierFilter: string
  deliveryDateFrom: string
  deliveryDateTo: string
  ordering: string
  page: number
  pageSize: number
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

const parsePurchaseOrderListState = (params: URLSearchParams): PurchaseOrderListState => {
  const status = params.get("purchase_orders_status")
  const ordering = params.get("purchase_orders_ordering")
  const requestedPage = Number(params.get("purchase_orders_page"))
  const requestedPageSize = Number(params.get("purchase_orders_page_size"))
  const allowedStatuses = Object.values(PurchaseOrderStatus)
  const allowedOrderings = ["-created_at", "created_at", "delivery_date", "-delivery_date", "reference"]

  return {
    searchQuery: params.get("purchase_orders_search") || "",
    statusFilter: status && allowedStatuses.includes(status as (typeof allowedStatuses)[number]) ? status : "all",
    supplierFilter: params.get("purchase_orders_supplier") || "all",
    deliveryDateFrom: params.get("purchase_orders_delivery_date_from") || "",
    deliveryDateTo: params.get("purchase_orders_delivery_date_to") || "",
    ordering: ordering && allowedOrderings.includes(ordering) ? ordering : "-created_at",
    page: Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    pageSize: [10, 20, 50, 100].includes(requestedPageSize) ? requestedPageSize : 10,
  }
}

const quickSummary = (summary?: PurchaseOrderDashboardSummary, analytics?: PurchaseOrderAnalyticsResponse) => ({
  totalOrders: asNumber(summary?.total_orders as string | number | undefined) || analytics?.total_purchase_orders || 0,
  pendingApproval: asNumber(summary?.pending_approval as string | number | undefined) || analytics?.pending_orders || 0,
  overdueOrders: asNumber(summary?.overdue_orders as string | number | undefined),
  ordersThisWeek: asNumber(summary?.orders_this_week as string | number | undefined),
  totalValueThisMonth: asNumber(summary?.total_value_this_month as string | number | undefined),
})

export default function PurchaseOrderSetupWorkspace() {
  const router = useRouter()
  const { activeMembership, isWorkspaceContextLoading: loadingWorkspaceSetup, isOwner, profile } = useWorkspaceSetupProgress()
  const defaultCurrency = profile?.currency || "NGN"
  const [formState, setFormState] = useState<PurchaseOrderFormState>(() => buildInitialForm(defaultCurrency))
  const [selectedStructuralLocationIds, setSelectedStructuralLocationIds] = useStructuralLocationScope()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const listStateKey = "purchase_orders"
  const urlListState = useMemo(() => parsePurchaseOrderListState(searchParams), [searchParams])
  const [listState, setListState] = useState<PurchaseOrderListState>(urlListState)
  const {
    searchQuery,
    statusFilter,
    supplierFilter,
    deliveryDateFrom,
    deliveryDateTo,
    ordering,
    page,
    pageSize,
  } = listState

  useEffect(() => {
    setListState(urlListState)
  }, [urlListState])

  useEffect(() => {
    const syncFromBrowserHistory = () => {
      setListState(parsePurchaseOrderListState(new URLSearchParams(window.location.search)))
    }
    window.addEventListener("popstate", syncFromBrowserHistory)
    return () => window.removeEventListener("popstate", syncFromBrowserHistory)
  }, [])
  const hasActiveListFilters = Boolean(
    searchQuery ||
      statusFilter !== "all" ||
      supplierFilter !== "all" ||
      deliveryDateFrom ||
      deliveryDateTo ||
      ordering !== "-created_at" ||
      page > 1 ||
      pageSize !== 10,
  )

  const updateListState = (updates: Record<string, string | null>, historyMode: "push" | "replace" = "push") => {
    const currentQuery = typeof window === "undefined" ? searchParams.toString() : window.location.search
    const nextParams = new URLSearchParams(currentQuery)
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        nextParams.set(key, value)
      } else {
        nextParams.delete(key)
      }
    })
    const query = nextParams.toString()
    const href = query ? `${pathname}?${query}` : pathname
    setListState(parsePurchaseOrderListState(nextParams))
    if (typeof window !== "undefined" && `${window.location.pathname}${window.location.search}` !== href) {
      if (historyMode === "replace") {
        window.history.replaceState(window.history.state, "", href)
      } else {
        window.history.pushState(window.history.state, "", href)
      }
    }
  }

  const updateListFilter = (key: string, value: string | null) => {
    updateListState({
      [`${listStateKey}_${key}`]: value,
      [`${listStateKey}_page`]: null,
    }, key === "search" ? "replace" : "push")
  }

  const clearListFilters = () => {
    updateListState({
      [`${listStateKey}_search`]: null,
      [`${listStateKey}_status`]: null,
      [`${listStateKey}_supplier`]: null,
      [`${listStateKey}_delivery_date_from`]: null,
      [`${listStateKey}_delivery_date_to`]: null,
      [`${listStateKey}_ordering`]: null,
      [`${listStateKey}_page`]: null,
      [`${listStateKey}_page_size`]: null,
    })
  }

  const deferredSearchQuery = useDeferredValue(searchQuery.trim())
  const structuralScopeParams = useMemo(
    () => buildStructuralLocationScopeParams(selectedStructuralLocationIds),
    [selectedStructuralLocationIds],
  )

  const { data: suppliers = [] } = useGetSupplersQuery()
  const { data: users = [] } = useGetCompanyUsersQuery()
  const { data: summary } = useGetPurchaseOrderDashboardSummaryQuery(structuralScopeParams)
  const { data: analytics } = useGetPurchaseOrderAnalyticsQuery(structuralScopeParams)
  const {
    data: purchaseOrderPage,
    isLoading: loadingOrders,
    refetch: refetchOrders,
  } = useListPurchaseOrdersQuery(
    {
      ...structuralScopeParams,
      search: deferredSearchQuery || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      supplier: supplierFilter === "all" ? undefined : supplierFilter,
      delivery_date_from: deliveryDateFrom || undefined,
      delivery_date_to: deliveryDateTo || undefined,
      ordering,
      page,
      page_size: pageSize,
    },
  )
  const [createPurchaseOrder, { isLoading: creatingOrder }] = useCreatePurchaseOrderMutation()

  const quickMetrics = quickSummary(summary, analytics)
  const purchaseOrders = useMemo(() => purchaseOrderPage?.results ?? [], [purchaseOrderPage])
  const totalPurchaseOrders = purchaseOrderPage?.count ?? purchaseOrders.length
  const currentPage = purchaseOrderPage?.page ?? page
  const totalPages = purchaseOrderPage?.total_pages ?? Math.max(1, Math.ceil(totalPurchaseOrders / pageSize))
  const pageStart = totalPurchaseOrders === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const pageEnd = totalPurchaseOrders === 0 ? 0 : Math.min(currentPage * pageSize, totalPurchaseOrders)
  const issuedCount = analytics?.issued_orders ?? 0
  const receivedCount = analytics?.received_orders ?? 0
  const completedCount = analytics?.completed_orders ?? 0
  const workflowReadyCount = (analytics?.approved_orders ?? 0) + issuedCount + receivedCount + completedCount
  const hasOrders = quickMetrics.totalOrders > 0
  const createStepReady = hasOrders
  const issueStepReady = workflowReadyCount > 0
  const receiveStepReady = receivedCount > 0 || completedCount > 0

  const nextStepId = !createStepReady ? "create-orders" : !issueStepReady ? "active-orders" : !receiveStepReady ? "attention" : null

  const attentionStatuses = useMemo(() => new Set(Object.values(PurchaseOrderStatus)), [])
  const attentionOrders = useMemo(
    () => purchaseOrders.filter((order) => attentionStatuses.has(String(order.status) as (typeof PurchaseOrderStatus)[keyof typeof PurchaseOrderStatus])),
    [attentionStatuses, purchaseOrders],
  )
  const setupGuideSteps = [
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
  ] as const
  const showWorkspaceLoading = loadingWorkspaceSetup && !activeMembership

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

  if (!activeMembership && !showWorkspaceLoading) {
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
            {isOwner ? (
              <Button asChild>
                <Link href="/profile/create">
                  Go to workspace setup
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <p className="text-sm text-gray-600">Ask the workspace owner to complete the company setup before purchase ordering continues.</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="purchase-orders-workspace mx-auto w-full max-w-7xl space-y-6 px-4 py-6 lg:px-8">
      {showWorkspaceLoading ? <WorkspaceSetupLoadingCard /> : null}
      {isOwner ? (
        <CollapsibleSetupGuide
          eyebrow="Purchase orders"
          title="Run replenishment from request to receiving"
          description="Start supplier-backed orders, add the required lines, then move each order through approval, issue, receiving, and closure."
          steps={setupGuideSteps}
          nextStep={
            nextStepId
              ? { href: `#${nextStepId}`, label: "Continue the purchase flow" }
              : null
          }
          completeMessage="Purchase-order foundations are in place. Your team can now keep replenishment moving from order to receiving."
          notes={[
            {
              title: "Suppliers first",
              description: "Create supplier companies before opening purchase orders so the order can be issued cleanly.",
            },
            {
              title: "Order lines before approval",
              description: "Approval should happen after quantity, price, and receiving expectations are already on the order.",
            },
            {
              title: "Receiving closes the loop",
              description: "Stock only becomes operational after the issued order is received into a stock location.",
            },
          ]}
        />
      ) : null}

      <main className="min-w-0 space-y-6">
        <StructuralLocationScopeSelect
          allowMultiSelect
          className="max-w-sm"
          id="purchase-order-structural-scope"
          values={selectedStructuralLocationIds}
          onValuesChange={setSelectedStructuralLocationIds}
          description="Focus purchase-order setup, metrics, and order lists on one structural location when you need store-level replenishment visibility."
        />
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
            { label: "Active orders", value: analytics?.total_purchase_orders ?? totalPurchaseOrders },
            { label: "Approved or beyond", value: workflowReadyCount },
            { label: "Search results", value: loadingOrders ? "..." : totalPurchaseOrders },
          ]}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="po-search">Search purchase orders</Label>
              <Input
                id="po-search"
                value={searchQuery}
                onChange={(event) => updateListFilter("search", event.target.value.trim() || null)}
                placeholder="Search by reference, description, or supplier"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="po-status">Filter by status</Label>
              <Select value={statusFilter} onValueChange={(value) => updateListFilter("status", value === "all" ? null : value)}>
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
            <div className="space-y-2">
              <Label htmlFor="po-supplier">Supplier</Label>
              <Select value={supplierFilter} onValueChange={(value) => updateListFilter("supplier", value === "all" ? null : value)}>
                <SelectTrigger id="po-supplier">
                  <SelectValue placeholder="All suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All suppliers</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={String(supplier.id)}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="po-ordering">Sort by</Label>
              <Select value={ordering} onValueChange={(value) => updateListFilter("ordering", value === "-created_at" ? null : value)}>
                <SelectTrigger id="po-ordering">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-created_at">Newest created</SelectItem>
                  <SelectItem value="created_at">Oldest created</SelectItem>
                  <SelectItem value="delivery_date">Delivery date: earliest</SelectItem>
                  <SelectItem value="-delivery_date">Delivery date: latest</SelectItem>
                  <SelectItem value="reference">Reference: A–Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="po-delivery-date-from">Delivery date from</Label>
              <Input id="po-delivery-date-from" type="date" value={deliveryDateFrom} onChange={(event) => updateListFilter("delivery_date_from", event.target.value || null)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="po-delivery-date-to">Delivery date to</Label>
              <Input id="po-delivery-date-to" type="date" value={deliveryDateTo} onChange={(event) => updateListFilter("delivery_date_to", event.target.value || null)} />
            </div>
          </div>
          {hasActiveListFilters ? (
            <div className="mt-4 flex justify-end">
              <Button type="button" variant="outline" onClick={clearListFilters}>
                Clear filters
              </Button>
            </div>
          ) : null}

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
                ) : purchaseOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-gray-500">
                      No purchase orders match the current filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  purchaseOrders.map((order) => (
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
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span>
                Showing <span className="font-semibold text-gray-950">{pageStart}</span> to{" "}
                <span className="font-semibold text-gray-950">{pageEnd}</span> of{" "}
                <span className="font-semibold text-gray-950">{totalPurchaseOrders}</span> orders
              </span>
              <div className="flex items-center gap-2">
                <span>Rows per page</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    updateListState({
                      [`${listStateKey}_page_size`]: value === "10" ? null : value,
                      [`${listStateKey}_page`]: null,
                    })
                  }}
                >
                  <SelectTrigger className="h-9 w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50, 100].map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(nextPage) => updateListState({ [`${listStateKey}_page`]: nextPage <= 1 ? null : String(nextPage) })}
            />
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

"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { getCookie } from "cookies-next"
import {
  Boxes,
  Building2,
  CreditCard,
  Loader2,
  PackageOpen,
  PlusCircle,
  ReceiptText,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  Users,
} from "lucide-react"
import { toast } from "react-toastify"
import DomainLaunchCard from "@/components/dashboard/DomainLaunchCard"
import StatTile from "@/components/dashboard/StatTile"
import { WorkspaceSetupOverview, useWorkspaceSetupProgress } from "@/components/onboarding/WorkspaceSetupShell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CompanyProfileContext,
  useGetUserCompaniesQuery,
  useSwitchCompanyMutation,
} from "@/redux/features/auth/authApiSlice"
import { hasPermission } from "@/lib/permissionsGuard"
import { useGetInventoryAnalyticsQuery } from "@/redux/features/inventory/inventoryAPiSlice"
import {
  useGetPurchaseOrderAnalyticsQuery,
  useListReturnOrdersQuery,
  useListSalesOrdersQuery,
} from "@/redux/features/orders/orderAPISlice"
import { useGetCurrentSessionQuery, useGetDailySalesQuery, useGetHeldOrdersQuery, useGetSessionCloseoutSummaryQuery } from "@/redux/features/pos/posAPISlice"
import { useGetDashboardStatsQuery } from "@/redux/features/product/productAPISlice"
import { useGetLowStockItemsQuery } from "@/redux/features/stock/stockAPISlice"
import { readCookieValue } from "@/lib/authCookies"
import { formatCurrencyCompact } from "@/lib/currency-utils"

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "No active session"
  }

  return new Date(value).toLocaleString()
}

const DashboardLoadingState = () => (
  <div className="mx-auto mt-8 grid w-full max-w-6xl grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
    {Array.from({ length: 8 }).map((_, index) => (
      <div key={`dashboard-loading-${index}`} className="h-36 animate-pulse rounded-2xl border border-gray-200 bg-white" />
    ))}
  </div>
)

const PermissionMetricTile = ({
  label,
  requiredPermission,
}: {
  label: string
  requiredPermission: string
}) => (
  <Card className="border-red-200 bg-red-50 shadow-sm">
    <CardContent className="space-y-3 p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-red-600">Access restricted</div>
      <div className="text-lg font-semibold text-red-950">{label}</div>
      <div className="text-sm text-red-800">You do not have access to this dashboard metric.</div>
      <div className="inline-flex items-center rounded-xl border border-red-200 bg-white px-3 py-2 font-mono text-xs font-semibold text-red-700">
        {requiredPermission}
      </div>
    </CardContent>
  </Card>
)

const PermissionSectionCard = ({
  title,
  description,
  requiredPermission,
}: {
  title: string
  description: string
  requiredPermission: string
}) => (
  <Card className="border-red-200 bg-red-50 shadow-sm">
    <CardHeader className="border-b border-red-100 p-5 text-left text-inherit">
      <CardTitle className="text-xl tracking-tight text-red-950">{title}</CardTitle>
      <CardDescription className="text-sm leading-6 text-red-800">{description}</CardDescription>
    </CardHeader>
    <CardContent className="p-5">
      <div className="rounded-2xl border border-red-200 bg-white px-4 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-red-600">Permission required</div>
        <div className="mt-2 font-mono text-sm font-semibold text-red-900">{requiredPermission}</div>
        <div className="mt-2 text-sm text-red-800">
          This dashboard section exists in the workspace, but your current access does not include this resource.
        </div>
      </div>
    </CardContent>
  </Card>
)

const PermissionLaunchCard = ({
  title,
  description,
  requiredPermission,
}: {
  title: string
  description: string
  requiredPermission: string
}) => (
  <Card className="border-red-200 bg-red-50 shadow-sm">
    <CardHeader className="p-6 text-left">
      <div className="rounded-full border border-red-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-red-600">
        Restricted
      </div>
      <CardTitle className="mt-4 text-2xl tracking-tight text-red-950">{title}</CardTitle>
      <CardDescription className="mt-2 text-sm leading-6 text-red-800">{description}</CardDescription>
    </CardHeader>
    <CardContent className="p-6 pt-0">
      <div className="rounded-2xl border border-red-200 bg-white px-4 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-red-600">Permission required</div>
        <div className="mt-2 font-mono text-sm font-semibold text-red-900">{requiredPermission}</div>
      </div>
    </CardContent>
  </Card>
)

const NoProfileState = ({
  profiles,
  switchingProfileId,
  onSwitchCompany,
}: {
  profiles: CompanyProfileContext[]
  switchingProfileId: string | null
  onSwitchCompany: (profile: CompanyProfileContext) => Promise<void>
}) => {
  if (!profiles.length) {
    return (
      <div className="mx-auto mt-10 w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-blue-50 p-3 text-blue-700">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Create your first company profile</h2>
            <p className="mt-2 text-sm text-gray-600">
              You’re signed in, but no company workspace is attached yet. Create a profile to start managing inventory.
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link href="/profile">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create company profile
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-4xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex items-start gap-4">
        <div className="rounded-full bg-blue-50 p-3 text-blue-700">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Choose a company workspace</h2>
          <p className="mt-2 text-sm text-gray-600">
            Select the company you want to work with. Dashboard data loads after you switch context.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition-colors hover:border-blue-300"
          >
            <div className="mb-3">
              <p className="text-base font-semibold text-gray-900">{profile.name}</p>
              <p className="text-xs text-gray-500">
                Code: <span className="font-medium text-gray-700">{profile.company_code}</span>
              </p>
              {profile.role ? (
                <p className="mt-1 text-xs uppercase tracking-wide text-blue-700">Role: {profile.role}</p>
              ) : null}
            </div>
            <Button onClick={() => void onSwitchCompany(profile)} disabled={switchingProfileId === profile.id} className="w-full">
              {switchingProfileId === profile.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Switching...
                </>
              ) : (
                "Open dashboard"
              )}
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Button asChild variant="outline">
          <Link href="/profile">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create another company profile
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [switchingProfileId, setSwitchingProfileId] = useState<string | null>(null)
  const { data: companyMemberships, isLoading, isError, refetch } = useGetUserCompaniesQuery()
  const [switchCompany] = useSwitchCompanyMutation()
  const { activeMembership, isOwner, nextRecommendedStage } = useWorkspaceSetupProgress()

  const canReadInventory = hasPermission("read_inventory")
  const canViewInventoryReports = hasPermission("view_inventory_reports")
  const canReadPos = hasPermission("read_pos")
  const canViewPosReports = hasPermission("view_pos_reports")
  const canReadPurchaseOrders = hasPermission("read_purchase_order")
  const canReadSalesOrders = hasPermission("read_sales_order")
  const canReadReturnOrders = hasPermission("read_return_order")
  const canManageCompanySettings = hasPermission("manage_company_settings")
  const canManageAgentSettings = hasPermission("manage_agent_settings")
  const canReadProductDashboard = canReadInventory || canViewInventoryReports

  const { data: inventoryAnalytics } = useGetInventoryAnalyticsQuery(undefined, {
    skip: !canReadInventory && !canViewInventoryReports,
  })
  const { data: productStats } = useGetDashboardStatsQuery(undefined, {
    skip: !canReadProductDashboard,
  })
  const { data: lowStockItems = [] } = useGetLowStockItemsQuery(undefined, {
    skip: !canReadInventory && !canViewInventoryReports,
  })
  const { data: currentSession } = useGetCurrentSessionQuery(undefined, {
    skip: !canReadPos,
  })
  const { data: heldOrders = [] } = useGetHeldOrdersQuery(undefined, {
    skip: !canReadPos,
  })
  const { data: dailyPosSales } = useGetDailySalesQuery(undefined, {
    skip: !canReadPos || !canViewPosReports,
  })
  const { data: sessionCloseout } = useGetSessionCloseoutSummaryQuery(
    { sessionId: currentSession?.id || "" },
    { skip: !canReadPos || !currentSession?.id },
  )
  const { data: purchaseAnalytics } = useGetPurchaseOrderAnalyticsQuery(undefined, {
    skip: !canReadPurchaseOrders,
  })
  const { data: openSalesOrders = [] } = useListSalesOrdersQuery(
    { status: "pending" },
    { skip: !canReadSalesOrders },
  )
  const { data: openReturnOrders = [] } = useListReturnOrdersQuery(
    { status: "pending" },
    { skip: !canReadReturnOrders },
  )

  const activeProfileId = companyMemberships?.active_profile_id ?? null
  const profiles = companyMemberships?.profiles ?? []
  const cookieProfileId = readCookieValue("profileId", getCookie) ?? readCookieValue("profile", getCookie)
  const currencyCode = activeMembership?.currency || "NGN"
  const inventoryItemCount = inventoryAnalytics?.total_inventory_items ?? inventoryAnalytics?.total_inventories ?? 0
  const activeInventoryItemCount = inventoryAnalytics?.active_inventories ?? inventoryItemCount
  const posSalesCount = dailyPosSales?.total_orders ?? sessionCloseout?.paid_orders_count ?? 0
  const posSalesTotal = Number(dailyPosSales?.total_sales ?? sessionCloseout?.total_sales ?? currentSession?.total_sales ?? 0)
  const posSalesDescription = dailyPosSales
    ? `${posSalesCount} completed POS order${posSalesCount === 1 ? "" : "s"} today`
    : `${posSalesCount} paid POS order${posSalesCount === 1 ? "" : "s"} in the live session`

  const handleSwitchCompany = async (profile: CompanyProfileContext) => {
    try {
      setSwitchingProfileId(profile.id)
      await switchCompany({ profile_id: profile.id }).unwrap()
      await refetch()
      toast.success(`Switched to ${profile.name}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error?.data?.detail || "Unable to switch company context.")
    } finally {
      setSwitchingProfileId(null)
    }
  }

  if (isLoading) {
    return <DashboardLoadingState />
  }

  if (isError && !cookieProfileId) {
    return (
      <div className="mx-auto mt-10 w-full max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-8">
        <h2 className="text-xl font-semibold text-red-800">Unable to load company workspaces</h2>
        <p className="mt-2 text-sm text-red-700">
          We could not fetch your company context. Try again, then create or select a company profile.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={() => void refetch()} variant="outline">
            Retry
          </Button>
          <Button asChild>
            <Link href="/profile">Create company profile</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!activeProfileId) {
    return <NoProfileState profiles={profiles} switchingProfileId={switchingProfileId} onSwitchCompany={handleSwitchCompany} />
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 lg:px-8">
      <Card className="overflow-hidden border-gray-200 shadow-sm">
        <CardContent className="p-0">
          <div className="border-b border-gray-100 bg-gray-100/50 px-6 py-6">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                  <Store className="h-3.5 w-3.5" />
                  Operations home
                </div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">
                  {activeMembership?.name ? `${activeMembership.name} workspace` : "Inventory operations"}
                </h1>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Use this as the command surface for the rebuilt application: onboarding readiness, inventory attention, product launch, POS activity,
                  and order execution all start here.
                </p>
              </div>

              {isOwner ? (
                <div className="min-w-[280px] rounded-3xl border border-white/80 bg-white/90 p-5 shadow-sm">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Recommended next move</div>
                  <div className="mt-2 text-lg font-semibold text-gray-900">
                    {nextRecommendedStage ? nextRecommendedStage.title : "Operational setup is complete"}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {nextRecommendedStage ? nextRecommendedStage.helper : "Move into day-to-day inventory, POS, and order execution."}
                  </p>
                  {nextRecommendedStage ? (
                    <Button asChild className="mt-4 w-full">
                      <Link href={nextRecommendedStage.href}>Continue setup</Link>
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-6">
            {canReadProductDashboard ? (
              <StatTile
                label="Products"
                value={productStats?.total_products ?? 0}
                description={`${productStats?.quick_sale_products ?? 0} POS-ready products`}
                icon={PackageOpen}
                tone="amber"
              />
            ) : (
              <PermissionMetricTile label="Products" requiredPermission="read_inventory" />
            )}
            {canReadInventory || canViewInventoryReports ? (
              <StatTile
                label="Inventory items"
                value={inventoryItemCount}
                description={`${activeInventoryItemCount} active items`}
                icon={Boxes}
                tone="blue"
              />
            ) : (
              <PermissionMetricTile label="Inventory items" requiredPermission="read_inventory" />
            )}
            {canReadInventory || canViewInventoryReports ? (
              <StatTile
                label="Low stock"
                value={lowStockItems.length}
                description={`${inventoryAnalytics?.out_of_stock_count ?? 0} currently out of stock`}
                icon={Truck}
                tone={lowStockItems.length > 0 ? "amber" : "green"}
              />
            ) : (
              <PermissionMetricTile label="Low stock" requiredPermission="view_inventory_reports" />
            )}
            {canReadPos ? (
              <StatTile
                label="Today sales"
                value={formatCurrencyCompact(currencyCode, posSalesTotal)}
                description={posSalesDescription}
                icon={CreditCard}
                tone="green"
              />
            ) : (
              <PermissionMetricTile label="Today sales" requiredPermission="read_pos" />
            )}
            {canReadPos ? (
              <StatTile
                label="Held carts"
                value={heldOrders.length}
                description={currentSession ? "Session is live" : "No live POS session"}
                icon={ShoppingCart}
              />
            ) : (
              <PermissionMetricTile label="Held carts" requiredPermission="read_pos" />
            )}
            {canReadPurchaseOrders ? (
              <StatTile
                label="Pending POs"
                value={purchaseAnalytics?.pending_orders ?? 0}
                description={`${purchaseAnalytics?.approved_orders ?? 0} approved and waiting issue`}
                icon={ReceiptText}
              />
            ) : (
              <PermissionMetricTile label="Pending POs" requiredPermission="read_purchase_order" />
            )}
          </div>
        </CardContent>
      </Card>

      {isOwner ? <WorkspaceSetupOverview /> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        {canReadInventory || canViewInventoryReports ? (
          <DomainLaunchCard
            title="Inventory"
            description="Manage locations, inventory items, stock attention queues, adjustments, reservations, and tracked stock."
            href="/inventory"
            icon={Boxes}
            facts={[
              { label: "Items", value: inventoryItemCount },
              { label: "Low stock", value: inventoryAnalytics?.low_stock_count ?? 0 },
              { label: "Stock value", value: formatCurrencyCompact(currencyCode, Number(inventoryAnalytics?.total_stock_value ?? 0)) },
            ]}
          />
        ) : (
          <PermissionLaunchCard
            title="Inventory"
            description="Manage locations, inventory items, stock attention queues, adjustments, reservations, and tracked stock."
            requiredPermission="read_inventory"
          />
        )}

        {canReadProductDashboard ? (
          <DomainLaunchCard
            title="Product catalog"
            description="Create products, shape variants, manage pricing, control POS visibility, and export catalog data."
            href="/product"
            icon={PackageOpen}
            facts={[
              { label: "Products", value: productStats?.total_products ?? 0 },
              { label: "Quick sale", value: productStats?.quick_sale_products ?? 0 },
              { label: "New this week", value: productStats?.recent_activity?.new_products_this_week ?? 0 },
            ]}
          />
        ) : (
          <PermissionLaunchCard
            title="Product catalog"
            description="Create products, shape variants, manage pricing, control POS visibility, and export catalog data."
            requiredPermission="read_inventory"
          />
        )}

        {canReadPos ? (
          <DomainLaunchCard
            title="POS floor"
            description="Run the cashier flow: sessions, held carts, customer assignment, inventory confirmation, and checkout."
            href="/pos"
            icon={CreditCard}
            facts={[
              { label: "Session", value: currentSession ? "Live" : "Closed" },
              { label: "Held carts", value: heldOrders.length },
              { label: "Orders today", value: posSalesCount },
            ]}
          />
        ) : (
          <PermissionLaunchCard
            title="POS floor"
            description="Run the cashier flow: sessions, held carts, customer assignment, inventory confirmation, and checkout."
            requiredPermission="read_pos"
          />
        )}

        {canReadPurchaseOrders ? (
          <DomainLaunchCard
            title="Purchasing"
            description="Create, approve, issue, receive, and complete supplier orders from the rebuilt purchase-order workflow."
            href="/order/purchase"
            icon={Truck}
            facts={[
              { label: "Total POs", value: purchaseAnalytics?.total_purchase_orders ?? 0 },
              { label: "Pending", value: purchaseAnalytics?.pending_orders ?? 0 },
              { label: "Completed", value: purchaseAnalytics?.completed_orders ?? 0 },
            ]}
          />
        ) : (
          <PermissionLaunchCard
            title="Purchasing"
            description="Create, approve, issue, receive, and complete supplier orders from the rebuilt purchase-order workflow."
            requiredPermission="read_purchase_order"
          />
        )}

        {canReadSalesOrders ? (
          <DomainLaunchCard
            title="Sales orders"
            description="Coordinate reservations, releases, shipments, and delivery completion from the sales-order workspace."
            href="/order/sales"
            icon={ShoppingCart}
            facts={[
              { label: "Open", value: openSalesOrders.length },
              { label: "POS sales today", value: posSalesCount },
              { label: "Held carts", value: heldOrders.length },
            ]}
            ctaLabel="Open sales orders"
          />
        ) : (
          <PermissionLaunchCard
            title="Sales orders"
            description="Coordinate reservations, releases, shipments, and delivery completion from the sales-order workspace."
            requiredPermission="read_sales_order"
          />
        )}

        {canReadReturnOrders ? (
          <DomainLaunchCard
            title="Returns"
            description="Track supplier-facing return flows and keep operational visibility on pending return work."
            href="/order/returns"
            icon={Users}
            facts={[
              { label: "Pending", value: openReturnOrders.length },
              { label: "Issued POs", value: purchaseAnalytics?.issued_orders ?? 0 },
              { label: "Received POs", value: purchaseAnalytics?.received_orders ?? 0 },
            ]}
            ctaLabel="Open returns workspace"
          />
        ) : (
          <PermissionLaunchCard
            title="Returns"
            description="Track supplier-facing return flows and keep operational visibility on pending return work."
            requiredPermission="read_return_order"
          />
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {canReadInventory || canViewInventoryReports ? (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 p-5 text-left text-inherit">
            <CardTitle className="text-xl tracking-tight">Attention queue</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-600">
              These are the most immediate things worth checking before diving deeper into the domain workspaces.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Low stock watchlist</p>
                  <p className="mt-1 text-sm text-gray-600">Top inventory items currently below threshold.</p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/inventory">Open inventory</Link>
                </Button>
              </div>
              <div className="mt-4 space-y-3">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                        <p className="mt-1 text-xs text-gray-500">SKU {item.sku || "No SKU"} · Inventory {item.inventory_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-amber-700">{item.quantity} left</p>
                        <p className="text-xs text-gray-500">Min {item.minimum_stock_level}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {lowStockItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
                    No low-stock alerts right now.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Purchasing pressure</p>
                  <p className="mt-1 text-sm text-gray-600">Purchase-order counts that need operational follow-up.</p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/order/purchase">Open purchasing</Link>
                </Button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Pending</div>
                  <div className="mt-2 text-xl font-semibold text-gray-900">{purchaseAnalytics?.pending_orders ?? 0}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Approved</div>
                  <div className="mt-2 text-xl font-semibold text-gray-900">{purchaseAnalytics?.approved_orders ?? 0}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Issued</div>
                  <div className="mt-2 text-xl font-semibold text-gray-900">{purchaseAnalytics?.issued_orders ?? 0}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Received</div>
                  <div className="mt-2 text-xl font-semibold text-gray-900">{purchaseAnalytics?.received_orders ?? 0}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        ) : (
          <PermissionSectionCard
            title="Attention queue"
            description="These are the most immediate things worth checking before diving deeper into the domain workspaces."
            requiredPermission="view_inventory_reports"
          />
        )}

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 p-5 text-left text-inherit">
            <CardTitle className="text-xl tracking-tight">Live checkout and team context</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-600">
              Quick operational context without switching into the POS floor or settings pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            {canReadPos ? (
              <div className="rounded-2xl border border-gray-200 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-950">Current POS session</p>
                <p className="mt-2 text-lg font-semibold text-blue-950">{currentSession ? "Open and selling" : "No active session"}</p>
                <p className="mt-1 text-sm text-blue-900">
                  {currentSession
                    ? `Started ${formatDateTime(currentSession.opening_time)}`
                    : "Open the POS floor to start a selling session."}
                </p>
                <div className="mt-4">
                  <Button asChild variant="outline" className="border-blue-300 bg-white text-blue-950 hover:bg-blue-100">
                    <Link href="/pos">Open POS floor</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-red-600">Permission required</div>
                <div className="mt-2 font-mono text-sm font-semibold text-red-900">read_pos</div>
                <div className="mt-2 text-sm text-red-800">You do not have access to live POS session data.</div>
              </div>
            )}

            {canReadPos ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">Held cart recovery</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{heldOrders.length}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {heldOrders.length > 0
                    ? "There are suspended sales ready to be restored into the active session."
                    : "No carts are waiting on hold."}
                </p>
              </div>
            ) : null}

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">Workspace actions</p>
              <div className="mt-4 grid gap-3">
                {canManageCompanySettings ? (
                  <Button asChild variant="outline" className="justify-between bg-white">
                    <Link href="/profile/staff">Manage staff and roles</Link>
                  </Button>
                ) : (
                  <div className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-800">
                    Staff and roles requires <span className="font-mono font-semibold text-red-900">manage_company_settings</span>
                  </div>
                )}
                {canManageAgentSettings ? (
                  <Button asChild variant="outline" className="justify-between bg-white">
                    <Link href="/agent/settings">Open AI workspace settings</Link>
                  </Button>
                ) : (
                  <div className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-800">
                    AI workspace settings requires <span className="font-mono font-semibold text-red-900">manage_agent_settings</span>
                  </div>
                )}
                <Button asChild variant="outline" className="justify-between bg-white">
                  <Link href="/realtime-dashboard">Open realtime monitor</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

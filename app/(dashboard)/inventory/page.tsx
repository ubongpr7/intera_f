"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  FolderTree,
  MapPin,
  PackageSearch,
  ShieldCheck,
  TriangleAlert,
  Warehouse,
} from "lucide-react"
import InventoryAttentionCard from "@/components/inventory/InventoryAttentionCard"
import InventoryCategoryView from "@/components/inventory/InventoryCategory"
import InventoryView from "@/components/inventory/InventoryView"
import { useWorkspaceSetupProgress } from "@/components/onboarding/WorkspaceSetupShell"
import OperationalStepSection from "@/components/setup/OperationalStepSection"
import StockLocations from "@/components/stock/stockLoation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatCurrencyCompact } from "@/lib/currency-utils"
import {
  useGetInventoryAnalyticsQuery,
  useGetInventoryCategoriesQuery,
  useGetInventoryDataQuery,
  useGetInventoriesNeedingReorderQuery,
  useGetLowStockInventoriesQuery,
} from "@/redux/features/inventory/inventoryAPiSlice"
import { useGetExpiringStockItemsQuery, useGetLowStockItemsQuery, useGetStockItemDataLocationQuery } from "@/redux/features/stock/stockAPISlice"

type InventorySetupStep = {
  id: string
  title: string
  description: string
  complete: boolean
  icon: typeof MapPin
}

const displayCount = (value: number | undefined, isLoading: boolean) => {
  if (isLoading) {
    return "..."
  }

  return value ?? 0
}

export default function InventoryPage() {
  const [refetchData, setRefetchData] = useState(false)
  const { activeMembership, nextRecommendedStage, profile, readiness } = useWorkspaceSetupProgress()

  const { data: locations, isLoading: loadingLocations } = useGetStockItemDataLocationQuery()
  const { data: categories, isLoading: loadingCategories } = useGetInventoryCategoriesQuery()
  const { data: inventories, isLoading: loadingInventories } = useGetInventoryDataQuery()
  const { data: inventoryAnalytics, isLoading: loadingAnalytics } = useGetInventoryAnalyticsQuery()
  const { data: lowStockItems, isLoading: loadingLowStock } = useGetLowStockItemsQuery()
  const { data: lowStockInventories = [], isLoading: loadingLowStockInventories } = useGetLowStockInventoriesQuery()
  const { data: inventoriesNeedingReorder = [], isLoading: loadingReorderInventories } = useGetInventoriesNeedingReorderQuery()
  const { data: expiringStockItems = [], isLoading: loadingExpiringStock } = useGetExpiringStockItemsQuery({ days: 30 })

  const locationCount = locations?.length ?? 0
  const categoryCount = categories?.length ?? 0
  const inventoryCount = inventories?.length ?? 0
  const lowStockCount = inventoryAnalytics?.low_stock_count ?? lowStockItems?.length ?? 0
  const totalStockValue = Number(inventoryAnalytics?.total_stock_value ?? 0)
  const currencyCode = profile?.currency || "NGN"

  const setupSteps: InventorySetupStep[] = useMemo(
    () => [
      {
        id: "locations",
        title: "Define stock locations",
        description: "Create the physical and logical places where stock will live before anything else is cataloged.",
        complete: locationCount > 0,
        icon: MapPin,
      },
      {
        id: "categories",
        title: "Group inventory categories",
        description: "Create operating categories that can inherit default locations and later shape reorder policy.",
        complete: categoryCount > 0,
        icon: FolderTree,
      },
      {
        id: "inventories",
        title: "Open inventory ledgers",
        description: "Create the actual inventory buckets with valuation, reorder rules, and ownership.",
        complete: inventoryCount > 0,
        icon: Warehouse,
      },
    ],
    [categoryCount, inventoryCount, locationCount],
  )

  const completedSetupSteps = setupSteps.filter((step) => step.complete).length
  const completionPercentage = Math.round((completedSetupSteps / setupSteps.length) * 100)
  const nextInventoryStep = setupSteps.find((step) => !step.complete) ?? null
  const lowStockInventoryItems = (lowStockInventories || []).slice(0, 4).map((inventory) => ({
    id: inventory.id,
    title: inventory.name,
    supporting: inventory.category_name || "Inventory",
    detail: `Current stock: ${inventory.current_stock_level ?? 0} • Minimum: ${inventory.minimum_stock_level ?? 0}`,
    href: `/inventory/${inventory.id}`,
    badge: inventory.stock_status || "low stock",
  }))
  const reorderInventoryItems = (inventoriesNeedingReorder || []).slice(0, 4).map((inventory) => ({
    id: inventory.id,
    title: inventory.name,
    supporting: inventory.reorder_strategy || "Reorder required",
    detail: `Reorder point: ${inventory.re_order_point ?? 0} • Suggested quantity: ${inventory.re_order_quantity ?? 0}`,
    href: `/inventory/${inventory.id}`,
    badge: inventory.re_order_quantity ?? 0,
  }))
  const expiringInventoryItems = (expiringStockItems || []).slice(0, 4).map((item) => ({
    id: item.id,
    title: item.name || "Stock item",
    supporting: item.inventory_name || "Inventory item",
    detail: `Expiry: ${item.expiry_date || "Unknown"} • Quantity: ${item.quantity ?? 0}`,
    badge: item.days_to_expiry ?? "watch",
  }))

  if (!activeMembership) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="p-6 text-left text-inherit">
            <CardTitle className="text-3xl tracking-tight">Create a workspace before setting up inventory</CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6 text-gray-600">
              Inventory setup depends on an active company workspace. Create and activate your workspace first, then come back here to
              define locations, categories, and inventory ledgers.
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
              <Boxes className="h-3.5 w-3.5" />
              Inventory setup
            </div>
            <CardTitle className="mt-3 text-xl">Build the operating structure before stock starts moving</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-600">
              The clean order is location structure, then categories, then the inventory ledgers your staff will manage every day.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-gray-500">
                <span>Inventory readiness</span>
                <span>{completionPercentage}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            {nextInventoryStep ? (
              <a
                href={`#${nextInventoryStep.id}`}
                className="flex w-full items-center justify-between rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Continue with {nextInventoryStep.title}
                <ArrowRight className="h-4 w-4" />
              </a>
            ) : (
              <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                Inventory foundations are in place. You can move forward into products, stock control, and POS execution.
              </div>
            )}

            <div className="space-y-3">
              {setupSteps.map((step, index) => {
                const isActive = nextInventoryStep?.id === step.id
                return (
                  <a
                    key={step.id}
                    href={`#${step.id}`}
                    className={cn(
                      "block rounded-2xl border p-4 transition-colors",
                      step.complete
                        ? "border-green-200 bg-green-50"
                        : isActive
                          ? "border-blue-300 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 rounded-xl p-2",
                          step.complete ? "bg-green-100 text-green-700" : isActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600",
                        )}
                      >
                        {step.complete ? <CheckCircle2 className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          Step {index + 1}: {step.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-gray-600">{step.description}</p>
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="p-5 text-left text-inherit">
            <CardTitle className="text-base">Dependency notes</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-600">
              Keep the setup smooth by following the order below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-0 text-sm text-gray-600">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="font-medium text-gray-900">Locations first</p>
              <p className="mt-1">Categories can reference default locations, so define your structure before building category rules.</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="font-medium text-gray-900">Categories before inventories</p>
              <p className="mt-1">Inventories should land inside a clear operating category so reorder and reporting stay consistent.</p>
            </div>
            {!readiness.teamComplete || !readiness.agentComplete ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
                <p className="font-medium">Workspace setup is still in progress</p>
                <p className="mt-1 text-sm">
                  You can continue inventory setup now, but complete staff and AI workspace setup in
                  {" "}
                  {nextRecommendedStage ? (
                    <Link href={nextRecommendedStage.href} className="font-semibold underline underline-offset-2">
                      {nextRecommendedStage.title.toLowerCase()}
                    </Link>
                  ) : (
                    "the onboarding section"
                  )}
                  {" "}
                  afterwards.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </aside>

      <main className="min-w-0 space-y-6">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 p-6 text-left text-inherit">
            <CardTitle className="text-3xl tracking-tight">Inventory operations setup</CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6 text-gray-600">
              This page is now structured like the real operational journey: establish your stock map, group the inventories that follow the
              same rules, then create the inventory ledgers your team will replenish, monitor, and sell against.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Locations</p>
                <MapPin className="h-4 w-4 text-gray-400" />
              </div>
              <div className="mt-3 text-3xl font-semibold text-gray-900">{displayCount(locationCount, loadingLocations)}</div>
              <p className="mt-2 text-sm text-gray-600">Warehouses, stores, shelves, and external stock positions.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Categories</p>
                <FolderTree className="h-4 w-4 text-gray-400" />
              </div>
              <div className="mt-3 text-3xl font-semibold text-gray-900">{displayCount(categoryCount, loadingCategories)}</div>
              <p className="mt-2 text-sm text-gray-600">Operational groupings that inventories can inherit from.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Inventories</p>
                <Warehouse className="h-4 w-4 text-gray-400" />
              </div>
              <div className="mt-3 text-3xl font-semibold text-gray-900">{displayCount(inventoryCount, loadingInventories)}</div>
              <p className="mt-2 text-sm text-gray-600">Ledgers with replenishment, value, and stock rules.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Stock value</p>
                <ShieldCheck className="h-4 w-4 text-gray-400" />
              </div>
              <div className="mt-3 text-3xl font-semibold text-gray-900">
                {loadingAnalytics ? "..." : formatCurrencyCompact(currencyCode, totalStockValue)}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {lowStockCount > 0 ? `${lowStockCount} items currently need attention.` : "No low-stock alerts at the moment."}
              </p>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-4 xl:grid-cols-3">
          <InventoryAttentionCard
            title="Low-stock inventories"
            description="These ledgers need a replenishment review before the stock situation becomes disruptive."
            emptyMessage={loadingLowStockInventories ? "Loading low-stock inventories..." : "No inventory is currently flagged as low stock."}
            items={lowStockInventoryItems}
          />
          <InventoryAttentionCard
            title="Needs reorder"
            description="These inventories already crossed their reorder point and should be planned next."
            emptyMessage={loadingReorderInventories ? "Loading reorder candidates..." : "No inventory is currently flagged for reorder."}
            items={reorderInventoryItems}
          />
          <InventoryAttentionCard
            title="Expiring stock watch"
            description="Time-sensitive stock that should be reviewed before it turns into a write-off or forced discount."
            emptyMessage={loadingExpiringStock ? "Loading expiring stock..." : "No expiring stock items are currently flagged."}
            items={expiringInventoryItems}
          />
        </section>

        <OperationalStepSection
          id="locations"
          step={1}
          title="Define your stock location structure"
          description="Start with the physical map of your operation: warehouses, branches, backrooms, shelves, and external fulfillment points."
          helper="If a category or inventory should default into a location later, define that location here first."
          status={locationCount > 0 ? "complete" : "in_progress"}
          facts={[
            { label: "Current locations", value: displayCount(locationCount, loadingLocations) },
            { label: "Low-stock alerts", value: displayCount(lowStockCount, loadingLowStock || loadingAnalytics) },
            { label: "Next outcome", value: locationCount > 0 ? "Structure ready" : "Create first location" },
          ]}
          notice={
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              Use structural locations for hierarchy and external locations for suppliers, third-party storage, or consignment partners.
            </div>
          }
        >
          <StockLocations refetchData={refetchData} setRefetchData={setRefetchData} />
        </OperationalStepSection>

        <OperationalStepSection
          id="categories"
          step={2}
          title="Create inventory categories that match operations"
          description="Categories define how inventories are grouped and where they naturally belong, which keeps reporting and replenishment cleaner."
          helper="Categories can still be created without default locations, but they become much more useful once the location map already exists."
          status={categoryCount > 0 ? "complete" : locationCount > 0 ? "in_progress" : "pending"}
          facts={[
            { label: "Categories", value: displayCount(categoryCount, loadingCategories) },
            { label: "Location map", value: locationCount > 0 ? "Ready" : "Still needed" },
            { label: "Next outcome", value: categoryCount > 0 ? "Grouping ready" : "Create first category" },
          ]}
          notice={
            locationCount === 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                You can create categories now, but set up at least one stock location first if you want cleaner defaults.
              </div>
            ) : undefined
          }
        >
          <InventoryCategoryView refetchData={refetchData} setRefetchData={setRefetchData} />
        </OperationalStepSection>

        <OperationalStepSection
          id="inventories"
          step={3}
          title="Open the inventories your team will manage"
          description="Each inventory becomes an operational ledger with ownership, reorder rules, stock thresholds, and valuation details."
          helper="By the time you create inventories, your location and category model should already describe where the stock belongs and who is responsible."
          status={inventoryCount > 0 ? "complete" : categoryCount > 0 ? "in_progress" : "pending"}
          facts={[
            { label: "Inventories", value: displayCount(inventoryCount, loadingInventories) },
            { label: "Categories ready", value: categoryCount > 0 ? "Yes" : "No" },
            { label: "Stock value", value: loadingAnalytics ? "..." : formatCurrencyCompact(currencyCode, totalStockValue) },
          ]}
          notice={
            categoryCount === 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Create at least one inventory category before opening ledgers, otherwise your stock model will become hard to scale.
              </div>
            ) : inventoryCount === 0 ? (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                Once the first inventory exists, you can move into products, stock items, and replenishment flows with much less friction.
              </div>
            ) : undefined
          }
        >
          <InventoryView refetchData={refetchData} setRefetchData={setRefetchData} />
        </OperationalStepSection>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="p-6 text-left text-inherit">
            <CardTitle className="text-xl">What comes after inventory setup</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-600">
              After these three steps are stable, the next frontend flow should guide users into products and then POS using the same
              workflow-first pattern.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 pt-0 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <PackageSearch className="h-4 w-4 text-blue-600" />
                Product setup next
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Move from inventory ledgers into product templates, variants, pricing, and sellable catalog structure.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <TriangleAlert className="h-4 w-4 text-blue-600" />
                POS after product readiness
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                POS should come after product and inventory foundations so selling, reservations, and stock movement stay trustworthy.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

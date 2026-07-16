"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowRight,
  Boxes,
  ChevronDown,
  CheckCircle2,
  MapPin,
  PackageSearch,
  ShieldCheck,
  TriangleAlert,
  Warehouse,
} from "lucide-react"
import InventoryAttentionCard from "@/components/inventory/InventoryAttentionCard"
import InventoryOperationalInsights from "@/components/inventory/InventoryOperationalInsights"
import InventoryView from "@/components/inventory/InventoryView"
import { WorkspaceSetupLoadingCard, useWorkspaceSetupProgress } from "@/components/onboarding/WorkspaceSetupShell"
import OperationalStepSection from "@/components/setup/OperationalStepSection"
import StructuralLocationScopeSelect from "@/components/stock/StructuralLocationScopeSelect"
import StockLocations from "@/components/stock/stockLoation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { formatCurrencyCompact } from "@/lib/currency-utils"
import { buildStructuralLocationScopeParams } from "@/lib/structuralLocationScope"
import { formatMachineLabel } from "@/lib/displayLabels"
import { useStructuralLocationScope } from "@/hooks/useStructuralLocationScope"
import {
  useGetInventoryDataQuery,
  useGetInventoriesNeedingReorderQuery,
  useGetLowStockInventoriesQuery,
  useGetInventorySetupSummaryQuery,
} from "@/redux/features/inventory/inventoryAPiSlice"
import { useGetExpiringInventoryItemsQuery, useListStockLocationsQuery } from "@/redux/features/stock/stockAPISlice"

type InventorySetupStep = {
  id: string
  title: string
  description: string
  complete: boolean
  icon: typeof MapPin
}

type InventoryTab = "overview" | "locations" | "inventories" | "insights"

const displayCount = (value: number | undefined, isLoading: boolean) => {
  if (isLoading) {
    return "..."
  }

  return value ?? 0
}

const toStockNumber = (value: unknown) => {
  const numericValue = Number(value ?? 0)
  return Number.isFinite(numericValue) ? numericValue : 0
}

const formatStockQuantity = (value: unknown) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(toStockNumber(value))

const getCurrentStockLevel = (inventory: { current_stock_level?: unknown; current_stock?: unknown; quantity_available?: unknown }) =>
  toStockNumber(inventory.current_stock_level ?? inventory.current_stock ?? inventory.quantity_available ?? 0)

const getLowStockBadge = (inventory: { current_stock_level?: unknown; current_stock?: unknown; quantity_available?: unknown; minimum_stock_level?: unknown }) => {
  const currentStock = getCurrentStockLevel(inventory)
  const minimumStock = toStockNumber(inventory.minimum_stock_level)

  if (currentStock <= 0) return "Out of stock"
  if (minimumStock > 0 && currentStock <= minimumStock) return "Below minimum"
  return "Review stock"
}

export default function InventoryPage() {
  const [refetchData, setRefetchData] = useState(false)
  const [activeTab, setActiveTab] = useState<InventoryTab>("overview")
  const [setupGuideOpen, setSetupGuideOpen] = useState(false)
  const [selectedStructuralLocationIds, setSelectedStructuralLocationIds] = useStructuralLocationScope()
  const [loadedTabs, setLoadedTabs] = useState<Record<InventoryTab, boolean>>({
    overview: true,
    locations: false,
    inventories: false,
    insights: false,
  })
  const { activeMembership, isWorkspaceContextLoading: loadingWorkspaceSetup, isOwner, nextRecommendedStage, profile, readiness } = useWorkspaceSetupProgress()
  const structuralScopeParams = useMemo(
    () => buildStructuralLocationScopeParams(selectedStructuralLocationIds),
    [selectedStructuralLocationIds],
  )
  const expiringQueryParams = useMemo(
    () => (structuralScopeParams ? { days: 30, ...structuralScopeParams } : { days: 30 }),
    [structuralScopeParams],
  )

  const shouldLoadLocations = loadedTabs.locations || loadedTabs.insights
  const shouldLoadInventories = loadedTabs.inventories || loadedTabs.insights

  const { data: locations } = useListStockLocationsQuery(undefined, {
    skip: !shouldLoadLocations,
  })
  const { data: inventories } = useGetInventoryDataQuery(structuralScopeParams, {
    skip: !shouldLoadInventories,
  })
  const { data: summary, isLoading: loadingSummary } = useGetInventorySetupSummaryQuery(structuralScopeParams)
  const { data: lowStockInventories = [], isLoading: loadingLowStockInventories } = useGetLowStockInventoriesQuery(structuralScopeParams)
  const { data: inventoriesNeedingReorder = [], isLoading: loadingReorderInventories } = useGetInventoriesNeedingReorderQuery(structuralScopeParams)
  const { data: expiringStockItems = [], isLoading: loadingExpiringStock } = useGetExpiringInventoryItemsQuery(expiringQueryParams)

  const locationCount = summary?.total_locations ?? 0
  const inventoryCount = summary?.total_inventory_items ?? 0
  const lowStockCount = summary?.low_stock_count ?? 0
  const totalStockValue = Number(summary?.total_stock_value ?? 0)
  const currencyCode = profile?.currency || "NGN"
  const inventoryItemCount = inventoryCount

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
        id: "inventories",
        title: "Create inventory items",
        description: "Create the actual inventory items with valuation, reorder rules, and ownership.",
        complete: inventoryItemCount > 0,
        icon: Warehouse,
      },
    ],
    [inventoryItemCount, locationCount],
  )

  const nextInventoryStep = setupSteps.find((step) => !step.complete) ?? null
  const inventorySetupComplete = setupSteps.every((step) => step.complete)
  const showSetupControls = isOwner && !loadingSummary && !inventorySetupComplete
  const showSetupGuide = showSetupControls && setupGuideOpen
  const nextInventoryTab: InventoryTab | null = nextInventoryStep
    ? nextInventoryStep.id === "locations"
      ? "locations"
      : "inventories"
    : null
  const validReorderInventories = useMemo(
    () =>
      (inventoriesNeedingReorder || []).filter((inventory) => {
        const reorderPoint = toStockNumber(inventory.reorder_point)
        return reorderPoint > 0 && getCurrentStockLevel(inventory) <= reorderPoint
      }),
    [inventoriesNeedingReorder],
  )
  const reorderInventoryIdSet = useMemo(
    () => new Set(validReorderInventories.map((inventory) => String(inventory.id))),
    [validReorderInventories],
  )
  const lowStockInventoryItems = (lowStockInventories || [])
    .filter((inventory) => !reorderInventoryIdSet.has(String(inventory.id)))
    .slice(0, 4)
    .map((inventory) => ({
      id: inventory.id,
      title: inventory.name,
      imageUrl: inventory.display_image || inventory.product_variant_image_url,
      supporting: formatMachineLabel(inventory.inventory_type, "Inventory item"),
      detail: `Available stock: ${formatStockQuantity(getCurrentStockLevel(inventory))} • Minimum: ${formatStockQuantity(inventory.minimum_stock_level)}`,
      href: `/inventory/${inventory.id}`,
      badge: getLowStockBadge(inventory),
    }))
  const reorderInventoryItems = validReorderInventories.slice(0, 4).map((inventory) => ({
    id: inventory.id,
    title: inventory.name,
    imageUrl: inventory.display_image || inventory.product_variant_image_url,
    supporting: formatMachineLabel(inventory.inventory_type, "Reorder required"),
    detail: `Available stock: ${formatStockQuantity(getCurrentStockLevel(inventory))} • Reorder point: ${formatStockQuantity(inventory.reorder_point)}`,
    href: `/inventory/${inventory.id}`,
    badge: toStockNumber(inventory.reorder_quantity) > 0 ? `Order ${formatStockQuantity(inventory.reorder_quantity)}` : "Needs order",
  }))
  const expiringInventoryItems = (expiringStockItems || []).slice(0, 4).map((item) => ({
    id: item.id,
    title: item.name || "Inventory item",
    imageUrl: item.display_image || item.product_variant_image_url,
    supporting: item.inventory_name || "Inventory item",
    detail: `Expiry: ${item.expiry_date || "Unknown"} • Quantity: ${item.quantity ?? 0}`,
    badge: item.days_to_expiry ?? "watch",
  }))
  const inventoryOptions = (inventories || []).map((item) => ({
    id: item.id,
    name: item.name,
  }))
  const locationOptions = (locations || []).map((location) => ({
    id: String(location.id),
    name: location.name,
  }))

  if (loadingWorkspaceSetup) {
    return (
      <WorkspaceSetupLoadingCard
      />
    )
  }

  if (!activeMembership) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="p-6 text-left text-inherit">
            <CardTitle className="text-3xl tracking-tight">Create a workspace before setting up inventory</CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6 text-gray-600">
              Inventory setup depends on an active company workspace. Create and activate your workspace first, then come back here to define locations and inventory items.
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
              <p className="text-sm text-gray-600">Ask the workspace owner to complete the company setup before inventory operations continue.</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid w-full grid-cols-1 gap-6 py-2">
      <main className="min-w-0 space-y-6">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 p-6 text-left text-inherit">
            <CardTitle className="text-3xl tracking-tight">Inventory operations setup</CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6 text-gray-600">
              This page is now structured like the real operational journey: establish your stock map, then create the inventory records your
              team will replenish, monitor, and sell against.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <StructuralLocationScopeSelect
              allowMultiSelect
              className="max-w-sm"
              id="inventory-page-structural-scope"
              values={selectedStructuralLocationIds}
              onValuesChange={setSelectedStructuralLocationIds}
              description="Limit inventory setup metrics and listings to one structural location when you want to inspect a specific store."
            />
            {showSetupControls ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                      <Boxes className="h-3.5 w-3.5" />
                      Inventory setup
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      Finish the remaining setup step before daily stock operations become fully reliable.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSetupGuideOpen((open) => !open)}
                    className="w-full justify-between rounded-xl bg-white md:w-auto"
                  >
                    {setupGuideOpen ? "Hide setup guide" : "Show setup guide"}
                    <ChevronDown className={cn("h-4 w-4 transition-transform", setupGuideOpen ? "rotate-180" : "")} />
                  </Button>
                </div>

                {showSetupGuide ? (
                  <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
                    <div className="space-y-3">
                      {nextInventoryStep && nextInventoryTab ? (
                        <button
                          type="button"
                          onClick={() => setActiveTab(nextInventoryTab)}
                          className="flex w-full items-center justify-between rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                        >
                          Continue with {nextInventoryStep.title}
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      ) : null}
                      <div className="grid gap-3 md:grid-cols-3">
                      {setupSteps.map((step, index) => {
                          const isActive = nextInventoryStep?.id === step.id
                          return (
                            <button
                              type="button"
                              key={step.id}
                              onClick={() =>
                                setActiveTab(
                                  step.id === "locations" ? "locations" : "inventories",
                                )
                              }
                            className={cn(
                              "block rounded-2xl border p-4 text-left transition-colors",
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
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
                      <p className="font-semibold text-gray-900">Dependency notes</p>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <p className="font-medium text-gray-900">Locations first</p>
                        <p className="mt-1">Define the storage map first so the inventory records have a stable operational context.</p>
                      </div>
                      {!readiness.teamComplete || !readiness.agentComplete ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
                          <p className="font-medium">Workspace setup is still in progress</p>
                          <p className="mt-1 text-sm">
                            You can continue inventory setup now, but complete staff and AI workspace setup in{" "}
                            {nextRecommendedStage ? (
                              <Link href={nextRecommendedStage.href} className="font-semibold underline underline-offset-2">
                                {nextRecommendedStage.title.toLowerCase()}
                              </Link>
                            ) : (
                              "the onboarding section"
                            )}{" "}
                            afterwards.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            {isOwner && loadingSummary ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="h-5 w-40 animate-pulse rounded-full bg-gray-200" />
                    <p className="mt-3 text-sm text-gray-600">Checking inventory setup status before showing setup guidance.</p>
                  </div>
                  <div className="h-10 w-36 animate-pulse rounded-xl bg-gray-200" />
                </div>
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Locations</p>
                <MapPin className="h-4 w-4 text-gray-400" />
              </div>
              <div className="mt-3 text-3xl font-semibold text-gray-900">{displayCount(locationCount, loadingSummary)}</div>
              <p className="mt-2 text-sm text-gray-600">Warehouses, stores, shelves, and external stock positions.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Inventory items</p>
                <Warehouse className="h-4 w-4 text-gray-400" />
              </div>
              <div className="mt-3 text-3xl font-semibold text-gray-900">{displayCount(inventoryItemCount, loadingSummary)}</div>
              <p className="mt-2 text-sm text-gray-600">Operational records with replenishment, value, and stock rules.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Stock value</p>
                <ShieldCheck className="h-4 w-4 text-gray-400" />
              </div>
              <div className="mt-3 text-3xl font-semibold text-gray-900">
                {loadingSummary ? "..." : formatCurrencyCompact(currencyCode, totalStockValue)}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {lowStockCount > 0 ? `${lowStockCount} items currently need attention.` : "No low-stock alerts at the moment."}
              </p>
            </div>
            </div>
          </CardContent>
        </Card>

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            const nextTab = value as InventoryTab
            setActiveTab(nextTab)
            setLoadedTabs((current) => (current[nextTab] ? current : { ...current, [nextTab]: true }))
          }}
          className="space-y-5"
        >
          <TabsList className="h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
            <TabsTrigger value="overview" className="rounded-xl bg-white px-4 py-2.5">
              Overview
            </TabsTrigger>
            <TabsTrigger value="locations" className="rounded-xl bg-white px-4 py-2.5">
              Stock locations
            </TabsTrigger>
            <TabsTrigger value="inventories" className="rounded-xl bg-white px-4 py-2.5">
              Inventory items
            </TabsTrigger>
            <TabsTrigger value="insights" className="rounded-xl bg-white px-4 py-2.5">
              Stock operations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0 space-y-6 bg-transparent">
            <section className="grid gap-4 xl:grid-cols-3">
              <InventoryAttentionCard
                title="Low-stock inventory items"
                description="Inventory items below minimum that are not already in the reorder queue."
                emptyMessage={loadingLowStockInventories ? "Loading low-stock inventory items..." : "No separate low-stock watchlist item is currently pending."}
                items={lowStockInventoryItems}
              />
              <InventoryAttentionCard
                title="Needs reorder"
                description="These inventory items already crossed their reorder point and should be planned next."
                emptyMessage={loadingReorderInventories ? "Loading reorder candidates..." : "No inventory item is currently flagged for reorder."}
                items={reorderInventoryItems}
              />
              <InventoryAttentionCard
                title="Expiring stock watch"
                description="Time-sensitive stock that should be reviewed before it turns into a write-off or forced discount."
                emptyMessage={loadingExpiringStock ? "Loading expiring stock..." : "No expiring stock items are currently flagged."}
                items={expiringInventoryItems}
              />
            </section>

              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="p-6 text-left text-inherit">
                  <CardTitle className="text-xl">What comes after inventory setup</CardTitle>
                  <CardDescription className="text-sm leading-6 text-gray-600">
                    After these two steps are stable, the next frontend flow should guide users into products and then POS using the same workflow-first pattern.
                  </CardDescription>
                </CardHeader>
              <CardContent className="grid gap-4 p-6 pt-0 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <PackageSearch className="h-4 w-4 text-blue-600" />
                    Product setup next
                  </div>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Move from inventory items into product templates, variants, pricing, and sellable catalog structure.
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
          </TabsContent>

          <TabsContent value="locations" className="mt-0 bg-transparent">
            {loadedTabs.locations ? (
              <OperationalStepSection
                id="locations"
                step={1}
                title="Define your stock location structure"
                description="Start with the physical map of your operation: warehouses, branches, backrooms, shelves, and external fulfillment points."
                helper="If an inventory item should default into a location later, define that location here first."
                status={locationCount > 0 ? "complete" : "in_progress"}
                facts={[
                  { label: "Current locations", value: displayCount(locationCount, loadingSummary) },
                  { label: "Low-stock alerts", value: displayCount(lowStockCount, loadingSummary) },
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
            ) : null}
          </TabsContent>

          <TabsContent value="inventories" className="mt-0 bg-transparent">
            {loadedTabs.inventories ? (
              <OperationalStepSection
                id="inventories"
                step={2}
                title="Create the inventory items your team will manage"
                description="Each inventory item becomes an operational record with ownership, reorder rules, stock thresholds, and valuation details."
                helper="By the time you create inventory items, your location model should already describe where the stock belongs and who is responsible."
                status={inventoryItemCount > 0 ? "complete" : locationCount > 0 ? "in_progress" : "pending"}
                facts={[
                  { label: "Inventory items", value: displayCount(inventoryItemCount, loadingSummary) },
                  {
                    label: "Stock value",
                    value: loadingSummary ? "..." : formatCurrencyCompact(currencyCode, totalStockValue),
                  },
                ]}
                notice={
                  locationCount === 0 ? (
                    <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
                      Create at least one stock location before creating inventory items, otherwise your stock model will become hard to scale.
                    </div>
                  ) : inventoryItemCount === 0 ? (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                      Once the first inventory item exists, you can move into products, stock tracking, and replenishment flows with much less friction.
                    </div>
                  ) : undefined
                }
              >
                <InventoryView
                  refetchData={refetchData}
                  setRefetchData={setRefetchData}
                  selectedLocationIds={selectedStructuralLocationIds}
                  onSelectedLocationIdsChange={setSelectedStructuralLocationIds}
                />
              </OperationalStepSection>
            ) : null}
          </TabsContent>

          <TabsContent value="insights" className="mt-0 bg-transparent">
            {loadedTabs.insights ? (
              <InventoryOperationalInsights
                inventoryOptions={inventoryOptions}
                locationOptions={locationOptions}
                locations={locations || []}
                selectedStructuralLocationIds={selectedStructuralLocationIds}
              />
            ) : null}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

"use client"

import Link from "next/link"
import { useMemo } from "react"
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Download,
  Layers3,
  PackagePlus,
  PackageSearch,
  ScanBarcode,
  ShoppingBag,
  Sparkles,
  Tag,
  TriangleAlert,
  Warehouse,
} from "lucide-react"
import { useWorkspaceSetupProgress } from "@/components/onboarding/WorkspaceSetupShell"
import ProductView from "@/components/product/productView"
import OperationalStepSection from "@/components/setup/OperationalStepSection"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatCurrencyCompact } from "@/lib/currency-utils"
import { toast } from "react-toastify"
import { useGetInventoryDataQuery } from "@/redux/features/inventory/inventoryAPiSlice"
import {
  useGetDashboardStatsQuery,
  useLazyExportProductsCsvQuery,
  useGetInventorySummaryQuery,
  useGetProductCategoriesQuery,
  useGetProductDataQuery,
  useGetStockAlertsQuery,
} from "@/redux/features/product/productAPISlice"

type ProductSetupStep = {
  id: string
  title: string
  description: string
  complete: boolean
  icon: typeof Warehouse
}

const displayCount = (value: number | undefined, isLoading: boolean) => {
  if (isLoading) {
    return "..."
  }

  return value ?? 0
}

export default function ProductPage() {
  const { activeMembership, nextRecommendedStage, profile, readiness } = useWorkspaceSetupProgress()

  const { data: inventories, isLoading: loadingInventories } = useGetInventoryDataQuery()
  const { data: products, isLoading: loadingProducts } = useGetProductDataQuery()
  const { data: productCategories, isLoading: loadingCategories } = useGetProductCategoriesQuery()
  const { data: dashboardStats, isLoading: loadingDashboard } = useGetDashboardStatsQuery()
  const { data: inventorySummary, isLoading: loadingInventorySummary } = useGetInventorySummaryQuery()
  const { data: stockAlerts, isLoading: loadingStockAlerts } = useGetStockAlertsQuery()
  const [exportProductsCsv, { isFetching: isExportingProducts }] = useLazyExportProductsCsvQuery()

  const inventoryCount = inventories?.length ?? 0
  const productCount = products?.length ?? dashboardStats?.total_products ?? 0
  const productCategoryCount = productCategories?.length ?? 0
  const totalVariants = inventorySummary?.variant_stats.total_variants ?? 0
  const posVisibleVariants = inventorySummary?.variant_stats.pos_visible_variants ?? 0
  const quickSaleProducts = dashboardStats?.quick_sale_products ?? products?.filter((product) => product.quick_sale).length ?? 0
  const posReadyProducts = products?.filter((product) => product.pos_ready).length ?? 0
  const totalAlerts = stockAlerts?.total_alerts ?? 0
  const averagePrice = Number(dashboardStats?.price_analysis?.avg_price ?? 0)
  const currencyCode = profile?.currency || "NGN"

  const featuredProducts = useMemo(() => (products ?? []).slice(0, 3), [products])

  const setupSteps: ProductSetupStep[] = useMemo(
    () => [
      {
        id: "dependency",
        title: "Confirm inventory foundations",
        description: "Products should be introduced only after inventory foundations exist so stock movement and replenishment remain trustworthy.",
        complete: inventoryCount > 0,
        icon: Warehouse,
      },
      {
        id: "products",
        title: "Create product templates",
        description: "Add the sellable product records your team will later expand into variants, pricing, and POS behaviors.",
        complete: productCount > 0,
        icon: PackagePlus,
      },
      {
        id: "enablement",
        title: "Configure variants, pricing, and POS",
        description: "Open each product to define variants, pricing strategy, quick sale behavior, and POS visibility.",
        complete: productCount > 0 && totalVariants > 0 && posReadyProducts > 0,
        icon: ScanBarcode,
      },
    ],
    [inventoryCount, posReadyProducts, productCount, totalVariants],
  )

  const completedSteps = setupSteps.filter((step) => step.complete).length
  const completionPercentage = Math.round((completedSteps / setupSteps.length) * 100)
  const nextProductStep = setupSteps.find((step) => !step.complete) ?? null

  const handleExportCatalog = async () => {
    try {
      const blob = await exportProductsCsv().unwrap()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = "product-catalog.csv"
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
      toast.success("Catalog export started.")
    } catch {
      toast.error("Failed to export the product catalog.")
    }
  }

  if (!activeMembership) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="p-6 text-left text-inherit">
            <CardTitle className="text-3xl tracking-tight">Create a workspace before setting up products</CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6 text-gray-600">
              Product setup depends on an active company workspace. Complete your company onboarding first, then come back here to build
              the product catalog.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <Button asChild>
              <Link href="/profile">
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
              <ShoppingBag className="h-3.5 w-3.5" />
              Product setup
            </div>
            <CardTitle className="mt-3 text-xl">Turn inventory structure into a sellable catalog</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-600">
              Start after inventory foundations exist, then refine product records into variants, price rules, and POS-ready items.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-gray-500">
                <span>Product readiness</span>
                <span>{completionPercentage}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            {nextProductStep ? (
              <a
                href={`#${nextProductStep.id}`}
                className="flex w-full items-center justify-between rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Continue with {nextProductStep.title}
                <ArrowRight className="h-4 w-4" />
              </a>
            ) : (
              <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                Product foundations are in place. You can continue into POS execution and selling workflows.
              </div>
            )}

            <div className="space-y-3">
              {setupSteps.map((step, index) => {
                const isActive = nextProductStep?.id === step.id
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
              Keep the catalog structure clean by following the operational order below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-0 text-sm text-gray-600">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="font-medium text-gray-900">Inventory first</p>
              <p className="mt-1">Build products after the inventory structure exists so stock tracking and replenishment have a solid foundation.</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="font-medium text-gray-900">Templates before variants</p>
              <p className="mt-1">Create the product record first, then open it to expand into sizes, colors, and variant-level pricing.</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="font-medium text-gray-900">POS readiness last</p>
              <p className="mt-1">Quick-sale and POS behavior should be enabled after pricing and variant structure are defined.</p>
            </div>
            {!readiness.teamComplete || !readiness.agentComplete ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
                <p className="font-medium">Workspace setup is still in progress</p>
                <p className="mt-1 text-sm">
                  Product setup can continue now, but finish
                  {" "}
                  {nextRecommendedStage ? (
                    <Link href={nextRecommendedStage.href} className="font-semibold underline underline-offset-2">
                      {nextRecommendedStage.title.toLowerCase()}
                    </Link>
                  ) : (
                    "the remaining onboarding"
                  )}
                  {" "}
                  soon so the workspace is fully operational.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </aside>

      <main className="min-w-0 space-y-6">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 p-6 text-left text-inherit">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle className="text-3xl tracking-tight">Product catalog setup</CardTitle>
                <CardDescription className="max-w-3xl text-sm leading-6 text-gray-600">
                  This page now follows the real catalog-building journey: confirm inventory foundations, create product templates with the shared
                  form system, then continue inside each product to define variants, pricing, and POS behavior.
                </CardDescription>
              </div>
              <Button variant="outline" onClick={handleExportCatalog} disabled={isExportingProducts}>
                <Download className="mr-2 h-4 w-4" />
                {isExportingProducts ? "Exporting..." : "Export catalog CSV"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Products</p>
                <PackageSearch className="h-4 w-4 text-gray-400" />
              </div>
              <div className="mt-3 text-3xl font-semibold text-gray-900">{displayCount(productCount, loadingProducts || loadingDashboard)}</div>
              <p className="mt-2 text-sm text-gray-600">Sellable records linked to pricing, variant structure, and stock behavior.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Variants</p>
                <Layers3 className="h-4 w-4 text-gray-400" />
              </div>
              <div className="mt-3 text-3xl font-semibold text-gray-900">
                {displayCount(totalVariants, loadingInventorySummary)}
              </div>
              <p className="mt-2 text-sm text-gray-600">Size, color, and other sellable combinations configured inside product detail.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">POS-ready</p>
                <ScanBarcode className="h-4 w-4 text-gray-400" />
              </div>
              <div className="mt-3 text-3xl font-semibold text-gray-900">{displayCount(posReadyProducts, loadingProducts)}</div>
              <p className="mt-2 text-sm text-gray-600">
                {quickSaleProducts > 0 ? `${quickSaleProducts} products already enabled for quick sale.` : "No quick-sale products configured yet."}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Avg. price</p>
                <Tag className="h-4 w-4 text-gray-400" />
              </div>
              <div className="mt-3 text-3xl font-semibold text-gray-900">
                {loadingDashboard ? "..." : formatCurrencyCompact(currencyCode, averagePrice)}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {totalAlerts > 0 ? `${totalAlerts} stock or catalog alerts need review.` : "No product stock alerts at the moment."}
              </p>
            </div>
          </CardContent>
        </Card>

        <OperationalStepSection
          id="dependency"
          step={1}
          title="Confirm inventory foundations before building the catalog"
          description="Every serious product setup should start after locations and ledgers exist. That keeps stock movement, valuation, and replenishment aligned."
          helper="The create-product form can still open, but the workflow is much cleaner once inventory ledgers already exist."
          status={inventoryCount > 0 ? "complete" : "in_progress"}
          facts={[
            { label: "Inventories available", value: displayCount(inventoryCount, loadingInventories) },
            { label: "Product categories", value: displayCount(productCategoryCount, loadingCategories) },
            { label: "Next outcome", value: inventoryCount > 0 ? "Catalog can begin" : "Create inventory first" },
          ]}
          notice={
            inventoryCount === 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                No inventory ledgers exist yet. Set up inventory first so the catalog can connect cleanly to the real stock model once variants go live.
              </div>
            ) : productCategoryCount === 0 ? (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                The current backend exposes product categories as read-only data. If the category list is empty, fix that from the product service
                side rather than expecting category creation on this page.
              </div>
            ) : undefined
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">Inventory dependency</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Products do not attach directly to a specific inventory record in the current backend, but inventory structure should still exist
                before you start selling or tracking stock. This keeps the catalog aligned with real stock operations.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">Recommended next move</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {inventoryCount > 0
                  ? "Inventory foundations are ready. You can start creating product templates below."
                  : "Go to the inventory page, define your locations and ledgers, then return here to build the catalog."}
              </p>
              <div className="mt-4">
                <Button asChild variant={inventoryCount > 0 ? "outline" : "default"}>
                  <Link href="/inventory">
                    Open inventory setup
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </OperationalStepSection>

        <OperationalStepSection
          id="products"
          step={2}
          title="Create product templates with the shared form system"
          description="Add products manually or through bulk generation, define their commercial defaults, and establish the base catalog record."
          helper="This step uses the existing custom create form and bulk-create flow. The page around it now makes the intended sequence obvious."
          status={productCount > 0 ? "complete" : inventoryCount > 0 ? "in_progress" : "pending"}
          facts={[
            { label: "Products", value: displayCount(productCount, loadingProducts || loadingDashboard) },
            { label: "Quick sale", value: displayCount(quickSaleProducts, loadingProducts || loadingDashboard) },
            { label: "Next outcome", value: productCount > 0 ? "Catalog exists" : "Create first product" },
          ]}
          notice={
            inventoryCount === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              You can view the table now, but product creation will be much smoother after inventory setup is complete.
            </div>
            ) : undefined
          }
        >
          <ProductView />
        </OperationalStepSection>

        <OperationalStepSection
          id="enablement"
          step={3}
          title="Open each product and finish variants, pricing, and POS behavior"
          description="Product detail is where each template becomes operational: variants, attribute links, pricing strategy, POS settings, and analytics."
          helper="The list above gets you into the right record. The detail page is the second-stage workspace for making a product truly sellable."
          status={productCount > 0 && totalVariants > 0 && posReadyProducts > 0 ? "complete" : productCount > 0 ? "in_progress" : "pending"}
          facts={[
            { label: "Total variants", value: displayCount(totalVariants, loadingInventorySummary) },
            { label: "POS-visible variants", value: displayCount(posVisibleVariants, loadingInventorySummary) },
            { label: "Stock alerts", value: displayCount(totalAlerts, loadingStockAlerts) },
          ]}
          notice={
            productCount > 0 ? (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                Click any product row above to continue into detail. That is where you configure variants, pricing strategy, POS settings, and analytics.
              </div>
            ) : undefined
          }
        >
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Layers3 className="h-4 w-4 text-blue-600" />
                  Variants and attribute links
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Add sellable combinations like size or color, link the relevant attributes, and decide which variants should be visible in POS.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Tag className="h-4 w-4 text-blue-600" />
                  Pricing strategy
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Define base prices, overrides, pricing strategies, and later review price movement history from the same product workspace.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <ScanBarcode className="h-4 w-4 text-blue-600" />
                  POS behavior
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Set quick-sale behavior, tax and discount rules, and other POS-facing defaults only after the product structure is solid.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  Analytics and attention
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Use the detail analytics view to check stock, pricing spread, and which variants are low or out of stock before going live.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                <ShoppingBag className="h-4 w-4 text-blue-600" />
                Continue with a product
              </div>
              {featuredProducts.length ? (
                <div className="mt-4 space-y-3">
                  {featuredProducts.map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      className="block rounded-2xl border border-gray-200 bg-gray-50 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">{product.name}</p>
                          <p className="mt-1 text-xs text-gray-600">
                            {product.variant_count ?? 0} variants · {product.pos_ready ? "POS ready" : "Not POS ready"}
                          </p>
                        </div>
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                  Once you create products above, quick continuation links into detail will appear here.
                </div>
              )}
            </div>
          </div>
        </OperationalStepSection>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="p-6 text-left text-inherit">
            <CardTitle className="text-xl">What comes after product setup</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-600">
              Once products are variant-enabled and POS-ready, the next workflow should move into live sales execution and order handling.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 pt-0 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <TriangleAlert className="h-4 w-4 text-blue-600" />
                POS flow next
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                The POS page should follow this foundation and focus on sessions, orders, held baskets, payments, and fulfillment.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Boxes className="h-4 w-4 text-blue-600" />
                Catalog maintenance later
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Dashboards and polish can come afterwards. The important part is that product operations now follow a coherent setup path.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

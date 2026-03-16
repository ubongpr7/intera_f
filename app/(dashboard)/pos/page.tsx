"use client"

import Link from "next/link"
import { useMemo } from "react"
import {
  CheckCircle2,
  CreditCard,
  LayoutGrid,
  ReceiptText,
  ScanBarcode,
  ShoppingCart,
  Store,
  Users2,
} from "lucide-react"
import { useWorkspaceSetupProgress } from "@/components/onboarding/WorkspaceSetupShell"
import Configurations from "@/components/pos/Configurations"
import Customers from "@/components/pos/Customers"
import Discounts from "@/components/pos/Discounts"
import POSExecutionWorkspace from "@/components/pos/POSExecutionWorkspace"
import Tables from "@/components/pos/Tables"
import Terminals from "@/components/pos/Terminals"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrencyCompact } from "@/lib/currency-utils"
import {
  useGetConfigurationsQuery,
  useGetCurrentSessionQuery,
  useGetCustomersQuery,
  useGetDailySalesQuery,
  useGetDiscountsQuery,
  useGetHeldOrdersQuery,
  useGetTablesQuery,
  useGetTerminalsQuery,
} from "@/redux/features/pos/posAPISlice"
import type { POSDailySalesPaymentMethodBreakdown } from "@/redux/features/pos/posTypes"
import { useGetDashboardStatsQuery } from "@/redux/features/product/productAPISlice"

const today = new Date().toISOString().slice(0, 10)

const displayCount = (value: number | undefined, isLoading: boolean) => (isLoading ? "..." : value ?? 0)

export default function POSPage() {
  const { activeMembership, profile } = useWorkspaceSetupProgress()
  const { data: configurations = [], isLoading: loadingConfigurations } = useGetConfigurationsQuery()
  const { data: terminals = [], isLoading: loadingTerminals } = useGetTerminalsQuery()
  const { data: tables = [], isLoading: loadingTables } = useGetTablesQuery()
  const { data: customers = [], isLoading: loadingCustomers } = useGetCustomersQuery()
  const { data: discounts = [], isLoading: loadingDiscounts } = useGetDiscountsQuery()
  const { data: heldOrders = [], isLoading: loadingHeldOrders } = useGetHeldOrdersQuery()
  const { data: currentSession } = useGetCurrentSessionQuery()
  const { data: analytics, isLoading: loadingAnalytics } = useGetDailySalesQuery(today)
  const { data: productStats, isLoading: loadingProductStats } = useGetDashboardStatsQuery()

  const currencyCode = profile?.currency || "NGN"
  const posReadyProducts = productStats?.quick_sale_products ?? 0

  const readinessItems = useMemo(
    () => [
      {
        label: "Checkout policy",
        value: displayCount(configurations.length, loadingConfigurations),
        hint: configurations.length > 0 ? "Ready" : "Needs configuration",
        icon: ReceiptText,
      },
      {
        label: "Live terminals",
        value: displayCount(terminals.length, loadingTerminals),
        hint: terminals.length > 0 ? "Floor prepared" : "Add a selling terminal",
        icon: ScanBarcode,
      },
      {
        label: "POS customers",
        value: displayCount(customers.length, loadingCustomers),
        hint: customers.length > 0 ? "Saved records available" : "Walk-ins still supported",
        icon: Users2,
      },
      {
        label: "Held carts",
        value: displayCount(heldOrders.length, loadingHeldOrders),
        hint: heldOrders.length > 0 ? "Ready for recovery" : "No carts on hold",
        icon: ShoppingCart,
      },
      {
        label: "POS-ready products",
        value: displayCount(posReadyProducts, loadingProductStats),
        hint: posReadyProducts > 0 ? "Cashier catalog is populated" : "Mark variants for POS",
        icon: LayoutGrid,
      },
      {
        label: "Today’s sales",
        value: loadingAnalytics ? "..." : formatCurrencyCompact(currencyCode, Number(analytics?.total_sales ?? 0)),
        hint: `${analytics?.total_orders ?? 0} orders processed today`,
        icon: CreditCard,
      },
    ],
    [
      analytics?.total_orders,
      analytics?.total_sales,
      configurations.length,
      currencyCode,
      customers.length,
      heldOrders.length,
      loadingAnalytics,
      loadingConfigurations,
      loadingCustomers,
      loadingHeldOrders,
      loadingProductStats,
      loadingTerminals,
      posReadyProducts,
      terminals.length,
    ],
  )

  if (!activeMembership) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="p-6 text-left text-inherit">
            <CardTitle className="text-3xl tracking-tight">Create a workspace before setting up POS</CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6 text-gray-600">
              POS depends on an active company workspace with products, inventory context, and operating settings. Finish workspace creation first.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <Button asChild>
              <Link href="/profile/create">Go to workspace setup</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 lg:px-8">
      <Card className="overflow-hidden border-gray-200 shadow-sm">
        <CardContent className="p-0">
          <div className="border-b border-gray-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_38%),linear-gradient(135deg,_#fff7ed,_#ffffff_42%,_#eff6ff)] px-6 py-6">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                  <Store className="h-3.5 w-3.5" />
                  POS floor
                </div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">
                  Run cashier flow first, keep back-office tools secondary
                </h1>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  This POS page now centers the selling workspace: open a session, build the cart, recover held orders, reserve inventory, and settle the sale.
                  Configuration, terminals, tables, and customer records remain available below as support tools instead of leading the page.
                </p>
              </div>

              <div className="min-w-[250px] rounded-3xl border border-white/80 bg-white/90 p-5 shadow-sm">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Live status</div>
                <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <CheckCircle2 className={`h-5 w-5 ${currentSession ? "text-green-600" : "text-gray-300"}`} />
                  {currentSession ? "Session open" : "No active session"}
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {currentSession
                    ? "Cashiers can continue checkout immediately from the workspace below."
                    : "Open a terminal-backed session from the cashier workspace to begin selling."}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-6">
            {readinessItems.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{item.label}</p>
                    <Icon className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-gray-900">{item.value}</div>
                  <p className="mt-2 text-sm text-gray-600">{item.hint}</p>
                </div>
              )
            })}
          </div>

          {posReadyProducts === 0 ? (
            <div className="border-t border-amber-100 bg-amber-50/70 px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="max-w-3xl text-sm text-amber-900">
                  The cashier workspace is ready, but there are no POS-ready variants in the product catalog yet. Checkout will feel empty until products are exposed to POS.
                </div>
                <Button asChild variant="outline" className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100">
                  <Link href="/product">Open product workspace</Link>
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <POSExecutionWorkspace />

      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100 p-6 text-left text-inherit">
          <CardTitle className="text-2xl tracking-tight">Back-office POS controls</CardTitle>
          <CardDescription className="max-w-3xl text-sm leading-6 text-gray-600">
            Keep the selling workspace above for daily cashier activity. Use the sections below for policy changes, floor setup, and performance review.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="policy" className="space-y-5">
            <TabsList className="h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
              <TabsTrigger value="policy" className="rounded-xl bg-white px-4 py-2.5">
                Checkout policy
              </TabsTrigger>
              <TabsTrigger value="floor" className="rounded-xl bg-white px-4 py-2.5">
                Selling floor
              </TabsTrigger>
              <TabsTrigger value="pulse" className="rounded-xl bg-white px-4 py-2.5">
                Daily pulse
              </TabsTrigger>
            </TabsList>

            <TabsContent value="policy" className="mt-0 space-y-4 bg-transparent">
              <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <Configurations />
                <Discounts />
              </div>
            </TabsContent>

            <TabsContent value="floor" className="mt-0 space-y-4 bg-transparent">
              <div className="grid gap-6 xl:grid-cols-2">
                <Terminals />
                <Tables />
                <div className="xl:col-span-2">
                  <Customers />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pulse" className="mt-0 space-y-5 bg-transparent">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Total sales</div>
                  <div className="mt-3 text-2xl font-semibold text-gray-900">
                    {loadingAnalytics ? "..." : formatCurrencyCompact(currencyCode, Number(analytics?.total_sales ?? 0))}
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Orders</div>
                  <div className="mt-3 text-2xl font-semibold text-gray-900">{analytics?.total_orders ?? 0}</div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Average order</div>
                  <div className="mt-3 text-2xl font-semibold text-gray-900">
                    {loadingAnalytics ? "..." : formatCurrencyCompact(currencyCode, Number(analytics?.average_order_value ?? 0))}
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Tax captured</div>
                  <div className="mt-3 text-2xl font-semibold text-gray-900">
                    {loadingAnalytics ? "..." : formatCurrencyCompact(currencyCode, Number(analytics?.total_tax ?? 0))}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <div className="text-sm font-semibold text-gray-900">Operational notes</div>
                  <div className="mt-4 space-y-3 text-sm text-gray-600">
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      {configurations.length > 0
                        ? `There are ${configurations.length} POS configurations and ${discounts.length} discount rules available for cashiers.`
                        : "Create a POS configuration before expecting the live workspace to fully match your operating policy."}
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      {terminals.length > 0
                        ? `${terminals.length} terminals and ${tables.length} tables are configured for floor operations.`
                        : "There are no live terminals yet. Cashiers cannot open sessions until at least one terminal exists."}
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      {customers.length > 0
                        ? `${customers.length} saved customers are available for quick assignment during checkout.`
                        : "The workspace still supports walk-in flow even without saved customers."}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white">
                  <div className="border-b border-gray-100 px-5 py-4">
                    <div className="text-sm font-semibold text-gray-900">Payment method mix</div>
                    <p className="mt-1 text-sm text-gray-600">Use this as a quick daily review, not as the cashier workspace.</p>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Method</TableHead>
                        <TableHead>Transactions</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics?.payment_methods?.map((paymentBreakdown: POSDailySalesPaymentMethodBreakdown) => (
                        <TableRow key={paymentBreakdown.payments__payment_method || "unknown"}>
                          <TableCell className="capitalize">{paymentBreakdown.payments__payment_method || "unknown"}</TableCell>
                          <TableCell>{paymentBreakdown.count}</TableCell>
                          <TableCell>{formatCurrencyCompact(currencyCode, Number(paymentBreakdown.total ?? 0))}</TableCell>
                        </TableRow>
                      ))}
                      {!analytics?.payment_methods?.length ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-sm text-gray-500">
                            No payment activity recorded for this date yet.
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import Link from "next/link"
import {
  Activity,
  Boxes,
  CreditCard,
  PackageOpen,
  ReceiptText,
  ShoppingCart,
  Truck,
} from "lucide-react"
import StatTile from "@/components/dashboard/StatTile"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useWorkspaceSetupProgress } from "@/components/onboarding/WorkspaceSetupShell"
import { useGetInventoryAnalyticsQuery } from "@/redux/features/inventory/inventoryAPiSlice"
import { useGetPurchaseOrderAnalyticsQuery } from "@/redux/features/orders/orderAPISlice"
import { useGetCurrentSessionQuery, useGetDailySalesQuery, useGetHeldOrdersQuery } from "@/redux/features/pos/posAPISlice"
import type { POSDailySalesPaymentMethodBreakdown } from "@/redux/features/pos/posTypes"
import { useGetDashboardStatsQuery } from "@/redux/features/product/productAPISlice"
import { useGetLowStockItemsQuery, useGetStockAnalyticsQuery } from "@/redux/features/stock/stockAPISlice"
import { formatCurrencyCompact } from "@/lib/currency-utils"

const today = new Date().toISOString().slice(0, 10)

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "No active session"
  }

  return new Date(value).toLocaleString()
}

export default function RealtimeDashboardPage() {
  const { activeMembership } = useWorkspaceSetupProgress()
  const { data: productStats } = useGetDashboardStatsQuery()
  const { data: inventoryAnalytics } = useGetInventoryAnalyticsQuery()
  const { data: stockAnalytics } = useGetStockAnalyticsQuery()
  const { data: lowStockItems = [] } = useGetLowStockItemsQuery()
  const { data: currentSession } = useGetCurrentSessionQuery()
  const { data: heldOrders = [] } = useGetHeldOrdersQuery()
  const { data: dailySales } = useGetDailySalesQuery(today)
  const { data: purchaseAnalytics } = useGetPurchaseOrderAnalyticsQuery()

  const currencyCode = activeMembership?.currency || "NGN"
  const inventoryItemCount = inventoryAnalytics?.total_inventory_items ?? inventoryAnalytics?.total_inventories ?? 0
  const trackedInventoryItemCount = stockAnalytics?.total_inventory_items ?? stockAnalytics?.total_stock_items ?? 0

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 lg:px-8">
      <Card className="overflow-hidden border-gray-200 shadow-sm">
        <CardContent className="p-0">
          <div className="border-b border-gray-100 bg-gray-100/50 px-6 py-6">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  <Activity className="h-3.5 w-3.5" />
                  Live operations monitor
                </div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">Realtime operational pulse</h1>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  This view is for monitoring active movement across inventory, POS, and purchasing. It should help you spot operational pressure quickly,
                  not replace the domain workspaces.
                </p>
              </div>

              <div className="min-w-[280px] rounded-3xl border border-white/80 bg-white/90 p-5 shadow-sm">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Live POS state</div>
                <div className="mt-2 text-lg font-semibold text-gray-900">{currentSession ? "Active cashier session" : "No active cashier session"}</div>
                <p className="mt-2 text-sm text-gray-600">
                  {currentSession ? `Started ${formatDateTime(currentSession.opening_time)}` : "Open the POS floor when selling begins."}
                </p>
                <Button asChild className="mt-4 w-full">
                  <Link href="/pos">Open POS floor</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-6">
            <StatTile
              label="Today sales"
              value={formatCurrencyCompact(currencyCode, Number(dailySales?.total_sales ?? 0))}
              description={`${dailySales?.total_orders ?? 0} completed orders today`}
              icon={CreditCard}
              tone="green"
            />
            <StatTile
              label="Held carts"
              value={heldOrders.length}
              description={heldOrders.length > 0 ? "Cashiers may need to recover parked orders" : "No held carts waiting"}
              icon={ShoppingCart}
              tone={heldOrders.length > 0 ? "amber" : "default"}
            />
            <StatTile
              label="Low stock items"
              value={lowStockItems.length}
              description={`${inventoryAnalytics?.out_of_stock_count ?? 0} items fully out of stock`}
              icon={Truck}
              tone={lowStockItems.length > 0 ? "amber" : "green"}
            />
            <StatTile
              label="Pending POs"
              value={purchaseAnalytics?.pending_orders ?? 0}
              description={`${purchaseAnalytics?.approved_orders ?? 0} approved and awaiting issue`}
              icon={ReceiptText}
            />
            <StatTile
              label="Products"
              value={productStats?.total_products ?? 0}
              description={`${productStats?.quick_sale_products ?? 0} POS-ready products`}
              icon={PackageOpen}
              tone="blue"
            />
            <StatTile
              label="Stock value"
              value={formatCurrencyCompact(currencyCode, Number(stockAnalytics?.total_stock_value ?? inventoryAnalytics?.total_stock_value ?? 0))}
              description={`${trackedInventoryItemCount} inventory items across ${stockAnalytics?.total_locations ?? 0} locations`}
              icon={Boxes}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 p-5 text-left text-inherit">
            <CardTitle className="text-xl tracking-tight">Inventory item watchlist</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-600">
              Immediate stock pressure that may affect sales, fulfillment, or purchasing today.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            {lowStockItems.slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      SKU {item.sku || "No SKU"} · {item.inventory_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-amber-700">{item.quantity} remaining</p>
                    <p className="text-xs text-gray-500">Min {item.minimum_stock_level}</p>
                  </div>
                </div>
              </div>
            ))}
            {lowStockItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                No low-stock signals right now.
              </div>
            ) : null}
            <Button asChild variant="outline" className="w-full">
              <Link href="/inventory">Open inventory workspace</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 p-5 text-left text-inherit">
            <CardTitle className="text-xl tracking-tight">Cashier and revenue pulse</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-600">
              Checkout activity and payment flow from the current operating day.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="rounded-2xl border border-gray-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-950">Current session</p>
              <p className="mt-2 text-lg font-semibold text-emerald-950">{currentSession ? "Cashier live" : "No cashier active"}</p>
              <p className="mt-1 text-sm text-emerald-900">{formatDateTime(currentSession?.opening_time)}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Orders today</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">{dailySales?.total_orders ?? 0}</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Average order</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">
                  {formatCurrencyCompact(currencyCode, Number(dailySales?.average_order_value ?? 0))}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Tax captured</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">
                  {formatCurrencyCompact(currencyCode, Number(dailySales?.total_tax ?? 0))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">Payment method mix</p>
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
                  {dailySales?.payment_methods?.map((paymentBreakdown: POSDailySalesPaymentMethodBreakdown) => (
                    <TableRow key={paymentBreakdown.payments__payment_method || "unknown"}>
                      <TableCell className="capitalize">{paymentBreakdown.payments__payment_method || "unknown"}</TableCell>
                      <TableCell>{paymentBreakdown.count}</TableCell>
                      <TableCell>{formatCurrencyCompact(currencyCode, Number(paymentBreakdown.total ?? 0))}</TableCell>
                    </TableRow>
                  ))}
                  {!dailySales?.payment_methods?.length ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-sm text-gray-500">
                        No payment activity recorded for this date yet.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 p-5 text-left text-inherit">
            <CardTitle className="text-xl tracking-tight">Purchasing pressure</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-600">
              Current purchase-order load and throughput markers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Pending</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">{purchaseAnalytics?.pending_orders ?? 0}</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Issued</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">{purchaseAnalytics?.issued_orders ?? 0}</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Received</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">{purchaseAnalytics?.received_orders ?? 0}</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Completed</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">{purchaseAnalytics?.completed_orders ?? 0}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Total purchase order value</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">
                {formatCurrencyCompact(currencyCode, Number(purchaseAnalytics?.total_order_value ?? 0))}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Average order value {formatCurrencyCompact(currencyCode, Number(purchaseAnalytics?.average_order_value ?? 0))}
              </p>
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link href="/order/purchase">Open purchase orders</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 p-5 text-left text-inherit">
            <CardTitle className="text-xl tracking-tight">Catalog and warehouse pulse</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-600">
              High-level product and stock markers to decide whether action belongs in product or inventory next.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Products</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{productStats?.total_products ?? 0}</div>
              <p className="mt-2 text-sm text-gray-600">
                {productStats?.featured_products ?? 0} featured · {productStats?.quick_sale_products ?? 0} quick-sale
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">New this week</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{productStats?.recent_activity?.new_products_this_week ?? 0}</div>
              <p className="mt-2 text-sm text-gray-600">
                Average price {formatCurrencyCompact(currencyCode, Number(productStats?.price_analysis?.avg_price ?? 0))}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Inventory items</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{inventoryItemCount}</div>
              <p className="mt-2 text-sm text-gray-600">
                {(inventoryAnalytics?.active_inventories ?? inventoryItemCount)} active · {inventoryAnalytics?.low_stock_count ?? 0} low stock
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Stock locations</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{stockAnalytics?.total_locations ?? 0}</div>
              <p className="mt-2 text-sm text-gray-600">
                {trackedInventoryItemCount} items tracked across the warehouse footprint
              </p>
            </div>

            <div className="md:col-span-2 grid gap-3 sm:grid-cols-2">
              <Button asChild variant="outline" className="w-full justify-between bg-white">
                <Link href="/product">Open product workspace</Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between bg-white">
                <Link href="/inventory">Open inventory workspace</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

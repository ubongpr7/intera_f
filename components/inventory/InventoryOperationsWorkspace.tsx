"use client"

import Link from "next/link"
import { getCookie } from "cookies-next"
import { ArrowLeft, Boxes, Clock3, PackageCheck, ShieldAlert } from "lucide-react"
import InventoryDetail from "@/components/inventory/Detail"
import InventoryAdjustStockCard from "@/components/inventory/InventoryAdjustStockCard"
import InventoryReservationsCard from "@/components/inventory/InventoryReservationsCard"
import InventoryStockSummaryCard from "@/components/inventory/InventoryStockSummaryCard"
import OperationalStepSection from "@/components/setup/OperationalStepSection"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { readCookieValue } from "@/lib/authCookies"
import { formatCurrencyCompact } from "@/lib/currency-utils"
import {
  useGetInventoryQuery,
  useGetInventoryStockSummaryQuery,
} from "@/redux/features/inventory/inventoryAPiSlice"
import { useListStockLocationsQuery } from "@/redux/features/stock/stockAPISlice"

type InventoryOperationsWorkspaceProps = {
  inventoryId: string
}

const toNumber = (value: string | number | undefined) => Number(value ?? 0)

export default function InventoryOperationsWorkspace({ inventoryId }: InventoryOperationsWorkspaceProps) {
  const { data: inventory, isLoading: loadingInventory, refetch: refetchInventory } = useGetInventoryQuery(inventoryId)
  const { data: summary, isLoading: loadingSummary, refetch: refetchSummary } = useGetInventoryStockSummaryQuery(inventoryId)
  const { data: locations = [], refetch: refetchLocations } = useListStockLocationsQuery()

  const refreshOperationalData = async () => {
    await Promise.all([refetchInventory(), refetchSummary(), refetchLocations()])
  }

  const reservedQuantity = toNumber(summary?.quantity_reserved)
  const availableQuantity = toNumber(summary?.quantity_available)
  const totalQuantity = toNumber(summary?.total_quantity)
  const totalValue = toNumber(summary?.total_value ?? inventory?.total_stock_value)
  const currencyCode = readCookieValue("currency", getCookie) || "NGN"

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 lg:px-8">
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100 p-6 text-left text-inherit">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Link href="/inventory" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4" />
                Back to inventory items
              </Link>
              <div>
                <CardTitle className="text-3xl tracking-tight">{loadingInventory ? "Loading inventory item..." : inventory?.name || "Inventory item operations"}</CardTitle>
                <CardDescription className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                  Run the full operational cycle for this inventory item: keep the record healthy, review the live stock picture, then handle
                  reservations and stock actions without leaving the workspace.
                </CardDescription>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Current stock</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingSummary ? "..." : totalQuantity}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Reserved</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingSummary ? "..." : reservedQuantity}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Total value</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">
                  {loadingSummary && loadingInventory ? "..." : formatCurrencyCompact(currencyCode, totalValue)}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-6 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              <Boxes className="h-4 w-4" />
              Total quantity
            </div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingSummary ? "..." : summary?.total_quantity ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              <PackageCheck className="h-4 w-4" />
              Available stock
            </div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingSummary ? "..." : availableQuantity}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              <ShieldAlert className="h-4 w-4" />
              Stock status
            </div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingSummary ? "..." : summary?.stock_status || inventory?.stock_status || "unknown"}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              <Clock3 className="h-4 w-4" />
              Active locations
            </div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingSummary ? "..." : summary?.total_locations ?? 0}</div>
          </div>
        </CardContent>
      </Card>

      <InventoryStockSummaryCard summary={summary} isLoading={loadingSummary} currencyCode={currencyCode} />

      <OperationalStepSection
        id="inventory-record"
        step={1}
        title="Maintain the inventory item record"
        description="Keep the inventory item definition clean so replenishment, valuation, and audit context remain accurate."
        helper="Update the inventory item metadata here before working on live stock operations."
        status={inventory ? "complete" : "in_progress"}
        facts={[
          { label: "Inventory type", value: inventory?.inventory_type || "Not set" },
          { label: "Category", value: inventory?.category_name || "Not set" },
          { label: "Status", value: inventory?.status || "Not set" },
        ]}
      >
        <InventoryDetail id={inventoryId} />
      </OperationalStepSection>

      <OperationalStepSection
        id="live-stock"
        step={2}
        title="Monitor and adjust live stock"
        description="Use the live summary and manual adjustment tool to reconcile quantities and respond to physical operations."
        helper="Adjustments should always be tied to a location so the audit trail stays meaningful."
        status={summary ? "complete" : "in_progress"}
        facts={[
          { label: "Tracked lots", value: inventory?.stock_analytics?.lot_count ?? summary?.lot_count ?? 0 },
          { label: "Available quantity", value: loadingSummary ? "..." : availableQuantity },
          { label: "Reserved quantity", value: loadingSummary ? "..." : reservedQuantity },
        ]}
      >
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <InventoryAdjustStockCard inventoryId={inventoryId} locations={locations} onAdjusted={refreshOperationalData} />
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="p-6 text-left text-inherit">
              <CardTitle className="text-lg">Tracking posture</CardTitle>
              <CardDescription className="text-sm leading-6 text-gray-600">
                Confirm how this inventory item is tracked before you move stock across locations.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 p-6 pt-0 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Track stock</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">{inventory?.track_stock ? "Enabled" : "Disabled"}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Track lots</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">{inventory?.track_lot ? "Enabled" : "Disabled"}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Track serials</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">{inventory?.track_serial ? "Enabled" : "Disabled"}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Track expiry</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">{inventory?.track_expiry ? "Enabled" : "Disabled"}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </OperationalStepSection>

      <OperationalStepSection
        id="reservations"
        step={3}
        title="Handle reservations and downstream fulfillment"
        description="Reserve stock for orders and other downstream commitments, then release or fulfill those commitments from the same inventory workspace."
        helper="This closes the loop between availability, allocation, and fulfillment without leaving inventory."
        status={reservedQuantity > 0 ? "complete" : "in_progress"}
        facts={[
          { label: "Reserved", value: loadingSummary ? "..." : reservedQuantity },
          { label: "Available", value: loadingSummary ? "..." : availableQuantity },
          { label: "Operational locations", value: locations.filter((location) => !location.structural).length },
        ]}
      >
        <InventoryReservationsCard
          inventoryItemId={inventoryId}
          locations={locations}
          onMutated={refreshOperationalData}
        />
      </OperationalStepSection>
    </div>
  )
}

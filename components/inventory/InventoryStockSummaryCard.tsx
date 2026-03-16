"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrencyCompact } from "@/lib/currency-utils"
import type { InventoryStockSummary } from "@/redux/features/inventory/inventoryTypes"

type InventoryStockSummaryCardProps = {
  summary?: InventoryStockSummary
  isLoading?: boolean
  currencyCode?: string
}

const formatMetric = (value: string | number | undefined, isLoading?: boolean) => {
  if (isLoading) {
    return "..."
  }

  if (value === undefined || value === null || value === "") {
    return "0"
  }

  return `${value}`
}

const resolveLocationLabel = (entry: Record<string, unknown>) =>
  String(entry.location_name ?? entry.location ?? entry.name ?? entry.code ?? "Location")

const resolveLocationQuantity = (entry: Record<string, unknown>) =>
  String(entry.quantity_available ?? entry.quantity_on_hand ?? entry.quantity ?? entry.total_quantity ?? "0")

const resolveExpiringLabel = (entry: Record<string, unknown>) =>
  String(entry.lot_number ?? entry.serial_number ?? entry.name ?? entry.inventory_item_name ?? "Tracked stock")

const resolveExpiringDetail = (entry: Record<string, unknown>) =>
  `Expiry: ${String(entry.expiry_date ?? entry.expiration_date ?? entry.date ?? "Unknown")} • Quantity: ${String(
    entry.quantity_available ?? entry.quantity_on_hand ?? entry.quantity ?? "0",
  )}`

export default function InventoryStockSummaryCard({
  summary,
  isLoading = false,
  currencyCode = "NGN",
}: InventoryStockSummaryCardProps) {
  const locationBreakdown = Array.isArray(summary?.location_breakdown) ? summary?.location_breakdown.slice(0, 5) : []
  const expiringLots = Array.isArray(summary?.expiring_lots) ? summary?.expiring_lots.slice(0, 5) : []

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-100 p-6 text-left text-inherit">
        <CardTitle className="text-xl">Live stock summary</CardTitle>
        <CardDescription className="text-sm leading-6 text-gray-600">
          Use this panel to confirm current quantity, available stock, location spread, and any time-sensitive stock risk before making changes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Total quantity</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{formatMetric(summary?.total_quantity, isLoading)}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Available</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{formatMetric(summary?.quantity_available, isLoading)}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Reserved</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{formatMetric(summary?.quantity_reserved, isLoading)}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Locations</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{formatMetric(summary?.total_locations, isLoading)}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Total value</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">
              {isLoading ? "..." : formatCurrencyCompact(currencyCode, Number(summary?.total_value ?? 0))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900">Location distribution</h3>
            <div className="mt-3 space-y-2">
              {locationBreakdown.length ? (
                locationBreakdown.map((entry, index) => (
                  <div key={`${resolveLocationLabel(entry)}-${index}`} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                    <span className="text-sm text-gray-700">{resolveLocationLabel(entry)}</span>
                    <span className="text-sm font-semibold text-gray-900">{resolveLocationQuantity(entry)}</span>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-600">
                  No location-level stock breakdown is available yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900">Expiring stock watch</h3>
            <div className="mt-3 space-y-2">
              {expiringLots.length ? (
                expiringLots.map((entry, index) => (
                  <div key={`expiring-${index}`} className="rounded-xl bg-amber-50 px-3 py-2">
                    <div className="text-sm font-semibold text-amber-950">{resolveExpiringLabel(entry)}</div>
                    <div className="mt-1 text-sm text-amber-900">{resolveExpiringDetail(entry)}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-600">
                  No expiring lots are currently flagged for this inventory.
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

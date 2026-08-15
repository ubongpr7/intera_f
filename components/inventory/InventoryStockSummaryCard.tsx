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
  String(
    entry.structural_location_name ??
      entry.location_name ??
      entry.location ??
      entry.name ??
      entry.code ??
      "Location",
  )

const resolveLocationQuantity = (entry: Record<string, unknown>) =>
  String(entry.quantity_available ?? entry.quantity_on_hand ?? entry.quantity ?? entry.total_quantity ?? "0")

const resolveLeafLocations = (entry: Record<string, unknown>) => {
  const rows = entry.leaf_locations
  if (!Array.isArray(rows)) {
    return []
  }
  return rows
    .filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object"))
    .slice(0, 2)
}

export default function InventoryStockSummaryCard({
  summary,
  isLoading = false,
  currencyCode = "NGN",
}: InventoryStockSummaryCardProps) {
  const locationBreakdown = Array.isArray(summary?.location_breakdown) ? summary?.location_breakdown.slice(0, 5) : []

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
                    <div className="min-w-0">
                      <div className="truncate text-sm text-gray-700">{resolveLocationLabel(entry)}</div>
                      {Number(entry.leaf_location_count ?? 0) > 0 ? (
                        <div className="text-xs text-gray-500">
                          {Number(entry.leaf_location_count)} mapped shelf{Number(entry.leaf_location_count) > 1 ? "s" : ""}
                        </div>
                      ) : null}
                      {resolveLeafLocations(entry).length ? (
                        <div className="mt-1 text-xs text-gray-500">
                          {resolveLeafLocations(entry)
                            .map((leaf) => `${String(leaf.stock_location_name || "Leaf")} (${resolveLocationQuantity(leaf)})`)
                            .join(" • ")}
                        </div>
                      ) : null}
                    </div>
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
            <h3 className="text-sm font-semibold text-gray-900">Tracking posture</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-gray-50 px-3 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Avg purchase price</div>
                <div className="mt-2 text-sm font-semibold text-gray-900">
                  {isLoading ? "..." : formatCurrencyCompact(currencyCode, Number(summary?.avg_purchase_price ?? 0))}
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 px-3 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Tracked lots</div>
                <div className="mt-2 text-sm font-semibold text-gray-900">{formatMetric(summary?.lot_count, isLoading)}</div>
              </div>
              <div className="rounded-xl bg-gray-50 px-3 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Tracked serials</div>
                <div className="mt-2 text-sm font-semibold text-gray-900">{formatMetric(summary?.serial_count, isLoading)}</div>
              </div>
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-600 sm:col-span-3">
                {summary?.expiry_date ? `Next tracked expiry: ${summary.expiry_date}` : "No tracked expiry date is currently flagged for this inventory item."}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

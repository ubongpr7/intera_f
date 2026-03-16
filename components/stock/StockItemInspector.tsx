"use client"

import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrencyCompact } from "@/lib/currency-utils"
import {
  useGetStockItemQuery,
  useGetStockItemTrackingHistoryQuery,
  useUpdateStockItemStatusMutation,
} from "@/redux/features/stock/stockAPISlice"
import { useState } from "react"

type StockItemInspectorProps = {
  itemId: string
  onClose: () => void
  onUpdated?: () => unknown
  currencyCode?: string
}

const STATUS_OPTIONS = [
  "ok",
  "attention_needed",
  "damaged",
  "destroyed",
  "rejected",
  "lost",
  "quarantined",
  "returned",
]

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: Record<string, unknown> }).data
    if (typeof data?.error === "string") {
      return data.error
    }
  }
  return "Failed to update stock item status."
}

export default function StockItemInspector({
  itemId,
  onClose,
  onUpdated,
  currencyCode = "NGN",
}: StockItemInspectorProps) {
  const { data: item, isLoading, refetch } = useGetStockItemQuery(itemId)
  const { data: trackingHistory = [], refetch: refetchTracking } = useGetStockItemTrackingHistoryQuery(itemId)
  const [updateStatus, { isLoading: isUpdating }] = useUpdateStockItemStatusMutation()
  const [status, setStatus] = useState("")
  const [reason, setReason] = useState("")

  const handleUpdateStatus = async () => {
    if (!status) {
      toast.error("Choose a new status first.")
      return
    }

    try {
      await updateStatus({
        id: itemId,
        data: { status, reason },
      }).unwrap()
      toast.success("Stock item status updated.")
      setReason("")
      await Promise.all([refetch(), refetchTracking()])
      if (onUpdated) {
        await onUpdated()
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="max-h-[90vh] w-full max-w-4xl overflow-y-auto border-gray-200 shadow-xl">
        <CardHeader className="border-b border-gray-100 p-6 text-left text-inherit">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{isLoading ? "Loading stock item..." : item?.name || "Stock item"}</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6 text-gray-600">
                Inspect this stock item, review its movement history, and change operational status when needed.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Quantity</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{item?.quantity ?? "..."}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Reserved</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{item?.quantity_reserved ?? "..."}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Available</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{item?.quantity_available ?? "..."}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Value</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">
                {formatCurrencyCompact(currencyCode, Number(item?.total_stock_value ?? 0))}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Lot tracking</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{item?.track_lot ? "Enabled" : "Disabled"}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Serial tracking</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{item?.track_serial ? "Enabled" : "Disabled"}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Tracked lots</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{item?.lot_count ?? 0}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Tracked serials</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{item?.serial_count ?? 0}</div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-gray-900">Core details</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">SKU: {item?.sku || "N/A"}</div>
                  <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">Status: {item?.status || "N/A"}</div>
                  <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">Location: {item?.location_name || "N/A"}</div>
                  <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">Variant: {item?.product_variant || "N/A"}</div>
                  <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">Expiry: {item?.expiry_date || "N/A"}</div>
                  <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">Serial: {item?.serial || "N/A"}</div>
                  <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">Lot count: {item?.lot_count ?? 0}</div>
                  <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">Serial count: {item?.serial_count ?? 0}</div>
                  <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">Tracking flags: {[item?.track_stock ? "stock" : null, item?.track_lot ? "lot" : null, item?.track_serial ? "serial" : null].filter(Boolean).join(", ") || "none"}</div>
                  <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    Purchase price: {formatCurrencyCompact(currencyCode, Number(item?.purchase_price ?? 0))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-gray-900">Tracking history</h3>
                <div className="mt-3 space-y-3">
                  {trackingHistory.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-600">
                      No tracking entries are available yet.
                    </div>
                  ) : (
                    trackingHistory.map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900">{entry.tracking_type_display || entry.tracking_type}</p>
                          <span className="text-xs uppercase tracking-wide text-gray-500">{entry.date || "No date"}</span>
                        </div>
                        {entry.notes ? <p className="mt-2 text-sm text-gray-600">{entry.notes}</p> : null}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-gray-900">Recent movements</h3>
                <div className="mt-3 space-y-3">
                  {item?.recent_movements?.length ? (
                    item.recent_movements.map((movement) => (
                      <div key={movement.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900">{movement.movement_type_display || movement.movement_type}</p>
                          <span className="text-xs uppercase tracking-wide text-gray-500">{movement.occurred_at || "No timestamp"}</span>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                          Quantity: {movement.quantity} • {movement.from_location_name || "Unknown source"} → {movement.to_location_name || "Unknown destination"}
                        </p>
                        {movement.lot_number || movement.serial_number ? (
                          <p className="mt-2 text-sm text-gray-600">
                            {movement.lot_number ? `Lot: ${movement.lot_number}` : "No lot"}{movement.lot_number && movement.serial_number ? " • " : ""}
                            {movement.serial_number ? `Serial: ${movement.serial_number}` : ""}
                          </p>
                        ) : null}
                        {movement.notes ? <p className="mt-2 text-sm text-gray-600">{movement.notes}</p> : null}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-600">
                      No recent movements are available for this stock item.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-900">Update stock status</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Use this only when stock needs operational intervention such as quarantine, damage, rejection, or return.
              </p>

              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stock-item-status">New status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="stock-item-status" className="h-11">
                      <SelectValue placeholder={item?.status || "Choose status"} />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option.replaceAll("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock-item-reason">Reason</Label>
                  <Textarea
                    id="stock-item-reason"
                    placeholder="Why is the status changing?"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </div>

                <Button onClick={handleUpdateStatus} disabled={isUpdating || !status}>
                  {isUpdating ? "Updating..." : "Apply status update"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

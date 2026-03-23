"use client"

import { useMemo, useState } from "react"
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
import {
  useGetLocationInventoryItemsQuery,
  useGetStockLocationQuery,
  useTransferLocationStockMutation,
} from "@/redux/features/stock/stockAPISlice"
import type { StockLocation } from "@/redux/features/stock/stockTypes"

type StockLocationInspectorProps = {
  locationId: string
  allLocations: StockLocation[]
  onClose: () => void
  onUpdated?: () => unknown
}

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: Record<string, unknown> }).data
    if (typeof data?.error === "string") {
      return data.error
    }
  }
  return "Failed to transfer stock from this location."
}

export default function StockLocationInspector({
  locationId,
  allLocations,
  onClose,
  onUpdated,
}: StockLocationInspectorProps) {
  const { data: location, isLoading } = useGetStockLocationQuery(locationId)
  const { data: stockItems = [], refetch } = useGetLocationInventoryItemsQuery(locationId)
  const [transferStock, { isLoading: isTransferring }] = useTransferLocationStockMutation()
  const [targetLocationId, setTargetLocationId] = useState("")
  const [inventoryItemId, setInventoryItemId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [serialNumber, setSerialNumber] = useState("")

  const transferTargets = useMemo(
    () => allLocations.filter((entry) => String(entry.id) !== locationId && !entry.structural),
    [allLocations, locationId],
  )

  const handleTransfer = async () => {
    if (!targetLocationId || !inventoryItemId || !quantity) {
      toast.error("Choose an inventory item, destination, and quantity.")
      return
    }

    try {
      await transferStock({
        id: locationId,
        data: {
          to_location_id: targetLocationId,
          inventory_item_id: inventoryItemId,
          quantity,
          serial_number: serialNumber || undefined,
        },
      }).unwrap()

      toast.success("Stock transferred successfully.")
      setInventoryItemId("")
      setQuantity("")
      setSerialNumber("")
      await refetch()
      if (onUpdated) {
        await onUpdated()
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="max-h-[90vh] w-full max-w-5xl overflow-y-auto border-gray-200 shadow-xl">
        <CardHeader className="border-b border-gray-100 p-6 text-left text-inherit">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{isLoading ? "Loading location..." : location?.name || "Location"}</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6 text-gray-600">
                Inspect stock held at this location and transfer inventory items into another operational location when required.
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
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Code</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{location?.code || "N/A"}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Type</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{location?.location_type_name || "N/A"}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Parent</div>
              <div className="mt-2 text-xl font-semibold text-gray-900">{location?.parent_name || "None"}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Inventory items</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{stockItems.length}</div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-gray-900">Current stock at this location</h3>
              <div className="mt-3 space-y-3">
                {stockItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-600">
                    No inventory items are currently allocated to this location.
                  </div>
                ) : (
                  stockItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setInventoryItemId(item.id)}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                        inventoryItemId === item.id ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900">{item.name || "Unnamed item"}</p>
                        <span className="text-xs uppercase tracking-wide text-gray-500">{item.quantity ?? 0}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{item.sku || item.product_variant || "No SKU/variant reference"}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {[item.track_lot ? `lots ${item.lot_count ?? 0}` : null, item.track_serial ? `serials ${item.serial_count ?? 0}` : null, item.serial ? `serial ${item.serial}` : null]
                          .filter(Boolean)
                          .join(" • ") || "No lot/serial tracking"}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-900">Transfer stock</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Move stock from this location into another operational location without leaving the inventory workspace.
              </p>

              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location-transfer-target">Destination location</Label>
                  <Select value={targetLocationId} onValueChange={setTargetLocationId}>
                    <SelectTrigger id="location-transfer-target" className="h-11">
                      <SelectValue placeholder="Choose destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {transferTargets.map((locationOption) => (
                        <SelectItem key={String(locationOption.id)} value={String(locationOption.id)}>
                          {locationOption.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location-transfer-quantity">Quantity</Label>
                  <Input
                    id="location-transfer-quantity"
                    type="number"
                    step="0.01"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location-transfer-serial">Serial number</Label>
                  <Input
                    id="location-transfer-serial"
                    value={serialNumber}
                    onChange={(event) => setSerialNumber(event.target.value)}
                    placeholder="Optional for tracked serial transfers"
                  />
                </div>

                <Button onClick={handleTransfer} disabled={isTransferring || !inventoryItemId || !targetLocationId || !quantity}>
                  {isTransferring ? "Transferring..." : "Transfer selected inventory item"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

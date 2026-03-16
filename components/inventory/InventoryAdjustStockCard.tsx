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
import { Textarea } from "@/components/ui/textarea"
import { useAdjustInventoryStockMutation } from "@/redux/features/inventory/inventoryAPiSlice"
import type { StockLocation } from "@/redux/features/stock/stockTypes"

type InventoryAdjustStockCardProps = {
  inventoryId: string
  locations: StockLocation[]
  onAdjusted?: () => void | Promise<void>
}

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: Record<string, unknown> }).data
    if (typeof data?.error === "string") {
      return data.error
    }
  }
  return "Failed to adjust stock."
}

export default function InventoryAdjustStockCard({
  inventoryId,
  locations,
  onAdjusted,
}: InventoryAdjustStockCardProps) {
  const [locationId, setLocationId] = useState("")
  const [quantityChange, setQuantityChange] = useState("")
  const [reason, setReason] = useState("")
  const [adjustInventoryStock, { isLoading }] = useAdjustInventoryStockMutation()

  const actionableLocations = useMemo(
    () => locations.filter((location) => !location.structural),
    [locations],
  )

  const handleSubmit = async () => {
    if (!locationId || !quantityChange) {
      toast.error("Pick a stock location and quantity change first.")
      return
    }

    try {
      await adjustInventoryStock({
        id: inventoryId,
        data: {
          location_id: locationId,
          quantity_change: quantityChange,
          reason,
        },
      }).unwrap()

      toast.success("Inventory stock adjusted successfully.")
      setQuantityChange("")
      setReason("")
      if (onAdjusted) {
        await onAdjusted()
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="p-6 text-left text-inherit">
        <CardTitle className="text-lg">Adjust stock manually</CardTitle>
        <CardDescription className="text-sm leading-6 text-gray-600">
          Use this for controlled corrections, opening balances, write-offs, or emergency reconciliations against a specific location.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6 pt-0">
        <div className="space-y-2">
          <Label htmlFor="inventory-adjust-location">Stock location</Label>
          <Select value={locationId} onValueChange={setLocationId}>
            <SelectTrigger id="inventory-adjust-location" className="h-11">
              <SelectValue placeholder="Choose a location" />
            </SelectTrigger>
            <SelectContent>
              {actionableLocations.map((location) => (
                <SelectItem key={String(location.id)} value={String(location.id)}>
                  {location.name}
                  {location.code ? ` (${location.code})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="inventory-adjust-quantity">Quantity change</Label>
          <Input
            id="inventory-adjust-quantity"
            type="number"
            step="0.01"
            placeholder="Use negative values for deductions"
            value={quantityChange}
            onChange={(event) => setQuantityChange(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="inventory-adjust-reason">Reason</Label>
          <Textarea
            id="inventory-adjust-reason"
            placeholder="Explain why the adjustment is necessary"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>

        <Button onClick={handleSubmit} disabled={isLoading || !locationId || !quantityChange}>
          {isLoading ? "Adjusting..." : "Adjust stock"}
        </Button>
      </CardContent>
    </Card>
  )
}

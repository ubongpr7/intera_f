"use client"

import { useMemo, useState } from "react"
import { toast } from "react-toastify"
import { AlertCircle, CheckCircle2, Lock, MinusCircle, PlusCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { hasAnyPermission } from "@/lib/permissionsGuard"
import { useAdjustInventoryStockMutation } from "@/redux/features/inventory/inventoryAPiSlice"
import type { AdjustStockResponse } from "@/redux/features/inventory/inventoryTypes"
import type { StockLocation } from "@/redux/features/stock/stockTypes"

type InventoryAdjustStockCardProps = {
  inventoryId: string
  locations: StockLocation[]
  onAdjusted?: () => void | Promise<void>
}

type AdjustmentFormErrors = Partial<Record<"locationId" | "quantityChange" | "reason", string>>

const adjustmentPermissions = ["adjust_stock_item_quantity", "adjust_inventory_item_quantity"]

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: Record<string, unknown> }).data
    if (typeof data?.detail === "string") {
      return data.detail
    }
    if (typeof data?.error === "string") {
      return data.error
    }
  }
  return "Failed to adjust stock."
}

const parseQuantityChange = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return null
  const numericValue = Number(trimmed)
  return Number.isFinite(numericValue) ? numericValue : null
}

const validateAdjustmentForm = ({
  locationId,
  quantityChange,
  reason,
}: {
  locationId: string
  quantityChange: string
  reason: string
}) => {
  const errors: AdjustmentFormErrors = {}
  const parsedQuantity = parseQuantityChange(quantityChange)

  if (!locationId) {
    errors.locationId = "Select the stock location where this adjustment should be applied."
  }
  if (parsedQuantity === null) {
    errors.quantityChange = "Enter a numeric quantity change."
  } else if (parsedQuantity === 0) {
    errors.quantityChange = "Quantity change cannot be zero."
  }
  if (!reason.trim()) {
    errors.reason = "Enter a reason so the adjustment can be audited."
  }

  return {
    errors,
    parsedQuantity,
  }
}

export default function InventoryAdjustStockCard({
  inventoryId,
  locations,
  onAdjusted,
}: InventoryAdjustStockCardProps) {
  const [locationId, setLocationId] = useState("")
  const [quantityChange, setQuantityChange] = useState("")
  const [reason, setReason] = useState("")
  const [fieldErrors, setFieldErrors] = useState<AdjustmentFormErrors>({})
  const [formError, setFormError] = useState("")
  const [lastAdjustment, setLastAdjustment] = useState<AdjustStockResponse | null>(null)
  const [adjustInventoryStock, { isLoading }] = useAdjustInventoryStockMutation()
  const canAdjustStock = hasAnyPermission(adjustmentPermissions)

  const actionableLocations = useMemo(
    () => locations.filter((location) => !location.structural),
    [locations],
  )
  const selectedLocation = useMemo(
    () => actionableLocations.find((location) => String(location.id) === locationId),
    [actionableLocations, locationId],
  )
  const parsedQuantityChange = parseQuantityChange(quantityChange)
  const adjustmentDirection =
    parsedQuantityChange === null || parsedQuantityChange === 0
      ? "neutral"
      : parsedQuantityChange > 0
        ? "increase"
        : "decrease"
  const submitDisabled = isLoading || !canAdjustStock || actionableLocations.length === 0

  const handleSubmit = async () => {
    setFormError("")
    setLastAdjustment(null)

    if (!canAdjustStock) {
      setFormError("You do not have permission to adjust stock quantities.")
      return
    }

    const validation = validateAdjustmentForm({ locationId, quantityChange, reason })
    setFieldErrors(validation.errors)

    if (Object.keys(validation.errors).length > 0 || validation.parsedQuantity === null) {
      setFormError("Review the highlighted fields before submitting this adjustment.")
      return
    }

    try {
      const result = await adjustInventoryStock({
        id: inventoryId,
        data: {
          location_id: locationId,
          structural_location_id: selectedLocation?.structural_location_id
            ? String(selectedLocation.structural_location_id)
            : undefined,
          quantity_change: validation.parsedQuantity,
          reason: reason.trim(),
        },
      }).unwrap()

      toast.success("Inventory stock adjusted successfully.")
      setLastAdjustment(result)
      setQuantityChange("")
      setReason("")
      setFieldErrors({})
      if (onAdjusted) {
        await onAdjusted()
      }
    } catch (error) {
      const message = getErrorMessage(error)
      setFormError(message)
      toast.error(message)
    }
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="p-6 text-left text-inherit">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Adjust stock manually</CardTitle>
            <CardDescription className="mt-2 text-sm leading-6 text-gray-600">
              Use this for controlled corrections, opening balances, write-offs, or emergency reconciliations against a specific location.
            </CardDescription>
          </div>
          <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
            Audited action
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6 pt-0">
        {!canAdjustStock ? (
          <Alert className="rounded-2xl border-amber-200 bg-amber-50 text-amber-900">
            <Lock className="h-4 w-4" />
            <AlertTitle>Permission required</AlertTitle>
            <AlertDescription>
              You need <span className="font-mono font-semibold">adjust_stock_item_quantity</span> to submit manual stock adjustments.
            </AlertDescription>
          </Alert>
        ) : null}

        {formError ? (
          <Alert className="rounded-2xl border-red-200 bg-red-50 text-red-900">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Adjustment not submitted</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        {lastAdjustment ? (
          <Alert className="rounded-2xl border-emerald-200 bg-emerald-50 text-emerald-900">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Stock adjusted</AlertTitle>
            <AlertDescription>
              Quantity changed by {lastAdjustment.change}. Previous quantity: {lastAdjustment.old_quantity}; new quantity:{" "}
              {lastAdjustment.new_quantity}.
            </AlertDescription>
          </Alert>
        ) : null}

        {actionableLocations.length === 0 ? (
          <Alert className="rounded-2xl border-amber-200 bg-amber-50 text-amber-900">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No actionable stock location</AlertTitle>
            <AlertDescription>
              Create a non-structural stock location before applying manual stock adjustments.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inventory-adjust-location">Stock location</Label>
              <Select
                value={locationId}
                onValueChange={(value) => {
                  setLocationId(value)
                  setFieldErrors((current) => ({ ...current, locationId: undefined }))
                  setFormError("")
                }}
                disabled={!canAdjustStock || isLoading || actionableLocations.length === 0}
              >
                <SelectTrigger
                  id="inventory-adjust-location"
                  className={`h-11 ${fieldErrors.locationId ? "border-red-300 focus:ring-red-500/30" : ""}`}
                >
                  <SelectValue placeholder="Choose a location" />
                </SelectTrigger>
                <SelectContent>
                  {actionableLocations.map((location) => (
                    <SelectItem key={String(location.id)} value={String(location.id)}>
                      {location.name}
                      {location.structural_location_name ? ` • ${location.structural_location_name}` : ""}
                      {location.code ? ` (${location.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.locationId ? <p className="text-xs font-medium text-red-600">{fieldErrors.locationId}</p> : null}
              {selectedLocation?.structural_location_name ? (
                <p className="text-xs text-gray-500">
                  This adjustment will be enforced inside the{" "}
                  <span className="font-medium text-gray-700">{selectedLocation.structural_location_name}</span> structural location scope.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="inventory-adjust-quantity">Quantity change</Label>
              <Input
                id="inventory-adjust-quantity"
                type="number"
                step="0.01"
                placeholder="Example: 12 or -3"
                value={quantityChange}
                disabled={!canAdjustStock || isLoading}
                onChange={(event) => {
                  setQuantityChange(event.target.value)
                  setFieldErrors((current) => ({ ...current, quantityChange: undefined }))
                  setFormError("")
                }}
                className={fieldErrors.quantityChange ? "border-red-300 focus-visible:ring-red-500/30" : undefined}
              />
              {fieldErrors.quantityChange ? <p className="text-xs font-medium text-red-600">{fieldErrors.quantityChange}</p> : null}
              <p className="text-xs text-gray-500">Use positive values to add stock and negative values to deduct stock.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inventory-adjust-reason">Reason</Label>
              <Textarea
                id="inventory-adjust-reason"
                placeholder="Example: Cycle count correction after physical stock check"
                value={reason}
                disabled={!canAdjustStock || isLoading}
                onChange={(event) => {
                  setReason(event.target.value)
                  setFieldErrors((current) => ({ ...current, reason: undefined }))
                  setFormError("")
                }}
                className={fieldErrors.reason ? "border-red-300 focus-visible:ring-red-500/30" : undefined}
              />
              {fieldErrors.reason ? <p className="text-xs font-medium text-red-600">{fieldErrors.reason}</p> : null}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Adjustment preview</div>
            <div className="mt-4 flex items-center gap-3">
              <div
                className={`rounded-2xl p-3 ${
                  adjustmentDirection === "increase"
                    ? "bg-emerald-100 text-emerald-700"
                    : adjustmentDirection === "decrease"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-gray-100 text-gray-500"
                }`}
              >
                {adjustmentDirection === "decrease" ? <MinusCircle className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {parsedQuantityChange === null || parsedQuantityChange === 0
                    ? "Enter a quantity"
                    : parsedQuantityChange > 0
                      ? `Add ${parsedQuantityChange}`
                      : `Deduct ${Math.abs(parsedQuantityChange)}`}
                </p>
                <p className="mt-1 text-xs text-gray-500">{selectedLocation?.name || "No location selected"}</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3 text-xs leading-5 text-gray-600">
              This action posts an audited stock adjustment against the selected stock location. The backend will reject locations outside the selected structural scope.
            </div>
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={submitDisabled} className="w-full sm:w-auto">
          {isLoading ? "Adjusting stock..." : "Adjust stock"}
        </Button>
        <CardDescription className="text-xs text-gray-500">
          Backend contract: <span className="font-mono">location_id</span>, optional{" "}
          <span className="font-mono">structural_location_id</span>, <span className="font-mono">quantity_change</span>, and{" "}
          <span className="font-mono">reason</span>.
        </CardDescription>
      </CardContent>
    </Card>
  )
}

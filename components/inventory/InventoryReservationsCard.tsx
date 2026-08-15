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
import { formatMachineLabel } from "@/lib/displayLabels"
import {
  useCreateReservationMutation,
  useFulfillReservationMutation,
  useListReservationsQuery,
  useReleaseReservationMutation,
} from "@/redux/features/stock/stockAPISlice"
import type { StockLocation, StockReservation } from "@/redux/features/stock/stockTypes"

type InventoryReservationsCardProps = {
  inventoryItemId: string
  locations: StockLocation[]
  onMutated?: () => void | Promise<void>
}

const getNumber = (value: string | number | undefined) => Number(value ?? 0)

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: Record<string, unknown> }).data
    if (typeof data?.error === "string") {
      return data.error
    }
  }
  return "The reservation action could not be completed."
}

const getRemainingReservation = (reservation: StockReservation) =>
  Math.max(getNumber(reservation.reserved_quantity) - getNumber(reservation.fulfilled_quantity), 0)

export default function InventoryReservationsCard({
  inventoryItemId,
  locations,
  onMutated,
}: InventoryReservationsCardProps) {
  const { data: reservations = [], isLoading, refetch } = useListReservationsQuery({ inventory_item: inventoryItemId })
  const [createReservation, { isLoading: isCreating }] = useCreateReservationMutation()
  const [releaseReservation, { isLoading: isReleasing }] = useReleaseReservationMutation()
  const [fulfillReservation, { isLoading: isFulfilling }] = useFulfillReservationMutation()

  const [locationId, setLocationId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [externalOrderType, setExternalOrderType] = useState("sales_order")
  const [externalOrderId, setExternalOrderId] = useState("")
  const [notes, setNotes] = useState("")

  const actionableLocations = useMemo(() => locations.filter((location) => !location.structural), [locations])
  const selectedLocation = useMemo(
    () => actionableLocations.find((location) => String(location.id) === locationId),
    [actionableLocations, locationId],
  )
  const activeReservations = reservations.filter((reservation) => reservation.status !== "fulfilled" && reservation.status !== "released")

  const handleMutationComplete = async () => {
    await refetch()
    if (onMutated) {
      await onMutated()
    }
  }

  const handleCreate = async () => {
    if (!locationId || !quantity || !externalOrderId) {
      toast.error("Location, quantity, and external order ID are required.")
      return
    }

    try {
      await createReservation({
        inventory_item_id: inventoryItemId,
        location_id: locationId,
        structural_location_id: selectedLocation?.structural_location_id
          ? String(selectedLocation.structural_location_id)
          : undefined,
        quantity,
        external_order_type: externalOrderType,
        external_order_id: externalOrderId,
        notes,
      }).unwrap()

      toast.success("Reservation created successfully.")
      setQuantity("")
      setExternalOrderId("")
      setNotes("")
      await handleMutationComplete()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const handleRelease = async (reservation: StockReservation) => {
    try {
      await releaseReservation({
        id: reservation.id,
        data: { quantity: getRemainingReservation(reservation) || undefined },
      }).unwrap()
      toast.success("Reservation released.")
      await handleMutationComplete()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const handleFulfill = async (reservation: StockReservation) => {
    try {
      await fulfillReservation({
        id: reservation.id,
        data: { quantity: getRemainingReservation(reservation) || undefined },
      }).unwrap()
      toast.success("Reservation fulfilled.")
      await handleMutationComplete()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="p-6 text-left text-inherit">
        <CardTitle className="text-lg">Reservations and fulfillment</CardTitle>
        <CardDescription className="text-sm leading-6 text-gray-600">
          Reserve stock for downstream sales or operational requests, then release or fulfill those allocations from the same workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6 pt-0">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reservation-location">Location</Label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger id="reservation-location" className="h-11">
                    <SelectValue placeholder="Choose a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {actionableLocations.map((location) => (
                      <SelectItem key={String(location.id)} value={String(location.id)}>
                        {location.name}
                        {location.structural_location_name ? ` • ${location.structural_location_name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedLocation?.structural_location_name ? (
                  <p className="text-xs text-gray-500">
                    This reservation will stay inside <span className="font-medium text-gray-700">{selectedLocation.structural_location_name}</span>.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reservation-quantity">Quantity</Label>
                <Input
                  id="reservation-quantity"
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reservation-order-type">External order type</Label>
                <Select value={externalOrderType} onValueChange={setExternalOrderType}>
                  <SelectTrigger id="reservation-order-type" className="h-11">
                    <SelectValue placeholder="Order type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales_order">Sales order</SelectItem>
                    <SelectItem value="pos_order">POS order</SelectItem>
                    <SelectItem value="transfer_request">Transfer request</SelectItem>
                    <SelectItem value="manual_allocation">Manual allocation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservation-order-id">External order ID</Label>
              <Input
                id="reservation-order-id"
                value={externalOrderId}
                onChange={(event) => setExternalOrderId(event.target.value)}
                placeholder="e.g. SO-10021"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservation-notes">Notes</Label>
              <Textarea
                id="reservation-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional operational notes"
              />
            </div>

            <Button onClick={handleCreate} disabled={isCreating || !locationId || !quantity || !externalOrderId}>
              {isCreating ? "Creating..." : "Create reservation"}
            </Button>
          </div>

          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Total</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{reservations.length}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Active</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{activeReservations.length}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Loading</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{isLoading ? "..." : "Ready"}</div>
              </div>
            </div>

            <div className="space-y-3">
              {reservations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
                  No reservations have been created for this inventory item yet.
                </div>
              ) : (
                reservations.map((reservation) => {
                  const remaining = getRemainingReservation(reservation)
                  return (
                    <div key={reservation.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{reservation.external_order_id}</p>
                          <p className="mt-1 text-sm text-gray-600">
                            {reservation.location_name || "Unknown location"} • {reservation.inventory_item_name || "Inventory item reservation"}
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-wide text-gray-500">
                            Status: {formatMachineLabel(reservation.status)} • Reserved: {reservation.reserved_quantity} • Remaining: {remaining}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handleRelease(reservation)}
                            disabled={isReleasing || remaining <= 0 || reservation.status === "released"}
                          >
                            Release
                          </Button>
                          <Button
                            onClick={() => handleFulfill(reservation)}
                            disabled={isFulfilling || remaining <= 0 || reservation.status === "fulfilled"}
                          >
                            Fulfill
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

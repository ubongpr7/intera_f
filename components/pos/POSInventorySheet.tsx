"use client"

import { PackageCheck } from "lucide-react"
import type {
  POSOrder,
  POSOrderInventorySummary,
  POSOrderInventorySummaryItem,
  POSOrderItem,
} from "@/redux/features/pos/posTypes"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

type InventoryAction = "request" | "confirm" | "release" | "fulfill" | "fail"

interface POSInventorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentOrder?: POSOrder
  inventorySummary?: POSOrderInventorySummary
  getDraftItem: (itemId: string) => POSOrderItem | undefined
  failureReason: string
  onFailureReasonChange: (value: string) => void
  onAction: (action: InventoryAction, item: POSOrderInventorySummaryItem) => Promise<void>
  pendingActionKeys: Record<string, boolean>
}

const getPendingActionKey = (action: InventoryAction, itemId: string) => `${action}:${itemId}`

const asNumber = (value: string | number | undefined | null) => Number(value ?? 0)

const humanizeStatus = (value?: string | null) => (value || "not_started").replaceAll("_", " ")

const getRecommendedAction = (
  item: POSOrderInventorySummaryItem,
  draftItem?: POSOrderItem,
): {
  action?: InventoryAction
  title: string
  description: string
} => {
  const reserved = asNumber(draftItem?.reserved_quantity ?? item.reserved_quantity)
  const fulfilled = asNumber(draftItem?.fulfilled_quantity ?? item.fulfilled_quantity)
  const remainingToReserve = asNumber(draftItem?.remaining_to_reserve)
  const remainingToFulfill = asNumber(draftItem?.remaining_to_fulfill)

  if (fulfilled > 0 && remainingToFulfill <= 0) {
    return {
      title: "Done",
      description: "This item has already been fulfilled and stock should already be deducted.",
    }
  }

  if (reserved > 0 && remainingToFulfill > 0) {
    return {
      action: "fulfill",
      title: "Next: Fulfill",
      description: "Stock is already reserved. Press Fulfill to complete the deduction and finish this item.",
    }
  }

  if (item.inventory_status === "reservation_pending" && reserved <= 0) {
    return {
      action: "request",
      title: "Next: Request stock",
      description:
        "Request stock first. If payment already succeeded and this line is just stuck in pending, Confirm can be used as a manual recovery step.",
    }
  }

  if (item.inventory_status === "failed") {
    return {
      action: "request",
      title: "Next: Retry request",
      description: "Retry the reservation if stock is available. Use Fail only when you want to keep this item marked as failed.",
    }
  }

  if (reserved <= 0 && remainingToReserve > 0) {
    return {
      action: "request",
      title: "Next: Request stock",
      description: "Start by requesting stock for this item. After stock is reserved, fulfill it to finish the flow.",
    }
  }

  if (item.inventory_status === "released") {
    return {
      action: "request",
      title: "Next: Request again",
      description: "The previous reservation was released. Request stock again if this sale should continue.",
    }
  }

  return {
    title: "Review needed",
    description: "Check the reservation and fulfillment numbers, then use the action that matches the current state.",
  }
}

export default function POSInventorySheet({
  open,
  onOpenChange,
  currentOrder,
  inventorySummary,
  getDraftItem,
  failureReason,
  onFailureReasonChange,
  onAction,
  pendingActionKeys,
}: POSInventorySheetProps) {
  const items = inventorySummary?.items || []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-3xl border-gray-200 bg-white p-0 text-gray-900 sm:max-w-3xl">
        <SheetHeader className="border-b border-gray-100 px-6 py-5">
          <SheetTitle className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4 text-blue-600" />
            Inventory workflow
          </SheetTitle>
          <SheetDescription>
            Reserve, release, fulfill, or mark inventory failure against the current draft order.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Order</div>
            <div className="mt-1 text-sm font-semibold text-gray-900">{currentOrder?.order_number || "No draft order"}</div>
            <div className="mt-2 text-xs text-gray-500 capitalize">
              {humanizeStatus(currentOrder?.inventory_status) || "Inventory not started"}
            </div>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
            <div className="font-semibold">How this flow works</div>
            <div className="mt-2 space-y-1 text-blue-900">
              <p>1. Press <span className="font-semibold">Request</span> to ask inventory to reserve the stock.</p>
              <p>2. If reservation is already known to be valid but the line is stuck in pending, press <span className="font-semibold">Confirm</span>.</p>
              <p>3. Once stock is reserved, press <span className="font-semibold">Fulfill</span> to complete the deduction.</p>
              <p><span className="font-semibold">Release</span> undoes an existing reservation. <span className="font-semibold">Fail</span> keeps the line marked as failed.</p>
              {currentOrder?.payment_status === "paid" ? (
                <p className="pt-1 font-medium text-blue-950">Payment is already recorded for this order. Do not pay again. Finish the inventory step instead.</p>
              ) : null}
            </div>
          </div>

          <ScrollArea className="h-[420px] rounded-2xl border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Projected</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const draftItem = getDraftItem(item.item_id)
                  const canRequest = asNumber(draftItem?.remaining_to_reserve) > 0
                  const canRelease = asNumber(draftItem?.reserved_quantity) > 0
                  const canFulfill = asNumber(draftItem?.remaining_to_fulfill) > 0
                  const recommended = getRecommendedAction(item, draftItem)
                  const isRequesting = !!pendingActionKeys[getPendingActionKey("request", item.item_id)]
                  const isConfirming = !!pendingActionKeys[getPendingActionKey("confirm", item.item_id)]
                  const isReleasing = !!pendingActionKeys[getPendingActionKey("release", item.item_id)]
                  const isFulfilling = !!pendingActionKeys[getPendingActionKey("fulfill", item.item_id)]
                  const isFailing = !!pendingActionKeys[getPendingActionKey("fail", item.item_id)]

                  return (
                    <TableRow key={item.item_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{item.variant_name || item.product_name}</p>
                          <p className="text-xs text-gray-500 capitalize">{humanizeStatus(item.inventory_status)}</p>
                          <p className="mt-2 text-xs font-medium text-blue-700">{recommended.title}</p>
                          <p className="mt-1 text-xs text-gray-500">{recommended.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">{item.projected_available_quantity} available</div>
                        <div className="text-xs text-gray-500">{item.projected_stock_status}</div>
                      </TableCell>
                      <TableCell>{item.reserved_quantity}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant={recommended.action === "request" ? "default" : "outline"}
                            onClick={() => void onAction("request", item)}
                            disabled={!canRequest || isRequesting}
                          >
                            Request
                          </Button>
                          <Button
                            size="sm"
                            variant={recommended.action === "confirm" ? "default" : "outline"}
                            onClick={() => void onAction("confirm", item)}
                            disabled={!canRequest || isConfirming}
                          >
                            Confirm
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => void onAction("release", item)} disabled={!canRelease || isReleasing}>
                            Release
                          </Button>
                          <Button
                            size="sm"
                            variant={recommended.action === "fulfill" ? "default" : "outline"}
                            onClick={() => void onAction("fulfill", item)}
                            disabled={!canFulfill || isFulfilling}
                          >
                            Fulfill
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => void onAction("fail", item)} disabled={isFailing}>
                            Fail
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}

                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-sm text-gray-500">
                      This order does not currently have inventory-controlled items.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </ScrollArea>

          <div className="space-y-2">
            <Label htmlFor="inventory-failure-reason">Failure reason</Label>
            <Textarea
              id="inventory-failure-reason"
              value={failureReason}
              onChange={(event) => onFailureReasonChange(event.target.value)}
              className="min-h-[96px] bg-gray-50"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

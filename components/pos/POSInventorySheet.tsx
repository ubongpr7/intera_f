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
  isBusy: boolean
}

const asNumber = (value: string | number | undefined | null) => Number(value ?? 0)

export default function POSInventorySheet({
  open,
  onOpenChange,
  currentOrder,
  inventorySummary,
  getDraftItem,
  failureReason,
  onFailureReasonChange,
  onAction,
  isBusy,
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
              {currentOrder?.inventory_status?.replaceAll("_", " ") || "Inventory not started"}
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

                  return (
                    <TableRow key={item.item_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{item.variant_name || item.product_name}</p>
                          <p className="text-xs text-gray-500 capitalize">{item.inventory_status.replaceAll("_", " ")}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">{item.projected_available_quantity} available</div>
                        <div className="text-xs text-gray-500">{item.projected_stock_status}</div>
                      </TableCell>
                      <TableCell>{item.reserved_quantity}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => void onAction("request", item)} disabled={!canRequest || isBusy}>
                            Request
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => void onAction("confirm", item)} disabled={!canRequest || isBusy}>
                            Confirm
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => void onAction("release", item)} disabled={!canRelease || isBusy}>
                            Release
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => void onAction("fulfill", item)} disabled={!canFulfill || isBusy}>
                            Fulfill
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => void onAction("fail", item)} disabled={isBusy}>
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

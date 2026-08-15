"use client"

import type { POSHoldOrder } from "@/redux/features/pos/posTypes"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface POSHeldOrdersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  heldOrders: POSHoldOrder[]
  isLoading?: boolean
  onRestore: (heldOrder: POSHoldOrder) => Promise<void>
  restoringHoldOrderIds: Record<string, boolean>
  accessNotice?: {
    requiredPermission: string
    message: string
  }
}

export default function POSHeldOrdersDialog({
  open,
  onOpenChange,
  heldOrders,
  isLoading = false,
  onRestore,
  restoringHoldOrderIds,
  accessNotice,
}: POSHeldOrdersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-gray-200 bg-white p-0 text-gray-900">
        <DialogHeader className="border-b border-gray-100 px-6 py-5">
          <DialogTitle>Held carts</DialogTitle>
          <DialogDescription>
            Restore a suspended sale into the current session when the customer returns.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5">
          {accessNotice ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-red-600">Permission required</div>
              <div className="mt-2 font-mono text-sm font-semibold text-red-900">{accessNotice.requiredPermission}</div>
              <div className="mt-2 text-sm text-red-800">{accessNotice.message}</div>
            </div>
          ) : null}

          <ScrollArea className="h-[360px] rounded-xl border border-gray-200">
            <div className="space-y-3 p-3">
              {heldOrders.map((heldOrder) => (
                <div
                  key={heldOrder.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{heldOrder.hold_reason || "Held order"}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Stored {new Date(heldOrder.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void onRestore(heldOrder)}
                    disabled={!!restoringHoldOrderIds[heldOrder.id] || !!accessNotice}
                  >
                    Restore cart
                  </Button>
                </div>
              ))}

              {isLoading ? (
                <div className="space-y-3 p-1">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`held-order-skeleton-${index}`}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-4 animate-pulse"
                    >
                      <div className="h-4 w-40 rounded bg-gray-200" />
                      <div className="mt-2 h-3 w-52 rounded bg-gray-100" />
                    </div>
                  ))}
                </div>
              ) : heldOrders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                  No held carts are waiting to be restored.
                </div>
              ) : null}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="border-t border-gray-100 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { Edit3, PackageCheck, ReceiptText, Rows3, ShoppingCart, UserRound } from "lucide-react"
import { formatCurrency } from "@/lib/currency-utils"
import type { POSOrder, POSOrderItem } from "@/redux/features/pos/posTypes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"

interface POSCartPanelProps {
  currentOrder?: POSOrder
  currencyCode: string
  customerLabel: string
  tableLabel: string
  heldOrderCount: number
  itemQuantities: Record<string, string>
  onItemQuantityChange: (itemId: string, value: string) => void
  onUpdateItem: (item: POSOrderItem) => Promise<void>
  onRemoveItem: (item: POSOrderItem) => Promise<void>
  onOpenCustomer: () => void
  onOpenTable: () => void
  onOpenHeldOrders: () => void
  onOpenPayment: () => void
  onOpenInventory: () => void
  onStartDraft: () => Promise<void>
  discountPercent: string
  discountAmount: string
  onDiscountPercentChange: (value: string) => void
  onDiscountAmountChange: (value: string) => void
  onApplyDiscount: () => Promise<void>
  tipPercent: string
  tipAmount: string
  onTipPercentChange: (value: string) => void
  onTipAmountChange: (value: string) => void
  onApplyTip: () => Promise<void>
  holdReason: string
  onHoldReasonChange: (value: string) => void
  onHoldOrder: () => Promise<void>
  onCancelOrder: () => Promise<void>
  hasInventoryControls: boolean
  canStartDraft: boolean
  isCreatingDraft: boolean
  isUpdatingItem: boolean
  isRemovingItem: boolean
  isApplyingDiscount: boolean
  isAddingTip: boolean
  isHoldingOrder: boolean
  isCancellingOrder: boolean
}

const asNumber = (value: string | number | undefined | null) => Number(value ?? 0)

export default function POSCartPanel({
  currentOrder,
  currencyCode,
  customerLabel,
  tableLabel,
  heldOrderCount,
  itemQuantities,
  onItemQuantityChange,
  onUpdateItem,
  onRemoveItem,
  onOpenCustomer,
  onOpenTable,
  onOpenHeldOrders,
  onOpenPayment,
  onOpenInventory,
  onStartDraft,
  discountPercent,
  discountAmount,
  onDiscountPercentChange,
  onDiscountAmountChange,
  onApplyDiscount,
  tipPercent,
  tipAmount,
  onTipPercentChange,
  onTipAmountChange,
  onApplyTip,
  holdReason,
  onHoldReasonChange,
  onHoldOrder,
  onCancelOrder,
  hasInventoryControls,
  canStartDraft,
  isCreatingDraft,
  isUpdatingItem,
  isRemovingItem,
  isApplyingDiscount,
  isAddingTip,
  isHoldingOrder,
  isCancellingOrder,
}: POSCartPanelProps) {
  const items = currentOrder?.items || []

  return (
    <Card className="h-full overflow-hidden border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-100 p-5">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="h-4 w-4 text-amber-600" />
            Current sale
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onOpenHeldOrders}>
            Held carts ({heldOrderCount})
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        {!currentOrder ? (
          <div className="space-y-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <p className="text-lg font-semibold text-gray-900">No draft order yet</p>
            <p className="text-sm text-gray-600">
              Choose customer or table if needed, then start a draft order before adding products.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" onClick={onOpenCustomer}>
                <UserRound className="h-4 w-4" />
                Customer: {customerLabel}
              </Button>
              <Button variant="outline" onClick={onOpenTable}>
                <Rows3 className="h-4 w-4" />
                Table: {tableLabel}
              </Button>
            </div>
            <Button onClick={() => void onStartDraft()} disabled={!canStartDraft || isCreatingDraft}>
              Start draft order
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={onOpenCustomer}
                className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                  <UserRound className="h-3.5 w-3.5" />
                  Customer
                </div>
                <div className="mt-2 text-sm font-semibold text-gray-900">{customerLabel}</div>
              </button>
              <button
                type="button"
                onClick={onOpenTable}
                className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                  <Rows3 className="h-3.5 w-3.5" />
                  Table
                </div>
                <div className="mt-2 text-sm font-semibold text-gray-900">{tableLabel}</div>
              </button>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                  <ReceiptText className="h-3.5 w-3.5" />
                  Order
                </div>
                <div className="mt-2 text-sm font-semibold text-gray-900">{currentOrder.order_number}</div>
              </div>
            </div>

            <ScrollArea className="h-[280px] rounded-2xl border border-gray-200">
              <div className="space-y-3 p-3">
                {items.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.variant_name || item.product_name}</p>
                        <p className="mt-1 text-xs text-gray-500">{item.sku_snapshot || item.barcode_snapshot || "No stock code"}</p>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">{formatCurrency(currencyCode, item.line_total)}</div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={itemQuantities[item.id] || String(item.quantity)}
                        onChange={(event) => onItemQuantityChange(item.id, event.target.value)}
                        className="w-24"
                      />
                      <Button size="sm" variant="outline" onClick={() => void onUpdateItem(item)} disabled={isUpdatingItem}>
                        <Edit3 className="h-3.5 w-3.5" />
                        Update
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void onRemoveItem(item)} disabled={isRemovingItem}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}

                {items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                    The draft exists, but the cart is still empty.
                  </div>
                ) : null}
              </div>
            </ScrollArea>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(currencyCode, currentOrder.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tax</span>
                  <span>{formatCurrency(currencyCode, currentOrder.tax_amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Discount</span>
                  <span>-{formatCurrency(currencyCode, currentOrder.discount_amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tip</span>
                  <span>{formatCurrency(currencyCode, currentOrder.tip_amount)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-base font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(currencyCode, currentOrder.total_amount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-medium text-amber-800">
                  <span>Remaining balance</span>
                  <span>{formatCurrency(currencyCode, currentOrder.remaining_balance)}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">Discount</div>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountPercent}
                    onChange={(event) => onDiscountPercentChange(event.target.value)}
                    placeholder="Percent"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountAmount}
                    onChange={(event) => onDiscountAmountChange(event.target.value)}
                    placeholder="Amount"
                  />
                  <Button onClick={() => void onApplyDiscount()} disabled={isApplyingDiscount}>
                    Apply
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">Tip</div>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tipPercent}
                    onChange={(event) => onTipPercentChange(event.target.value)}
                    placeholder="Percent"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tipAmount}
                    onChange={(event) => onTipAmountChange(event.target.value)}
                    placeholder="Amount"
                  />
                  <Button onClick={() => void onApplyTip()} disabled={isAddingTip}>
                    Apply
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-900">Hold or cancel</div>
              <Textarea
                value={holdReason}
                onChange={(event) => onHoldReasonChange(event.target.value)}
                className="mt-3 min-h-[88px] bg-white"
                placeholder="Optional reason for holding this cart"
              />
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Button variant="outline" onClick={() => void onHoldOrder()} disabled={isHoldingOrder}>
                  Hold cart
                </Button>
                <Button variant="outline" onClick={() => void onCancelOrder()} disabled={isCancellingOrder}>
                  Cancel order
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button className="w-full" onClick={onOpenPayment} disabled={items.length === 0}>
                <ReceiptText className="h-4 w-4" />
                Checkout
              </Button>
              <Button variant="outline" className="w-full bg-white" onClick={onOpenInventory} disabled={!hasInventoryControls}>
                <PackageCheck className="h-4 w-4" />
                Inventory workflow
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

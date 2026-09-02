"use client"

import { PackageCheck, ReceiptText, Rows3, ShoppingCart, UserRound } from "lucide-react"
import { formatCurrency } from "@/lib/currency-utils"
import type { POSDiscount, POSOrder, POSOrderItem } from "@/redux/features/pos/posTypes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"

interface POSCartPanelProps {
  currentOrder?: POSOrder
  currencyCode: string
  supportsTables?: boolean
  isHydrating?: boolean
  cartUnavailable?: boolean
  sessionReadNotice?: {
    requiredPermission: string
    message: string
  }
  cartOperateNotice?: {
    requiredPermission: string
    message: string
  }
  customerAccessNotice?: {
    requiredPermission: string
    message: string
  }
  tableAccessNotice?: {
    requiredPermission: string
    message: string
  }
  heldOrdersAccessNotice?: {
    requiredPermission: string
    message: string
  }
  customerLabel: string
  tableLabel: string
  heldOrderCount: number
  itemQuantities: Record<string, string>
  onItemQuantityChange: (itemId: string, value: string) => void
  onRemoveItem: (item: POSOrderItem) => Promise<void>
  onOpenCustomer: () => void
  onOpenTable: () => void
  onOpenHeldOrders: () => void
  onOpenPayment: () => void
  onOpenInventory: () => void
  onStartDraft: () => Promise<void>
  discountPercent: string
  discountAmount: string
  discountPolicies: POSDiscount[]
  selectedDiscountId: string
  onDiscountPolicyChange: (value: string) => void
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
  syncingItemIds: Record<string, boolean>
  removingItemIds: Record<string, boolean>
  isApplyingDiscount: boolean
  isAddingTip: boolean
  isHoldingOrder: boolean
  isCancellingOrder: boolean
  isCheckoutBlocked: boolean
}

const asNumber = (value: string | number | undefined | null) => Number(value ?? 0)
const noticeCardClassName = "rounded-2xl border border-red-200 bg-red-50 p-4"
const sanitizeIntegerInput = (value: string) => value.replace(/\D/g, "")
const sanitizeDecimalInput = (value: string) => {
  const filtered = value.replace(/[^\d.]/g, "")
  const [whole = "", ...rest] = filtered.split(".")
  const fraction = rest.join("").slice(0, 2)
  if (filtered.startsWith(".")) {
    return fraction ? `0.${fraction}` : "0."
  }
  return rest.length > 0 ? `${whole}.${fraction}` : whole
}

const PermissionNoticeCard = ({
  title,
  requiredPermission,
  message,
}: {
  title: string
  requiredPermission: string
  message: string
}) => (
  <div className={noticeCardClassName}>
    <div className="text-[11px] font-semibold uppercase tracking-wide text-red-600">{title}</div>
    <div className="mt-2 font-mono text-sm font-semibold text-red-900">{requiredPermission}</div>
    <div className="mt-2 text-sm text-red-800">{message}</div>
  </div>
)

export default function POSCartPanel({
  currentOrder,
  currencyCode,
  supportsTables = true,
  isHydrating = false,
  cartUnavailable = false,
  sessionReadNotice,
  cartOperateNotice,
  customerAccessNotice,
  tableAccessNotice,
  heldOrdersAccessNotice,
  customerLabel,
  tableLabel,
  heldOrderCount,
  itemQuantities,
  onItemQuantityChange,
  onRemoveItem,
  onOpenCustomer,
  onOpenTable,
  onOpenHeldOrders,
  onOpenPayment,
  onOpenInventory,
  onStartDraft,
  discountPercent,
  discountAmount,
  discountPolicies,
  selectedDiscountId,
  onDiscountPolicyChange,
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
  syncingItemIds,
  removingItemIds,
  isApplyingDiscount,
  isAddingTip,
  isHoldingOrder,
  isCancellingOrder,
  isCheckoutBlocked,
}: POSCartPanelProps) {
  const items = currentOrder?.items || []
  const isCartReadOnly = !!cartOperateNotice || currentOrder?.payment_status === "paid"
  const canCheckout =
    items.length > 0 &&
    currentOrder?.payment_status !== "paid" &&
    ["draft", "pending"].includes(currentOrder?.status || "") &&
    !isCheckoutBlocked &&
    !cartOperateNotice

  return (
    <Card className="h-full overflow-hidden border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-100 p-5">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="h-4 w-4 text-blue-600" />
            Current sale
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onOpenHeldOrders} disabled={!!heldOrdersAccessNotice}>
            Held carts ({heldOrderCount})
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        {!currentOrder ? (
          <div className="space-y-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <p className="text-lg font-semibold text-gray-900">
              {isHydrating
                ? "Loading"
                : sessionReadNotice
                  ? "POS session access denied"
                  : cartUnavailable
                    ? "Unable to load cashier session"
                    : "No live sale yet"}
            </p>
            <p className="text-sm text-gray-600">
              {isHydrating
                ? "Please wait while we open this page."
                : sessionReadNotice
                  ? sessionReadNotice.message
                : cartUnavailable
                  ? "The POS page could not load session or cart data right now. Reload after the backend becomes available."
                  : supportsTables
                    ? "Choose customer or table if needed, then start selling. Adding a product can also create the sale automatically."
                    : "Choose customer if needed, then start selling. Adding a product can also create the sale automatically."}
            </p>
            {sessionReadNotice ? (
              <PermissionNoticeCard
                title="Permission required"
                requiredPermission={sessionReadNotice.requiredPermission}
                message={sessionReadNotice.message}
              />
            ) : null}
            <div className={`grid gap-3 ${supportsTables ? "sm:grid-cols-2" : ""}`}>
              <Button variant="outline" onClick={onOpenCustomer} disabled={!!customerAccessNotice}>
                <UserRound className="h-4 w-4" />
                Customer: {customerLabel}
              </Button>
              {supportsTables ? (
                <Button variant="outline" onClick={onOpenTable} disabled={!!tableAccessNotice}>
                  <Rows3 className="h-4 w-4" />
                  Table: {tableLabel}
                </Button>
              ) : null}
            </div>
            <Button
              onClick={() => void onStartDraft()}
              disabled={isHydrating || cartUnavailable || !!sessionReadNotice || !!cartOperateNotice || !canStartDraft || isCreatingDraft}
            >
              Start sale
            </Button>
          </div>
        ) : (
          <>
            <div className={`grid gap-3 ${supportsTables ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
              <button
                type="button"
                onClick={onOpenCustomer}
                disabled={!!customerAccessNotice}
                className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                  <UserRound className="h-3.5 w-3.5" />
                  Customer
                </div>
                <div className="mt-2 text-sm font-semibold text-gray-900">{customerLabel}</div>
              </button>
              {supportsTables ? (
                <button
                  type="button"
                  onClick={onOpenTable}
                  disabled={!!tableAccessNotice}
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
                >
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                    <Rows3 className="h-3.5 w-3.5" />
                    Table
                  </div>
                  <div className="mt-2 text-sm font-semibold text-gray-900">{tableLabel}</div>
                </button>
              ) : null}
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                  <ReceiptText className="h-3.5 w-3.5" />
                  Order
                </div>
                <div className="mt-2 text-sm font-semibold text-gray-900">{currentOrder.order_number}</div>
              </div>
            </div>

            {cartOperateNotice ? (
              <PermissionNoticeCard
                title="Selling actions restricted"
                requiredPermission={cartOperateNotice.requiredPermission}
                message={cartOperateNotice.message}
              />
            ) : null}

            {customerAccessNotice ? (
              <PermissionNoticeCard
                title="Customer assignment restricted"
                requiredPermission={customerAccessNotice.requiredPermission}
                message={customerAccessNotice.message}
              />
            ) : null}

            {supportsTables && tableAccessNotice ? (
              <PermissionNoticeCard
                title="Table assignment restricted"
                requiredPermission={tableAccessNotice.requiredPermission}
                message={tableAccessNotice.message}
              />
            ) : null}

            {heldOrdersAccessNotice ? (
              <PermissionNoticeCard
                title="Held carts restricted"
                requiredPermission={heldOrdersAccessNotice.requiredPermission}
                message={heldOrdersAccessNotice.message}
              />
            ) : null}

            <ScrollArea className="h-[280px] rounded-2xl border border-gray-200">
              <div className="space-y-3 p-3">
                {items.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.variant_name || item.product_name}</p>
                        <p className="mt-1 text-xs text-gray-500">{item.sku_snapshot || item.barcode_snapshot || "No stock code"}</p>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(currencyCode, item.line_total)}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={itemQuantities[item.id] || String(item.quantity)}
                        onChange={(event) => onItemQuantityChange(item.id, sanitizeIntegerInput(event.target.value))}
                        className="w-24"
                        disabled={isCartReadOnly}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void onRemoveItem(item)}
                        disabled={!!removingItemIds[item.id] || isCartReadOnly}
                      >
                        Remove
                      </Button>
                      <div className="text-xs font-medium text-gray-500">
                        {syncingItemIds[item.id] ? "Saving..." : "Auto-save"}
                      </div>
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
                  <span>{formatCurrency(currencyCode, currentOrder?.subtotal ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tax</span>
                  <span>{formatCurrency(currencyCode, currentOrder?.tax_amount ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Discount</span>
                  <span>-{formatCurrency(currencyCode, currentOrder?.discount_amount ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tip</span>
                  <span>{formatCurrency(currencyCode, currentOrder?.tip_amount ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-base font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(currencyCode, currentOrder?.total_amount ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-medium text-blue-800">
                  <span>Remaining balance</span>
                  <span>{formatCurrency(currencyCode, currentOrder?.remaining_balance ?? 0)}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Discount</div>
                    <p className="mt-1 text-xs text-gray-500">Use a quick percentage or enter a fixed amount.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[5, 10, 15].map((value) => (
                      <Button
                        key={value}
                        size="sm"
                        variant="outline"
                        className="bg-white"
                        onClick={() => {
                          onDiscountPercentChange(String(value))
                          onDiscountAmountChange("")
                        }}
                        disabled={!!cartOperateNotice}
                      >
                        {value}%
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <select
                    value={selectedDiscountId}
                    onChange={(event) => onDiscountPolicyChange(event.target.value)}
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm sm:col-span-2"
                    disabled={!!cartOperateNotice}
                    aria-label="Discount policy"
                  >
                    <option value="">Manual discount</option>
                    {discountPolicies.map((policy) => (
                      <option key={policy.id} value={policy.id} disabled={policy.requires_approval}>
                        {policy.name} ({policy.discount_type === "percentage" ? `${policy.value}%` : formatCurrency(currencyCode, policy.value)})
                        {policy.requires_approval ? " - approval required" : ""}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={discountPercent}
                    onChange={(event) => onDiscountPercentChange(sanitizeDecimalInput(event.target.value))}
                    placeholder="Discount %"
                    className="h-11 bg-white"
                    disabled={!!cartOperateNotice}
                  />
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={discountAmount}
                    onChange={(event) => onDiscountAmountChange(sanitizeDecimalInput(event.target.value))}
                    placeholder="Discount amount"
                    className="h-11 bg-white"
                    disabled={!!cartOperateNotice}
                  />
                  <Button className="sm:col-span-2 h-11" onClick={() => void onApplyDiscount()} disabled={isApplyingDiscount || !!cartOperateNotice}>
                    Apply
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Tip</div>
                    <p className="mt-1 text-xs text-gray-500">Apply a service tip without opening another step.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[5, 10, 12.5].map((value) => (
                      <Button
                        key={value}
                        size="sm"
                        variant="outline"
                        className="bg-white"
                        onClick={() => {
                          onTipPercentChange(String(value))
                          onTipAmountChange("")
                        }}
                        disabled={!!cartOperateNotice}
                      >
                        {value}%
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={tipPercent}
                    onChange={(event) => onTipPercentChange(sanitizeDecimalInput(event.target.value))}
                    placeholder="Tip %"
                    className="h-11 bg-white"
                    disabled={!!cartOperateNotice}
                  />
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={tipAmount}
                    onChange={(event) => onTipAmountChange(sanitizeDecimalInput(event.target.value))}
                    placeholder="Tip amount"
                    className="h-11 bg-white"
                    disabled={!!cartOperateNotice}
                  />
                  <Button className="sm:col-span-2 h-11" onClick={() => void onApplyTip()} disabled={isAddingTip || !!cartOperateNotice}>
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
                disabled={!!cartOperateNotice}
              />
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Button variant="outline" onClick={() => void onHoldOrder()} disabled={isHoldingOrder || !!cartOperateNotice}>
                  Hold cart
                </Button>
                <Button variant="outline" onClick={() => void onCancelOrder()} disabled={isCancellingOrder || !!cartOperateNotice}>
                  Cancel order
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button className="w-full" onClick={onOpenPayment} disabled={!canCheckout || !!cartOperateNotice}>
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

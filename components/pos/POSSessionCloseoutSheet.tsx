"use client"

import { AlertTriangle, ArrowRightLeft, BadgeDollarSign, Wallet } from "lucide-react"
import { formatCurrency } from "@/lib/currency-utils"
import type { POSSessionCloseoutSummary } from "@/redux/features/pos/posTypes"
import { Button } from "@/components/ui/button"
import { formatMachineLabel } from "@/lib/displayLabels"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface POSSessionCloseoutSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  summary?: POSSessionCloseoutSummary
  currencyCode: string
  closingBalance: string
  onClosingBalanceChange: (value: string) => void
  onSubmit: (force?: boolean) => void
  isSubmitting: boolean
}

const asNumber = (value: string | number | undefined | null) => Number(value ?? 0)

export default function POSSessionCloseoutSheet({
  open,
  onOpenChange,
  summary,
  currencyCode,
  closingBalance,
  onClosingBalanceChange,
  onSubmit,
  isSubmitting,
}: POSSessionCloseoutSheetProps) {
  const hasBlockers = (summary?.unresolved_orders_count ?? 0) > 0
  const variance = asNumber(summary?.variance)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="pr-8">
          <SheetTitle>Close POS session</SheetTitle>
          <SheetDescription>
            Reconcile the shift before closing. The system now shows the expected drawer balance, payment mix, and unresolved orders.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                <Wallet className="h-3.5 w-3.5 text-blue-600" />
                Opening balance
              </div>
              <div className="mt-3 text-lg font-semibold text-gray-900">
                {formatCurrency(currencyCode, asNumber(summary?.opening_balance))}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                <BadgeDollarSign className="h-3.5 w-3.5 text-blue-600" />
                Paid sales
              </div>
              <div className="mt-3 text-lg font-semibold text-gray-900">
                {formatCurrency(currencyCode, asNumber(summary?.total_sales))}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {summary?.paid_orders_count ?? 0} paid order{summary?.paid_orders_count === 1 ? "" : "s"} in this session
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                <ArrowRightLeft className="h-3.5 w-3.5 text-blue-600" />
                Expected balance
              </div>
              <div className="mt-3 text-lg font-semibold text-gray-900">
                {formatCurrency(currencyCode, asNumber(summary?.expected_balance))}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Cash {formatCurrency(currencyCode, asNumber(summary?.cash_payments_total))} • non-cash {formatCurrency(currencyCode, asNumber(summary?.non_cash_payments_total))}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Completed orders</div>
              <div className="mt-3 text-lg font-semibold text-gray-900">{summary?.completed_orders_count ?? 0}</div>
              <div className="mt-1 text-xs text-gray-500">
                Completed sales {formatCurrency(currencyCode, asNumber(summary?.completed_total_sales))} • change given {formatCurrency(currencyCode, asNumber(summary?.change_given_total))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-gray-900">Count the drawer and enter the closing balance</div>
                <p className="mt-1 text-sm text-gray-600">
                  Any difference from the expected amount is shown immediately as variance.
                </p>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs font-semibold ${variance === 0 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                Variance {formatCurrency(currencyCode, variance)}
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={closingBalance}
                onChange={(event) => onClosingBalanceChange(event.target.value)}
                className="h-12 bg-white"
                placeholder="Enter counted drawer balance"
              />
              <Button className="h-12 px-6" onClick={() => onSubmit(false)} disabled={isSubmitting || !closingBalance}>
                Close session
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
            <div className="text-sm font-semibold text-gray-900">Payment mix</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {summary?.payment_method_totals?.length ? (
                summary.payment_method_totals.map((row) => (
                  <div key={row.payment_method} className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{row.payment_method}</div>
                    <div className="mt-2 text-base font-semibold text-gray-900">
                      {formatCurrency(currencyCode, asNumber(row.total))}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">{row.count} processed payment{row.count === 1 ? "" : "s"}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600 sm:col-span-2">
                  No processed payments were recorded in this session yet.
                </div>
              )}
            </div>
          </div>

          <div className={`rounded-3xl border p-5 ${hasBlockers ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-gray-50"}`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={`mt-0.5 h-5 w-5 ${hasBlockers ? "text-amber-700" : "text-green-600"}`} />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900">
                  {hasBlockers ? "Unresolved orders need attention" : "No session blockers"}
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {hasBlockers
                    ? "Draft or pending orders are still attached to this session. Resolve them first, or override the close if you intentionally want to end the shift."
                    : "All orders in this session are closed, completed, cancelled, or refunded."}
                </p>
              </div>
            </div>

            {hasBlockers ? (
              <>
                <div className="mt-4 space-y-3">
                  {summary?.unresolved_orders.map((order) => (
                    <div key={order.id} className="rounded-2xl border border-amber-200 bg-white px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{order.order_number}</div>
                          <div className="mt-1 text-xs uppercase tracking-wide text-gray-500">
                            {formatMachineLabel(order.status)} • payment {formatMachineLabel(order.payment_status)} • inventory {formatMachineLabel(order.inventory_status)}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(currencyCode, asNumber(order.total_amount))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button variant="outline" className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100" onClick={() => onSubmit(true)} disabled={isSubmitting || !closingBalance}>
                    Force close anyway
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </div>

        <SheetFooter className="mt-6 border-t border-gray-100 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

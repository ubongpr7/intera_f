"use client"

import { Clock3, PlayCircle, ReceiptText, ShoppingCart } from "lucide-react"
import { formatCurrencyCompact } from "@/lib/currency-utils"
import type { POSOrder, POSSession, POSSessionCloseoutSummary } from "@/redux/features/pos/posTypes"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface POSCashierHeaderProps {
  isLoading?: boolean
  hasCurrentSession: boolean
  currentSession?: POSSession
  currentOrder?: POSOrder
  terminalName?: string
  currencyCode: string
  heldOrderCount: number
  liveSessionCount: number
  closeoutSummary?: POSSessionCloseoutSummary
  onOpenSession: () => void
  onOpenHeldOrders: () => void
  onOpenCloseout: () => void
  isClosingSession: boolean
}

const asNumber = (value: string | number | undefined | null) => Number(value ?? 0)

const formatTime = (value?: string | null) => {
  if (!value) {
    return "Not started"
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function POSCashierHeader({
  isLoading = false,
  hasCurrentSession,
  currentSession,
  currentOrder,
  terminalName,
  currencyCode,
  heldOrderCount,
  liveSessionCount,
  closeoutSummary,
  onOpenSession,
  onOpenHeldOrders,
  onOpenCloseout,
  isClosingSession,
}: POSCashierHeaderProps) {
  return (
    <Card className="overflow-hidden border-gray-200 shadow-sm">
      <CardContent className="p-0">
        <div className="border-b border-gray-100 bg-gray-50 px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                <ShoppingCart className="h-3.5 w-3.5" />
                Cashier workspace
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900">
                {isLoading
                  ? "Loading POS session"
                  : hasCurrentSession
                    ? "Live session in progress"
                    : "Open a session to start selling"}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                {isLoading
                  ? "Loading terminals, session status, closeout state, and cashier workspace data."
                  : "Browse POS-ready products, recover held carts, manage the cart, coordinate inventory, and settle the order from one checkout flow."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="min-w-[132px] rounded-2xl border border-gray-200 bg-white p-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Terminal</div>
                <div className="mt-2 text-base font-semibold text-gray-900">{isLoading ? "Loading..." : terminalName || "Not selected"}</div>
              </div>
              <div className="min-w-[132px] rounded-2xl border border-gray-200 bg-white p-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Live sessions</div>
                <div className="mt-2 text-base font-semibold text-gray-900">{liveSessionCount}</div>
              </div>
              <div className="min-w-[132px] rounded-2xl border border-gray-200 bg-white p-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Held carts</div>
                <div className="mt-2 text-base font-semibold text-gray-900">{heldOrderCount}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Clock3 className="h-4 w-4 text-blue-600" />
              Session and order status
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Session</div>
                <div className="mt-2 text-base font-semibold capitalize text-gray-900">
                  {isLoading ? "Loading" : hasCurrentSession ? currentSession?.status || "open" : "closed"}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Started</div>
                <div className="mt-2 text-base font-semibold text-gray-900">{isLoading ? "Loading..." : formatTime(currentSession?.opening_time)}</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Current order</div>
                <div className="mt-2 text-base font-semibold text-gray-900">{isLoading ? "Loading..." : currentOrder?.order_number || "No draft"}</div>
              </div>
            </div>

            {currentOrder ? (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-600">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-blue-800">
                  <ReceiptText className="h-3.5 w-3.5" />
                  Remaining {formatCurrencyCompact(currencyCode, asNumber(currentOrder.remaining_balance))}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-blue-800">
                  Customer {currentOrder.customer_name || "Walk-in"}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                  Table {currentOrder.table_number || "Counter"}
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-sm font-semibold text-gray-900">Quick actions</div>
            <div className="mt-4 space-y-3">
              {isLoading ? (
                <>
                  <div className="rounded-2xl border border-gray-200 bg-white p-3 text-sm text-gray-600">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Session status</div>
                    <div className="mt-2 text-base font-semibold text-gray-900">Loading...</div>
                    <div className="mt-2 text-xs">Checking whether a cashier session is already open on this terminal.</div>
                  </div>
                  <Button className="w-full" disabled>
                    Loading session...
                  </Button>
                </>
              ) : hasCurrentSession ? (
                <>
                  <div className="rounded-2xl border border-gray-200 bg-white p-3 text-sm text-gray-600">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Expected close balance</div>
                    <div className="mt-2 text-base font-semibold text-gray-900">
                      {formatCurrencyCompact(currencyCode, asNumber(closeoutSummary?.expected_balance))}
                    </div>
                    <div className="mt-2 text-xs">
                      {closeoutSummary?.unresolved_orders_count
                        ? `${closeoutSummary.unresolved_orders_count} unresolved order${closeoutSummary.unresolved_orders_count === 1 ? "" : "s"} still need attention`
                        : "Session is clear for closeout"}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-gray-50 px-3 py-2">
                        <div className="uppercase tracking-wide text-gray-500">Paid sales</div>
                        <div className="mt-1 font-semibold text-gray-900">
                          {closeoutSummary?.paid_orders_count ?? 0} • {formatCurrencyCompact(currencyCode, asNumber(closeoutSummary?.total_sales))}
                        </div>
                      </div>
                      <div className="rounded-xl bg-gray-50 px-3 py-2">
                        <div className="uppercase tracking-wide text-gray-500">Completed</div>
                        <div className="mt-1 font-semibold text-gray-900">
                          {closeoutSummary?.completed_orders_count ?? 0} • {formatCurrencyCompact(currencyCode, asNumber(closeoutSummary?.completed_total_sales))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full" onClick={onOpenCloseout} disabled={isClosingSession}>
                    Close current session
                  </Button>
                </>
              ) : (
                <Button className="w-full" onClick={onOpenSession}>
                  <PlayCircle className="h-4 w-4" />
                  Open a new session
                </Button>
              )}

              <Button variant="outline" className="w-full bg-white" onClick={onOpenHeldOrders} disabled={isLoading}>
                Recover held carts ({heldOrderCount})
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

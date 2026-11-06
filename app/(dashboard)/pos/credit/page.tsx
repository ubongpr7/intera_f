"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useGetCreditSalesQuery, useGetCurrentConfigurationQuery, useGetCurrentSessionQuery, useProcessPaymentMutation } from "@/redux/features/pos/posAPISlice"
import type { POSOrder, POSPaymentMethod } from "@/redux/features/pos/posTypes"

const money = (value: unknown) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function CreditSalesPage() {
  const { data, isLoading, refetch } = useGetCreditSalesQuery({ ordering: "-created_at" })
  const { data: configuration } = useGetCurrentConfigurationQuery()
  const { data: currentSession } = useGetCurrentSessionQuery()
  const [processPayment, { isLoading: isPaying }] = useProcessPaymentMutation()
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const sales = useMemo(() => Array.isArray(data) ? data : data?.results || [], [data])

  const pay = async (order: POSOrder) => {
    const amount = Number(amounts[order.id] || order.remaining_balance || 0)
    if (!amount || amount <= 0) return
    await processPayment({
      orderId: order.id,
      idempotency_key: `web-credit-${order.id}-${Date.now()}`,
      session_id: currentSession?.sync_identifier,
      payments: [{ payment_method: "cash" as POSPaymentMethod, amount }],
      create_receipt: true,
    }).unwrap()
    setAmounts((current) => ({ ...current, [order.id]: "" }))
    await refetch()
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle>Credit sales</CardTitle>
          <CardDescription>Track customer balances and record later payments. Credit sales are {configuration?.allow_credit_sales ? "enabled" : "currently disabled"} for the active POS policy.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-muted-foreground">Loading credit sales…</p> : sales.length === 0 ? <p className="text-sm text-muted-foreground">No credit sales yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b text-xs uppercase text-muted-foreground"><th className="px-3 py-3">Customer</th><th className="px-3 py-3">Order</th><th className="px-3 py-3">Sale date</th><th className="px-3 py-3">Balance</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Record payment</th></tr></thead>
                <tbody>{sales.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="px-3 py-4 font-medium">{order.customer_name || "Registered customer"}</td>
                    <td className="px-3 py-4">{order.order_number}</td>
                    <td className="px-3 py-4">{new Date(order.created_at).toLocaleString()}</td>
                    <td className="px-3 py-4">{money(order.remaining_balance)}</td>
                    <td className="px-3 py-4"><Badge variant="outline">{order.credit_status || "open"}</Badge></td>
                    <td className="px-3 py-4"><div className="flex min-w-[220px] gap-2"><Input value={amounts[order.id] || ""} onChange={(event) => setAmounts((current) => ({ ...current, [order.id]: event.target.value }))} placeholder={String(order.remaining_balance || "0.00")} type="number" min="0.01" step="0.01" /><Button disabled={isPaying || Number(order.remaining_balance || 0) <= 0} onClick={() => void pay(order)}>Pay</Button></div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

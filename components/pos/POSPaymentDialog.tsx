"use client"

import { useEffect, useMemo, useState } from "react"
import { Banknote, CreditCard, Mail, ReceiptText, Smartphone } from "lucide-react"
import { formatCurrency } from "@/lib/currency-utils"
import type { POSOrder, POSPaymentMethod } from "@/redux/features/pos/posTypes"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type PaymentSubmission = {
  paymentMethod: POSPaymentMethod
  amount: string
  cashReceived?: string
  referenceNumber?: string
  emailAddress?: string
  printReceipt: boolean
}

interface POSPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order?: POSOrder
  currencyCode: string
  defaultPrintReceipt: boolean
  isProcessing: boolean
  onSubmit: (data: PaymentSubmission) => Promise<void>
}

const paymentMethods: Array<{ value: POSPaymentMethod; label: string; icon: typeof Banknote }> = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "mobile", label: "Mobile transfer", icon: Smartphone },
  { value: "qr", label: "QR", icon: ReceiptText },
  { value: "loyalty", label: "Loyalty", icon: ReceiptText },
  { value: "gift_card", label: "Gift card", icon: ReceiptText },
]

const asNumber = (value: string | number | undefined | null) => Number(value ?? 0)

export default function POSPaymentDialog({
  open,
  onOpenChange,
  order,
  currencyCode,
  defaultPrintReceipt,
  isProcessing,
  onSubmit,
}: POSPaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<POSPaymentMethod>("cash")
  const [amount, setAmount] = useState("0")
  const [cashReceived, setCashReceived] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [emailAddress, setEmailAddress] = useState("")
  const [printReceipt, setPrintReceipt] = useState(defaultPrintReceipt)

  useEffect(() => {
    if (!open || !order) {
      return
    }

    setPaymentMethod("cash")
    setAmount(String(order.remaining_balance ?? order.total_amount ?? 0))
    setCashReceived("")
    setReferenceNumber("")
    setEmailAddress("")
    setPrintReceipt(defaultPrintReceipt)
  }, [defaultPrintReceipt, open, order])

  const amountNumber = asNumber(amount)
  const cashReceivedNumber = asNumber(cashReceived)
  const changeDue = Math.max(0, cashReceivedNumber - amountNumber)
  const remainingBalance = asNumber(order?.remaining_balance ?? order?.total_amount)

  const canSubmit = useMemo(() => {
    if (!order) {
      return false
    }

    if (paymentMethod === "cash" && cashReceived && cashReceivedNumber < amountNumber) {
      return false
    }

    return amountNumber > 0
  }, [amountNumber, cashReceived, cashReceivedNumber, order, paymentMethod])

  const handleSubmit = async () => {
    await onSubmit({
      paymentMethod,
      amount,
      cashReceived: paymentMethod === "cash" ? cashReceived : undefined,
      referenceNumber: referenceNumber || undefined,
      emailAddress: emailAddress || undefined,
      printReceipt,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-gray-200 bg-white p-0 text-gray-900">
        <DialogHeader className="border-b border-gray-100 px-6 py-5">
          <DialogTitle>Process payment</DialogTitle>
          <DialogDescription>
            Settle the current draft order and optionally send a receipt email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 py-5">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Order</div>
                <div className="mt-1 text-sm font-semibold text-gray-900">{order?.order_number || "No draft"}</div>
              </div>
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Subtotal</div>
                <div className="mt-1 text-sm font-semibold text-gray-900">
                  {formatCurrency(currencyCode, order?.subtotal ?? 0)}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Total</div>
                <div className="mt-1 text-sm font-semibold text-gray-900">
                  {formatCurrency(currencyCode, order?.total_amount ?? 0)}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Remaining</div>
                <div className="mt-1 text-sm font-semibold text-gray-900">
                  {formatCurrency(currencyCode, remainingBalance)}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-900">Payment method</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon
                const active = paymentMethod === method.value
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentMethod(method.value)}
                    className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                      active
                        ? "border-blue-300 bg-blue-50 text-blue-900"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-semibold">{method.label}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Amount to collect</label>
              <Input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
            </div>
            {paymentMethod === "cash" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Cash received</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cashReceived}
                  onChange={(event) => setCashReceived(event.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Reference number</label>
                <Input value={referenceNumber} onChange={(event) => setReferenceNumber(event.target.value)} />
              </div>
            )}
          </div>

          {paymentMethod === "cash" ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">Change due</div>
              <div className="mt-2 text-2xl font-semibold text-emerald-900">{formatCurrency(currencyCode, changeDue)}</div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail className="h-4 w-4 text-gray-400" />
                Receipt email
              </label>
              <Input
                type="email"
                value={emailAddress}
                onChange={(event) => setEmailAddress(event.target.value)}
                placeholder="Optional customer email"
              />
            </div>
            <label className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={printReceipt}
                onChange={(event) => setPrintReceipt(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              Print receipt
            </label>
          </div>
        </div>

        <DialogFooter className="border-t border-gray-100 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={!canSubmit || isProcessing}>
            Process {formatCurrency(currencyCode, amountNumber)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

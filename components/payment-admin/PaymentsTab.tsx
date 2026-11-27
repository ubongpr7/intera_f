"use client"

import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Eye, RefreshCw, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { useGetPaymentsQuery, useIssuePaymentRefundMutation, useConfirmPaymentRefundMutation } from "@/redux/features/payment/paymentAPISlice"
import type { PaymentRecord, PaymentStatus } from "@/redux/features/payment/paymentTypes"
import { formatMachineLabel } from "@/lib/displayLabels"

export function PaymentsTab() {
  const [filters, setFilters] = useState<Record<string, string>>({})
  const { data: payments = [], isLoading, refetch } = useGetPaymentsQuery(filters)
  const [issuePaymentRefund, { isLoading: issuingRefund }] = useIssuePaymentRefundMutation()
  const [confirmPaymentRefund, { isLoading: confirmingRefund }] = useConfirmPaymentRefundMutation()
  const refundQueue = payments.filter((payment) => (
    `${payment.status ?? ""}`.toLowerCase() === "completed" &&
    `${payment.metadata?.payment_kind ?? ""}`.toLowerCase() === "subscription_upgrade" &&
    Number(payment.metadata?.manual_refund_amount ?? 0) > 0 &&
    ["PENDING_REVIEW", "INITIATED", "PENDING", "PROCESSING"].includes(`${payment.metadata?.manual_refund_status ?? ""}`.toUpperCase())
  ))

  const issueRefund = async (payment: PaymentRecord) => {
    const refundAmount = Number(payment.metadata?.manual_refund_amount ?? 0)
    if (!refundAmount || !window.confirm(`Issue a refund of ₦${refundAmount.toLocaleString()} for ${payment.external_payment_id ?? payment.id}?`)) return
    try {
      await issuePaymentRefund({ id: payment.id, amount: refundAmount, merchant_note: "Manual upgrade refund" }).unwrap()
      await refetch()
    } catch {
      window.alert("Unable to initiate the refund.")
    }
  }

  const confirmRefund = async (payment: PaymentRecord) => {
    if (!window.confirm(`Confirm that ₦${Number(payment.metadata?.manual_refund_amount ?? 0).toLocaleString()} has been refunded?`)) return
    try {
      await confirmPaymentRefund({ id: payment.id }).unwrap()
      await refetch()
    } catch {
      window.alert("Unable to confirm the refund.")
    }
  }

  const getStatusBadge = (status: PaymentStatus) => {
    const normalized = `${status ?? ""}`.trim().toLowerCase()
    const variant =
      normalized === "completed"
        ? "default"
        : normalized === "failed"
          ? "destructive"
          : normalized === "cancelled"
            ? "outline"
            : "secondary"
    return <Badge variant={variant}>{formatMachineLabel(normalized || "unknown")}</Badge>
  }

  const columns: ColumnDef<PaymentRecord>[] = [
    {
      accessorKey: "external_payment_id",
      header: "Reference",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.external_payment_id || row.original.reference || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) =>
        new Intl.NumberFormat("en-NG", {
          style: "currency",
          currency: String(row.original.currency ?? row.original.metadata?.currency ?? "NGN"),
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(Number(row.getValue("amount") ?? 0)),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status") as PaymentStatus),
    },
    {
      accessorKey: "provider",
      header: "Provider",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.provider_name ?? row.original.provider?.name ?? "Unknown"}
        </Badge>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => new Date(String(row.getValue("created_at"))).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
          {`${row.original.status ?? ""}`.toLowerCase() === "completed" && `${row.original.metadata?.payment_kind ?? ""}`.toLowerCase() === "subscription_upgrade" && Number(row.original.metadata?.manual_refund_amount ?? 0) > 0 && `${row.original.metadata?.manual_refund_status ?? ""}`.toUpperCase() === "PENDING_REVIEW" ? (
            <Button size="sm" onClick={() => void issueRefund(row.original)} disabled={issuingRefund}>
              <RotateCcw className="mr-1 h-4 w-4" /> Refund
            </Button>
          ) : null}
          {["INITIATED", "PENDING", "PROCESSING"].includes(`${row.original.metadata?.manual_refund_status ?? ""}`.toUpperCase()) ? (
            <Button size="sm" onClick={() => void confirmRefund(row.original)} disabled={confirmingRefund}>
              <RotateCcw className="mr-1 h-4 w-4" /> Mark as refunded
            </Button>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payments</h2>
          <p className="text-gray-500">Monitor all payment transactions across your applications.</p>
        </div>
        <Button onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {refundQueue.length > 0 ? (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle>Refunds requiring action</CardTitle>
            <CardDescription>Review Paystack refund requests and confirm them after the customer has been refunded.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {refundQueue.map((payment) => (
              <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                <div>
                  <p className="font-medium">{payment.external_payment_id || payment.reference || payment.id}</p>
                  <p className="text-sm text-muted-foreground">Refund: ₦{Number(payment.metadata?.manual_refund_amount ?? 0).toLocaleString()} · {payment.customer_email || "No billing email"}</p>
                </div>
                {`${payment.metadata?.manual_refund_status ?? ""}`.toUpperCase() === "PENDING_REVIEW" ? (
                  <Button onClick={() => void issueRefund(payment)} disabled={issuingRefund}>Issue refund</Button>
                ) : (
                  <Button onClick={() => void confirmRefund(payment)} disabled={confirmingRefund}>Mark as refunded</Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
          <CardDescription>All payment transactions processed through your system.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={payments} loading={isLoading} searchKey="external_payment_id" />
        </CardContent>
      </Card>
    </div>
  )
}

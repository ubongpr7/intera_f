"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Eye, RefreshCw, Ban } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useGetPaymentsQuery, useGetSubscriptionsQuery, useCancelSubscriptionMutation } from "@/redux/features/payment/paymentAPISlice"
import type { PaymentRecord, SubscriptionRecord, SubscriptionStatus } from "@/redux/features/payment/paymentTypes"
import { toast } from "react-toastify"
import { formatMachineLabel } from "@/lib/displayLabels"
import { extractErrorMessage } from "@/lib/utils"
import { confirmAction } from "@/components/common/confirmAction"

export function SubscriptionsTab() {
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionRecord | null>(null)
  const { data: subscriptions = [], isLoading, refetch } = useGetSubscriptionsQuery(filters)
  const { data: payments = [] } = useGetPaymentsQuery({})
  const [cancelSubscription] = useCancelSubscriptionMutation()

  const handleCancel = async (id: string) => {
    const confirmed = await confirmAction({
      title: "Cancel subscription?",
      description: "This cancels the subscription and may stop future billing for the customer.",
      confirmText: "Cancel subscription",
      destructive: true,
    })
    if (!confirmed) return

    try {
      await cancelSubscription(id).unwrap()
      toast.success("Subscription cancelled successfully")
      refetch()
    } catch (error) {
      toast.error(extractErrorMessage(error, ["detail"]) || "Failed to cancel subscription")
    }
  }

  const getStatusBadge = (status: SubscriptionStatus) => {
    const variants: Record<SubscriptionStatus, "default" | "destructive" | "secondary" | "outline"> = {
      active: "default",
      cancelled: "destructive",
      expired: "secondary",
      trial: "outline",
    }
    return <Badge variant={variants[status]}>{formatMachineLabel(status)}</Badge>
  }

  const formatAccessUntil = (value?: string | null) => {
    if (!value) return "N/A"
    return new Date(value).toLocaleString()
  }

  const relatedPayments = useMemo(() => {
    if (!selectedSubscription?.plan?.name) return []
    return payments
      .filter((payment) => payment.plan_name === selectedSubscription.plan?.name)
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
  }, [payments, selectedSubscription])

  const cardSummary = (payment?: PaymentRecord | null) => {
    const card = payment?.metadata?.billing_card as Record<string, unknown> | undefined
    if (!card) return "No saved card reference"
    const brand = `${card.brand ?? card.type ?? "Card"}`
      .replace(/\b\w/g, (char) => char.toUpperCase())
    const last4 = `${card.last4 ?? card.last_4digits ?? ""}`.trim()
    return last4 ? `${brand} ending in ${last4}` : brand
  }

  const formatAmount = (payment: PaymentRecord) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: String(payment.metadata?.currency ?? "NGN"),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(payment.amount ?? 0))

  const columns: ColumnDef<SubscriptionRecord>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <span className="font-mono text-sm">#{String(row.getValue("id"))}</span>,
    },
    {
      accessorKey: "plan",
      header: "Plan",
      cell: ({ row }) => row.original.plan?.name || "N/A",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          {getStatusBadge(row.getValue("status") as SubscriptionStatus)}
          {row.original.pending_cancellation ? (
            <Badge variant="secondary">Scheduled to end</Badge>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "current_period_end",
      header: "Access Until",
      cell: ({ row }) => {
        const date = row.getValue("current_period_end")
        return formatAccessUntil(date ? String(date) : row.original.access_until)
      },
    },
    {
      id: "billing",
      header: "Billing",
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="font-medium">{row.original.billing_provider ? formatMachineLabel(row.original.billing_provider) : "N/A"}</div>
          <div className="text-gray-500">
            {row.original.current_payment_status ? formatMachineLabel(row.original.current_payment_status) : "No payment status"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => new Date(String(row.getValue("created_at"))).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedSubscription(row.original)}>
            <Eye className="h-4 w-4" />
          </Button>
          {row.original.status === "active" && !row.original.pending_cancellation && (
            <Button variant="ghost" size="sm" onClick={() => handleCancel(row.original.id)}>
              <Ban className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Subscriptions</h2>
          <p className="text-gray-500">Manage trial access, live billing, and period-end cancellations.</p>
        </div>
        <Button onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Subscriptions</CardTitle>
          <CardDescription>Customer subscriptions across all your applications.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={subscriptions} loading={isLoading} />
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedSubscription)} onOpenChange={(open) => !open && setSelectedSubscription(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedSubscription?.plan?.name ?? "Subscription"} details</DialogTitle>
            <DialogDescription>
              Review status, access window, billing state, and recent payment activity for this subscription.
            </DialogDescription>
          </DialogHeader>
          {selectedSubscription ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</p>
                  <div className="mt-3 flex flex-col gap-2">
                    {getStatusBadge(selectedSubscription.status)}
                    {selectedSubscription.pending_cancellation ? <Badge variant="secondary">Scheduled to end</Badge> : null}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Access until</p>
                  <p className="mt-3 text-sm font-medium">{formatAccessUntil(selectedSubscription.current_period_end ?? selectedSubscription.access_until)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Billing provider</p>
                  <p className="mt-3 text-sm font-medium">
                    {selectedSubscription.billing_provider ? formatMachineLabel(selectedSubscription.billing_provider) : "N/A"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedSubscription.current_payment_status ? formatMachineLabel(selectedSubscription.current_payment_status) : "No current payment status"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Created</p>
                  <p className="mt-3 text-sm font-medium">{new Date(selectedSubscription.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Recent billing activity</p>
                    <p className="text-sm text-slate-500">Charges, failures, and payment records tied to this plan.</p>
                  </div>
                </div>
                {relatedPayments.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    No billing records found for this subscription yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {relatedPayments.slice(0, 8).map((payment) => (
                      <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4">
                        <div>
                          <p className="font-medium">{payment.plan_name ?? "Subscription charge"}</p>
                          <p className="text-sm text-slate-500">
                            {new Date(payment.created_at).toLocaleString()} • {payment.customer_email ?? "No email"}
                          </p>
                          <p className="text-sm text-slate-500">{cardSummary(payment)}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{formatMachineLabel(String(payment.status ?? "unknown"))}</Badge>
                          <p className="mt-2 text-sm font-semibold">{formatAmount(payment)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Eye, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { useGetPaymentsQuery } from "@/redux/features/payment/paymentAPISlice"
import type { PaymentRecord, PaymentStatus } from "@/redux/features/payment/paymentTypes"
import { formatMachineLabel } from "@/lib/displayLabels"

export function PaymentsTab() {
  const [filters, setFilters] = useState<Record<string, string>>({})
  const { data: payments = [], isLoading, refetch } = useGetPaymentsQuery(filters)

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
          currency: String(row.original.metadata?.currency ?? "NGN"),
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
      cell: ({ row }) => <Badge variant="outline">{row.original.provider?.name ?? "Unknown"}</Badge>,
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

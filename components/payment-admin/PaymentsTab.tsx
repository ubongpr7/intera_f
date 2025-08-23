"use client"

import { useState } from "react"
import { Eye, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { useGetPaymentsQuery } from "@/redux/features/payment/paymentAPISlice"

export function PaymentsTab() {
  const [filters, setFilters] = useState({})
  const { data: payments = [], isLoading, refetch } = useGetPaymentsQuery(filters)

  const getStatusBadge = (status) => {
    const variants = {
      pending: "secondary",
      completed: "default",
      failed: "destructive",
      cancelled: "outline",
    }
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>
  }

  const columns = [
    {
      accessorKey: "reference",
      header: "Reference",
      cell: ({ row }) => <span className="font-mono text-sm">{row.getValue("reference")}</span>,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => `$${Number.parseFloat(row.getValue("amount")).toFixed(2)}`,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "provider",
      header: "Provider",
      cell: ({ row }) => <Badge variant="outline">{row.original.provider?.name}</Badge>,
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => new Date(row.getValue("created_at")).toLocaleDateString(),
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
          <p className="text-muted-foreground">Monitor all payment transactions across your applications.</p>
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
          <DataTable columns={columns} data={payments} loading={isLoading} searchKey="reference" />
        </CardContent>
      </Card>
    </div>
  )
}

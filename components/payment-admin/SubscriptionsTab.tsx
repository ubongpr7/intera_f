"use client"

import { useState } from "react"
import { Eye, RefreshCw, Ban } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { useGetSubscriptionsQuery, useCancelSubscriptionMutation } from "@/redux/features/payment/paymentAPISlice"
import { toast } from "react-toastify"

export function SubscriptionsTab() {
  const [filters, setFilters] = useState({})
  const { data: subscriptions = [], isLoading, refetch } = useGetSubscriptionsQuery(filters)
  const [cancelSubscription] = useCancelSubscriptionMutation()

  const handleCancel = async (id) => {
    if (confirm("Are you sure you want to cancel this subscription?")) {
      try {
        await cancelSubscription(id).unwrap()
        toast.success("Subscription cancelled successfully")
        refetch()
      } catch (error) {
        toast.error("Failed to cancel subscription")
      }
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      active: "default",
      cancelled: "destructive",
      expired: "secondary",
      trial: "outline",
    }
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>
  }

  const columns = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <span className="font-mono text-sm">#{row.getValue("id")}</span>,
    },
    {
      accessorKey: "plan",
      header: "Plan",
      cell: ({ row }) => row.original.plan?.name || "N/A",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "current_period_end",
      header: "Next Billing",
      cell: ({ row }) => {
        const date = row.getValue("current_period_end")
        return date ? new Date(date).toLocaleDateString() : "N/A"
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
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
          {row.original.status === "active" && (
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
          <p className="text-muted-foreground">Manage customer subscriptions and billing cycles.</p>
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
    </div>
  )
}

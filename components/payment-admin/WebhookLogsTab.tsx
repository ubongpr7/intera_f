"use client"

import { useState } from "react"
import { Eye, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { useGetWebhookLogsQuery } from "@/redux/features/payment/paymentAPISlice"

interface WebhookProvider {
  name: string
}

interface WebhookLog {
  id: number | string
  provider?: WebhookProvider
  event_type: string
  status: "success" | "failed" | "pending" | string
  created_at: string | Date
  [key: string]: any
}

interface Filters {
  [key: string]: any
}

type Status = "success" | "failed" | "pending" | string

export function WebhookLogsTab() {
  const [filters, setFilters] = useState<Filters>({})
  const { data: logs = [], isLoading, refetch } = useGetWebhookLogsQuery(filters)

  const getStatusBadge = (status: Status) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      success: "default",
      failed: "destructive",
      pending: "secondary",
    }
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>
  }
}

  import type { Row } from "@tanstack/react-table" // Adjust import path/type as needed

  const columns = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }: { row: Row<WebhookLog> }) => <span className="font-mono text-sm">#{row.getValue("id")}</span>,
    },
    {
      accessorKey: "provider",
      header: "Provider",
      cell: ({ row }: { row: Row<WebhookLog> }) => <Badge variant="outline">{row.original.provider?.name}</Badge>,
    },
    {
      accessorKey: "event_type",
      header: "Event Type",
      cell: ({ row }: { row: Row<WebhookLog> }) => <Badge variant="secondary">{row.getValue("event_type")}</Badge>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: Row<WebhookLog> }) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "created_at",
      header: "Received",
      cell: ({ row }: { row: Row<WebhookLog> }) => new Date(row.getValue("created_at")).toLocaleString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: Row<WebhookLog> }) => (
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
          <h2 className="text-2xl font-bold tracking-tight">Webhook Logs</h2>
          <p className="text-muted-foreground">Monitor webhook events from payment providers.</p>
        </div>
        <Button onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Events</CardTitle>
          <CardDescription>Incoming webhook events from payment providers.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={logs} loading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { PaymentAppDialog } from "./PaymentAppDialog"
import { useGetPaymentAppsQuery, useDeletePaymentAppMutation } from "@/redux/features/payment/paymentAPISlice"
import { toast } from "react-toastify"
import type { ColumnDef } from "@tanstack/react-table"
import { extractErrorMessage } from "@/lib/utils"
import { confirmAction } from "@/components/common/confirmAction"
import { QueryStateBoundary } from "@/components/common/QueryStateBoundary"

interface PaymentApp {
  id: string
  name: string
  slug: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export function PaymentAppsTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<PaymentApp | null>(null)

  const { data: apps = [], isLoading, error, refetch } = useGetPaymentAppsQuery({})
  const [deleteApp] = useDeletePaymentAppMutation()

  const handleEdit = (app: PaymentApp) => {
    setEditingApp(app)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirmAction({
      title: "Delete payment app?",
      description: "This removes the payment app configuration from the workspace.",
      confirmText: "Delete app",
      destructive: true,
    })
    if (!confirmed) return

    try {
      await deleteApp(id).unwrap()
      toast.success("Payment app deleted successfully")
      refetch()
    } catch (error) {
      toast.error(extractErrorMessage(error, ["detail"]) || "Failed to delete payment app")
    }
  }

  const columns: ColumnDef<PaymentApp>[] = [
    {
      accessorKey: "name",
      header: "App Name",
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) => <Badge variant="secondary">{row.getValue("slug")}</Badge>,
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.getValue("is_active") ? "default" : "secondary"}>
          {row.getValue("is_active") ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.original.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Payment Apps</h2>
            <p className="text-gray-500">Manage applications that can accept payments through your system.</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add App
          </Button>
        </div>

        <QueryStateBoundary
          error={error}
          onRetry={refetch}
          errorTitle="Unable to load payment apps"
          errorKeys={["detail", "message", "error"]}
        >
          <div />
        </QueryStateBoundary>

        <PaymentAppDialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) {
              setEditingApp(null)
            }
          }}
          app={editingApp}
          onSuccess={() => {
            refetch()
            setIsDialogOpen(false)
            setEditingApp(null)
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payment Apps</h2>
          <p className="text-gray-500">Manage applications that can accept payments through your system.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add App
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Applications</CardTitle>
          <CardDescription>Applications configured to use your payment system.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading payment apps...</div>
            </div>
          ) : apps.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="mb-2 text-gray-500">No payment apps found</p>
                <Button onClick={() => setIsDialogOpen(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First App
                </Button>
              </div>
            </div>
          ) : (
            <DataTable columns={columns} data={apps} loading={isLoading} />
          )}
        </CardContent>
      </Card>

      <PaymentAppDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingApp(null)
          }
        }}
        app={editingApp}
        onSuccess={() => {
          refetch()
          setIsDialogOpen(false)
          setEditingApp(null)
        }}
      />
    </div>
  )
}

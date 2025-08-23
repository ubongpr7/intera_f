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

  console.log("[v0] PaymentAppsTab - apps data:", apps)
  console.log("[v0] PaymentAppsTab - isLoading:", isLoading)
  console.log("[v0] PaymentAppsTab - error:", error)

  const handleEdit = (app: PaymentApp) => {
    setEditingApp(app)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this payment app?")) {
      try {
        await deleteApp(id).unwrap()
        toast.success("Payment app deleted successfully")
        refetch()
      } catch (error) {
        toast.error("Failed to delete payment app")
      }
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
            <p className="text-muted-foreground">Manage applications that can accept payments through your system.</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add App
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Error Loading Apps</CardTitle>
            <CardDescription>Failed to load payment apps. Please check your backend connection.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">
              Error: {(error as any)?.message || (error as any)?.data?.message || "Unknown error occurred"}
            </p>
            <Button onClick={refetch} className="mt-4">
              Retry
            </Button>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payment Apps</h2>
          <p className="text-muted-foreground">Manage applications that can accept payments through your system.</p>
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
              <div className="text-muted-foreground">Loading payment apps...</div>
            </div>
          ) : apps.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-muted-foreground mb-2">No payment apps found</p>
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

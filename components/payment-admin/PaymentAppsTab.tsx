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

export function PaymentAppsTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingApp, setEditingApp] = useState(null)

  const { data: apps = [], isLoading, refetch } = useGetPaymentAppsQuery({})
  const [deleteApp] = useDeletePaymentAppMutation()

  const handleEdit = (app) => {
    setEditingApp(app)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this payment app?")) {
      try {
        await deleteApp(id).unwrap()
        toast.success('Payment App Deleted Successfully')
        refetch()
      } catch (error) {
        toast.error('Could Not Delete Payment App')
      }
    }
  }

  const columns = [
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
          <DataTable columns={columns} data={apps} loading={isLoading} />
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

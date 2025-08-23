"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { PaymentProviderDialog } from "./PaymentProviderDialog"
import { useGetPaymentProvidersQuery, useDeletePaymentProviderMutation } from "@/redux/features/payment/paymentAPISlice"
import { useToast } from "@/hooks/use-toast"

export function PaymentProvidersTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState(null)
  const [showSecrets, setShowSecrets] = useState({})

  const { data: providers = [], isLoading, refetch } = useGetPaymentProvidersQuery()
  const [deleteProvider] = useDeletePaymentProviderMutation()
  const { toast } = useToast()

  const handleEdit = (provider) => {
    setEditingProvider(provider)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this payment provider?")) {
      try {
        await deleteProvider(id).unwrap()
        toast({
          title: "Success",
          description: "Payment provider deleted successfully",
        })
        refetch()
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete payment provider",
          variant: "destructive",
        })
      }
    }
  }

  const toggleSecretVisibility = (id) => {
    setShowSecrets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const columns = [
    {
      accessorKey: "name",
      header: "Provider Name",
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) => <Badge variant="secondary">{row.getValue("slug")}</Badge>,
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
      accessorKey: "webhook_secret",
      header: "Webhook Secret",
      cell: ({ row }) => {
        const id = row.original.id
        const secret = row.getValue("webhook_secret")
        const isVisible = showSecrets[id]

        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">{isVisible ? secret : "••••••••••••••••"}</span>
            <Button variant="ghost" size="sm" onClick={() => toggleSecretVisibility(id)}>
              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        )
      },
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
          <h2 className="text-2xl font-bold tracking-tight">Payment Providers</h2>
          <p className="text-muted-foreground">
            Configure and manage payment providers like Flutterwave, Stripe, PayPal, etc.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured Providers</CardTitle>
          <CardDescription>Manage your payment provider configurations and API credentials.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={providers} loading={isLoading} />
        </CardContent>
      </Card>

      <PaymentProviderDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingProvider(null)
          }
        }}
        provider={editingProvider}
        onSuccess={() => {
          refetch()
          setIsDialogOpen(false)
          setEditingProvider(null)
        }}
      />
    </div>
  )
}

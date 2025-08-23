"use client"

import { useState } from "react"
import { Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { SubscriptionPlanDialog } from "./SubscriptionPlanDialog"
import {
  useGetSubscriptionPlansQuery,
  useDeleteSubscriptionPlanMutation,
} from "@/redux/features/payment/paymentAPISlice"
import { toast } from "react-toastify"

export function SubscriptionPlansTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)

  const { data: plans = [], isLoading, refetch } = useGetSubscriptionPlansQuery({})
  const [deletePlan] = useDeleteSubscriptionPlanMutation()

  interface SubscriptionPlan {
    id: string
    name: string
    price: number
    billing_cycle: string
    is_active: boolean
    // Add other fields if needed
  }

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id:string) => {
    if (confirm("Are you sure you want to delete this subscription plan?")) {
      try {
        await deletePlan(id).unwrap()
        toast.success("Subscription plan deleted successfully")
        refetch()
      } catch (error) {
        toast.error("Failed to delete subscription plan")
        
      } 
    }
  }

  const columns = [
    {
      accessorKey: "name",
      header: "Plan Name",
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }: { row: any }) => `$${row.getValue("price")}`,
    },
    {
      accessorKey: "billing_cycle",
      header: "Billing Cycle",
      cell: ({ row }: { row: any }) => <Badge variant="outline">{row.getValue("billing_cycle")}</Badge>,
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }: { row: any }) => (
        <Badge variant={row.getValue("is_active") ? "default" : "secondary"}>
          {row.getValue("is_active") ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: any }) => (
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
          <h2 className="text-2xl font-bold tracking-tight">Subscription Plans</h2>
          <p className="text-muted-foreground">
            Create and manage subscription plans with different features and pricing.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Plan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>Subscription plans available across your applications.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={plans} loading={isLoading} />
        </CardContent>
      </Card>

      <SubscriptionPlanDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingPlan(null)
          }
        }}
        plan={editingPlan}
        onSuccess={() => {
          refetch()
          setIsDialogOpen(false)
          setEditingPlan(null)
        }}
      />
    </div>
  )
}

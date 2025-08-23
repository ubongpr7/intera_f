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
import type { ColumnDef } from "@tanstack/react-table"

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: string
  billing_cycle: string
  is_active: boolean
  app: string
  features: string[]
  created_at: string
  updated_at: string
  application_name?: string
}

export function SubscriptionPlansTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)

  const { data: plans = [], isLoading, error, refetch } = useGetSubscriptionPlansQuery({})
  const [deletePlan] = useDeleteSubscriptionPlanMutation()

  console.log("[v0] SubscriptionPlansTab - plans data:", plans)
  console.log("[v0] SubscriptionPlansTab - isLoading:", isLoading)
  console.log("[v0] SubscriptionPlansTab - error:", error)

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
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

  const columns: ColumnDef<SubscriptionPlan>[] = [
    {
      accessorKey: "name",
      header: "Plan Name",
    },
    {
      accessorKey: "application_name",
      header: "Application",
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => `$${row.getValue("price")}`,
    },
    {
      accessorKey: "billing_cycle",
      header: "Billing Cycle",
      cell: ({ row }) => <Badge variant="outline">{row.getValue("billing_cycle")}</Badge>,
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
            <CardTitle>Error Loading Plans</CardTitle>
            <CardDescription>Failed to load subscription plans. Please check your backend connection.</CardDescription>
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
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading subscription plans...</div>
            </div>
          ) : plans.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-muted-foreground mb-2">No subscription plans found</p>
                <Button onClick={() => setIsDialogOpen(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Plan
                </Button>
              </div>
            </div>
          ) : (
            <DataTable columns={columns} data={plans} loading={isLoading} />
          )}
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

"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SubscriptionPlanDialog } from "./SubscriptionPlanDialog"
import { FeatureManagementDialog } from "./FeatureManagementDialog"
import {
  useGetSubscriptionPlansQuery,
  useDeleteSubscriptionPlanMutation,
} from "@/redux/features/payment/paymentAPISlice"
import { toast } from "react-toastify"
import { extractErrorMessage } from "@/lib/utils"
import { confirmAction } from "@/components/common/confirmAction"
import { QueryStateBoundary } from "@/components/common/QueryStateBoundary"

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
  application: string
  application_name?: string
  intera_coins_reward?: string
}

export function SubscriptionPlansTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isFeatureDialogOpen, setIsFeatureDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [managingFeaturesPlan, setManagingFeaturesPlan] = useState<SubscriptionPlan | null>(null)

  const { data: plans = [], isLoading, error, refetch } = useGetSubscriptionPlansQuery({})
  const [deletePlan] = useDeleteSubscriptionPlanMutation()

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan)
    setIsDialogOpen(true)
  }

  const handleManageFeatures = (plan: SubscriptionPlan) => {
    setManagingFeaturesPlan(plan)
    setIsFeatureDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirmAction({
      title: "Delete subscription plan?",
      description: "This removes the plan from the subscription catalog. Existing references may be affected.",
      confirmText: "Delete plan",
      destructive: true,
    })
    if (!confirmed) return

    try {
      await deletePlan(id).unwrap()
      toast.success("Subscription plan deleted successfully")
      refetch()
    } catch (error) {
      toast.error(extractErrorMessage(error, ["detail"]) || "Failed to delete subscription plan")
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Subscription Plans</h2>
            <p className="text-gray-500">
              Create and manage subscription plans with different features and pricing.
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Plan
          </Button>
        </div>

        <QueryStateBoundary
          error={error}
          onRetry={refetch}
          errorTitle="Unable to load subscription plans"
          errorKeys={["detail", "message", "error"]}
        >
          <div />
        </QueryStateBoundary>

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
          <p className="text-gray-500">
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
              <div className="text-gray-500">Loading subscription plans...</div>
            </div>
          ) : plans.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="mb-2 text-gray-500">No subscription plans found</p>
                <Button onClick={() => setIsDialogOpen(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Plan
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan: SubscriptionPlan) => (
                <Card key={plan.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <CardDescription className="text-sm">{plan.application_name}</CardDescription>
                      </div>
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="mb-2 text-sm text-gray-500">{plan.description}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">${plan.price}</span>
                        <span className="text-sm text-gray-500">/{plan.billing_cycle}</span>
                      </div>
                      {plan.intera_coins_reward && (
                        <p className="mt-1 text-sm text-gray-500">{plan.intera_coins_reward} Intera Coins</p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Features</p>
                      <Badge variant="outline" className="text-xs">
                        {plan.features?.length || 0} features
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(plan)} className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleManageFeatures(plan)} className="flex-1">
                        <Settings className="h-4 w-4 mr-1" />
                        Features
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(plan.id)}
                        className="text-red-600 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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

      <FeatureManagementDialog
        open={isFeatureDialogOpen}
        onOpenChange={(open) => {
          setIsFeatureDialogOpen(open)
          if (!open) {
            setManagingFeaturesPlan(null)
          }
        }}
        plan={managingFeaturesPlan}
        onSuccess={() => {
          refetch()
        }}
      />
    </div>
  )
}

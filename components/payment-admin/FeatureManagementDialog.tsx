"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ReactSelectField } from "@/components/ui/react-select-field" // Import the custom component
import {
  useGetFeaturesQuery,
  useGetFeaturesByAppQuery,
  useGetPlanFeaturesQuery,
  useAddFeatureToPlanMutation,
  useRemoveFeatureFromPlanMutation,
} from "@/redux/features/payment/paymentAPISlice"
import { toast } from "react-toastify"

interface Feature {
  id: string
  name: string
  slug: string
  description: string
  feature_type: string
  app: string
  is_active: boolean
  application_name?: string
}

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
  application: string
  intera_coins_reward?: string
}

interface FeatureManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: SubscriptionPlan | null
  onSuccess?: () => void
}

interface SelectOption {
  value: string
  label: string
  feature: Feature
}

export function FeatureManagementDialog({ open, onOpenChange, plan, onSuccess }: FeatureManagementDialogProps) {
  const [selectedFeatures, setSelectedFeatures] = useState<SelectOption[]>([])

  // API hooks
  const { data: appFeatures = [] } = useGetFeaturesByAppQuery(plan?.application || "", {
    skip: !plan?.application,
  })
  const { data: planFeatures = [], refetch: refetchPlanFeatures } = useGetPlanFeaturesQuery(plan?.id || "", {
    skip: !plan?.id,
  })

  const [addFeature, { isLoading: isAdding }] = useAddFeatureToPlanMutation()
  const [removeFeature, { isLoading: isRemoving }] = useRemoveFeatureFromPlanMutation()

  // Convert features to select options
  const availableFeatureOptions: SelectOption[] = appFeatures
    .filter((feature: Feature) => !planFeatures.some((pf: Feature) => pf.id === feature.id))
    .map((feature: Feature) => ({
      value: feature.id,
      label: `${feature.name} (${feature.feature_type})`,
      feature,
    }))

  // Reset selected features when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedFeatures([])
    }
  }, [open])

  const handleAddFeatures = async () => {
    if (!plan || selectedFeatures.length === 0) return

    try {
      // Add features one by one
      for (const selectedFeature of selectedFeatures) {
        await addFeature({
          planId: plan.id,
          featureId: selectedFeature.value,
        }).unwrap()
      }

      toast.success(`Added ${selectedFeatures.length} feature(s) to ${plan.name}`)
      setSelectedFeatures([])
      refetchPlanFeatures()
      onSuccess?.()
    } catch (error) {
      toast.error("Failed to add features to plan")
      console.error("Error adding features:", error)
    }
  }

  const handleRemoveFeature = async (featureId: string, featureName: string) => {
    if (!plan) return

    try {
      await removeFeature({
        planId: plan.id,
        featureId,
      }).unwrap()

      toast.success(`Removed ${featureName} from ${plan.name}`)
      refetchPlanFeatures()
      onSuccess?.()
    } catch (error) {
      toast.error("Failed to remove feature from plan")
      console.error("Error removing feature:", error)
    }
  }

  const getFeatureTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case "CORE":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "PROFESSIONAL":
        return "bg-green-100 text-green-800 border-green-200"
      case "BUSINESS":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "ENTERPRISE":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "ADDON":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "PREMIUM":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (!plan) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Manage Features - {plan.name}
          </DialogTitle>
          <DialogDescription>
            Add or remove features from this subscription plan. Features determine what functionality subscribers will
            have access to.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Features Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Features</CardTitle>
              <CardDescription>Select features to add to this subscription plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <ReactSelectField
                  isMulti
                  value={selectedFeatures}
                  onChange={(selected) => setSelectedFeatures(selected as SelectOption[])}
                  options={availableFeatureOptions}
                  placeholder="Select features to add..."
                  label="Available Features"
                  isDisabled={availableFeatureOptions.length === 0}
                  noOptionsMessage={() => "No more features available for this app"}
                />
              </div>

              {selectedFeatures.length > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-muted-foreground">{selectedFeatures.length} feature(s) selected</span>
                  <Button onClick={handleAddFeatures} disabled={isAdding} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    {isAdding ? "Adding..." : "Add Features"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Current Features Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Features</CardTitle>
              <CardDescription>Features currently included in this subscription plan</CardDescription>
            </CardHeader>
            <CardContent>
              {planFeatures.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No features added to this plan yet</p>
                  <p className="text-sm">Add features using the section above</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {planFeatures.map((feature: Feature) => (
                    <div
                      key={feature.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{feature.name}</h4>
                            <Badge variant="outline" className={getFeatureTypeColor(feature.feature_type)}>
                              {feature.feature_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFeature(feature.id, feature.name)}
                        disabled={isRemoving}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
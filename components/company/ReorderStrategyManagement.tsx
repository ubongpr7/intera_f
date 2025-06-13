"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ReactSelectField, type SelectOption } from "@/components/ui/react-select-field"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Edit, Trash2, RotateCcw, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  useGetReorderStrategiesQuery,
  useCreateReorderStrategyMutation,
  useUpdateReorderStrategyMutation,
  useDeleteReorderStrategyMutation,
} from "@/redux/features/management/companyProfileApiSlice"
import type { ReorderStrategy } from "@/types/company-profile"

interface ReorderStrategyManagementProps {
  profileId: number
}

interface StrategyFormData {
  name: string
  description: string
  strategy_type: string
  parameters: Record<string, any>
  applies_to_categories: string
  applies_to_all: boolean
  is_active: boolean
  profile:number
}

const STRATEGY_TYPE_OPTIONS: SelectOption[] = [
  { value: "fixed", label: "Fixed Quantity" },
  { value: "economic_order_quantity", label: "Economic Order Quantity" },
  { value: "min_max", label: "Min-Max" },
  { value: "periodic", label: "Periodic Review" },
  { value: "just_in_time", label: "Just-in-Time" },
  { value: "custom", label: "Custom" },
]

export function ReorderStrategyManagement({profileId}:ReorderStrategyManagementProps) {
  const { data: strategies = [], isLoading, error: fetchError,refetch } = useGetReorderStrategiesQuery()
  const [createStrategy, { isLoading: isCreating, error: createError }] = useCreateReorderStrategyMutation()
  const [updateStrategy, { isLoading: isUpdating, error: updateError }] = useUpdateReorderStrategyMutation()
  const [deleteStrategy, { isLoading: isDeleting, error: deleteError }] = useDeleteReorderStrategyMutation()

  const [showForm, setShowForm] = useState(false)
  const [editingStrategy, setEditingStrategy] = useState<ReorderStrategy | null>(null)
  const [formData, setFormData] = useState<StrategyFormData>({
    name: "",
    description: "",
    strategy_type: "fixed",
    parameters: {},
    applies_to_categories: "",
    applies_to_all: false,
    is_active: true,
    profile:profileId
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Reset form when editing strategy changes
  useEffect(() => {
    if (editingStrategy) {
      setFormData({
        name: editingStrategy.name,
        description: editingStrategy.description || "",
        strategy_type: editingStrategy.strategy_type,
        parameters: editingStrategy.parameters,
        applies_to_categories: editingStrategy.applies_to_categories || "",
        applies_to_all: editingStrategy.applies_to_all,
        is_active: editingStrategy.is_active,
        profile:profileId
      })
    } else {
      setFormData({
        name: "",
        description: "",
        strategy_type: "fixed",
        parameters: {},
        applies_to_categories: "",
        applies_to_all: false,
        is_active: true,
        profile:profileId

      })
    }
  }, [editingStrategy])

  // Handle errors
  useEffect(() => {
    const error = fetchError || createError || updateError || deleteError
    if (error) {
      setErrorMessage(JSON.stringify(error))
      const timer = setTimeout(() => {
        setErrorMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [fetchError, createError, updateError, deleteError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingStrategy) {
        await updateStrategy({ id: editingStrategy.id, data: formData }).unwrap()
        setSuccessMessage("Strategy updated successfully")
      } else {
        await createStrategy(formData).unwrap()
        setSuccessMessage("Strategy created successfully")
      }
      setShowForm(false)
      setEditingStrategy(null)
      await refetch()

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (error) {
      console.error("Failed to save reorder strategy:", error)
    }
  }

  const handleEdit = (strategy: ReorderStrategy) => {
    setEditingStrategy(strategy)
    setShowForm(true)

  }

  const handleDelete = async (strategyId: string) => {
    if (confirm("Are you sure you want to delete this reorder strategy?")) {
      try {
        await deleteStrategy(strategyId).unwrap()
        setSuccessMessage("Strategy deleted successfully")
        await refetch()

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null)
        }, 3000)
      } catch (error) {
        console.error("Failed to delete strategy:", error)
      }
    }
  }

  const toggleActive = async (strategy: ReorderStrategy) => {
    try {
      await updateStrategy({
        id: strategy.id,
        data: { ...strategy, is_active: !strategy.is_active },
      }).unwrap()
      setSuccessMessage(`Strategy ${strategy.is_active ? "deactivated" : "activated"} successfully`)

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (error) {
      console.error("Failed to toggle strategy status:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <RotateCcw className="h-5 w-5" />
          Reorder Strategies
        </h3>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2 ">
          <Plus className="h-4 w-4" />
          Add Strategy
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingStrategy ? "Edit Reorder Strategy" : "Create New Reorder Strategy"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="strategy-name">Strategy Name</Label>
                  <Input
                    id="strategy-name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter strategy name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="strategy-type">Strategy Type</Label>
                  <ReactSelectField
                    options={STRATEGY_TYPE_OPTIONS}
                    value={STRATEGY_TYPE_OPTIONS.find((option) => option.value === formData.strategy_type) || null}
                    onChange={(option) => {
                      if (option && !Array.isArray(option)) {
                        setFormData((prev) => ({ ...prev, strategy_type: option.value }))
                      }
                    }}
                    placeholder="Select strategy type"
                    isSearchable
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="strategy-description">Description</Label>
                <Textarea
                  id="strategy-description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the reorder strategy"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="applies-to-all"
                    checked={formData.applies_to_all}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, applies_to_all: checked as boolean }))
                    }
                  />
                  <Label htmlFor="applies-to-all">Apply to all inventory items</Label>
                </div>
              </div>

              {!formData.applies_to_all && (
                <div className="space-y-2">
                  <Label htmlFor="categories">Categories (comma-separated)</Label>
                  <Input
                    id="categories"
                    value={formData.applies_to_categories}
                    onChange={(e) => setFormData((prev) => ({ ...prev, applies_to_categories: e.target.value }))}
                    placeholder="electronics, books, clothing"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {isCreating || isUpdating ? "Saving..." : editingStrategy ? "Update Strategy" : "Create Strategy"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingStrategy(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {strategies.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No reorder strategies found. Create your first strategy to get started.
            </CardContent>
          </Card>
        ) : (
          strategies.map((strategy) => (
            <Card key={strategy.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h4 className="font-medium">{strategy.name}</h4>
                    {strategy.description && <p className="text-sm text-muted-foreground">{strategy.description}</p>}
                    <div className="flex gap-2">
                      <Badge variant={strategy.is_active ? "default" : "secondary"}>
                        {strategy.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">
                        {STRATEGY_TYPE_OPTIONS.find((t) => t.value === strategy.strategy_type)?.label}
                      </Badge>
                      {strategy.applies_to_all ? (
                        <Badge variant="outline">All Items</Badge>
                      ) : (
                        <Badge variant="outline">Specific Categories</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggleActive(strategy)} disabled={isUpdating}>
                      {strategy.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(strategy)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(strategy.id)} disabled={isDeleting}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

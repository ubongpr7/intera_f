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
import { Plus, Edit, Trash2, FileText, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

import type { InventoryPolicy } from "@/types/company-profile"
import { useCreateInventoryPolicyMutation, useDeleteInventoryPolicyMutation, useGetInventoryPoliciesQuery, useUpdateInventoryPolicyMutation } from "redux/features/management/companyProfileApiSlice"

interface InventoryPolicyManagementProps {
  profileId: string
  userId: string
}

interface PolicyFormData {
  name: string
  description: string
  policy_type: string
  details: Record<string, any>
  applies_to_categories: string
  applies_to_all: boolean
  effective_date: string
  expiry_date: string
  is_active: boolean
}

const POLICY_TYPE_OPTIONS: SelectOption[] = [
  { value: "expiry", label: "Expiry Management" },
  { value: "quality", label: "Quality Control" },
  { value: "storage", label: "Storage Requirements" },
  { value: "counting", label: "Inventory Counting" },
  { value: "valuation", label: "Inventory Valuation" },
  { value: "other", label: "Other" },
]

export function InventoryPolicyManagement() {
  const { data: policies = [], isLoading, error: fetchError } = useGetInventoryPoliciesQuery()
  const [createPolicy, { isLoading: isCreating, error: createError }] = useCreateInventoryPolicyMutation()
  const [updatePolicy, { isLoading: isUpdating, error: updateError }] = useUpdateInventoryPolicyMutation()
  const [deletePolicy, { isLoading: isDeleting, error: deleteError }] = useDeleteInventoryPolicyMutation()

  const [showForm, setShowForm] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<InventoryPolicy | null>(null)
  const [formData, setFormData] = useState<PolicyFormData>({
    name: "",
    description: "",
    policy_type: "other",
    details: {},
    applies_to_categories: "",
    applies_to_all: false,
    effective_date: new Date().toISOString().split("T")[0],
    expiry_date: "",
    is_active: true,
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Reset form when editing policy changes
  useEffect(() => {
    if (editingPolicy) {
      setFormData({
        name: editingPolicy.name,
        description: editingPolicy.description,
        policy_type: editingPolicy.policy_type,
        details: editingPolicy.details,
        applies_to_categories: editingPolicy.applies_to_categories || "",
        applies_to_all: editingPolicy.applies_to_all,
        effective_date: editingPolicy.effective_date,
        expiry_date: editingPolicy.expiry_date || "",
        is_active: editingPolicy.is_active,
      })
    } else {
      setFormData({
        name: "",
        description: "",
        policy_type: "other",
        details: {},
        applies_to_categories: "",
        applies_to_all: false,
        effective_date: new Date().toISOString().split("T")[0],
        expiry_date: "",
        is_active: true,
      })
    }
  }, [editingPolicy])

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
      if (editingPolicy) {
        await updatePolicy({ id: editingPolicy.id, data: formData }).unwrap()
        setSuccessMessage("Policy updated successfully")
      } else {
        await createPolicy(formData).unwrap()
        setSuccessMessage("Policy created successfully")
      }
      setShowForm(false)
      setEditingPolicy(null)

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (error) {
      console.error("Failed to save inventory policy:", error)
    }
  }

  const handleEdit = (policy: InventoryPolicy) => {
    setEditingPolicy(policy)
    setShowForm(true)
  }

  const handleDelete = async (policyId: string) => {
    if (confirm("Are you sure you want to delete this inventory policy?")) {
      try {
        await deletePolicy(policyId).unwrap()
        setSuccessMessage("Policy deleted successfully")

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null)
        }, 3000)
      } catch (error) {
        console.error("Failed to delete policy:", error)
      }
    }
  }

  const toggleActive = async (policy: InventoryPolicy) => {
    try {
      await updatePolicy({
        id: policy.id,
        data: { ...policy, is_active: !policy.is_active },
      }).unwrap()
      setSuccessMessage(`Policy ${policy.is_active ? "deactivated" : "activated"} successfully`)

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (error) {
      console.error("Failed to toggle policy status:", error)
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
          <FileText className="h-5 w-5" />
          Inventory Policies
        </h3>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Policy
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingPolicy ? "Edit Inventory Policy" : "Create New Inventory Policy"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="policy-name">Policy Name</Label>
                  <Input
                    id="policy-name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter policy name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="policy-type">Policy Type</Label>
                  <ReactSelectField
                    options={POLICY_TYPE_OPTIONS}
                    value={POLICY_TYPE_OPTIONS.find((option) => option.value === formData.policy_type) || null}
                    onChange={(option) => {
                      if (option && !Array.isArray(option)) {
                        setFormData((prev) => ({ ...prev, policy_type: option.value }))
                      }
                    }}
                    placeholder="Select policy type"
                    isSearchable
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="policy-description">Description</Label>
                <Textarea
                  id="policy-description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the inventory policy"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="effective-date">Effective Date</Label>
                  <Input
                    id="effective-date"
                    type="date"
                    value={formData.effective_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, effective_date: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry-date">Expiry Date (Optional)</Label>
                  <Input
                    id="expiry-date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, expiry_date: e.target.value }))}
                  />
                </div>
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
                    placeholder="food, medicine, electronics"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {isCreating || isUpdating ? "Saving..." : editingPolicy ? "Update Policy" : "Create Policy"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingPolicy(null)
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
        {policies.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No inventory policies found. Create your first policy to get started.
            </CardContent>
          </Card>
        ) : (
          policies.map((policy) => (
            <Card key={policy.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h4 className="font-medium">{policy.name}</h4>
                    <p className="text-sm text-muted-foreground">{policy.description}</p>
                    <div className="flex gap-2">
                      <Badge variant={policy.is_active ? "default" : "secondary"}>
                        {policy.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">
                        {POLICY_TYPE_OPTIONS.find((t) => t.value === policy.policy_type)?.label}
                      </Badge>
                      {policy.applies_to_all ? (
                        <Badge variant="outline">All Items</Badge>
                      ) : (
                        <Badge variant="outline">Specific Categories</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Effective: {new Date(policy.effective_date).toLocaleDateString()}
                      {policy.expiry_date && ` - ${new Date(policy.expiry_date).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggleActive(policy)} disabled={isUpdating}>
                      {policy.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(policy)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(policy.id)} disabled={isDeleting}>
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

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, AlertTriangle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  useGetRecallPoliciesQuery,
  useCreateRecallPolicyMutation,
  useUpdateRecallPolicyMutation,
  useDeleteRecallPolicyMutation,
} from "@/redux/features/management/companyProfileApiSlice"
import type { RecallPolicy } from "@/types/company-profile"

interface RecallPolicyManagementProps {
  profileId: number
}

interface PolicyFormData {
  name: string
  description: string
  severity_levels: string[]
  notification_template: string
  contact_information: Record<string, any>
  is_active: boolean
  profile:number
}

export function RecallPolicyManagement({profileId}:RecallPolicyManagementProps) {
  const { data: policies = [], isLoading, error: fetchError,refetch } = useGetRecallPoliciesQuery()
  const [createPolicy, { isLoading: isCreating, error: createError }] = useCreateRecallPolicyMutation()
  const [updatePolicy, { isLoading: isUpdating, error: updateError }] = useUpdateRecallPolicyMutation()
  const [deletePolicy, { isLoading: isDeleting, error: deleteError }] = useDeleteRecallPolicyMutation()

  const [showForm, setShowForm] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<RecallPolicy | null>(null)
  const [formData, setFormData] = useState<PolicyFormData>({
    name: "",
    description: "",
    severity_levels: [],
    notification_template: "",
    contact_information: {},
    is_active: true,
    profile:profileId
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Reset form when editing policy changes
  useEffect(() => {
    if (editingPolicy) {
      setFormData({
        name: editingPolicy.name,
        description: editingPolicy.description || "",
        severity_levels: editingPolicy.severity_levels,
        notification_template: editingPolicy.notification_template || "",
        contact_information: editingPolicy.contact_information,
        is_active: editingPolicy.is_active,
        profile:profileId
      })
    } else {
      setFormData({
        name: "",
        description: "",
        severity_levels: [],
        notification_template: "",
        contact_information: {},
        is_active: true,
        profile:profileId

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
      console.error("Failed to save recall policy:", error)
    }
  }

  const handleEdit = (policy: RecallPolicy) => {
    setEditingPolicy(policy)
    setShowForm(true)
  }

  const handleDelete = async (policyId: string) => {
    if (confirm("Are you sure you want to delete this recall policy?")) {
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

  const toggleActive = async (policy: RecallPolicy) => {
    try {
      await updatePolicy({
        id: policy.id,
        data: { ...policy, is_active: !policy.is_active },
      }).unwrap()
      setSuccessMessage(`Policy ${policy.is_active ? "deactivated" : "activated"} successfully`)
      await refetch()
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
          <AlertTriangle className="h-5 w-5" />
          Recall Policies
        </h3>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Policy
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingPolicy ? "Edit Recall Policy" : "Create New Recall Policy"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="policy-description">Description</Label>
                <Textarea
                  id="policy-description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the recall policy"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-template">Notification Template</Label>
                <Textarea
                  id="notification-template"
                  value={formData.notification_template}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notification_template: e.target.value }))}
                  placeholder="Enter notification template for recalls"
                  rows={4}
                />
              </div>

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
            <CardContent className="p-6 text-center ">
              No recall policies found. Create your first policy to get started.
            </CardContent>
          </Card>
        ) : (
          policies.map((policy) => (
            <Card key={policy.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h4 className="font-medium">{policy.name}</h4>
                    {policy.description && <p className="text-sm ">{policy.description}</p>}
                    <div className="flex gap-2">
                      <Badge variant={policy.is_active ? "default" : "secondary"}>
                        {policy.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">{policy.severity_levels.length} severity levels</Badge>
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

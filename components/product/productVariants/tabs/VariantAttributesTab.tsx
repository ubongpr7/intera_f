"use client"

import type React from "react"
import { useState, useMemo } from "react"
import {
  useGetProductAttributeLinksQuery,
  useGetProductAttributeValuesQuery,
  useAddVariantAttributeMutation,
  useRemoveVariantAttributeMutation,
  useEditVariantAttributeMutation,
} from "@/redux/features/product/productAPISlice"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, Edit, Save, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ReactSelectField, type SelectOption } from "@/components/ui/react-select-field"
import LoadingAnimation from "@/components/common/LoadingAnimation"
import type {
  ProductVariant,
  ProductAttributeLink,
  ProductAttributeValue,
  ProductVariantAttribute,
} from "@/components/interfaces/product"
import { getCurrencySymbolForProfile } from "@/lib/currency-utils"

interface VariantAttributesTabProps {
  variant: ProductVariant
  onSuccess: () => void
  refetchData: boolean
}

interface EditingAttribute {
  attributeLinkId: string
  attributeId: string
  currentValueId: string
  currentCustomValue: string
  currentCustomModifier: string
}

const VariantAttributesTab = ({ variant, onSuccess, refetchData }: VariantAttributesTabProps) => {
  const [attributeFormData, setAttributeFormData] = useState({
    attribute_link_id: "",
    attribute_id: "",
    value_id: "",
    custom_value: "",
    custom_modifier: "",
  })

  const [editingAttribute, setEditingAttribute] = useState<EditingAttribute | null>(null)
  const [editFormData, setEditFormData] = useState({
    value_id: "",
    custom_value: "",
    custom_modifier: "",
  })

  console.log("Variant attribute details:", variant?.attribute_details)
  console.log("Editing attribute:", editingAttribute)

  // Get all attribute links for the product
  const {
    data: allAttributeLinks = [],
    isLoading: isAttributeLinksLoading,
    error: attributeLinksError,
  } = useGetProductAttributeLinksQuery(
    { productId: variant.product, variant: variant.id },
    { skip: !variant.product || !variant.id || variant.product === undefined },
  )

  // For adding new attributes
  const {
    data: attributeValues,
    isLoading: isAttributeValuesLoading,
    error: attributeValuesError,
    refetch: refetchLinks,
  } = useGetProductAttributeValuesQuery(
    { attributeId: attributeFormData.attribute_id || "" },
    { skip: !attributeFormData.attribute_id },
  )

  // For editing - get attribute values for the attribute being edited
  const {
    data: editAttributeValues,
    isLoading: isEditAttributeValuesLoading,
    error: editAttributeValuesError,
  } = useGetProductAttributeValuesQuery(
    { attributeId: editingAttribute?.attributeId || "" },
    { skip: !editingAttribute?.attributeId },
  )

  const [addAttribute, { isLoading: addAttributeLoading }] = useAddVariantAttributeMutation()
  const [removeAttribute] = useRemoveVariantAttributeMutation()
  const [editAttribute, { isLoading: editAttributeLoading }] = useEditVariantAttributeMutation()

  // Filter out attribute links that are already assigned to this variant
  const availableAttributeLinks = useMemo(() => {
    if (!allAttributeLinks || !variant.attribute_details) return allAttributeLinks
    const assignedAttributeLinkIds = variant.attribute_details.map(
      (attr: ProductVariantAttribute) => attr.attribute_link,
    )
    return allAttributeLinks.filter((link: ProductAttributeLink) => !assignedAttributeLinkIds.includes(link.id))
  }, [allAttributeLinks, variant.attribute_details])

  // Create a mapping of attribute link ID to attribute ID for easy lookup
  const attributeLinkToAttributeMap = useMemo(() => {
    const map: Record<string, string> = {}
    allAttributeLinks.forEach((link: ProductAttributeLink) => {
      map[link.id] = link.attribute
    })
    return map
  }, [allAttributeLinks])

  const attributeLinkOptions: SelectOption[] = availableAttributeLinks.map((link: ProductAttributeLink) => ({
    value: link.id,
    label: link.attribute_name || link.attribute_details?.name || "Unnamed Attribute",
  }))

  const attributeValueOptions: SelectOption[] =
    attributeValues?.map((value: ProductAttributeValue) => ({
      value: value.id,
      label: value.effective_display_value || value.display_value || "No Value",
    })) || []

  const editAttributeValueOptions: SelectOption[] =
    editAttributeValues?.map((value: ProductAttributeValue) => ({
      value: value.id,
      label: value.effective_display_value || value.display_value || "No Value",
    })) || []

  const handleAddAttribute = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        attribute_link_id: attributeFormData.attribute_link_id,
        value_id: attributeFormData.value_id || undefined,
        custom_value: attributeFormData.custom_value || undefined,
        custom_modifier: Number.parseFloat(attributeFormData.custom_modifier) || undefined,
      }
      await addAttribute({ variantId: variant.id, data }).unwrap()
      refetchLinks()
      // Reset form data
      setAttributeFormData({
        attribute_link_id: "",
        attribute_id: "",
        value_id: "",
        custom_value: "",
        custom_modifier: "",
      })
      onSuccess()
    } catch (error) {
      console.error("Failed to add attribute:", error)
    }
  }

  const handleRemoveAttribute = async (attributeLinkId: string) => {
    try {
      await removeAttribute({ variantId: variant.id, attributeLinkId }).unwrap()
      onSuccess()
      refetchLinks()
    } catch (error) {
      console.error("Failed to remove attribute:", error)
    }
  }

  const handleStartEdit = (attr: ProductVariantAttribute) => {
    console.log("Starting edit for attribute:", attr)

    // Find the attribute ID from the attribute link
    const attributeLink = allAttributeLinks.find((link) => link.id === attr.attribute_link)
    const attributeId = attributeLink?.attribute || ""

    console.log("Found attribute link:", attributeLink)
    console.log("Attribute ID:", attributeId)

    const editingData = {
      attributeLinkId: attr.attribute_link,
      attributeId: attributeId,
      currentValueId: attr.value || "",
      currentCustomValue: attr.custom_value || "",
      currentCustomModifier: attr.custom_modifier?.toString() || "",
    }

    console.log("Setting editing attribute:", editingData)

    setEditingAttribute(editingData)
    setEditFormData({
      value_id: attr.value || "",
      custom_value: attr.custom_value || "",
      custom_modifier: attr.custom_modifier?.toString() || "",
    })
  }

  const handleCancelEdit = () => {
    setEditingAttribute(null)
    setEditFormData({
      value_id: "",
      custom_value: "",
      custom_modifier: "",
    })
  }

  const handleSaveEdit = async (attributeLinkId: string) => {
    try {
      const data = {
        value_id: editFormData.value_id || undefined,
        custom_value: editFormData.custom_value || undefined,
        custom_modifier: Number.parseFloat(editFormData.custom_modifier) || undefined,
      }

      await editAttribute({
        variantId: variant.id,
        attributeLinkId,
        data,
      }).unwrap()

      setEditingAttribute(null)
      setEditFormData({
        value_id: "",
        custom_value: "",
        custom_modifier: "",
      })
      onSuccess()
      refetchLinks()
    } catch (error) {
      console.error("Failed to edit attribute:", error)
    }
  }

  if (isAttributeLinksLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <LoadingAnimation />
      </div>
    )
  }

  if (attributeLinksError) {
    return (
      <div className="p-4 text-red-500">
        Error loading attributes: {(attributeLinksError as any).message || "Unknown error"}
      </div>
    )
  }

  return (
    <div className="p-4 max-h-[70vh] overflow-y-auto space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Add Attribute</h3>
        {availableAttributeLinks.length === 0 ? (
          <Alert className="border-blue-500 bg-blue-50">
            <AlertDescription className="text-blue-700">
              All available attributes have been assigned to this variant.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleAddAttribute} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attribute</label>
              <ReactSelectField
                options={attributeLinkOptions}
                value={
                  attributeLinkOptions.find((option) => option.value === attributeFormData.attribute_link_id) || null
                }
                onChange={(option) => {
                  if (option && !Array.isArray(option)) {
                    const attributeId = attributeLinkToAttributeMap[option.value] || ""
                    setAttributeFormData((prev) => ({
                      ...prev,
                      attribute_link_id: option.value,
                      attribute_id: attributeId,
                      value_id: "", // Reset dependent field
                    }))
                  } else {
                    setAttributeFormData((prev) => ({
                      ...prev,
                      attribute_link_id: "",
                      attribute_id: "",
                      value_id: "",
                    }))
                  }
                }}
                placeholder="Select Attribute"
                isSearchable
                isClearable
                className="w-full"
              />
            </div>
            {attributeFormData.attribute_link_id && (
              <>
                {isAttributeValuesLoading ? (
                  <LoadingAnimation />
                ) : attributeValuesError ? (
                  <Alert className="border-red-500 bg-red-50">
                    <AlertDescription className="text-red-700">
                      Error loading attribute values: {(attributeValuesError as any).message || "Unknown error"}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Value (Optional)</label>
                      <ReactSelectField
                        options={attributeValueOptions}
                        value={
                          attributeValueOptions.find((option) => option.value === attributeFormData.value_id) || null
                        }
                        onChange={(option) => {
                          if (option && !Array.isArray(option)) {
                            setAttributeFormData((prev) => ({
                              ...prev,
                              value_id: option.value,
                            }))
                          } else {
                            setAttributeFormData((prev) => ({
                              ...prev,
                              value_id: "",
                            }))
                          }
                        }}
                        placeholder="Select Value (Optional)"
                        isSearchable
                        isClearable
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Value (Optional)</label>
                      <input
                        type="text"
                        value={attributeFormData.custom_value}
                        onChange={(e) =>
                          setAttributeFormData((prev) => ({
                            ...prev,
                            custom_value: e.target.value,
                          }))
                        }
                        placeholder="Enter custom value"
                        className="w-full bg-gray-50 px-3 border-2 border-gray-300 focus:outline-none focus:border-blue-500 py-2 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Price Modifier (Optional)
                      </label>
                      <input
                        type="number"
                        value={attributeFormData.custom_modifier}
                        onChange={(e) =>
                          setAttributeFormData((prev) => ({
                            ...prev,
                            custom_modifier: e.target.value,
                          }))
                        }
                        placeholder="0.00"
                        step="0.01"
                        className="w-full bg-gray-50 px-3 border-2 border-gray-300 focus:outline-none focus:border-blue-500 py-2 rounded-md"
                      />
                    </div>
                  </>
                )}
              </>
            )}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAttributeFormData({
                    attribute_link_id: "",
                    attribute_id: "",
                    value_id: "",
                    custom_value: "",
                    custom_modifier: "",
                  })
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addAttributeLoading || !attributeFormData.attribute_link_id}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                {addAttributeLoading ? "Adding..." : "Add Attribute"}
              </Button>
            </div>
          </form>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Current Attributes</h3>
        {variant?.attribute_details && variant.attribute_details.length > 0 ? (
          <div className="space-y-2">
            {variant.attribute_details.map((attr: ProductVariantAttribute) => {
              const isEditing = editingAttribute && editingAttribute.attributeLinkId === attr.attribute_link

              console.log(`Attribute ${attr.attribute_name} - isEditing:`, isEditing)
              console.log(`Current editing:`, editingAttribute)
              console.log(`Attr link:`, attr.attribute_link)

              return (
                <Card key={attr.id}>
                  <CardContent className="p-4">
                    {isEditing ? (
                      // Edit mode
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-gray-900">Editing: {attr.attribute_name}</p>
                        </div>

                        {isEditAttributeValuesLoading ? (
                          <div className="flex justify-center py-4">
                            <LoadingAnimation />
                          </div>
                        ) : editAttributeValuesError ? (
                          <Alert className="border-red-500 bg-red-50">
                            <AlertDescription className="text-red-700">
                              Error loading attribute values:{" "}
                              {(editAttributeValuesError as any).message || "Unknown error"}
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Predefined Value (Optional)
                              </label>
                              <ReactSelectField
                                options={editAttributeValueOptions}
                                value={
                                  editAttributeValueOptions.find((option) => option.value === editFormData.value_id) ||
                                  null
                                }
                                onChange={(option) => {
                                  if (option && !Array.isArray(option)) {
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      value_id: option.value,
                                      custom_value: "", // Clear custom value when selecting predefined
                                    }))
                                  } else {
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      value_id: "",
                                    }))
                                  }
                                }}
                                placeholder="Select predefined value (optional)"
                                isSearchable
                                isClearable
                                className="w-full"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Custom Value (Optional)
                              </label>
                              <input
                                type="text"
                                value={editFormData.custom_value}
                                onChange={(e) =>
                                  setEditFormData((prev) => ({
                                    ...prev,
                                    custom_value: e.target.value,
                                    value_id: e.target.value ? "" : prev.value_id, // Clear predefined value when typing custom
                                  }))
                                }
                                placeholder="Enter custom value"
                                className="w-full bg-gray-50 px-3 border-2 border-gray-300 focus:outline-none focus:border-blue-500 py-2 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Price Modifier ({getCurrencySymbolForProfile()})
                              </label>
                              <input
                                type="number"
                                value={editFormData.custom_modifier}
                                onChange={(e) =>
                                  setEditFormData((prev) => ({
                                    ...prev,
                                    custom_modifier: e.target.value,
                                  }))
                                }
                                placeholder="0.00"
                                step="0.01"
                                className="w-full bg-gray-50 px-3 border-2 border-gray-300 focus:outline-none focus:border-blue-500 py-2 rounded-md"
                              />
                            </div>
                            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4 border-t">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancelEdit}
                                className="w-full sm:w-auto bg-transparent"
                                disabled={editAttributeLoading}
                              >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                onClick={() => handleSaveEdit(attr.attribute_link)}
                                disabled={editAttributeLoading}
                                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                              >
                                {editAttributeLoading ? (
                                  <>
                                    <LoadingAnimation />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                  </>
                                )}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      // Display mode
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">
                            {attr.attribute_name}: {attr?.display_value}
                          </p>
                          <p className="text-sm text-gray-500">
                            Modifier: {getCurrencySymbolForProfile()}
                            {attr.custom_modifier || "0.00"}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEdit(attr)}
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAttribute(attr.attribute_link)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-gray-500">No attributes assigned</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default VariantAttributesTab

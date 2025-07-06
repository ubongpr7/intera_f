"use client"

import type React from "react"

import { useState } from "react"
import {
  useGetProductAttributesQuery,
  useCreateProductAttributeMutation,
  useUpdateProductAttributeMutation,
  useDeleteProductAttributeMutation,
  useAddAttributeValueMutation,
  useCreateAttributeValueMutation,
  useUpdateAttributeValueMutation,
  useDeleteAttributeValueMutation,
  useToggleAttributeValueActiveMutation,
} from "@/redux/features/product/productAPISlice"
import LoadingAnimation from "../common/LoadingAnimation"
import Modal from "../common/Modal"

interface ProductAttributesProps {
  productId: string
}

export default function ProductAttributes({ productId }: ProductAttributesProps) {
  const [showCreateAttrModal, setShowCreateAttrModal] = useState(false)
  const [showCreateValueModal, setShowCreateValueModal] = useState(false)
  const [editingAttribute, setEditingAttribute] = useState<any>(null)
  const [editingValue, setEditingValue] = useState<any>(null)
  const [selectedAttribute, setSelectedAttribute] = useState<any>(null)

  const { data: attributes = [], isLoading, refetch } = useGetProductAttributesQuery({})
  const [createAttribute, { isLoading: isCreatingAttr }] = useCreateProductAttributeMutation()
  const [updateAttribute, { isLoading: isUpdatingAttr }] = useUpdateProductAttributeMutation()
  const [deleteAttribute] = useDeleteProductAttributeMutation()
  const [addAttributeValue] = useAddAttributeValueMutation()
  const [createAttributeValue] = useCreateAttributeValueMutation()
  const [updateAttributeValue] = useUpdateAttributeValueMutation()
  const [deleteAttributeValue] = useDeleteAttributeValueMutation()
  const [toggleValueActive] = useToggleAttributeValueActiveMutation()

  const handleCreateAttribute = async (data: any) => {
    try {
      await createAttribute(data).unwrap()
      setShowCreateAttrModal(false)
      refetch()
    } catch (error) {
      console.error("Error creating attribute:", error)
    }
  }

  const handleUpdateAttribute = async (data: any) => {
    try {
      await updateAttribute({ id: editingAttribute.id, data }).unwrap()
      setEditingAttribute(null)
      refetch()
    } catch (error) {
      console.error("Error updating attribute:", error)
    }
  }

  const handleDeleteAttribute = async (attributeId: string) => {
    if (confirm("Are you sure you want to delete this attribute? This will affect all products using it.")) {
      try {
        await deleteAttribute(attributeId).unwrap()
        refetch()
      } catch (error) {
        console.error("Error deleting attribute:", error)
      }
    }
  }

  const handleCreateValue = async (data: any) => {
    try {
      if (selectedAttribute) {
        await addAttributeValue({ attributeId: selectedAttribute.id, valueData: data }).unwrap()
      } else {
        await createAttributeValue(data).unwrap()
      }
      setShowCreateValueModal(false)
      setSelectedAttribute(null)
      refetch()
    } catch (error) {
      console.error("Error creating value:", error)
    }
  }

  const handleUpdateValue = async (data: any) => {
    try {
      await updateAttributeValue({ id: editingValue.id, data }).unwrap()
      setEditingValue(null)
      refetch()
    } catch (error) {
      console.error("Error updating value:", error)
    }
  }

  const handleDeleteValue = async (valueId: string) => {
    if (confirm("Are you sure you want to delete this attribute value?")) {
      try {
        await deleteAttributeValue(valueId).unwrap()
        refetch()
      } catch (error) {
        console.error("Error deleting value:", error)
      }
    }
  }

  const handleToggleValueActive = async (valueId: string) => {
    try {
      await toggleValueActive(valueId).unwrap()
      refetch()
    } catch (error) {
      console.error("Error toggling value status:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center flex items-center justify-center py-8 text-gray-500">
        <LoadingAnimation text="Loading attributes..." ringColor="#3b82f6" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Product Attributes</h2>
        <button
          onClick={() => setShowCreateAttrModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Add Attribute
        </button>
      </div>

      {/* Attributes List */}
      <div className="space-y-4">
        {attributes.map((attribute: any) => (
          <div key={attribute.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            {/* Attribute Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{attribute.name}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Type: {attribute.attribute_type}</span>
                  {attribute.unit && <span>Unit: {attribute.unit}</span>}
                  {attribute.is_required && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Required</span>
                  )}
                  {attribute.is_variant_attribute && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Variant Attribute</span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedAttribute(attribute)
                    setShowCreateValueModal(true)
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Add Value
                </button>
                <button
                  onClick={() => setEditingAttribute(attribute)}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteAttribute(attribute.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Attribute Values */}
            {attribute.values && attribute.values.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Values ({attribute.values_count})</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {attribute.values.map((value: any) => (
                    <div
                      key={value.id}
                      className={`flex items-center justify-between p-2 border rounded ${
                        value.is_active ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {value.color_code && (
                          <div
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: value.color_code }}
                          />
                        )}
                        <span className={`text-sm ${value.is_active ? "text-gray-900" : "text-gray-500"}`}>
                          {value.effective_display_value}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleToggleValueActive(value.id)}
                          className={`px-2 py-1 rounded text-xs ${
                            value.is_active
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {value.is_active ? "Active" : "Inactive"}
                        </button>
                        <button
                          onClick={() => setEditingValue(value)}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteValue(value.id)}
                          className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!attribute.values || attribute.values.length === 0) && (
              <div className="text-center py-4 text-gray-500">
                <p>No values defined for this attribute.</p>
                <button
                  onClick={() => {
                    setSelectedAttribute(attribute)
                    setShowCreateValueModal(true)
                  }}
                  className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Add First Value
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {attributes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No attributes found.</p>
          <button
            onClick={() => setShowCreateAttrModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Create First Attribute
          </button>
        </div>
      )}

      {/* Create Attribute Modal */}
      <Modal isOpen={showCreateAttrModal} onClose={() => setShowCreateAttrModal(false)} title="Create New Attribute">
        <AttributeForm
          onSubmit={handleCreateAttribute}
          onCancel={() => setShowCreateAttrModal(false)}
          isLoading={isCreatingAttr}
        />
      </Modal>

      {/* Edit Attribute Modal */}
      <Modal isOpen={!!editingAttribute} onClose={() => setEditingAttribute(null)} title="Edit Attribute">
        {editingAttribute && (
          <AttributeForm
            attribute={editingAttribute}
            onSubmit={handleUpdateAttribute}
            onCancel={() => setEditingAttribute(null)}
            isLoading={isUpdatingAttr}
          />
        )}
      </Modal>

      {/* Create/Edit Value Modal */}
      <Modal
        isOpen={showCreateValueModal || !!editingValue}
        onClose={() => {
          setShowCreateValueModal(false)
          setEditingValue(null)
          setSelectedAttribute(null)
        }}
        title={editingValue ? "Edit Attribute Value" : "Create Attribute Value"}
      >
        <AttributeValueForm
          attribute={selectedAttribute}
          value={editingValue}
          onSubmit={editingValue ? handleUpdateValue : handleCreateValue}
          onCancel={() => {
            setShowCreateValueModal(false)
            setEditingValue(null)
            setSelectedAttribute(null)
          }}
          attributes={attributes}
        />
      </Modal>
    </div>
  )
}

// Attribute Form Component
function AttributeForm({
  attribute,
  onSubmit,
  onCancel,
  isLoading,
}: {
  attribute?: any
  onSubmit: (data: any) => void
  onCancel: () => void
  isLoading?: boolean
}) {
  const [formData, setFormData] = useState({
    name: attribute?.name || "",
    attribute_type: attribute?.attribute_type || "TEXT",
    is_required: attribute?.is_required || false,
    is_variant_attribute: attribute?.is_variant_attribute || true,
    display_order: attribute?.display_order || 0,
    unit: attribute?.unit || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Attribute Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Attribute Type</label>
        <select
          value={formData.attribute_type}
          onChange={(e) => setFormData({ ...formData, attribute_type: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="TEXT">Text</option>
          <option value="NUMBER">Number</option>
          <option value="BOOLEAN">Boolean</option>
          <option value="DATE">Date</option>
          <option value="COLOR">Color</option>
          <option value="SIZE">Size</option>
          <option value="WEIGHT">Weight</option>
          <option value="DIMENSION">Dimension</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Unit (optional)</label>
        <input
          type="text"
          value={formData.unit}
          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., cm, kg, inches"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
        <input
          type="number"
          value={formData.display_order}
          onChange={(e) => setFormData({ ...formData, display_order: Number.parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_required"
            checked={formData.is_required}
            onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_required" className="ml-2 block text-sm text-gray-900">
            Required for all products
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_variant_attribute"
            checked={formData.is_variant_attribute}
            onChange={(e) => setFormData({ ...formData, is_variant_attribute: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_variant_attribute" className="ml-2 block text-sm text-gray-900">
            Used to create product variants
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {isLoading && <LoadingAnimation text="" ringColor="#ffffff" size="sm" />}
          {attribute ? "Update Attribute" : "Create Attribute"}
        </button>
      </div>
    </form>
  )
}

// Attribute Value Form Component
function AttributeValueForm({
  attribute,
  value,
  onSubmit,
  onCancel,
  attributes,
}: {
  attribute?: any
  value?: any
  onSubmit: (data: any) => void
  onCancel: () => void
  attributes: any[]
}) {
  const [formData, setFormData] = useState({
    attribute: attribute?.id || value?.attribute || "",
    value: value?.value || "",
    display_value: value?.display_value || "",
    color_code: value?.color_code || "",
    is_active: value?.is_active ?? true,
    sort_order: value?.sort_order || 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!attribute && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Attribute *</label>
          <select
            value={formData.attribute}
            onChange={(e) => setFormData({ ...formData, attribute: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select Attribute</option>
            {attributes.map((attr: any) => (
              <option key={attr.id} value={attr.id}>
                {attr.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
        <input
          type="text"
          value={formData.value}
          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Display Value (optional)</label>
        <input
          type="text"
          value={formData.display_value}
          onChange={(e) => setFormData({ ...formData, display_value: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Custom display name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Color Code (for color attributes)</label>
        <div className="flex space-x-2">
          <input
            type="color"
            value={formData.color_code}
            onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
            className="w-12 h-10 border border-gray-300 rounded"
          />
          <input
            type="text"
            value={formData.color_code}
            onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="#000000"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
        <input
          type="number"
          value={formData.sort_order}
          onChange={(e) => setFormData({ ...formData, sort_order: Number.parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
          Active
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          {value ? "Update Value" : "Create Value"}
        </button>
      </div>
    </form>
  )
}

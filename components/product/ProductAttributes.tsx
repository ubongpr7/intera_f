"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { ListChecks, Pencil, Plus, Search, Settings2, Tag, Trash2 } from "lucide-react"
import LoadingAnimation from "../common/LoadingAnimation"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  useAddAttributeValueMutation,
  useCreateAttributeValueMutation,
  useCreateProductAttributeMutation,
  useDeleteAttributeValueMutation,
  useDeleteProductAttributeMutation,
  useLazyGetProductAttributesQuery,
  useToggleAttributeValueActiveMutation,
  useUpdateAttributeValueMutation,
  useUpdateProductAttributeMutation,
} from "@/redux/features/product/productAPISlice"
import type { ProductAttribute, ProductAttributeValue } from "@/redux/features/product/productTypes"

interface ProductAttributesProps {
  productId: string
  mode?: "embedded" | "standalone"
}

type DrawerMode = "library" | "attribute" | "value" | "values" | null

const inputClassName =
  "w-full rounded-2xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"

export default function ProductAttributes({ mode = "embedded" }: ProductAttributesProps) {
  const isStandalone = mode === "standalone"
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null)
  const [editingAttribute, setEditingAttribute] = useState<ProductAttribute | null>(null)
  const [editingValue, setEditingValue] = useState<ProductAttributeValue | null>(null)
  const [selectedAttribute, setSelectedAttribute] = useState<ProductAttribute | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [loadAttributes, { data: attributes = [], isFetching, isUninitialized }] = useLazyGetProductAttributesQuery()
  const [createAttribute, { isLoading: isCreatingAttr }] = useCreateProductAttributeMutation()
  const [updateAttribute, { isLoading: isUpdatingAttr }] = useUpdateProductAttributeMutation()
  const [deleteAttribute] = useDeleteProductAttributeMutation()
  const [addAttributeValue] = useAddAttributeValueMutation()
  const [createAttributeValue] = useCreateAttributeValueMutation()
  const [updateAttributeValue] = useUpdateAttributeValueMutation()
  const [deleteAttributeValue] = useDeleteAttributeValueMutation()
  const [toggleValueActive] = useToggleAttributeValueActiveMutation()

  useEffect(() => {
    if (isStandalone) {
      loadAttributes({})
    }
  }, [isStandalone, loadAttributes])

  const ensureAttributesLoaded = () => {
    if (isUninitialized) {
      loadAttributes({})
    }
  }

  const openLibrary = () => {
    ensureAttributesLoaded()
    setDrawerMode("library")
  }

  const refreshAttributes = () => {
    loadAttributes({})
  }

  const filteredAttributes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return attributes

    return attributes.filter((attribute) => {
      const searchable = [
        attribute.name,
        attribute.attribute_type,
        attribute.unit,
        attribute.category_tags,
        attribute.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return searchable.includes(query)
    })
  }, [attributes, searchTerm])

  const variantAttributeCount = attributes.filter((attribute) => attribute.is_variant_attribute).length
  const requiredAttributeCount = attributes.filter((attribute) => attribute.is_required).length
  const valueCount = attributes.reduce((total, attribute) => total + (attribute.values_count ?? attribute.values?.length ?? 0), 0)

  const resetDrawer = () => {
    setDrawerMode(null)
    setEditingAttribute(null)
    setEditingValue(null)
    setSelectedAttribute(null)
  }

  const returnToLibrary = () => {
    setDrawerMode(isStandalone ? null : "library")
    setEditingAttribute(null)
    setEditingValue(null)
    setSelectedAttribute(null)
  }

  const openCreateAttribute = () => {
    ensureAttributesLoaded()
    setEditingAttribute(null)
    setSelectedAttribute(null)
    setDrawerMode("attribute")
  }

  const openEditAttribute = (attribute: ProductAttribute) => {
    setEditingAttribute(attribute)
    setSelectedAttribute(attribute)
    setDrawerMode("attribute")
  }

  const openValues = (attribute: ProductAttribute) => {
    setSelectedAttribute(attribute)
    setEditingValue(null)
    setDrawerMode("values")
  }

  const openCreateValue = (attribute: ProductAttribute) => {
    setSelectedAttribute(attribute)
    setEditingValue(null)
    setDrawerMode("value")
  }

  const openEditValue = (attribute: ProductAttribute, value: ProductAttributeValue) => {
    setSelectedAttribute(attribute)
    setEditingValue(value)
    setDrawerMode("value")
  }

  const handleCreateAttribute = async (data: Partial<ProductAttribute>) => {
    await createAttribute(data).unwrap()
    refreshAttributes()
    returnToLibrary()
  }

  const handleUpdateAttribute = async (data: Partial<ProductAttribute>) => {
    if (!editingAttribute) return
    await updateAttribute({ id: editingAttribute.id, data }).unwrap()
    refreshAttributes()
    returnToLibrary()
  }

  const handleDeleteAttribute = async (attributeId: string) => {
    if (!confirm("Delete this shared attribute? Products using it may be affected.")) return
    await deleteAttribute(attributeId).unwrap()
    refreshAttributes()
  }

  const handleCreateValue = async (data: Partial<ProductAttributeValue>) => {
    if (selectedAttribute) {
      await addAttributeValue({ attributeId: selectedAttribute.id, valueData: data }).unwrap()
    } else {
      await createAttributeValue(data).unwrap()
    }
    refreshAttributes()
    returnToLibrary()
  }

  const handleUpdateValue = async (data: Partial<ProductAttributeValue>) => {
    if (!editingValue) return
    await updateAttributeValue({ id: editingValue.id, data }).unwrap()
    refreshAttributes()
    returnToLibrary()
  }

  const handleDeleteValue = async (valueId: string) => {
    if (!confirm("Delete this attribute value?")) return
    await deleteAttributeValue(valueId).unwrap()
    refreshAttributes()
  }

  const handleToggleValueActive = async (valueId: string) => {
    await toggleValueActive(valueId).unwrap()
    refreshAttributes()
  }

  const managementSheet = (
    <Sheet open={drawerMode !== null} onOpenChange={(open) => !open && resetDrawer()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        {drawerMode === "library" ? (
          <AttributeLibraryPanel
            attributes={attributes}
            filteredAttributes={filteredAttributes}
            isFetching={isFetching}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            variantAttributeCount={variantAttributeCount}
            requiredAttributeCount={requiredAttributeCount}
            valueCount={valueCount}
            onCreateAttribute={openCreateAttribute}
            onEditAttribute={openEditAttribute}
            onDeleteAttribute={handleDeleteAttribute}
            onOpenValues={openValues}
          />
        ) : null}

        {drawerMode === "attribute" ? (
          <>
            <SheetHeader className="pr-8">
              <SheetTitle>{editingAttribute ? "Edit attribute" : "Create attribute"}</SheetTitle>
              <SheetDescription>
                Define shared product data once, then link it only to the products that should use it.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <AttributeForm
                attribute={editingAttribute || undefined}
                onSubmit={editingAttribute ? handleUpdateAttribute : handleCreateAttribute}
                onCancel={returnToLibrary}
                isLoading={editingAttribute ? isUpdatingAttr : isCreatingAttr}
              />
            </div>
          </>
        ) : null}

        {drawerMode === "values" && selectedAttribute ? (
          <AttributeValuesPanel
            attribute={selectedAttribute}
            onCreateValue={openCreateValue}
            onEditValue={openEditValue}
            onDeleteValue={handleDeleteValue}
            onToggleValueActive={handleToggleValueActive}
            onBack={returnToLibrary}
          />
        ) : null}

        {drawerMode === "value" ? (
          <>
            <SheetHeader className="pr-8">
              <SheetTitle>{editingValue ? "Edit value" : "Create value"}</SheetTitle>
              <SheetDescription>
                {selectedAttribute ? `Value for ${selectedAttribute.name}.` : "Choose an attribute and create a reusable value."}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <AttributeValueForm
                attribute={selectedAttribute || undefined}
                value={editingValue || undefined}
                onSubmit={editingValue ? handleUpdateValue : handleCreateValue}
                onCancel={returnToLibrary}
                attributes={attributes}
              />
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )

  if (isStandalone) {
    return (
      <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
        <AttributeLibraryPanel
          attributes={attributes}
          filteredAttributes={filteredAttributes}
          isFetching={isFetching}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          variantAttributeCount={variantAttributeCount}
          requiredAttributeCount={requiredAttributeCount}
          valueCount={valueCount}
          onCreateAttribute={openCreateAttribute}
          onEditAttribute={openEditAttribute}
          onDeleteAttribute={handleDeleteAttribute}
          onOpenValues={openValues}
        />
        {managementSheet}
      </div>
    )
  }

  return (
    <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            <Settings2 className="h-3.5 w-3.5" />
            Attribute library
          </div>
          <h2 className="mt-3 text-xl font-bold text-gray-900">Platform-wide attribute templates</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            This is not the current product’s attribute list. These are reusable platform templates. Use the attribute-link
            table above to attach only the relevant templates to this product.
          </p>
        </div>

        <button
          type="button"
          onClick={openLibrary}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Settings2 className="h-4 w-4" />
          Manage platform templates
        </button>
      </div>

      {managementSheet}
    </div>
  )
}

function AttributeLibraryPanel({
  attributes,
  filteredAttributes,
  isFetching,
  searchTerm,
  setSearchTerm,
  variantAttributeCount,
  requiredAttributeCount,
  valueCount,
  onCreateAttribute,
  onEditAttribute,
  onDeleteAttribute,
  onOpenValues,
}: {
  attributes: ProductAttribute[]
  filteredAttributes: ProductAttribute[]
  isFetching: boolean
  searchTerm: string
  setSearchTerm: (value: string) => void
  variantAttributeCount: number
  requiredAttributeCount: number
  valueCount: number
  onCreateAttribute: () => void
  onEditAttribute: (attribute: ProductAttribute) => void
  onDeleteAttribute: (attributeId: string) => void
  onOpenValues: (attribute: ProductAttribute) => void
}) {
  return (
    <>
      <SheetHeader className="pr-8">
        <SheetTitle>Workspace attribute template library</SheetTitle>
        <SheetDescription>
          These counts are for all reusable attribute templates in this workspace, not for the current product. Attach relevant templates to
          the product from the “Attributes linked to this product” section.
        </SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-5">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
          <p className="font-semibold">What this library means</p>
          <p className="mt-1">
            Definitions like flavor, pet type, processor, and screen size are reusable templates. They only affect the current product when
            you link them to it. If an attribute is not linked, it is just available in the workspace library.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <AttributeMetric label="Workspace templates" value={attributes.length} icon={<Tag className="h-4 w-4" />} />
          <AttributeMetric label="Variant-capable templates" value={variantAttributeCount} icon={<ListChecks className="h-4 w-4" />} />
          <AttributeMetric label="Required templates" value={requiredAttributeCount} icon={<ListChecks className="h-4 w-4" />} />
          <AttributeMetric label="Template values" value={valueCount} icon={<Settings2 className="h-4 w-4" />} />
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search workspace templates"
              className="h-11 w-full rounded-full border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <button
            type="button"
            onClick={onCreateAttribute}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New template
          </button>
        </div>

        {isFetching ? (
          <div className="flex justify-center py-10">
            <LoadingAnimation text="Loading shared attributes..." ringColor="#3b82f6" />
          </div>
        ) : (
          <div className="max-h-[58vh] overflow-y-auto rounded-2xl border border-gray-200">
            {filteredAttributes.length ? (
              <div className="divide-y divide-gray-100">
                {filteredAttributes.map((attribute) => (
                  <div key={attribute.id} className="grid gap-4 bg-white p-4 transition hover:bg-gray-50">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">{attribute.name}</h3>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">{attribute.attribute_type}</span>
                        {attribute.unit ? (
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">Unit: {attribute.unit}</span>
                        ) : null}
                        {attribute.is_required ? (
                          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">Required</span>
                        ) : null}
                        {attribute.is_variant_attribute ? (
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">Variant</span>
                        ) : null}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <span>{attribute.values_count ?? attribute.values?.length ?? 0} values</span>
                        {attribute.category_tags ? <span>Tags: {attribute.category_tags}</span> : null}
                        {attribute.description ? <span className="line-clamp-1 max-w-xl">{attribute.description}</span> : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenValues(attribute)}
                        className="rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                      >
                        Manage values
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditAttribute(attribute)}
                        className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteAttribute(attribute.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                  <p className="text-base font-semibold text-gray-800">No workspace attribute templates found.</p>
                  <p className="mt-1 max-w-md text-sm text-gray-500">
                  Create reusable templates here, then link only the relevant ones to each product.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function AttributeValuesPanel({
  attribute,
  onCreateValue,
  onEditValue,
  onDeleteValue,
  onToggleValueActive,
  onBack,
}: {
  attribute: ProductAttribute
  onCreateValue: (attribute: ProductAttribute) => void
  onEditValue: (attribute: ProductAttribute, value: ProductAttributeValue) => void
  onDeleteValue: (valueId: string) => void
  onToggleValueActive: (valueId: string) => void
  onBack: () => void
}) {
  return (
    <>
      <SheetHeader className="pr-8">
        <SheetTitle>{attribute.name} values</SheetTitle>
        <SheetDescription>Keep selectable values here without expanding the product detail page.</SheetDescription>
      </SheetHeader>
      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Back to library
          </button>
          <button
            type="button"
            onClick={() => onCreateValue(attribute)}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add value
          </button>
        </div>

        <div className="space-y-2">
          {attribute.values?.length ? (
            attribute.values.map((value) => (
              <div key={value.id} className="rounded-2xl border border-gray-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {value.color_code ? (
                        <span
                          className="h-4 w-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: value.color_code }}
                        />
                      ) : null}
                      <p className="font-medium text-gray-900">{value.effective_display_value || value.value}</p>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Sort order: {value.sort_order ?? 0}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleValueActive(value.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                        value.is_active
                          ? "bg-green-50 text-green-700 hover:bg-green-100"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {value.is_active ? "Active" : "Inactive"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditValue(attribute, value)}
                      className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteValue(value.id)}
                      className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
              <p className="font-medium text-gray-800">No values defined yet.</p>
              <p className="mt-1 text-sm text-gray-500">Add the values users can choose when this attribute is linked.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function AttributeMetric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
    </div>
  )
}

function AttributeForm({
  attribute,
  onSubmit,
  onCancel,
  isLoading,
}: {
  attribute?: ProductAttribute
  onSubmit: (data: Partial<ProductAttribute>) => void
  onCancel: () => void
  isLoading?: boolean
}) {
  const [formData, setFormData] = useState({
    name: attribute?.name || "",
    attribute_type: attribute?.attribute_type || "TEXT",
    is_required: attribute?.is_required || false,
    is_variant_attribute: attribute?.is_variant_attribute ?? true,
    display_order: attribute?.display_order || 0,
    unit: attribute?.unit || "",
    description: attribute?.description || "",
    category_tags: attribute?.category_tags || "",
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    onSubmit(formData as Partial<ProductAttribute>)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormField label="Attribute name" required>
        <input
          type="text"
          value={formData.name}
          onChange={(event) => setFormData({ ...formData, name: event.target.value })}
          className={inputClassName}
          required
        />
      </FormField>

      <FormField label="Attribute type">
        <select
          value={formData.attribute_type}
          onChange={(event) => setFormData({ ...formData, attribute_type: event.target.value as ProductAttribute["attribute_type"] })}
          className={inputClassName}
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
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Unit">
          <input
            type="text"
            value={formData.unit}
            onChange={(event) => setFormData({ ...formData, unit: event.target.value })}
            className={inputClassName}
            placeholder="e.g. watts, kg, cm"
          />
        </FormField>
        <FormField label="Display order">
          <input
            type="number"
            value={formData.display_order}
            onChange={(event) => setFormData({ ...formData, display_order: Number.parseInt(event.target.value) || 0 })}
            className={inputClassName}
          />
        </FormField>
      </div>

      <FormField label="Category tags">
        <input
          type="text"
          value={formData.category_tags}
          onChange={(event) => setFormData({ ...formData, category_tags: event.target.value })}
          className={inputClassName}
          placeholder="electronics, footwear, apparel"
        />
      </FormField>

      <FormField label="Description">
        <textarea
          value={formData.description}
          onChange={(event) => setFormData({ ...formData, description: event.target.value })}
          className={`${inputClassName} min-h-24 resize-none`}
          placeholder="When should this attribute be used?"
        />
      </FormField>

      <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <CheckboxField
          id="is_required"
          checked={formData.is_required}
          label="Required for products that use it"
          onChange={(checked) => setFormData({ ...formData, is_required: checked })}
        />
        <CheckboxField
          id="is_variant_attribute"
          checked={formData.is_variant_attribute}
          label="Can be used to create variants"
          onChange={(checked) => setFormData({ ...formData, is_variant_attribute: checked })}
        />
      </div>

      <FormActions
        onCancel={onCancel}
        submitLabel={attribute ? "Update attribute" : "Create attribute"}
        isLoading={isLoading}
      />
    </form>
  )
}

function AttributeValueForm({
  attribute,
  value,
  onSubmit,
  onCancel,
  attributes,
}: {
  attribute?: ProductAttribute
  value?: ProductAttributeValue
  onSubmit: (data: Partial<ProductAttributeValue>) => void
  onCancel: () => void
  attributes: ProductAttribute[]
}) {
  const [formData, setFormData] = useState({
    attribute: attribute?.id || value?.attribute || "",
    value: value?.value || "",
    display_value: value?.display_value || "",
    color_code: value?.color_code || "#000000",
    is_active: value?.is_active ?? true,
    sort_order: value?.sort_order || 0,
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    onSubmit(formData as Partial<ProductAttributeValue>)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!attribute ? (
        <FormField label="Attribute" required>
          <select
            value={formData.attribute}
            onChange={(event) => setFormData({ ...formData, attribute: event.target.value })}
            className={inputClassName}
            required
          >
            <option value="">Select attribute</option>
            {attributes.map((attr) => (
              <option key={attr.id} value={attr.id}>
                {attr.name}
              </option>
            ))}
          </select>
        </FormField>
      ) : null}

      <FormField label="Value" required>
        <input
          type="text"
          value={formData.value}
          onChange={(event) => setFormData({ ...formData, value: event.target.value })}
          className={inputClassName}
          required
        />
      </FormField>

      <FormField label="Display value">
        <input
          type="text"
          value={formData.display_value}
          onChange={(event) => setFormData({ ...formData, display_value: event.target.value })}
          className={inputClassName}
          placeholder="Optional customer-facing label"
        />
      </FormField>

      <FormField label="Color code">
        <div className="flex gap-3">
          <input
            type="color"
            value={formData.color_code}
            onChange={(event) => setFormData({ ...formData, color_code: event.target.value })}
            className="h-11 w-14 rounded-xl border border-gray-300 bg-white"
          />
          <input
            type="text"
            value={formData.color_code}
            onChange={(event) => setFormData({ ...formData, color_code: event.target.value })}
            className={inputClassName}
            placeholder="#000000"
          />
        </div>
      </FormField>

      <FormField label="Sort order">
        <input
          type="number"
          value={formData.sort_order}
          onChange={(event) => setFormData({ ...formData, sort_order: Number.parseInt(event.target.value) || 0 })}
          className={inputClassName}
        />
      </FormField>

      <CheckboxField
        id="value_is_active"
        checked={formData.is_active}
        label="Active"
        onChange={(checked) => setFormData({ ...formData, is_active: checked })}
      />

      <FormActions onCancel={onCancel} submitLabel={value ? "Update value" : "Create value"} />
    </form>
  )
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-gray-700">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </span>
      {children}
    </label>
  )
}

function CheckboxField({
  id,
  checked,
  label,
  onChange,
}: {
  id: string
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 text-sm font-medium text-gray-700">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      {label}
    </label>
  )
}

function FormActions({
  onCancel,
  submitLabel,
  isLoading,
}: {
  onCancel: () => void
  submitLabel: string
  isLoading?: boolean
}) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {isLoading ? <LoadingAnimation text="" ringColor="#ffffff" size={14} /> : null}
        {submitLabel}
      </button>
    </div>
  )
}

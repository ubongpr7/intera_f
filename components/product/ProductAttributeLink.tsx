"use client"

import { useState } from "react"
import {
  useGetProductAttributeLinksQuery,
  useCreateProductAttributeLinkMutation,
  useUpdateProductAttributeLinkMutation,
  useDeleteProductAttributeLinkMutation,
  useGetProductAttributesQuery,
} from "@/redux/features/product/productAPISlice"
import type { ProductAttributeLink, ProductAttribute, Product } from "@/redux/features/product/productTypes"
import { Column, DataTable } from "../common/DataTable/DataTable"
import CustomCreateCard from "../common/createCard"
import LoadingAnimation from "../common/LoadingAnimation"
import { Trash2 } from "lucide-react"
import { toast } from "react-toastify"
import { extractErrorMessage } from "@/lib/utils"

interface ProductAttributeLinksProps {
  productId: string;
  product:Partial<Product>;
}

const attributeLinkColumns: Column<ProductAttributeLink>[] = [
  {
    header: 'Attribute',
    accessor: 'attribute_name',
    render: (value) => value || 'N/A',
    className: 'font-medium',
  },
  {
    header: 'Attribute',
    accessor: 'attribute_type',
    render: (value) => value || 'N/A',
    className: 'font-medium',
  },
  {
    header: 'Required',
    accessor: 'required',
    render: (value) => (value ? 'Yes' : 'No'),
    info: 'Is this attribute required for variants?',
  },
  {
    header: 'Order',
    accessor: 'order',
    render: (value) => value ?? 'N/A',
    info: 'Priority order for display',
  },
  {
    header: 'Price Modifier',
    accessor: 'default_modifier',
    render: (value) => value,
    info: 'Default price adjustment for this attribute',
  },
  {
    header: 'POS Visible',
    accessor: 'is_visible_in_pos',
    render: (value) => (value ? 'Yes' : 'No'),
    info: 'Is the attribute visible in POS interface?',
  },
]

const defaultValues: Partial<ProductAttributeLink> = {
  required: true,
  order: 0,
  default_modifier: 0,
  is_visible_in_pos: true,
}

export default function ProductAttributeLinks({ productId, product }: ProductAttributeLinksProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingAttributeLink, setEditingAttributeLink] = useState<ProductAttributeLink | null>(null)

  const { 
    data: attributeLinks, 
    isLoading: isAttributeLinksLoading, 
    refetch: refetchAttributeLinks, 
    error: attributeLinksError 
  } = useGetProductAttributeLinksQuery({productId:productId,variant:'',},)

  const { 
    data: attributes, 
    isLoading: isAttributesLoading,
    error: attributesError 
  } = useGetProductAttributesQuery({excludeProductId:productId})

  const [createAttributeLink, { isLoading: createLoading }] = useCreateProductAttributeLinkMutation()
  const [updateAttributeLink, { isLoading: updateLoading }] = useUpdateProductAttributeLinkMutation()
  const [deleteAttributeLink, { isLoading: deleteLoading }] = useDeleteProductAttributeLinkMutation()

  const attributeOptions = attributes?.map((attr: ProductAttribute) => ({
    value: attr.id,
    text: attr.name,
  })) || []

  const actionButtons = [
    {
      label: "Delete",
      icon: Trash2,
      variant: "danger" as const,
      tooltip: "Remove this attribute link",
      disabled: () => deleteLoading,
      onClick: (row: ProductAttributeLink) => {
        if (typeof window !== "undefined" && !window.confirm(`Remove ${row.attribute_name || "this attribute"} from this product?`)) {
          return
        }
        void handleDelete(row.id)
      },
    },
  ]

  const selectOptions = {
    attribute: attributeOptions,
  }

  const handleCreate = async (data: Partial<ProductAttributeLink>) => {
    try {
      await createAttributeLink({ productId, data }).unwrap()
      setIsCreateOpen(false)
      refetchAttributeLinks()
    } catch {
      toast.error("Failed to link attribute to product.")
    }
  }

  const handleUpdate = async (data: Partial<ProductAttributeLink>) => {
    if (!editingAttributeLink) return
    try {
      await updateAttributeLink({ productId, id: editingAttributeLink.id, data }).unwrap()
      setEditingAttributeLink(null)
      setIsCreateOpen(false)
      refetchAttributeLinks()
    } catch {
      toast.error("Failed to update product attribute link.")
    }
  }

  const handleDelete = async (attributeLinkId: string) => {
    try {
      await deleteAttributeLink({ productId, id: attributeLinkId }).unwrap()
      refetchAttributeLinks()
    } catch {
      toast.error("Failed to remove product attribute link.")
    }
  }

  const handleRowClick = (row: ProductAttributeLink) => {
    setEditingAttributeLink(row)
    setIsCreateOpen(true)

  }

const interfaceKeys: (keyof ProductAttributeLink)[] = [
 editingAttributeLink? 'attribute_type':'attribute',
  'required',
  'order',
  'default_modifier',
  'is_visible_in_pos',
]

  if (attributeLinksError || attributesError) {
    return (
      <div className="p-4 text-red-500">
        Unable to load product attribute setup.
        {attributeLinksError ? <p>Attribute links: {extractErrorMessage(attributeLinksError, ["detail", "error"])}</p> : null}
        {attributesError ? <p>Attributes: {extractErrorMessage(attributesError, ["detail", "error"])}</p> : null}
      </div>
    )
  }

  if (isAttributeLinksLoading || isAttributesLoading) {
    return <LoadingAnimation />
  }

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-[24px] border border-blue-100 bg-blue-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Current product attributes</div>
        <h3 className="mt-2 text-lg font-semibold text-gray-900">Attributes linked to {product?.name || "this product"}</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
          This table is the product-specific list. Only attributes linked here should drive this product’s variants, POS display, pricing
          modifiers, or required product data. The shared library below is just the pool of reusable templates.
        </p>
      </div>

      <DataTable<ProductAttributeLink>
        columns={attributeLinkColumns}
        data={attributeLinks || []}
        isLoading={isAttributeLinksLoading}
        onRowClick={handleRowClick}
        actionButtons={actionButtons}
        searchableFields={['attribute_name', 'attribute_type']}
        filterableFields={['attribute_type', 'required', 'is_visible_in_pos']}
        sortableFields={['attribute_name', 'attribute_type', 'order', 'default_modifier']}
        rangeFilterFields={['order', 'default_modifier']}
        title={`Linked attributes for ${product?.name || 'Product'}`}
        onClose={() => setIsCreateOpen(true)}
      />


      {isCreateOpen ? (
        <CustomCreateCard
          defaultValues={editingAttributeLink || defaultValues}
          onClose={() => {
            setIsCreateOpen(false)
            setEditingAttributeLink(null)
          }}
          onSubmit={editingAttributeLink ? handleUpdate : handleCreate}
          isLoading={editingAttributeLink ? updateLoading : createLoading}
          selectOptions={selectOptions}
          keyInfo={{
            attribute: 'The attribute to link to this product',
            required: 'Is this attribute required for variants?',
            order: 'Priority order for display',
            default_modifier: 'Default price adjustment for this attribute',
            is_visible_in_pos: 'Show this attribute in POS interface',
          }}
          notEditableFields={['id', 'product','attribute_type']}
          interfaceKeys={interfaceKeys}
          optionalFields={['order', 'default_modifier','required','is_visible_in_pos']}
          itemTitle={`${editingAttributeLink ? 'Update' : 'Link'} Attribute to Product`}
        />
      ) : null}
    </div>
  )
}

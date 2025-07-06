"use client"

import { useState } from "react"
import {
  useGetProductAttributeLinksQuery,
  useCreateProductAttributeLinkMutation,
  useUpdateProductAttributeLinkMutation,
  useDeleteProductAttributeLinkMutation,
  useGetProductAttributesQuery,
} from "@/redux/features/product/productAPISlice"
import { PageHeader } from "../inventory/PageHeader"
import { useRouter } from "nextjs-toploader/app"
import { Column, DataTable } from "../common/DataTable/DataTable"
import { ProductAttributeLink, ProductAttribute, Product } from "../interfaces/product"
import CustomCreateCard from "../common/createCard"
import LoadingAnimation from "../common/LoadingAnimation"

interface ProductAttributeLinksProps {
  productId: string;
  product:Partial<Product>;
  setRefetchData:(arg:boolean)=>void;
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

export default function ProductAttributeLinks({ productId,product,setRefetchData }: ProductAttributeLinksProps) {
  const router = useRouter()
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

  const selectOptions = {
    attribute: attributeOptions,
  }

  const handleCreate = async (data: Partial<ProductAttributeLink>) => {
    try {
      await createAttributeLink({ productId, data }).unwrap()
      setIsCreateOpen(false)
      refetchAttributeLinks()
      setRefetchData(true)
    } catch (error) {
      console.error('Failed to create attribute link:', error)
    }
  }

  const handleUpdate = async (data: Partial<ProductAttributeLink>) => {
    if (!editingAttributeLink) return
    try {
      await updateAttributeLink({ productId, id: editingAttributeLink.id, data }).unwrap()
      setEditingAttributeLink(null)
      setIsCreateOpen(false)
      setRefetchData(true)
      refetchAttributeLinks()
    } catch (error) {
      console.error('Failed to update attribute link:', error)
    }
  }

  const handleDelete = async (attributeLinkId: string) => {
    try {
      await deleteAttributeLink({ productId, id: attributeLinkId }).unwrap()
      refetchAttributeLinks()
      setRefetchData(true)

    } catch (error) {
      console.error('Failed to delete attribute link:', error)
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
        Error loading data: 
        {attributeLinksError && <p>Attribute Links: {(attributeLinksError as any).message || 'Unknown error'}</p>}
        {attributesError && <p>Attributes: {(attributesError as any).message || 'Unknown error'}</p>}
      </div>
    )
  }

  if (isAttributeLinksLoading || isAttributesLoading) {
    return <LoadingAnimation />
  }

  return (
    <div className="p-4">
      <PageHeader
        title={`Attribute Links for ${product?.name || 'Product'}`}
        onClose={() => setIsCreateOpen(true)}
      />
      
      <DataTable<ProductAttributeLink>
        columns={attributeLinkColumns}
        data={attributeLinks || []}
        isLoading={isAttributeLinksLoading}
        onRowClick={handleRowClick}
        
      />

      {isCreateOpen && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${isCreateOpen ? 'block' : 'hidden'}`}>
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
            itemTitle={`${editingAttributeLink ? 'Update' : 'Create'}  Attribute Link`}
          />
        </div>
      )}
    </div>
  )
}
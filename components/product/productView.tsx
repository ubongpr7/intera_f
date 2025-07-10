"use client"
import { useState } from "react"
import { PageHeader } from "../inventory/PageHeader"
import { useRouter } from "nextjs-toploader/app"
import { type Column, DataTable, type ActionButton } from "../common/DataTable/DataTable"
import type { ProductData } from "../interfaces/product"
import {
  useGetProductDataQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useRemoveTemplateModeMutation,
} from "@/redux/features/product/productAPISlice"
import CustomCreateCard from "../common/createCard"
import { InventoryInterfaceKeys, defaultValues } from "./selectOptions"
import { useGetUnitsQuery } from "../../redux/features/common/typeOF"
import { useGetProductCategoriesQuery } from "../../redux/features/product/productAPISlice"
import { useGetInventoryDataQuery } from "@/redux/features/inventory/inventoryAPiSlice"
import { AIBulkCreateModal } from "./AIBulkCreateModal"
import { TableImageHover } from "../common/table-image-render"
import { Edit, Trash2, Eye, Copy, BarChart3, Package, ShoppingCart } from "lucide-react"
import { toast } from "react-toastify"

const inventoryColumns: Column<ProductData>[] = [
  {
    header: "Name",
    accessor: "name",
    className: "font-medium",
  },
  {
    header: "Category",
    accessor: "pos_category",
    render: (value) => value || "N/A",
    info: "Category to which the inventory belong",
  },
  {
    header: "Barcode",
    accessor: "barcode",
    render: (value) => value || "N/A",
    className: "font-medium",
  },
  {
    header: "Image",
    accessor: "display_image",
    render: (value: string) => (
      <TableImageHover
        src={value}
        alt="Product Image"
        className="hover:ring-2 hover:ring-blue-500 hover:ring-opacity-50"
      />
    ),
  },
  {
    header: "Variants",
    accessor: "variant_count",
    render: (value) => value || "N/A",
    className: "font-medium",
  },
  {
    header: "Base Cost Price",
    accessor: "cost_price",
    render: (value) => value || "0",
    info: "Category to which the inventory belong",
  },
  {
    header: "Base Price",
    accessor: "base_price",
    render: (value) => value || "0",
    info: "Category to which the inventory belong",
  },
]

function ProductView() {
  const { data, isLoading, refetch, error } = useGetProductDataQuery()
  const [createInventory, { isLoading: inventoryCreateLoading }] = useCreateProductMutation()
  const [updateProduct, { isLoading: updateLoading }] = useUpdateProductMutation()
  const [deleteProduct, { isLoading: deleteLoading }] = useDeleteProductMutation()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null)
  const [isAIBulkCreateOpen, setIsAIBulkCreateOpen] = useState(false)
  const [removeTemplateMode, { isLoading: removeTemplateModeLoading }] = useRemoveTemplateModeMutation()
  const router = useRouter()
  const { data: inventoryData = [] } = useGetInventoryDataQuery()

  const handleCreate = async (createdData: Partial<ProductData>) => {
    try {
      await createInventory(createdData).unwrap()
      setIsCreateOpen(false)
      await refetch()
      toast.success("Product created successfully!")
    } catch (error) {
      toast.error("Failed to create product")
    }
  }

  const handleEdit = async (updatedData: Partial<ProductData>) => {
    if (!editingProduct) return

    try {
      await updateProduct({
        id: editingProduct.id,
        ...updatedData,
      }).unwrap()
      setIsEditOpen(false)
      setEditingProduct(null)
      await refetch()
      toast.success("Product updated successfully!")
    } catch (error) {
      toast.error("Failed to update product")
    }
  }

  const handleDelete = async (product: ProductData) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      try {
        await deleteProduct(product.id).unwrap()
        await refetch()
        toast.success("Product deleted successfully!")
      } catch (error) {
        toast.error("Failed to delete product")
      }
    }
  }
  const handleRemoveTemplateMode = async (product: ProductData) => {
    if (window.confirm(`Are you sure you want to remove template mode for "${product.name} and track it stock"?`)) {
      try {
        await removeTemplateMode({ id: product.id }).unwrap()
        await refetch()
        toast.success("Template mode removed successfully!")
      } catch (error) {
        toast.error("Failed to remove template mode")
      }
    }

  const handleDuplicate = async (product: ProductData) => {
    const duplicateData = {
      ...product,
      name: `${product.name} (Copy)`,
      barcode: "", // Clear barcode for duplicate
      id: undefined, // Remove ID so it creates new
      created_at: undefined,
      updated_at: undefined,
    }

    try {
      await createInventory(duplicateData).unwrap()
      await refetch()
      toast.success("Product duplicated successfully!")
    } catch (error) {
      toast.error("Failed to duplicate product")
    }
  }

  const handleViewDetails = (product: ProductData) => {
    router.push(`/product/${product.id}`)
  }

  const handleViewAnalytics = (product: ProductData) => {
    router.push(`/analytics/product/${product.id}`)
  }

  const handleManageInventory = (product: ProductData) => {
    router.push(`/inventory/product/${product.id}`)
  }

  const handleAddToPos = (product: ProductData) => {
    toast.success(`${product.name} added to POS!`)
  }

  // Define action buttons for each product row
  const actionButtons: ActionButton<ProductData>[] = [
    {
      label: "",
      icon: <Eye size={16} />,
      onClick: (row) => handleViewDetails(row),
      className: "text-blue-600 hover:text-blue-800",
      variant: "secondary",
      tooltip: "View Details",
    },
    {
      label: "",
      icon: <Eye size={16} />,
      onClick: (row) => handleRemoveTemplateMode(row),
      className: "text-blue-600 hover:text-blue-800",
      variant: "secondary",
      tooltip: "Remove Template Mode",
    },
    {
      label: "",
      icon: <Edit size={16} />,
      onClick: (row) => {
        setEditingProduct(row)
        setIsEditOpen(true)
      },
      className: "text-green-600 hover:text-green-800",
      variant: "secondary",
      tooltip: "Edit Product",
    },
    {
      label: "",
      icon: <Copy size={16} />,
      onClick: (row) => handleDuplicate(row),
      className: "text-purple-600 hover:text-purple-800",
      variant: "secondary",
      tooltip: "Duplicate Product",
    },
    {
      label: "",
      icon: <Package size={16} />,
      onClick: (row) => handleManageInventory(row),
      className: "text-orange-600 hover:text-orange-800",
      variant: "secondary",
      tooltip: "Manage Inventory",
    },
    {
      label: "",
      icon: <BarChart3 size={16} />,
      onClick: (row) => handleViewAnalytics(row),
      className: "text-indigo-600 hover:text-indigo-800",
      variant: "secondary",
      tooltip: "View Analytics",
    },
    {
      label: "",
      icon: <ShoppingCart size={16} />,
      onClick: (row) => handleAddToPos(row),
      className: "text-teal-600 hover:text-teal-800",
      variant: "secondary",
      tooltip: "Add to POS",
      hidden: (row) => row.pos_ready === true, // Hide if already POS ready
    },
    {
      label: "",
      icon: <Trash2 size={16} />,
      onClick: (row) => handleDelete(row),
      className: "text-red-600 hover:text-red-800",
      variant: "danger",
      tooltip: "Delete Product",
      disabled: (row) => deleteLoading,
    },
  ]

  const { data: categories = [], isLoading: isCatLoading, error: catError } = useGetProductCategoriesQuery(1)
  const { data: units = [] } = useGetUnitsQuery()

  const unitOptions = units.map((unit: any) => ({
    value: `${unit.name} (${unit.dimension_type})`,
    text: `${unit.name} (${unit.dimension_type})`,
  }))

  const categoryOptions = categories.map((cat: any) => ({
    value: cat.id,
    text: cat.name,
  }))

  const inventoryOptions = inventoryData.map((inventory: any) => ({
    value: inventory.id,
    text: inventory.name,
  }))

  const selectOptions = {
    category: categoryOptions,
    unit: unitOptions,
    inventory: inventoryOptions,
  }

  const handleRefresh = async () => {
    await refetch()
  }

  const handleRowClick = (row: ProductData) => {
    router.push(`/product/${row.id}`)
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">Error loading Product data: {(error as any).message || "Unknown error"}</div>
    )
  }

  const notEditableFields: (keyof ProductData)[] = ["id", "created_at", "updated_at"]

  return (
    <div>
      <PageHeader title="Product" onClose={() => setIsCreateOpen(true)} />
      <DataTable<ProductData>
        columns={inventoryColumns}
        data={data || []}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        actionButtons={actionButtons}
        showActionsColumn={true}
        actionsColumnHeader="Actions"
        actionsColumnWidth="w-48"
        secondaryButton={{
          label: "Create Bulk Product",
          onClick: () => setIsAIBulkCreateOpen(true),
        }}
      />

      {/* AI Bulk Create Modal */}
      {isAIBulkCreateOpen && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50`}>
          <AIBulkCreateModal
            isOpen={isAIBulkCreateOpen}
            onClose={() => {
              refetch()
              setIsAIBulkCreateOpen(false)
            }}
          />
        </div>
      )}

      {/* Create Product Modal */}
      <div
        className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${isCreateOpen ? "block" : "hidden"}`}
      >
        <CustomCreateCard
          defaultValues={defaultValues}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreate}
          isLoading={inventoryCreateLoading}
          selectOptions={selectOptions}
          keyInfo={{}}
          notEditableFields={notEditableFields}
          interfaceKeys={InventoryInterfaceKeys}
          optionalFields={[
            "description",
            "cost_price",
            "dimensions",
            "weight",
            "max_discount_percent",
            "allow_discount",
            "tax_inclusive",
            "quick_sale",
            "pos_ready",
          ]}
          itemTitle={"New Product"}
        />
      </div>

      {/* Edit Product Modal */}
      <div
        className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${isEditOpen ? "block" : "hidden"}`}
      >
        <CustomCreateCard
          defaultValues={editingProduct || defaultValues}
          onClose={() => {
            setIsEditOpen(false)
            setEditingProduct(null)
          }}
          onSubmit={handleEdit}
          isLoading={updateLoading}
          selectOptions={selectOptions}
          keyInfo={{}}
          notEditableFields={notEditableFields}
          interfaceKeys={InventoryInterfaceKeys}
          optionalFields={[
            "description",
            "cost_price",
            "dimensions",
            "weight",
            "max_discount_percent",
            "allow_discount",
            "tax_inclusive",
            "quick_sale",
            "pos_ready",
          ]}
          itemTitle={"Edit Product"}
        />
      </div>
    </div>
  )
}

export default ProductView

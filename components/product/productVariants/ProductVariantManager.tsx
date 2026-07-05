"use client"

import { useState } from "react"
import {
  useDeleteProductVariantMutation,
  useGetProductDataQuery,
  useGetProductVariantsQuery,
  useToggleVariantFeaturedMutation,
  useToggleVariantPosVisibleMutation,
} from "@/redux/features/product/productAPISlice"
import type { Product, ProductVariant } from "@/redux/features/product/productTypes"

import { type ActionButton, type Column, DataTable } from "@/components/common/DataTable/DataTable"
import LoadingAnimation from "@/components/common/LoadingAnimation"
import CreateVariantModal from "./CreateVariantModal"
import VariantDetailsModal from "./VariantDetailsModal"
import { getCurrencySymbolForProfile } from "@/lib/currency-utils"
import { TableImageHover } from '@/components/common/table-image-render';
import { Eye, ScanBarcode, Star, Trash2 } from "lucide-react"
import { toast } from "react-toastify"
import { extractErrorMessage } from "@/lib/utils"
import { confirmAction } from "@/components/common/confirmAction"
import { useSubscriptionQuota } from "@/hooks/useSubscriptionQuota"

interface ProductVariantManagerProps {
  productId: string
  ProductData:Partial<Product>
}

const variantColumns: Column<ProductVariant>[] = [
  {
    header: "Display Name",
    accessor: "pos_display_name",
    render: (value) =>
  String(value).length > 21
    ? `${String(value).slice(0, 20)}...`
    : String(value),
    className: "font-medium",
  },
  {
    header: "Barcode",
    accessor: "variant_barcode",
    render: (value) => value || "Not set",
    className: "font-medium",
  },
  {
    header: "Image",
    accessor: "main_image",
    render: (value: string) => (
      <TableImageHover
        src={value}
        alt="Product Image"
        className="hover:ring-2 hover:ring-blue-500 hover:ring-opacity-50"
      />
    ),
  },
  {
    header: "SKU",
    accessor: "variant_sku",
    render: (value) => value || "Not set",
    info: "Stock Keeping Unit for the variant",
  },
  {
    header: "Selling Price",
    accessor: "selling_price",
    render: (value) => `${getCurrencySymbolForProfile()} ${Number(value).toFixed(2)}`,
    info: "Current selling price including modifiers",
  },
  {
    header: "Active",
    accessor: "active",
    render: (value) => (value ? "Yes" : "No"),
    info: "Is the variant active for sale?",
  },
  {
    header: "POS Visible",
    accessor: "pos_visible",
    render: (value) => (value ? "Yes" : "No"),
    info: "Is the variant visible in POS interface?",
  },
]

const ProductVariantManager = ({ productId, ProductData }: ProductVariantManagerProps) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const { data: products = [] } = useGetProductDataQuery()
  const workspaceVariantCount = products.reduce((total, product) => total + Number(product.variant_count ?? 0), 0)
  const variantQuota = useSubscriptionQuota("product-variants", workspaceVariantCount)

  const {
    data: variants,
    isLoading: isVariantsLoading,
    isFetching: isVariantsFetching,
    refetch: refetchVariants,
    error: variantsError,
  } = useGetProductVariantsQuery(productId)
  const [deleteVariant, { isLoading: isDeletingVariant }] = useDeleteProductVariantMutation()
  const [toggleVariantPosVisible] = useToggleVariantPosVisibleMutation()
  const [toggleVariantFeatured] = useToggleVariantFeaturedMutation()

  const handleRowClick = (row: ProductVariant) => {
    setSelectedVariantId(row.id)
  }

  const handleCloseVariantDetails = () => {
    setSelectedVariantId(null)
  }

  const handleDeleteVariant = async (variant: ProductVariant) => {
    const variantName = variant.pos_display_name || variant.display_name || variant.variant_sku || variant.id
    const confirmed = await confirmAction({
      title: "Delete product variant?",
      description: `Delete variant "${variantName}"?`,
      confirmText: "Delete variant",
      destructive: true,
    })
    if (!confirmed) return

    try {
      await deleteVariant(variant.id).unwrap()
      toast.success("Variant deleted successfully.")
      await refetchVariants()
      if (selectedVariantId === variant.id) {
        setSelectedVariantId(null)
      }
    } catch {
      toast.error("Failed to delete variant.")
    }
  }

  const handleTogglePosVisible = async (variant: ProductVariant) => {
    try {
      await toggleVariantPosVisible(variant.id).unwrap()
      await refetchVariants()
    } catch {
      toast.error("Failed to toggle POS visibility.")
    }
  }

  const handleToggleFeatured = async (variant: ProductVariant) => {
    try {
      await toggleVariantFeatured(variant.id).unwrap()
      await refetchVariants()
    } catch {
      toast.error("Failed to toggle featured status.")
    }
  }

  const actionButtons: ActionButton<ProductVariant>[] = [
    {
      label: "",
      icon: Eye,
      onClick: (row) => setSelectedVariantId(row.id),
      tooltip: "Open variant details",
      variant: "secondary",
    },
    {
      label: "",
      icon: Star,
      onClick: (row) => handleToggleFeatured(row),
      tooltip: "Toggle featured",
      variant: "secondary",
    },
    {
      label: "",
      icon: ScanBarcode,
      onClick: (row) => handleTogglePosVisible(row),
      tooltip: "Toggle POS visibility",
      variant: "secondary",
    },
    {
      label: "",
      icon: Trash2,
      onClick: (row) => {
        void handleDeleteVariant(row)
      },
      className: "text-red-500",
      tooltip: "Delete variant",
      variant: "secondary",
      disabled: () => isDeletingVariant,
    },
  ]

  if (variantsError) {
    return (
      <div className="p-4 text-red-500">
        Unable to load product variants: {extractErrorMessage(variantsError, ["detail", "error"])}
      </div>
    )
  }

  if (isVariantsLoading) {
    return <LoadingAnimation />
  }

  return (
    <div className="p-4">
      <DataTable<ProductVariant>
        columns={variantColumns}
        data={variants || []}
        isLoading={isVariantsFetching}
        onRowClick={handleRowClick}
        searchableFields={["pos_display_name", "display_name", "variant_sku", "variant_barcode"]}
        filterableFields={["active", "pos_visible", "is_featured"]}
        sortableFields={["pos_display_name", "variant_sku", "selling_price", "variant_number", "price_override", "cost_override"]}
        rangeFilterFields={["selling_price", "pos_price", "variant_number", "price_override", "cost_override", "low_stock_threshold_override"]}
        actionButtons={actionButtons}
        title="Product Variants" onClose={() => {
          if (!variantQuota.canCreate) {
            toast.error(variantQuota.message)
            return
          }
          setIsCreateOpen(true)
        }}
      />

      {isCreateOpen && (
        <CreateVariantModal
        ProductData={ProductData}
          productId={productId}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setIsCreateOpen(false)
            refetchVariants()
            
          }}
        />
      )}

      {selectedVariantId && (
        <VariantDetailsModal
          variantId={selectedVariantId}
          onClose={handleCloseVariantDetails}
          onSuccess={() => {
            void refetchVariants()
          }}
        />
      )}
    </div>
  )
}

export default ProductVariantManager

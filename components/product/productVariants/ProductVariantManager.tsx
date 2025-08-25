"use client"

import { useEffect, useState } from "react"
import {  useGetProductVariantsQuery } from "@/redux/features/product/productAPISlice"
import { PageHeader } from "@/components/inventory/PageHeader"
import { type Column, DataTable } from "@/components/common/DataTable/DataTable"
import type { Product, ProductVariant } from "@/components/interfaces/product"
import LoadingAnimation from "@/components/common/LoadingAnimation"
import CreateVariantModal from "./CreateVariantModal"
import VariantDetailsModal from "./VariantDetailsModal"
import { getCurrencySymbolForProfile } from "@/lib/currency-utils"
import { TableImageHover } from '@/components/common/table-image-render';

interface ProductVariantManagerProps {
  productId: string
  refetchData: boolean
  setRefetchData: (value: boolean) => void
  ProductData:Partial<Product>
}

const variantColumns: Column<ProductVariant>[] = [
  {
    header: "Display Name",
    accessor: "pos_display_name",
    className: "font-medium",
  },
  {
    header: "Barcode",
    accessor: "variant_barcode",
    render: (value) => value || "N/A",
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
    render: (value) => value || "N/A",
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

const ProductVariantManager = ({ productId, refetchData, setRefetchData,ProductData }: ProductVariantManagerProps) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

  const {
    data: variants,
    isLoading: isVariantsLoading,
    isFetching: isVariantsFetching,
    refetch: refetchVariants,
    error: variantsError,
  } = useGetProductVariantsQuery(productId)

  const handleRowClick = (row: ProductVariant) => {
    setSelectedVariantId(row.id)
  }

  const handleCloseVariantDetails = () => {
    setSelectedVariantId(null)
  }

  const actionButtons = [
    {
      label: "Delete",
      onClick: (row: ProductVariant) => {
        // Handle delete logic here
        console.log("Delete variant:", row.id)
      },
      className: "text-red-500",
    },
  ]

  if (variantsError) {
    return (
      <div className="p-4 text-red-500">
        Error loading variants: {(variantsError as any).message || "Unknown error"}
      </div>
    )
  }

  if (isVariantsLoading) {
    return <LoadingAnimation />
  }

  return (
    <div className="p-4">
      <PageHeader title="Product Variants" onClose={() => setIsCreateOpen(true)} />

      <DataTable<ProductVariant>
        columns={variantColumns}
        data={variants || []}
        isLoading={isVariantsFetching}
        onRowClick={handleRowClick}
        searchableFields={["pos_display_name", "variant_sku"]}
        filterableFields={["active", "pos_visible"]}
        sortableFields={["pos_display_name", "variant_sku"]}
        actionButtons={actionButtons}
      />

      {isCreateOpen && (
        <CreateVariantModal
        ProductData={ProductData}
          productId={productId}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setRefetchData(true)
            setIsCreateOpen(false)
            refetchVariants()
            
          }}
        />
      )}

      {selectedVariantId && (
        <VariantDetailsModal
          variantId={selectedVariantId}
          onClose={handleCloseVariantDetails}
          onSuccess={() => setRefetchData(true)}
          refetchData={refetchData}
        />
      )}
    </div>
  )
}

export default ProductVariantManager

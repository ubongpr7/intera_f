"use client"

import { useUpdateProductVariantMutation } from "@/redux/features/product/productAPISlice"
import CustomUpdateForm from "@/components/common/updateForm"
import type { ProductVariant } from "@/components/interfaces/product"

interface VariantDetailsTabProps {
  variant: ProductVariant
  onSuccess: () => void
}

const interfaceKeys: (keyof ProductVariant)[] = [
  "variant_barcode",
  "variant_sku",
  "pos_name",
  "price_override",
  "cost_override",
  "weight_override",
  "dimensions_override",
  "track_stock_override",
  "low_stock_threshold_override",
  "active",
  "pos_visible",
  "is_featured",
]

const VariantDetailsTab = ({ variant, onSuccess }: VariantDetailsTabProps) => {
  const [updateVariant, { isLoading: updateLoading }] = useUpdateProductVariantMutation()

  const handleUpdate = async (data: Partial<ProductVariant>) => {
    try {
      await updateVariant({ id: variant.id, data }).unwrap()
      onSuccess()
    } catch (error) {
      console.error("Failed to update variant:", error)
    }
  }

  return (
    <div className="p-4 max-h-[70vh] overflow-y-auto">
      <CustomUpdateForm
        data={variant}
        isLoading={updateLoading}
        onSubmit={handleUpdate}
        editableFields={interfaceKeys}
        displayKeys={[
          "pos_name",
          "variant_sku",
          "variant_barcode",
          "selling_price",
          "active",
          "pos_visible",
          "is_featured",
        ]}
        selectOptions={{}}
        keyInfo={{
          pos_name: "Custom name for POS display",
          variant_sku: "Stock Keeping Unit for the variant",
          variant_barcode: "Barcode for the variant",
          price_override: "Override product base price",
          cost_override: "Override product cost price",
          weight_override: "Override product weight (kg)",
          dimensions_override: "Override product dimensions (L x W x H in cm)",
          track_stock_override: "Override product stock tracking setting",
          low_stock_threshold_override: "Override low stock threshold",
          active: "Is the variant active for sale?",
          pos_visible: "Show in POS interface",
          is_featured: "Feature for quick access",
        }}
        notEditableFields={["id", "created_at", "updated_at", "variant_number", "product", "selling_price"]}
      />
    </div>
  )
}

export default VariantDetailsTab

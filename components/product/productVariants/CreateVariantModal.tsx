"use client"

import { useCreateProductVariantMutation } from "@/redux/features/product/productAPISlice"
import CustomCreateCard from "@/components/common/createCard"
import type { Product, ProductVariant } from "@/components/interfaces/product"

interface CreateVariantModalProps {
  productId: string
  onClose: () => void
  onSuccess: () => void
  ProductData:Partial<Product>
}


const interfaceKeys: (keyof ProductVariant)[] = [
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

const CreateVariantModal = ({ productId, onClose, onSuccess,ProductData }: CreateVariantModalProps) => {
  const [createVariant, { isLoading: createLoading }] = useCreateProductVariantMutation()
   
  const handleCreate = async (data: Partial<ProductVariant>) => {
    try {
      const variantData = { ...data, product: productId }
      await createVariant(variantData).unwrap()
      onSuccess()
    } catch (error) {
      console.error("Failed to create variant:", error)
    }
  }

const defaultValues: Partial<ProductVariant> = {
  active: ProductData.is_active,
  pos_visible: ProductData?.pos_ready||false,
  is_featured: false,
  price_override: ProductData.base_price,
  cost_override: ProductData?.cost_price,
  weight_override: ProductData?.weight,
  dimensions_override: ProductData?.dimensions||'',
  track_stock_override: ProductData?.track_stock,
  low_stock_threshold_override: ProductData.low_stock_threshold,
  pos_name: ProductData.name,
}

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CustomCreateCard
          defaultValues={defaultValues}
          onClose={onClose}
          onSubmit={handleCreate}
          isLoading={createLoading}
          selectOptions={{}}
          keyInfo={{
            variant_barcode: "Barcode for the variant",
            variant_sku: "Stock Keeping Unit for the variant",
            pos_name: "Custom name for POS display",
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
          notEditableFields={["id", "created_at", "updated_at", "variant_number", "product"]}
          interfaceKeys={interfaceKeys}
          optionalFields={[
            "variant_barcode",
            "variant_sku",
            "pos_name",
            "price_override",
            "cost_override",
            "weight_override",
            "dimensions_override",
            "track_stock_override",
            "low_stock_threshold_override",
            'is_featured',
            'pos_visible',
            'active'
          ]}
        />
      </div>
    </div>
  )
}

export default CreateVariantModal

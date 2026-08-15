"use client"

import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  useGetProductPosVariantsQuery,
  useGetProductQuery,
  useToggleProductFeaturedMutation,
  useToggleProductQuickSaleMutation,
} from "@/redux/features/product/productAPISlice"
import type { Product } from "@/redux/features/product/productTypes"

interface ProductPOSProps {
  productId: string
  product: Partial<Product>
}

export default function ProductPOS({ productId, product }: ProductPOSProps) {
  const { data: posVariants = [], isLoading } = useGetProductPosVariantsQuery(productId)
  const { data: currentProduct, refetch: refetchProduct } = useGetProductQuery(productId)
  const [toggleQuickSale, { isLoading: isTogglingQuickSale }] = useToggleProductQuickSaleMutation()
  const [toggleFeatured, { isLoading: isTogglingFeatured }] = useToggleProductFeaturedMutation()
  const productData = currentProduct ?? product

  const handleToggleQuickSale = async () => {
    try {
      await toggleQuickSale(productId).unwrap()
      await refetchProduct()
      toast.success("Quick-sale setting updated.")
    } catch {
      toast.error("Failed to update quick-sale setting.")
    }
  }

  const handleToggleFeatured = async () => {
    try {
      await toggleFeatured(productId).unwrap()
      await refetchProduct()
      toast.success("Featured status updated.")
    } catch {
      toast.error("Failed to update featured status.")
    }
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="p-6 text-left text-inherit">
        <CardTitle className="text-lg">POS readiness</CardTitle>
        <CardDescription className="text-sm leading-6 text-gray-600">
          Keep the POS-facing controls tied to real product capabilities that exist in the current backend: quick sale, featured state, discount rules, and POS-visible variants.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6 pt-0">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Quick sale</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{productData.quick_sale ? "Enabled" : "Disabled"}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Featured</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{productData.is_featured ? "Yes" : "No"}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">POS ready</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{productData.pos_ready ? "Yes" : "No"}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">POS variants</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{isLoading ? "..." : posVariants.length}</div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-semibold text-gray-900">Commercial controls</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Product-level POS configuration in the old UI depended on backend endpoints that are no longer exposed. This panel keeps only the controls that the current backend actually supports.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button onClick={handleToggleQuickSale} disabled={isTogglingQuickSale} aria-busy={isTogglingQuickSale}>
                {isTogglingQuickSale ? "Updating..." : productData.quick_sale ? "Disable quick sale" : "Enable quick sale"}
              </Button>
              <Button variant="outline" onClick={handleToggleFeatured} disabled={isTogglingFeatured} aria-busy={isTogglingFeatured}>
                {isTogglingFeatured ? "Updating..." : productData.is_featured ? "Remove featured" : "Mark featured"}
              </Button>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
              <p>Tax rate: <span className="font-semibold text-gray-900">{productData.tax_rate ?? 0}%</span></p>
              <p className="mt-2">Discounts: <span className="font-semibold text-gray-900">{productData.allow_discount ? `Allowed up to ${productData.max_discount_percent ?? 0}%` : "Disabled"}</span></p>
              <p className="mt-2">POS category: <span className="font-semibold text-gray-900">{productData.pos_category || "Not assigned"}</span></p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900">POS-visible variants</h3>
            <div className="mt-3 space-y-3">
              {posVariants.length ? (
                posVariants.map((variant) => (
                  <div key={variant.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">{variant.pos_display_name || variant.display_name || "Variant"}</p>
                      <span className="text-xs uppercase tracking-wide text-gray-500">{variant.variant_barcode || "No barcode"}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      SKU: {variant.variant_sku || "N/A"} • Price: {variant.selling_price ?? 0}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-600">
                  No POS-visible variants are currently configured for this product.
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

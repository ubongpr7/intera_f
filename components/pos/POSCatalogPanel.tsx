"use client"

import { Search, ShoppingBag, Sparkles } from "lucide-react"
import { formatCurrency } from "@/lib/currency-utils"
import type { ProductVariant } from "@/redux/features/product/productTypes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

type FeaturedVariantChip = {
  id: string
  name: string
  price: number
  sku: string
  barcode?: string
  productName: string
}

interface POSCatalogPanelProps {
  currencyCode: string
  catalogQuery: string
  onCatalogQueryChange: (value: string) => void
  deferredCatalogQuery: string
  searchResults: ProductVariant[]
  featuredResults: FeaturedVariantChip[]
  searchingCatalog: boolean
  variantQuantities: Record<string, string>
  onVariantQuantityChange: (variantId: string, value: string) => void
  onAddVariant: (variantId: string) => Promise<void>
  canAddToOrder: boolean
  isAdding: boolean
}

const variantLabel = (variant: ProductVariant) =>
  variant.display_name || variant.pos_display_name || variant.variant_sku || variant.product_details?.name || "Variant"

export default function POSCatalogPanel({
  currencyCode,
  catalogQuery,
  onCatalogQueryChange,
  deferredCatalogQuery,
  searchResults,
  featuredResults,
  searchingCatalog,
  variantQuantities,
  onVariantQuantityChange,
  onAddVariant,
  canAddToOrder,
  isAdding,
}: POSCatalogPanelProps) {
  const showSearchResults = deferredCatalogQuery.length >= 2

  return (
    <Card className="h-full overflow-hidden border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-100 p-5">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingBag className="h-4 w-4 text-amber-600" />
          Product catalog
        </CardTitle>
        <div className="mt-3 relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={catalogQuery}
            onChange={(event) => onCatalogQueryChange(event.target.value)}
            className="pl-10"
            placeholder="Search by product name, SKU, or barcode"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[720px]">
          <div className="space-y-5 p-5">
            {!showSearchResults ? (
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  Quick-sale favourites
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  Cashier-first shortcuts for the variants already marked as quick sale or POS-ready.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {featuredResults.map((variant) => (
                    <div key={variant.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                      <p className="text-sm font-semibold text-gray-900">{variant.name}</p>
                      <p className="mt-1 text-xs text-gray-500">{variant.productName}</p>
                      <p className="mt-1 text-xs text-gray-500">{variant.sku || variant.barcode || "No stock code"}</p>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(currencyCode, variant.price)}</div>
                        <Button size="sm" variant="outline" onClick={() => void onAddVariant(variant.id)} disabled={!canAddToOrder || isAdding}>
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                  {featuredResults.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-600 sm:col-span-2 xl:col-span-3">
                      No quick-sale variants are configured yet. Mark product variants as POS visible to populate this panel.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Search results</div>
                    <p className="mt-1 text-sm text-gray-600">
                      {searchingCatalog ? "Searching catalog..." : `Found ${searchResults.length} matching POS variants.`}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {searchResults.map((variant) => (
                    <div key={variant.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                      <p className="text-sm font-semibold text-gray-900">{variantLabel(variant)}</p>
                      <p className="mt-1 text-xs text-gray-500">{variant.product_details?.name || "Product"}</p>
                      <p className="mt-1 text-xs text-gray-500">{variant.variant_sku || variant.variant_barcode || "No stock code"}</p>
                      <div className="mt-4 flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={variantQuantities[variant.id] || "1"}
                          onChange={(event) => onVariantQuantityChange(variant.id, event.target.value)}
                          className="w-24"
                        />
                        <Button className="flex-1" onClick={() => void onAddVariant(variant.id)} disabled={!canAddToOrder || isAdding}>
                          {formatCurrency(currencyCode, variant.selling_price)}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!searchingCatalog && searchResults.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-600 sm:col-span-2 xl:col-span-3">
                      No POS-visible variants match this search. Try a product name, SKU, or barcode.
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

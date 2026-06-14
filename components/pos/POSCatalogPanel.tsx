"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { AlertTriangle, Layers3, Package2, Search, ShoppingBag, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatCurrency } from "@/lib/currency-utils"
import type { Product, ProductVariant } from "@/redux/features/product/productTypes"
import { toast } from "react-toastify"

type ProductCatalogItem = Product & {
  quick_sale_label?: string
}

type QuickSaleVariant = {
  id: string
  display_name?: string
  display_image?: string
  price?: number
  barcode?: string
  sku?: string
  stock_details?: {
    available?: number
    quantity?: number
  }
}

interface POSCatalogPanelProps {
  currencyCode: string
  catalogQuery: string
  onCatalogQueryChange: (value: string) => void
  deferredCatalogQuery: string
  products: ProductCatalogItem[]
  productVariants: Record<string, ProductVariant[]>
  searchingCatalog: boolean
  catalogUnavailable?: boolean
  variantQuantities: Record<string, string>
  onVariantQuantityChange: (variantId: string, value: string) => void
  onAddVariant: (variantId: string) => Promise<void>
  canAddToOrder: boolean
  pendingAddVariantIds: Record<string, boolean>
}

type BrowseMode = "quick_sale" | "all"

const productImage = (product: Product) => product.display_image

const productStock = (product: Product & { stock_quantity?: number; can_sell?: boolean }) =>
  Number(product.total_stock ?? product.stock_quantity ?? 0)

const variantImage = (variant: ProductVariant) =>
  variant.main_image || variant.attachments?.[0]?.file_url || variant.attachments?.[0]?.file || undefined

const variantLabel = (variant: ProductVariant) =>
  variant.display_name || variant.pos_display_name || variant.variant_sku || variant.product_details?.name || "Variant"

const variantAttributes = (variant: ProductVariant) =>
  (variant.attribute_details || [])
    .map((attribute) => {
      const label = attribute.attribute_name || "Attribute"
      const value = attribute.display_value || attribute.custom_value || attribute.value
      return `${label}: ${value}`
    })
    .filter(Boolean)

const variantStock = (variant: ProductVariant | QuickSaleVariant, fallbackStock = 0) =>
  Number(
    (variant as ProductVariant).stock_details?.available ??
      (variant as QuickSaleVariant).stock_details?.available ??
      (variant as QuickSaleVariant).stock_details?.quantity ??
      fallbackStock,
  )

const variantPrice = (variant: ProductVariant | QuickSaleVariant) =>
  Number(
    (variant as ProductVariant).selling_price ??
      (variant as ProductVariant).pos_price ??
      (variant as QuickSaleVariant).price ??
      0,
  )

const variantImageSource = (variant: ProductVariant | QuickSaleVariant) =>
  (variant as ProductVariant).main_image ||
  (variant as QuickSaleVariant).display_image ||
  (variant as ProductVariant).attachments?.[0]?.file_url ||
  (variant as ProductVariant).attachments?.[0]?.file ||
  undefined

const productVariantCandidates = (product: ProductCatalogItem, productVariants: Record<string, ProductVariant[]>) => {
  const fromMap = productVariants[product.id] || []
  const quickSaleVariants = (product.quick_sale_variants || []) as QuickSaleVariant[]
  const fromMapIds = new Set(fromMap.map((variant) => variant.id))
  const merged = [...fromMap]
  quickSaleVariants.forEach((variant) => {
    if (!fromMapIds.has(variant.id)) {
      merged.push(variant as unknown as ProductVariant)
    }
  })
  return merged
}

const productRepresentativeVariant = (
  product: ProductCatalogItem,
  productVariants: Record<string, ProductVariant[]>,
) => {
  const candidates = productVariantCandidates(product, productVariants)
  const inStockCandidates = candidates.filter((variant) => variantStock(variant) > 0)
  const usable = inStockCandidates.length > 0 ? inStockCandidates : candidates
  return [...usable].sort((left, right) => variantPrice(left) - variantPrice(right))[0] || null
}

function CatalogImage({ src, alt }: { src?: string; alt: string }) {
  return (
    <div className="relative h-44 w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover transition-transform duration-300 hover:scale-[1.03]"
          sizes="(max-width: 1280px) 50vw, 20vw"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-100 text-gray-400">
          <Package2 className="h-10 w-10" />
        </div>
      )}
    </div>
  )
}

function ProductCard({
  product,
  productVariants,
  currencyCode,
  quantityValue,
  onQuantityChange,
  onChoose,
  canAddToOrder,
  pendingAddVariantIds,
}: {
  product: ProductCatalogItem
  productVariants: Record<string, ProductVariant[]>
  currencyCode: string
  quantityValue: string
  onQuantityChange: (productId: string, value: string) => void
  onChoose: (product: ProductCatalogItem) => void
  canAddToOrder: boolean
  pendingAddVariantIds: Record<string, boolean>
}) {
  const stock = productStock(product)
  const representativeVariant = productRepresentativeVariant(product, productVariants)
  const representativePrice = representativeVariant ? variantPrice(representativeVariant) : Number(product.base_price ?? 0)
  const hasMultipleVariants = (product.variant_count ?? productVariantCandidates(product, productVariants).length) > 1
  const priceLabel = hasMultipleVariants
    ? `From ${formatCurrency(currencyCode, representativePrice)}`
    : formatCurrency(currencyCode, representativePrice)
  const imageUrl = representativeVariant ? variantImageSource(representativeVariant) : productImage(product)
  const singleVariantId = !hasMultipleVariants ? representativeVariant?.id : undefined
  const isPending = singleVariantId ? !!pendingAddVariantIds[singleVariantId] : false

  return (
    <div className="rounded-[28px] border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="space-y-4">
        <div>
          <p className="text-lg font-semibold text-gray-900">{product.name}</p>
          <p className="mt-1 text-xs text-gray-500">{product.category_details?.full_name || product.category || "Uncategorized"}</p>
          <p className="mt-1 text-xs text-gray-500">{product.sku || product.barcode || "No stock code"}</p>
          <p className="mt-2 text-xs font-medium text-blue-700">{stock} in stock</p>
        </div>
        <CatalogImage src={imageUrl} alt={product.name} />
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-gray-900">{priceLabel}</div>
            <div className="mt-1 text-xs text-gray-500">
              {hasMultipleVariants
                ? `${product.variant_count} variants`
                : "Single variant"}
            </div>
          </div>
          <Input
            type="number"
            min="1"
            step="1"
            value={quantityValue}
            onChange={(event) => onQuantityChange(product.id, event.target.value)}
            className="h-10 w-20 bg-white"
          />
        </div>
        <Button type="button" className="h-11 w-full" onClick={() => onChoose(product)} disabled={!canAddToOrder || isPending}>
          {hasMultipleVariants ? "Choose variant" : "Add to cart"}
        </Button>
      </div>
    </div>
  )
}

function VariantPickerDialog({
  open,
  onOpenChange,
  product,
  variants,
  fallbackStock,
  currencyCode,
  variantQuantities,
  onVariantQuantityChange,
  onAddVariant,
  canAddToOrder,
  pendingAddVariantIds,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: ProductCatalogItem | null
  variants: ProductVariant[]
  fallbackStock: number
  currencyCode: string
  variantQuantities: Record<string, string>
  onVariantQuantityChange: (variantId: string, value: string) => void
  onAddVariant: (variantId: string) => Promise<void>
  canAddToOrder: boolean
  pendingAddVariantIds: Record<string, boolean>
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0">
        <div className="border-b border-gray-100 p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl">{product?.name || "Choose a variant"}</DialogTitle>
            <DialogDescription>
              Select the exact variant to sell. Only in-stock variants are listed here.
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[72vh]">
          <div className="grid gap-4 p-6 md:grid-cols-2">
            {variants.map((variant) => {
              const available = variantStock(variant, fallbackStock)
              const attributes = variantAttributes(variant)
              return (
                <div key={variant.id} className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="grid gap-4 md:grid-cols-[120px_minmax(0,1fr)]">
                    <CatalogImage src={variantImage(variant)} alt={variantLabel(variant)} />
                    <div className="space-y-3">
                      <div>
                        <p className="text-base font-semibold text-gray-900">{variantLabel(variant)}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {variant.variant_sku || variant.variant_barcode || "No stock code"}
                        </p>
                        <p className="mt-2 text-xs font-medium text-blue-700">{available} available</p>
                      </div>

                      {attributes.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {attributes.map((attribute) => (
                            <span
                              key={`${variant.id}-${attribute}`}
                              className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600"
                            >
                              {attribute}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(currencyCode, Number(variant.selling_price ?? 0))}
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          max={Math.max(available, 1)}
                          step="1"
                          value={variantQuantities[variant.id] || "1"}
                          onChange={(event) => onVariantQuantityChange(variant.id, event.target.value)}
                          className="h-10 w-24 bg-white"
                        />
                        <Button
                          type="button"
                          className="h-10 flex-1"
                          onClick={() => void onAddVariant(variant.id)}
                          disabled={!canAddToOrder || !!pendingAddVariantIds[variant.id] || available <= 0}
                        >
                          Add to cart
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t border-gray-100 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function POSCatalogPanel({
  currencyCode,
  catalogQuery,
  onCatalogQueryChange,
  deferredCatalogQuery,
  products,
  productVariants,
  searchingCatalog,
  catalogUnavailable = false,
  variantQuantities,
  onVariantQuantityChange,
  onAddVariant,
  canAddToOrder,
  pendingAddVariantIds,
}: POSCatalogPanelProps) {
  const [browseMode, setBrowseMode] = useState<BrowseMode>("quick_sale")
  const [selectedProduct, setSelectedProduct] = useState<ProductCatalogItem | null>(null)
  const showSearchResults = deferredCatalogQuery.length >= 2

  const productGroups = useMemo(() => {
    const filtered = products.filter((product) => productStock(product) > 0)
    return {
      quickSale: filtered.filter((product) => product.quick_sale),
      all: filtered,
    }
  }, [products])

  const activeProducts = showSearchResults
    ? productGroups.all
    : browseMode === "quick_sale"
      ? productGroups.quickSale.length > 0
        ? productGroups.quickSale
        : productGroups.all
      : productGroups.all

  const selectedVariantOptions = selectedProduct ? productVariantCandidates(selectedProduct, productVariants) : []
  const selectedProductStock = selectedProduct ? productStock(selectedProduct) : 0

  const handleChooseProduct = (product: ProductCatalogItem) => {
    const fallbackStock = productStock(product)
    const variants = productVariantCandidates(product, productVariants).filter((variant) => variantStock(variant, fallbackStock) > 0)

    if (variants.length === 0) {
      toast.error("No sellable variant details are available for this product yet.")
      return
    }

    if (variants.length === 1) {
      void onAddVariant(variants[0].id)
      return
    }

    setSelectedProduct(product)
  }

  return (
    <>
      <Card className="h-full overflow-hidden border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingBag className="h-4 w-4 text-blue-600" />
              Product catalog
            </CardTitle>
            <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => setBrowseMode("quick_sale")}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${browseMode === "quick_sale" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}`}
              >
                Quick sale
              </button>
              <button
                type="button"
                onClick={() => setBrowseMode("all")}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${browseMode === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}`}
              >
                All products
              </button>
            </div>
          </div>
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
          <ScrollArea className="h-[760px]">
            <div className="space-y-5 p-5">
              <div className="rounded-[24px] border border-blue-100 bg-blue-50/70 p-4">
                <div className="flex items-start gap-3">
                  <Layers3 className="mt-0.5 h-5 w-5 text-blue-700" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Cashier catalog</p>
                    <p className="mt-1 text-sm text-blue-800">
                      Only sellable products with stock are shown here. Products with multiple variants will ask the cashier to choose the exact option.
                    </p>
                  </div>
                </div>
              </div>

              {showSearchResults ? (
                <div className="flex items-center justify-between gap-3 rounded-[24px] border border-gray-200 bg-gray-50 p-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Search className="h-4 w-4 text-blue-600" />
                      Search results
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {searchingCatalog ? "Searching catalog..." : `Found ${activeProducts.length} matching products with stock.`}
                    </p>
                  </div>
                </div>
              ) : browseMode === "quick_sale" ? (
                <div className="rounded-[24px] border border-amber-100 bg-amber-50/60 p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-5 w-5 text-amber-600" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Quick-sale favourites</p>
                      <p className="mt-1 text-sm text-amber-800">
                        Cashier-first shortcuts for products already marked as quick sale and currently in stock.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {searchingCatalog ? (
                <div className="space-y-4">
                  <div className="rounded-[24px] border border-blue-100 bg-blue-50/60 p-6">
                    <p className="text-base font-semibold text-blue-900">Loading POS products</p>
                    <p className="mt-2 text-sm text-blue-800">
                      Fetching the latest sellable products, stock, and variant details for the cashier.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={`catalog-skeleton-${index}`}
                        className="rounded-[28px] border border-gray-200 bg-white p-4 shadow-sm"
                      >
                        <div className="space-y-4 animate-pulse">
                          <div className="space-y-2">
                            <div className="h-6 w-3/4 rounded bg-gray-200" />
                            <div className="h-3 w-1/2 rounded bg-gray-100" />
                            <div className="h-3 w-1/3 rounded bg-gray-100" />
                          </div>
                          <div className="h-44 w-full rounded-2xl border border-gray-200 bg-gray-100" />
                          <div className="flex items-end justify-between gap-3">
                            <div className="space-y-2">
                              <div className="h-5 w-24 rounded bg-gray-200" />
                              <div className="h-3 w-20 rounded bg-gray-100" />
                            </div>
                            <div className="h-10 w-20 rounded bg-gray-100" />
                          </div>
                          <div className="h-11 w-full rounded bg-gray-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : catalogUnavailable ? (
                <div className="rounded-[24px] border border-dashed border-amber-300 bg-amber-50 p-8 text-center">
                  <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
                  <p className="mt-4 text-base font-semibold text-amber-900">Product catalog is unavailable</p>
                  <p className="mt-2 text-sm text-amber-800">
                    The POS page could not load products from the product service right now. Reload this page after the service is healthy.
                  </p>
                </div>
              ) : activeProducts.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <AlertTriangle className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-4 text-base font-semibold text-gray-900">No sellable products found</p>
                  <p className="mt-2 text-sm text-gray-600">
                    {showSearchResults
                      ? "Try another search term. Only products with available stock are listed."
                      : "There are no in-stock POS products to show in this view right now."}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {activeProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      productVariants={productVariants}
                      currencyCode={currencyCode}
                      quantityValue={variantQuantities[product.id] || "1"}
                      onQuantityChange={onVariantQuantityChange}
                      onChoose={handleChooseProduct}
                      canAddToOrder={canAddToOrder}
                      pendingAddVariantIds={pendingAddVariantIds}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <VariantPickerDialog
        open={!!selectedProduct}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProduct(null)
          }
        }}
        product={selectedProduct}
        variants={selectedVariantOptions}
        fallbackStock={selectedProductStock}
        currencyCode={currencyCode}
        variantQuantities={variantQuantities}
        onVariantQuantityChange={onVariantQuantityChange}
        onAddVariant={async (variantId) => {
          await onAddVariant(variantId)
          setSelectedProduct(null)
        }}
        canAddToOrder={canAddToOrder}
        pendingAddVariantIds={pendingAddVariantIds}
      />
    </>
  )
}

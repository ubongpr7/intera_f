"use client"

import { useDeferredValue, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, Boxes, Eye, ImageIcon, PackagePlus, Search, Sparkles } from "lucide-react"
import { toast } from "react-toastify"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  useCreateGlobalCatalogImportMutation,
  useGetGlobalCatalogProductQuery,
  useGetGlobalCatalogProductsQuery,
  usePreviewGlobalCatalogProductImportQuery,
} from "@/redux/features/product/productAPISlice"
import type { GlobalCatalogProduct } from "@/redux/features/product/productTypes"

function ProductLibraryCard({
  product,
  importing,
  selected,
  onImport,
  onPreview,
  onToggleSelect,
}: {
  product: GlobalCatalogProduct
  importing: boolean
  selected: boolean
  onImport: (productIds: string[]) => Promise<void>
  onPreview: (productId: string) => void
  onToggleSelect: (productId: string) => void
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-gray-300">
      <div className="flex items-start gap-4">
        <div className="pt-1">
          <Checkbox checked={selected} onCheckedChange={() => onToggleSelect(product.id)} aria-label={`Select ${product.name}`} />
        </div>
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
          {product.display_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.display_image} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-gray-950">{product.name}</p>
              <p className="mt-1 text-sm text-gray-600">
                {[product.brand, product.category_name].filter(Boolean).join(" · ") || "Curated global catalog product"}
              </p>
            </div>
            {product.imported ? (
              <Badge className="rounded-full border-green-200 bg-green-50 px-3 py-1 text-green-700 hover:bg-green-50">
                Imported
              </Badge>
            ) : (
              <Badge variant="outline" className="rounded-full px-3 py-1 text-gray-600">
                Ready to import
              </Badge>
            )}
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600">
            {product.short_description || "Import this curated family into the workspace with variants and inherited media."}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="rounded-full bg-gray-100 px-3 py-1">{product.variant_count} variants</span>
            {product.unit ? <span className="rounded-full bg-gray-100 px-3 py-1">{product.unit}</span> : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="rounded-full" onClick={() => onPreview(product.id)}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            {product.imported && product.workspace_product_id ? (
              <Button asChild variant="outline" className="rounded-full">
                <Link href={`/product/${product.workspace_product_id}`}>
                  Open imported product
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button type="button" onClick={() => void onImport([product.id])} disabled={importing} className="rounded-full">
                <PackagePlus className="mr-2 h-4 w-4" />
                {importing ? "Importing..." : "Import to workspace"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function GlobalProductPreviewSheet({
  productId,
  onOpenChange,
}: {
  productId: string | null
  onOpenChange: (open: boolean) => void
}) {
  const { data: product, isLoading } = useGetGlobalCatalogProductQuery(productId || "", { skip: !productId })
  const { data: importPreview, isFetching: loadingPreview } = usePreviewGlobalCatalogProductImportQuery(productId || "", { skip: !productId })

  return (
    <Sheet open={!!productId} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl">
        <SheetHeader className="pr-8">
          <SheetTitle>{isLoading ? "Loading product preview..." : product?.name || "Global product preview"}</SheetTitle>
          <SheetDescription>
            Review the curated family before you import it into the workspace. This preview shows the source variants and inherited product media.
          </SheetDescription>
        </SheetHeader>

        {isLoading || !product ? (
          <div className="mt-6 rounded-3xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">Loading preview...</div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex flex-wrap items-start gap-4">
                <div className="h-28 w-28 overflow-hidden rounded-3xl border border-gray-200 bg-white">
                  {product.display_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.display_image} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      <ImageIcon className="h-7 w-7" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {product.brand ? <Badge variant="outline" className="rounded-full">{product.brand}</Badge> : null}
                    {product.category_name ? <Badge variant="outline" className="rounded-full">{product.category_name}</Badge> : null}
                    <Badge className="rounded-full border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50">
                      {product.variant_count} variants
                    </Badge>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-gray-700">
                    {product.description || product.short_description || "No source description has been added yet."}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Import status</p>
                <p className="mt-2 text-lg font-semibold text-gray-950">
                  {loadingPreview ? "Checking..." : importPreview?.imported ? "Already imported" : "Ready"}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Variants to add</p>
                <p className="mt-2 text-lg font-semibold text-gray-950">
                  {loadingPreview ? "..." : importPreview?.missing_variant_count ?? product.variant_count}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Source version</p>
                <p className="mt-2 text-lg font-semibold text-gray-950">
                  {loadingPreview ? "..." : importPreview?.source_version ?? "-"}
                </p>
              </div>
            </div>

            {importPreview?.imported ? (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                This product family is already linked to the workspace. Use the imported-products sync panel to add newly published variants without creating a duplicate product.
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              {(product.variants || []).map((variant) => (
                <div key={variant.id} className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                      {variant.display_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={variant.display_image} alt={variant.display_name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-950">{variant.display_name}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                        {variant.barcode ? <span className="rounded-full bg-gray-100 px-3 py-1">{variant.barcode}</span> : null}
                        {variant.sku ? <span className="rounded-full bg-gray-100 px-3 py-1">{variant.sku}</span> : null}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(variant.attributes_snapshot || {}).map(([key, value]) => (
                          <span key={`${variant.id}-${key}`} className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600">
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default function GlobalProductLibrary() {
  const [query, setQuery] = useState("")
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [previewProductId, setPreviewProductId] = useState<string | null>(null)
  const [pendingProductIds, setPendingProductIds] = useState<string[]>([])
  const deferredQuery = useDeferredValue(query.trim())
  const { data: products = [], isLoading } = useGetGlobalCatalogProductsQuery(deferredQuery ? { q: deferredQuery } : {})
  const [createImport, { isLoading: importing }] = useCreateGlobalCatalogImportMutation()

  const visibleProducts = useMemo(() => products, [products])
  const selectableIds = useMemo(() => visibleProducts.filter((product) => !product.imported).map((product) => product.id), [visibleProducts])
  const selectedCount = selectedProductIds.length

  const toggleSelected = (productId: string) => {
    setSelectedProductIds((current) => (current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]))
  }

  const toggleSelectAll = () => {
    setSelectedProductIds((current) => (current.length === selectableIds.length ? [] : selectableIds))
  }

  const handleImport = async (productIds: string[]) => {
    if (!productIds.length) {
      return
    }
    try {
      setPendingProductIds(productIds)
      const response = await createImport({ global_product_ids: productIds }).unwrap()
      const importedTotal = response.results.reduce((sum, result) => sum + result.imported_variants, 0)
      const importedNames = response.results.map((result) => result.global_product_name)
      setSelectedProductIds((current) => current.filter((id) => !productIds.includes(id)))
      toast.success(
        `${importedNames.length === 1 ? importedNames[0] : `${importedNames.length} product families`} imported with ${importedTotal} new variant${importedTotal === 1 ? "" : "s"}.`,
      )
      const hasConflicts = response.results.some((result) => result.barcode_conflicts.length > 0 || result.sku_conflicts.length > 0)
      if (hasConflicts) {
        toast.info("Some source barcodes or SKUs were skipped because they already exist elsewhere in the catalog service.")
      }
    } catch (error: any) {
      const detail = error?.data?.detail || "Failed to import the selected global products."
      toast.error(detail)
    } finally {
      setPendingProductIds([])
    }
  }

  return (
    <>
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100 p-6 text-left text-inherit">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                <Boxes className="h-3.5 w-3.5" />
                Global product library
              </div>
              <CardTitle className="mt-3 text-2xl tracking-tight">Import curated product families instead of rebuilding them manually</CardTitle>
              <CardDescription className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                This starter catalog is platform-curated. Preview what is inside, select multiple families, and import them into your workspace with inherited media and source variants.
              </CardDescription>
            </div>
            <div className="w-full max-w-sm">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search Nivea, Sure, Ritz, perfume, lotion..."
                  className="h-12 rounded-full border-gray-200 bg-white pl-11"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectableIds.length > 0 && selectedCount === selectableIds.length}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all importable products"
                />
                <span className="text-sm font-medium text-gray-900">Select all importable products</span>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs text-gray-600">{visibleProducts.length} visible</span>
              <span className="rounded-full bg-white px-3 py-1 text-xs text-gray-600">{selectedCount} selected</span>
            </div>
            <Button
              type="button"
              onClick={() => void handleImport(selectedProductIds)}
              disabled={selectedCount === 0 || importing}
              className="rounded-full"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {importing ? "Importing selection..." : `Import selected${selectedCount > 0 ? ` (${selectedCount})` : ""}`}
            </Button>
          </div>

          {isLoading ? (
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
              Loading curated product families...
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-base font-semibold text-gray-900">No curated products matched this search.</p>
              <p className="mt-2 text-sm text-gray-600">Try a brand name, product type, or category keyword.</p>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {visibleProducts.map((product) => (
                <ProductLibraryCard
                  key={product.id}
                  product={product}
                  importing={pendingProductIds.includes(product.id)}
                  selected={selectedProductIds.includes(product.id)}
                  onImport={handleImport}
                  onPreview={setPreviewProductId}
                  onToggleSelect={toggleSelected}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <GlobalProductPreviewSheet productId={previewProductId} onOpenChange={(open) => !open && setPreviewProductId(null)} />
    </>
  )
}

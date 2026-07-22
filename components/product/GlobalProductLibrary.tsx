"use client"

import { useDeferredValue, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { AlertCircle, ArrowRight, Barcode, Boxes, CheckCircle2, ChevronLeft, ChevronRight, Eye, Filter, ImageIcon, PackagePlus, Search, Sparkles } from "lucide-react"
import { toast } from "react-toastify"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ReactSelectField, type SelectOption } from "@/components/ui/react-select-field"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { formatMachineLabel } from "@/lib/displayLabels"
import { useSubscriptionQuota } from "@/hooks/useSubscriptionQuota"
import {
  useCreateGlobalCatalogImportMutation,
  useGetGlobalCatalogProductQuery,
  useGetGlobalCatalogProductsQuery,
  useGetGlobalCatalogStatsQuery,
  useGetProductDataQuery,
  usePreviewGlobalCatalogProductImportQuery,
  useResolveGlobalCatalogBarcodesMutation,
} from "@/redux/features/product/productAPISlice"
import type { GlobalCatalogBarcodeResolveResponse, GlobalCatalogProduct } from "@/redux/features/product/productTypes"

type GlobalProductLibraryMode = "workspace" | "admin"

type GlobalProductLibraryProps = {
  mode?: GlobalProductLibraryMode
}

const RAW_METADATA_KEYS = new Set(["raw_product", "raw_image_urls", "identifiers", "category"])
const CURATED_METADATA_KEYS = new Set(["brand", "model", "barcode", "barcode_type", "source_query", "source_imported_at"])

function stringifyMetadataValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return ""
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => stringifyMetadataValue(item))
      .filter(Boolean)
      .slice(0, 3)
      .join(", ")
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>
    const preferredValue =
      record.path ||
      record.name ||
      record.label ||
      record.value ||
      record.ean13 ||
      record.upc ||
      record.isbn13 ||
      record.isbn10
    if (preferredValue) {
      return stringifyMetadataValue(preferredValue)
    }
    return Object.entries(record)
      .map(([key, nestedValue]) => {
        const nestedText = stringifyMetadataValue(nestedValue)
        return nestedText ? `${key}: ${nestedText}` : ""
      })
      .filter(Boolean)
      .slice(0, 3)
      .join(" · ")
  }
  return ""
}

function humanizeMetadataKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function shortenMetadataValue(value: string): string {
  if (value.length <= 96) {
    return value
  }
  return `${value.slice(0, 93)}...`
}

function buildVariantMetadataBadges(attributes: Record<string, unknown> | undefined) {
  if (!attributes) {
    return []
  }

  const badges: Array<{ key: string; label: string; value: string }> = []
  const pushBadge = (key: string, label: string, value: unknown) => {
    const text = shortenMetadataValue(stringifyMetadataValue(value))
    const normalizedLabel = label.trim().toLowerCase()
    if (!text || badges.some((badge) => badge.label.trim().toLowerCase() === normalizedLabel && badge.value === text)) {
      return
    }
    badges.push({ key, label, value: text })
  }

  pushBadge("brand", "Brand", attributes.brand)
  pushBadge("model", "Model", attributes.model)
  pushBadge("barcode", "Barcode", attributes.barcode)
  pushBadge("barcode_type", "Barcode type", attributes.barcode_type)
  pushBadge("source_query", "Source query", attributes.source_query)

  const category = attributes.category as Record<string, unknown> | undefined
  pushBadge("category", "Category", category?.path ?? category?.name)

  const identifiers = attributes.identifiers as Record<string, unknown> | undefined
  const identifierValues = identifiers?.values as Record<string, unknown> | undefined
  pushBadge("identifier_upc", "UPC", identifierValues?.upc)
  pushBadge("identifier_ean13", "EAN-13", identifierValues?.ean13)
  pushBadge("source_imported_at", "Imported", attributes.source_imported_at)

  Object.entries(attributes)
    .filter(([key]) => !RAW_METADATA_KEYS.has(key) && !CURATED_METADATA_KEYS.has(key))
    .forEach(([key, value]) => pushBadge(key, humanizeMetadataKey(key), value))

  return badges.slice(0, 12)
}

function parseBarcodeText(value: string) {
  const seen = new Set<string>()
  return value
    .split(/[\s,;]+/)
    .map((item) => item.trim().replace(/[\s\-_]/g, ""))
    .filter((item) => {
      if (!item || seen.has(item)) {
        return false
      }
      seen.add(item)
      return true
    })
}

function barcodeResolutionSummary(resolution: GlobalCatalogBarcodeResolveResponse) {
  const parts = [
    `${resolution.matched_count} matched`,
    `${resolution.duplicate_count} already in workspace`,
    `${resolution.not_found_count} not found`,
  ]
  if (resolution.created_global_count > 0) {
    parts.push(`${resolution.created_global_count} curated from barcode lookup`)
  }
  return parts.join(" · ")
}

function buildVisiblePageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 1) {
    return [1]
  }
  const start = Math.max(1, currentPage - 2)
  const end = Math.min(totalPages, start + 4)
  const normalizedStart = Math.max(1, end - 4)
  return Array.from({ length: end - normalizedStart + 1 }, (_, index) => normalizedStart + index)
}

type BrowserBarcodeDetector = {
  detect: (source: ImageBitmap) => Promise<Array<{ rawValue?: string }>>
}

type BrowserBarcodeDetectorConstructor = {
  new (options?: { formats?: string[] }): BrowserBarcodeDetector
  getSupportedFormats?: () => Promise<string[]>
}

async function detectBarcodesFromImage(file: File) {
  if (typeof window === "undefined" || typeof createImageBitmap === "undefined") {
    throw new Error("Image barcode extraction is not available in this browser.")
  }
  const BarcodeDetectorConstructor = (window as unknown as { BarcodeDetector?: BrowserBarcodeDetectorConstructor }).BarcodeDetector
  if (!BarcodeDetectorConstructor) {
    throw new Error("This browser does not support image barcode extraction yet. Paste the barcode text instead.")
  }
  const supportedFormats = typeof BarcodeDetectorConstructor.getSupportedFormats === "function"
    ? await BarcodeDetectorConstructor.getSupportedFormats()
    : []
  const detector = new BarcodeDetectorConstructor({
    formats: supportedFormats.length ? supportedFormats : ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"],
  })
  const image = await createImageBitmap(file)
  try {
    const results = await detector.detect(image)
    return results.map((result) => result.rawValue || "").filter(Boolean)
  } finally {
    image.close()
  }
}

function ProductLibraryCard({
  product,
  importing,
  selected,
  canImport,
  onImport,
  onPreview,
  onToggleSelect,
}: {
  product: GlobalCatalogProduct
  importing: boolean
  selected: boolean
  canImport: boolean
  onImport: (productIds: string[]) => Promise<void>
  onPreview: (productId: string) => void
  onToggleSelect: (productId: string) => void
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-gray-300">
      <div className="flex items-start gap-4">
        {canImport ? (
          <div className="pt-1">
            <Checkbox checked={selected} onCheckedChange={() => onToggleSelect(product.id)} aria-label={`Select ${product.name}`} />
          </div>
        ) : null}
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
            {canImport ? (
              product.imported ? (
                <Badge className="rounded-full border-green-200 bg-green-50 px-3 py-1 text-green-700 hover:bg-green-50">
                  Imported
                </Badge>
              ) : (
                <Badge variant="outline" className="rounded-full px-3 py-1 text-gray-600">
                  Ready to import
                </Badge>
              )
            ) : (
              <Badge variant="outline" className="rounded-full px-3 py-1 text-gray-600">
                Published catalog
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
            {canImport && product.imported && product.workspace_product_id ? (
              <Button asChild variant="outline" className="rounded-full">
                <Link href={`/product/${product.workspace_product_id}`}>
                  Open imported product
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : canImport ? (
              <Button type="button" onClick={() => void onImport([product.id])} disabled={importing} className="rounded-full">
                <PackagePlus className="mr-2 h-4 w-4" />
                {importing ? "Importing..." : "Import to workspace"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export function GlobalProductPreviewSheet({
  productId,
  onOpenChange,
  mode,
  sourceStatus,
}: {
  productId: string | null
  onOpenChange: (open: boolean) => void
  mode: GlobalProductLibraryMode
  sourceStatus?: string | null
}) {
  const { currentData: product, isFetching: loadingProduct } = useGetGlobalCatalogProductQuery(productId || "", { skip: !productId })
  const { currentData: importPreview, isFetching: loadingPreview } = usePreviewGlobalCatalogProductImportQuery(productId || "", { skip: !productId || mode !== "workspace" })
  const previewIsLoading = Boolean(productId) && (loadingProduct || !product)

  return (
    <Sheet open={!!productId} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl">
        <SheetHeader className="pr-8">
          <SheetTitle>{previewIsLoading ? "Loading product preview..." : product?.name || "Global product preview"}</SheetTitle>
          <SheetDescription>
            Review the curated family before you import it into the workspace. This preview shows the source variants and inherited product media.
          </SheetDescription>
        </SheetHeader>

        {previewIsLoading || !product ? (
          <div className="mt-6 space-y-5">
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex gap-4">
                <div className="h-28 w-28 animate-pulse rounded-3xl bg-gray-200" />
                <div className="flex-1 space-y-3 py-2">
                  <div className="h-4 w-40 animate-pulse rounded-full bg-gray-200" />
                  <div className="h-4 w-2/3 animate-pulse rounded-full bg-gray-200" />
                  <div className="h-4 w-1/2 animate-pulse rounded-full bg-gray-200" />
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-3xl border border-gray-200 bg-white p-4">
                  <div className="flex gap-4">
                    <div className="h-20 w-20 animate-pulse rounded-2xl bg-gray-100" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-4/5 animate-pulse rounded-full bg-gray-100" />
                      <div className="h-4 w-2/5 animate-pulse rounded-full bg-gray-100" />
                      <div className="h-4 w-3/5 animate-pulse rounded-full bg-gray-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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

            {mode === "workspace" ? (
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
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Catalog status</p>
                  <p className="mt-2 text-lg font-semibold text-gray-950">{formatMachineLabel(sourceStatus || "published")}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Active variants</p>
                  <p className="mt-2 text-lg font-semibold text-gray-950">{product.variant_count}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Brand group</p>
                  <p className="mt-2 text-lg font-semibold text-gray-950">{product.brand || "Unbranded"}</p>
                </div>
              </div>
            )}

            {mode === "workspace" && importPreview?.imported ? (
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
                        {buildVariantMetadataBadges(variant.attributes_snapshot).map((badge, badgeIndex) => (
                          <span key={`${variant.id}-${badge.key}-${badgeIndex}`} className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600">
                            <span className="font-medium text-gray-800">{badge.label}:</span> {badge.value}
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

export default function GlobalProductLibrary({ mode = "workspace" }: GlobalProductLibraryProps) {
  const isWorkspaceMode = mode === "workspace"
  const [query, setQuery] = useState("")
  const [brand, setBrand] = useState("")
  const [category, setCategory] = useState("")
  const [page, setPage] = useState(1)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [barcodeText, setBarcodeText] = useState("")
  const [barcodeResolution, setBarcodeResolution] = useState<GlobalCatalogBarcodeResolveResponse | null>(null)
  const [selectedBarcodeProductIds, setSelectedBarcodeProductIds] = useState<string[]>([])
  const [previewProductId, setPreviewProductId] = useState<string | null>(null)
  const [pendingProductIds, setPendingProductIds] = useState<string[]>([])
  const [extractingImageBarcodes, setExtractingImageBarcodes] = useState(false)
  const barcodeImageInputRef = useRef<HTMLInputElement | null>(null)
  const deferredQuery = useDeferredValue(query.trim())
  const selectMenuPortalTarget = typeof document !== "undefined" ? document.body : null
  const { data: catalogPage, isLoading, isFetching } = useGetGlobalCatalogProductsQuery({
    q: deferredQuery || undefined,
    brand: brand || undefined,
    category: category || undefined,
    page,
    page_size: 30,
  })
  const { data: catalogStats, isLoading: loadingStats } = useGetGlobalCatalogStatsQuery()
  const { data: workspaceProducts = [] } = useGetProductDataQuery(undefined, { skip: !isWorkspaceMode })
  const [createImport, { isLoading: importing }] = useCreateGlobalCatalogImportMutation()
  const [resolveBarcodes, { isLoading: resolvingBarcodes }] = useResolveGlobalCatalogBarcodesMutation()

  const visibleProducts = useMemo(() => catalogPage?.results ?? [], [catalogPage])
  const brandOptions = useMemo<SelectOption[]>(
    () => (catalogStats?.filters?.brands ?? catalogPage?.filters?.brands ?? []).map((option) => ({ value: option, label: option })),
    [catalogPage?.filters?.brands, catalogStats?.filters?.brands],
  )
  const categoryOptions = useMemo<SelectOption[]>(
    () => (catalogStats?.filters?.categories ?? catalogPage?.filters?.categories ?? []).map((option) => ({ value: option, label: option })),
    [catalogPage?.filters?.categories, catalogStats?.filters?.categories],
  )
  const selectedBrandOption = brand ? { value: brand, label: brand } : null
  const selectedCategoryOption = category ? { value: category, label: category } : null
  const filteredCount = catalogPage?.count ?? 0
  const totalCount = catalogStats?.total_products ?? filteredCount
  const totalVariants = catalogStats?.total_variants ?? 0
  const importedProducts = catalogStats?.imported_products ?? 0
  const currentPage = catalogPage?.page ?? page
  const pageSize = catalogPage?.page_size ?? 30
  const totalPages = catalogPage?.total_pages ?? Math.max(1, Math.ceil((filteredCount || 0) / pageSize))
  const pageNumbers = useMemo(() => buildVisiblePageNumbers(currentPage, totalPages), [currentPage, totalPages])
  const hasNextPage = Boolean(catalogPage?.next)
  const hasPreviousPage = Boolean(catalogPage?.previous)
  const selectableIds = useMemo(() => visibleProducts.filter((product) => !product.imported).map((product) => product.id), [visibleProducts])
  const selectedCount = selectedProductIds.length
  const parsedBarcodes = useMemo(() => parseBarcodeText(barcodeText), [barcodeText])
  const workspaceProductCount = workspaceProducts.length
  const importQuotaSingle = useSubscriptionQuota("products", workspaceProductCount, 1, { requireBillingAuthorization: true })
  const importQuotaBulk = useSubscriptionQuota("products", workspaceProductCount, Math.max(selectedCount, 1), { requireBillingAuthorization: true })
  const canImport = isWorkspaceMode && importQuotaSingle.canCreate
  const canImportBulk = isWorkspaceMode && importQuotaBulk.canCreate
  const importLocked = isWorkspaceMode && !canImport

  const toggleSelected = (productId: string) => {
    setSelectedProductIds((current) => (current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]))
  }

  const toggleSelectAll = () => {
    setSelectedProductIds((current) => (current.length === selectableIds.length ? [] : selectableIds))
  }

  const handleImport = async (productIds: string[]) => {
    if (!canImport) {
      toast.error("Choose a plan and connect the workspace card before importing products.")
      return
    }
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

  const handleResolveBarcodes = async () => {
    if (!canImport) {
      toast.error("Choose a plan and connect the workspace card before importing products.")
      return
    }
    if (!parsedBarcodes.length) {
      toast.error("Paste or type at least one barcode.")
      return
    }
    if (parsedBarcodes.length > 40) {
      toast.error("Resolve at most 40 barcodes at once.")
      return
    }
    try {
      const response = await resolveBarcodes({
        barcodes: parsedBarcodes,
        fetch_missing: true,
        source: "web_manual",
      }).unwrap()
      setBarcodeResolution(response)
      setSelectedBarcodeProductIds(
        Array.from(new Set(response.matches.filter((match) => !match.global_product.imported).map((match) => match.global_product_id))),
      )
      toast.success(barcodeResolutionSummary(response))
    } catch (error: any) {
      const detail = error?.data?.detail || "Unable to resolve the submitted barcodes."
      toast.error(detail)
    }
  }

  const toggleBarcodeProduct = (productId: string) => {
    setSelectedBarcodeProductIds((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId],
    )
  }

  const handleImportBarcodeProducts = async () => {
    if (!canImport) {
      toast.error("Choose a plan and connect the workspace card before importing products.")
      return
    }
    await handleImport(selectedBarcodeProductIds)
    setSelectedBarcodeProductIds([])
  }

  const handleBarcodeImageFiles = async (files: FileList | null) => {
    if (!canImport) {
      toast.error("Choose a plan and connect the workspace card before importing products.")
      return
    }
    const imageFiles = Array.from(files || []).filter((file) => file.type.startsWith("image/"))
    if (!imageFiles.length) {
      return
    }
    setExtractingImageBarcodes(true)
    try {
      const discovered = []
      for (const file of imageFiles) {
        discovered.push(...(await detectBarcodesFromImage(file)))
      }
      const merged = Array.from(new Set([...parseBarcodeText(barcodeText), ...discovered.map((value) => value.trim()).filter(Boolean)]))
      if (discovered.length === 0) {
        toast.info("No barcode was detected in the selected image.")
      } else {
        setBarcodeText(merged.join("\n"))
        setBarcodeResolution(null)
        setSelectedBarcodeProductIds([])
        toast.success(`${discovered.length} barcode${discovered.length === 1 ? "" : "s"} extracted from image.`)
      }
    } catch (error: any) {
      toast.error(error?.message || "Unable to extract barcode from image.")
    } finally {
      setExtractingImageBarcodes(false)
      if (barcodeImageInputRef.current) {
        barcodeImageInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="min-w-0 overflow-x-hidden">
      <Card className="w-full max-w-full overflow-hidden border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100 p-6 text-left text-inherit">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                <Boxes className="h-3.5 w-3.5" />
                {canImport ? "Global product library" : "Global catalog browser"}
              </div>
              <CardTitle className="mt-3 text-2xl tracking-tight">
                {canImport
                  ? "Choose categories and brands, then import curated product families"
                  : importLocked
                    ? "Browse the published catalog while billing is being connected"
                    : "Browse the published catalog before curating or editing source products"}
              </CardTitle>
              <CardDescription className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                {canImport
                  ? "This starter catalog is platform-curated. Preview what is inside, select categories and brands, choose multiple families, and import them into your workspace with inherited media and source variants."
                  : importLocked
                    ? "Preview product families, filters, and barcodes now. Importing stays locked until the workspace owner connects billing and chooses a plan."
                    : "Review published catalog families by name, brand, and category. This gives Intera IMS staff the same discovery context as workspace users without exposing workspace import actions."}
              </CardDescription>
            </div>
            <div className="w-full max-w-sm">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setPage(1)
                    setSelectedProductIds([])
                  }}
                  placeholder="Search Nivea, Sure, Ritz, perfume, lotion..."
                  className="h-12 rounded-full border-gray-200 bg-white pl-11"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="min-w-0 space-y-5 p-6">
          {importLocked ? (
            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Importing is locked until billing is connected.</p>
                  <p className="mt-1">
                    Browse and preview the catalog now, then open subscription setup to choose a plan and connect the workspace card before importing.
                  </p>
                </div>
                <Button asChild variant="outline" className="rounded-full border-blue-200 bg-white">
                  <Link href="/subscription">Open subscription</Link>
                </Button>
              </div>
            </div>
          ) : null}
          {canImport ? (
            <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                  <Barcode className="h-3.5 w-3.5" />
                  Add by barcode
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-700">
                  Paste or type barcodes from scanned products. Intera checks this workspace first, then the global catalog, and only calls the external barcode lookup for missing items.
                </p>
              </div>
              <div className="rounded-2xl bg-white px-3 py-2 text-xs font-medium text-gray-600">
                {parsedBarcodes.length} barcode{parsedBarcodes.length === 1 ? "" : "s"} ready
              </div>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
              <textarea
                value={barcodeText}
                onChange={(event) => {
                  setBarcodeText(event.target.value)
                  setBarcodeResolution(null)
                  setSelectedBarcodeProductIds([])
                }}
                placeholder="Paste barcodes separated by new lines, commas, or spaces"
                className="min-h-28 rounded-3xl border border-blue-100 bg-white px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-300"
              />
              <div className="flex flex-col gap-2">
                <input
                  ref={barcodeImageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => void handleBarcodeImageFiles(event.target.files)}
                />
                <Button
                  type="button"
                  onClick={() => void handleResolveBarcodes()}
                  disabled={resolvingBarcodes || parsedBarcodes.length === 0 || !canImportBulk}
                  className="rounded-full"
                >
                  {resolvingBarcodes ? "Checking..." : "Check barcodes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => barcodeImageInputRef.current?.click()}
                  disabled={extractingImageBarcodes}
                  className="rounded-full"
                >
                  {extractingImageBarcodes ? "Extracting..." : "Extract from image"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setBarcodeText("")
                    setBarcodeResolution(null)
                    setSelectedBarcodeProductIds([])
                  }}
                  className="rounded-full"
                >
                  Clear
                </Button>
              </div>
            </div>

            {barcodeResolution ? (
              <div className="mt-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-white p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {barcodeResolutionSummary(barcodeResolution)}
                  </div>
                  <Button
                  type="button"
                  onClick={() => void handleImportBarcodeProducts()}
                  disabled={selectedBarcodeProductIds.length === 0 || importing || !canImportBulk}
                  className="rounded-full"
                >
                  {importing ? "Importing..." : `Import selected families (${selectedBarcodeProductIds.length})`}
                </Button>
                </div>

                {barcodeResolution.matches.length > 0 ? (
                  <div className="grid gap-3 xl:grid-cols-2">
                    {barcodeResolution.matches.map((match) => {
                      const product = match.global_product
                      const selected = selectedBarcodeProductIds.includes(match.global_product_id)
                      return (
                        <div key={`${match.barcode}-${match.global_product_id}`} className="rounded-3xl border border-gray-200 bg-white p-4">
                          <div className="flex items-start gap-4">
                            <Checkbox
                              checked={selected}
                              disabled={product.imported}
                              onCheckedChange={() => toggleBarcodeProduct(match.global_product_id)}
                              aria-label={`Select ${product.name}`}
                            />
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                              {product.display_image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={product.display_image} alt={product.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-gray-400">
                                  <ImageIcon className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="min-w-0 flex-1 truncate font-semibold text-gray-950">{product.name}</p>
                                {product.imported ? (
                                  <Badge className="rounded-full border-green-200 bg-green-50 text-green-700 hover:bg-green-50">Already imported</Badge>
                                ) : null}
                                {match.source === "barcodespider_created" ? (
                                  <Badge className="rounded-full border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50">Newly curated</Badge>
                                ) : null}
                              </div>
                              <p className="mt-1 text-sm text-gray-600">
                                {[product.brand, product.category_name].filter(Boolean).join(" · ") || "Global catalog match"}
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {(product.variants ?? []).slice(0, 6).map((variant) => (
                                  <span
                                    key={`${match.barcode}-${variant.id}`}
                                    className={`rounded-full border px-3 py-1 text-xs ${
                                      variant.id === match.matched_variant_id
                                        ? "border-blue-300 bg-blue-50 font-semibold text-blue-700"
                                        : "border-gray-200 text-gray-600"
                                    }`}
                                  >
                                    {variant.display_name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : null}

                {barcodeResolution.duplicates.length > 0 ? (
                  <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-950">
                    <div className="mb-2 flex items-center gap-2 font-semibold">
                      <AlertCircle className="h-4 w-4" />
                      Already in this workspace
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {barcodeResolution.duplicates.map((duplicate) => (
                        <div key={duplicate.barcode} className="rounded-2xl bg-white/70 px-3 py-2">
                          <span className="font-semibold">{duplicate.barcode}</span> · {duplicate.product_name}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {barcodeResolution.misses.length > 0 ? (
                  <div className="rounded-3xl border border-red-100 bg-red-50 p-4 text-sm text-red-950">
                    <div className="mb-2 flex items-center gap-2 font-semibold">
                      <AlertCircle className="h-4 w-4" />
                      Not resolved
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {barcodeResolution.misses.map((miss) => (
                        <div key={miss.barcode} className="rounded-2xl bg-white/70 px-3 py-2">
                          <span className="font-semibold">{miss.barcode}</span> · {miss.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            </div>
          ) : null}

          <div className="grid gap-3 rounded-3xl border border-gray-200 bg-white p-4 md:grid-cols-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Filter className="h-4 w-4 text-blue-600" />
              Refine global catalog
            </div>
            <div className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <span>Brand</span>
              <ReactSelectField
                value={selectedBrandOption}
                options={brandOptions}
                onChange={(option) => {
                  const selected = Array.isArray(option) ? null : (option as SelectOption | null)
                  setBrand(selected ? String(selected.value) : "")
                  setPage(1)
                  setSelectedProductIds([])
                }}
                placeholder="All brands"
                isClearable
                menuPortalTarget={selectMenuPortalTarget}
                className="normal-case tracking-normal"
              />
            </div>
            <div className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <span>Category</span>
              <ReactSelectField
                value={selectedCategoryOption}
                options={categoryOptions}
                onChange={(option) => {
                  const selected = Array.isArray(option) ? null : (option as SelectOption | null)
                  setCategory(selected ? String(selected.value) : "")
                  setPage(1)
                  setSelectedProductIds([])
                }}
                placeholder="All categories"
                isClearable
                menuPortalTarget={selectMenuPortalTarget}
                className="normal-case tracking-normal"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-wrap items-center gap-4">
              {canImport ? (
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectableIds.length > 0 && selectedCount === selectableIds.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all importable products on this page"
                  />
                  <span className="text-sm font-medium text-gray-900">Select all importable products on this page</span>
                </div>
              ) : null}
              <span className="rounded-full bg-white px-3 py-1 text-xs text-gray-600">
                {visibleProducts.length} visible of {filteredCount.toLocaleString()} matches
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs text-gray-600">
                {loadingStats ? "Counting library..." : `${totalCount.toLocaleString()} total families`}
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs text-gray-600">
                {totalVariants.toLocaleString()} source variants
              </span>
              {canImport ? (
                <span className="rounded-full bg-white px-3 py-1 text-xs text-gray-600">
                  {importedProducts.toLocaleString()} imported
                </span>
              ) : null}
              {canImport ? <span className="rounded-full bg-white px-3 py-1 text-xs text-gray-600">{selectedCount} selected across pages</span> : null}
              {isFetching && !isLoading ? <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">Refreshing...</span> : null}
            </div>
            {canImport ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500">Selection stays intact while you move across pages.</span>
                {!canImportBulk ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">{importQuotaBulk.message}</span>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedProductIds([])}
                  disabled={selectedCount === 0 || importing}
                  className="rounded-full"
                >
                  Clear selection
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleImport(selectedProductIds)}
                  disabled={selectedCount === 0 || importing || !canImportBulk}
                  className="rounded-full"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {importing ? "Importing selection..." : `Import selected${selectedCount > 0 ? ` (${selectedCount})` : ""}`}
                </Button>
              </div>
            ) : null}
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
            <>
              <div className="grid min-w-0 gap-4 xl:grid-cols-2">
                {visibleProducts.map((product) => (
                  <ProductLibraryCard
                    key={product.id}
                    product={product}
                    importing={pendingProductIds.includes(product.id)}
                    selected={selectedProductIds.includes(product.id)}
                    canImport={canImport}
                    onImport={handleImport}
                    onPreview={setPreviewProductId}
                    onToggleSelect={toggleSelected}
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-gray-200 bg-white p-4">
                <p className="text-sm text-gray-600">
                  Page <span className="font-semibold text-gray-950">{currentPage}</span> of <span className="font-semibold text-gray-950">{totalPages}</span> · Showing up to {pageSize} families per page
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    disabled={!hasPreviousPage || isFetching}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex flex-wrap items-center gap-2">
                    {pageNumbers.map((pageNumber) => (
                      <Button
                        key={pageNumber}
                        type="button"
                        variant={pageNumber === currentPage ? "default" : "outline"}
                        className="min-w-10 rounded-full"
                        disabled={isFetching}
                        onClick={() => setPage(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    disabled={!hasNextPage || isFetching}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <GlobalProductPreviewSheet mode={mode} productId={previewProductId} onOpenChange={(open) => !open && setPreviewProductId(null)} />
    </div>
  )
}

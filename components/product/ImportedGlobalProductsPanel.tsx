"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowRight, ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react"
import { toast } from "react-toastify"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  useListGlobalCatalogImportsQuery,
  usePreviewGlobalCatalogImportSyncQuery,
  useSyncGlobalCatalogImportMutation,
} from "@/redux/features/product/productAPISlice"
import type { GlobalCatalogImport } from "@/redux/features/product/productTypes"

function ImportedProductRow({
  entry,
  syncing,
  onSync,
}: {
  entry: GlobalCatalogImport
  syncing: boolean
  onSync: (importId: string, productName: string) => void
}) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [shouldPreview, setShouldPreview] = useState(false)

  useEffect(() => {
    const row = rowRef.current
    if (!row || shouldPreview) return

    const observer = new IntersectionObserver(
      ([observedEntry]) => {
        if (observedEntry.isIntersecting) {
          setShouldPreview(true)
          observer.disconnect()
        }
      },
      { rootMargin: "400px 0px" },
    )

    observer.observe(row)
    return () => observer.disconnect()
  }, [shouldPreview])

  const { data: preview, isFetching } = usePreviewGlobalCatalogImportSyncQuery(entry.id, { skip: !shouldPreview })
  const pendingCount = preview?.missing_variant_count ?? 0
  const sourceStatus = !shouldPreview
    ? "Not checked"
    : isFetching
      ? "Checking source..."
      : pendingCount > 0
        ? `${pendingCount} new variant${pendingCount === 1 ? "" : "s"}`
          : "Ready to resync"
  const sourceStatusClassName = !shouldPreview
    ? "border-slate-200 bg-slate-50 text-slate-700"
    : pendingCount > 0
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700"

  return (
    <div ref={rowRef} className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-lg font-semibold text-gray-900">{entry.global_product_name}</p>
            <Badge variant="outline" className="rounded-full px-3 py-1 text-gray-600">
              {entry.import_mode === "initial_import" ? "Initial import" : "Synced"}
            </Badge>
            <Badge
              variant="outline"
              className={`rounded-full px-3 py-1 ${sourceStatusClassName}`}
            >
              {sourceStatus}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {entry.imported_variant_count} variant{entry.imported_variant_count === 1 ? "" : "s"} linked to your workspace product. Sync refreshes product details, UOM settings, variant data, and inherited media.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Last source version: {entry.last_source_version}
            {entry.last_synced_at ? ` · Synced ${new Date(entry.last_synced_at).toLocaleString()}` : ""}
          </p>

          {preview?.missing_variants?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {preview.missing_variants.slice(0, 4).map((variant) => (
                <span key={variant.id} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600">
                  {variant.display_name}
                </span>
              ))}
              {preview.missing_variants.length > 4 ? (
                <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-500">
                  +{preview.missing_variants.length - 4} more
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" className="rounded-full">
            <Link href={`/product/${entry.workspace_product_id}`}>
              Open product
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            type="button"
            onClick={() => onSync(entry.id, entry.global_product_name)}
            disabled={syncing || !shouldPreview || isFetching}
            className="rounded-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {syncing ? "Syncing..." : !shouldPreview ? "Not checked" : isFetching ? "Checking..." : "Sync now"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ImportedGlobalProductsPanel() {
  const { data: imports = [], isLoading, refetch, isFetching } = useListGlobalCatalogImportsQuery()
  const [syncImport, { isLoading: syncing }] = useSyncGlobalCatalogImportMutation()
  const [search, setSearch] = useState("")
  const [modeFilter, setModeFilter] = useState<"all" | "initial_import" | "sync">("all")
  const [page, setPage] = useState(1)
  const pageSize = 12

  const filteredImports = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return imports.filter((entry) => {
      const matchesSearch = !normalizedSearch || entry.global_product_name.toLowerCase().includes(normalizedSearch)
      const matchesMode = modeFilter === "all" || entry.import_mode === modeFilter
      return matchesSearch && matchesMode
    })
  }, [imports, modeFilter, search])

  const totalPages = Math.max(1, Math.ceil(filteredImports.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleImports = filteredImports.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleSync = async (importId: string, productName: string) => {
    try {
      const result = await syncImport(importId).unwrap()
      const updatedFields = result.updated_product_fields?.length ?? 0
      toast.success(
        `${productName} sync completed. ${result.imported_variants} new variant${result.imported_variants === 1 ? "" : "s"} added, ${result.updated_variants ?? 0} existing variant${result.updated_variants === 1 ? "" : "s"} refreshed, and ${result.inherited_images} image${result.inherited_images === 1 ? "" : "s"} synced${updatedFields ? ` across ${updatedFields} product field${updatedFields === 1 ? "" : "s"}` : ""}.`,
      )
      if (result.barcode_conflicts.length > 0 || result.sku_conflicts.length > 0) {
        toast.info("Some incoming source codes were skipped because they already exist in the catalog service.")
      }
    } catch (error: any) {
      const detail = error?.data?.detail || "Failed to synchronize the imported product."
      toast.error(detail)
    }
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-100 p-6 text-left text-inherit">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl tracking-tight">Imported global products</CardTitle>
            <CardDescription className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              These products already have a workspace link. Use sync to pull in newly published variants without duplicating the ones you already imported.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={() => void refetch()} disabled={isFetching} className="rounded-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            {isFetching ? "Refreshing..." : "Refresh imports"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {isLoading ? (
          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">Loading imported products...</div>
        ) : imports.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="text-base font-semibold text-gray-900">No global products imported yet.</p>
            <p className="mt-2 text-sm text-gray-600">Import a curated family above and it will appear here for later synchronization.</p>
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value)
                      setPage(1)
                    }}
                    placeholder="Search imported products..."
                    className="h-11 rounded-full border-gray-200 bg-white pl-10 text-gray-900"
                    aria-label="Search imported products"
                  />
                </div>
                <select
                  value={modeFilter}
                  onChange={(event) => {
                    setModeFilter(event.target.value as typeof modeFilter)
                    setPage(1)
                  }}
                  className="h-11 rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none focus:border-blue-500"
                  aria-label="Filter imported products by import mode"
                >
                  <option value="all">All import states</option>
                  <option value="initial_import">Initial imports</option>
                  <option value="sync">Synced products</option>
                </select>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                <span>
                  Showing {visibleImports.length ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, filteredImports.length)} of {filteredImports.length} imported products
                </span>
                {search || modeFilter !== "all" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("")
                      setModeFilter("all")
                      setPage(1)
                    }}
                    className="font-medium text-blue-700 hover:text-blue-800"
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
            </div>

            {visibleImports.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <p className="text-base font-semibold text-gray-900">No imported products match these filters.</p>
                <p className="mt-2 text-sm text-gray-600">Try another product name or clear the filters.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleImports.map((entry) => (
              <ImportedProductRow key={entry.id} entry={entry} syncing={syncing} onSync={(importId, productName) => void handleSync(importId, productName)} />
                ))}
              </div>
            )}

            {filteredImports.length > pageSize ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500">Page {currentPage} of {totalPages}</p>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" className="rounded-full" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <Button type="button" variant="outline" className="rounded-full" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage === totalPages}>
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}

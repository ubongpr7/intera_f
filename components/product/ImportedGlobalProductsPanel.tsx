"use client"

import Link from "next/link"
import { ArrowRight, RefreshCw } from "lucide-react"
import { toast } from "react-toastify"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  const { data: preview, isFetching } = usePreviewGlobalCatalogImportSyncQuery(entry.id)
  const pendingCount = preview?.missing_variant_count ?? 0

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-lg font-semibold text-gray-950">{entry.global_product_name}</p>
            <Badge variant="outline" className="rounded-full px-3 py-1 text-gray-600">
              {entry.import_mode === "initial_import" ? "Initial import" : "Synced"}
            </Badge>
            <Badge
              variant="outline"
              className={`rounded-full px-3 py-1 ${
                pendingCount > 0 ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {isFetching ? "Checking source..." : pendingCount > 0 ? `${pendingCount} new variant${pendingCount === 1 ? "" : "s"}` : "Up to date"}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {entry.imported_variant_count} variant{entry.imported_variant_count === 1 ? "" : "s"} linked to your workspace product.
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
            disabled={syncing || pendingCount === 0}
            className="rounded-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {syncing ? "Syncing..." : pendingCount === 0 ? "No changes" : "Sync now"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ImportedGlobalProductsPanel() {
  const { data: imports = [], isLoading, refetch, isFetching } = useListGlobalCatalogImportsQuery()
  const [syncImport, { isLoading: syncing }] = useSyncGlobalCatalogImportMutation()

  const handleSync = async (importId: string, productName: string) => {
    try {
      const result = await syncImport(importId).unwrap()
      toast.success(
        `${productName} sync completed. ${result.imported_variants} new variant${result.imported_variants === 1 ? "" : "s"} added.`,
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
          <div className="space-y-3">
            {imports.map((entry) => (
              <ImportedProductRow key={entry.id} entry={entry} syncing={syncing} onSync={(importId, productName) => void handleSync(importId, productName)} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

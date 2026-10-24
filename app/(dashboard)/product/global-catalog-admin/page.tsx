import GlobalCatalogAdminWorkspace from "@/components/product/GlobalCatalogAdminWorkspace"
import GlobalCatalogCaptureQueue from "@/components/product/GlobalCatalogCaptureQueue"

export default function GlobalCatalogAdminPage() {
  return (
    <div className="staff-catalog-page min-w-0 space-y-6 overflow-x-hidden">
      <GlobalCatalogCaptureQueue />
      <GlobalCatalogAdminWorkspace />
    </div>
  )
}

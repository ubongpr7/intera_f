import GlobalProductLibrary from "@/components/product/GlobalProductLibrary"
import ImportedGlobalProductsPanel from "@/components/product/ImportedGlobalProductsPanel"

export default function ProductImportsPage() {
  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Product imports</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">Import curated global products</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-gray-600">
          Search platform-curated product families, filter by brand and category, preview variants and barcodes, then import only the products your workspace needs.
          Existing imports can be synced here without disrupting your normal product management page.
        </p>
      </section>
      <GlobalProductLibrary />
      <ImportedGlobalProductsPanel />
    </main>
  )
}

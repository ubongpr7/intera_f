import GlobalProductLibrary from "@/components/product/GlobalProductLibrary"
import ImportedGlobalProductsPanel from "@/components/product/ImportedGlobalProductsPanel"

export default function ProductImportsPage() {
  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Product imports</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">Import curated global products</h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-gray-600">
              Start with categories and brands, browse 30 products per page, preview barcodes and images, then import only the products your workspace needs.
              Existing imports can be synced here without disrupting your normal product management page.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              ["1", "Choose filters", "Pick category, brand, or both"],
              ["2", "Review products", "Browse 30 global families at a time"],
              ["3", "Import selection", "Select one page or continue across pages"],
            ].map(([step, title, text]) => (
              <div key={title} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">Step {step}</p>
                <p className="mt-1 text-sm font-semibold text-gray-950">{title}</p>
                <p className="mt-1 text-xs leading-5 text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <GlobalProductLibrary />
      <ImportedGlobalProductsPanel />
    </main>
  )
}

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import GlobalProductLibrary from "@/components/product/GlobalProductLibrary"

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
              Imported products now live on a separate page so this view stays focused on picking new products.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["1", "Choose filters", "Pick category, brand, or both"],
                ["2", "Review products", "Browse 30 global families at a time"],
              ].map(([step, title, text]) => (
                <div key={title} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">Step {step}</p>
                  <p className="mt-1 text-sm font-semibold text-gray-950">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-gray-600">{text}</p>
                </div>
              ))}
            </div>
            <Link
              href="/product/imports/imported"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
            >
              View imported products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      <GlobalProductLibrary />
    </main>
  )
}

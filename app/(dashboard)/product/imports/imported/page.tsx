import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import ImportedGlobalProductsPanel from "@/components/product/ImportedGlobalProductsPanel"
import { Button } from "@/components/ui/button"

export default function ImportedProductsPage() {
  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Imported products</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">Manage imported global products</h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-gray-600">
              This page keeps the imported-product sync list separate from the import browser so the workspace can load faster on the main import screen.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/product/imports">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to imports
            </Link>
          </Button>
        </div>
      </section>

      <ImportedGlobalProductsPanel />
    </main>
  )
}

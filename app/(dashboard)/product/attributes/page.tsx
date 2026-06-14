"use client"

import Link from "next/link"
import { ArrowLeft, Tags } from "lucide-react"
import ProductAttributes from "@/components/product/ProductAttributes"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProductAttributeTemplatesPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 lg:px-8">
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="p-6 text-left text-inherit">
          <Link href="/product" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Back to product setup
          </Link>
          <div className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            <Tags className="h-3.5 w-3.5" />
            Attribute templates
          </div>
          <CardTitle className="mt-3 text-3xl tracking-tight">Product attribute template library</CardTitle>
          <CardDescription className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Manage reusable product attribute definitions and values from one place. Product-specific attributes are still controlled by
            linking the relevant templates from each product detail page.
          </CardDescription>
        </CardHeader>
      </Card>

      <ProductAttributes productId="" mode="standalone" />
    </div>
  )
}

"use client"

import ProductOperationsWorkspace from "@/components/product/ProductOperationsWorkspace"

export default function ProductPage({ Id }: { Id: string }) {
  return <ProductOperationsWorkspace productId={Id} />
}

"use client"

import { useState } from "react"
import Tabs from "@/components/common/Tabs"
import ProductDetail from "@/components/product/Detail"
import ProductVariantManager from "@/components/product/productVariants/ProductVariantManager"
import ProductAttributeLinks from "@/components/product/ProductAttributeLink"
import ProductPricingStrategies from "@/components/product/PricingStrategy"
import ProductPOS from "@/components/product/ProductPOS"
import ProductAnalytics from "@/components/product/ProductAnalytics"
import { BarChart2, Info, Layers, Lightbulb, Settings, Sliders } from "lucide-react"
import { useGetMinimalProductQuery } from "@/redux/features/product/productAPISlice"
import { Product } from "../interfaces/product"

export default function ProductPage({ Id }: { Id: string }) {
  const [refetchData, setRefetchData] = useState(false)
  const { 
      data: product, 
      isLoading: isProductLoading 
    } = useGetMinimalProductQuery(Id)
    const ProductData= product as Product
  useGetMinimalProductQuery
  const tabs = [
    {
      id: "details",
      label: "Product Details",
      content: <ProductDetail id={Id} />,
      icon: Info,
    },
    {
      id: "variants",
      label: "Variants",
      content: (
        <ProductVariantManager
          productId={Id}
          refetchData={refetchData}
          setRefetchData={setRefetchData}
          ProductData={ProductData}
        />
      ),
      icon: Layers,
    },
    {
      id: "attribute_links",
      label: "Attribute Links",
      content: <ProductAttributeLinks setRefetchData={setRefetchData} productId={Id} product={ProductData} />,
      icon: Sliders,
    },
    {
      id: "pricing_strategy",
      label: "Pricing Strategy",
      content: <ProductPricingStrategies productId={Id} product={ProductData} />,
      icon: Lightbulb,
    },
    {
      id: "pos",
      label: "POS Settings",
      content: <ProductPOS productId={Id} product={ProductData} />,
      icon: Settings,
    },
    {
      id: "analytics",
      label: "Analytics",
      content: <ProductAnalytics productId={Id} />,
      icon: BarChart2,
    },
  ]
  return (
    <div>
      <Tabs items={tabs} />
    </div>
  )
}
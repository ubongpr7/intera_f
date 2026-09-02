"use client"

import Link from "next/link"
import { getCookie } from "cookies-next"
import { ArrowLeft, Layers3, ShoppingBag, Tag, TrendingUp } from "lucide-react"
import ProductAnalytics from "@/components/product/ProductAnalytics"
import ProductAttributeLinks from "@/components/product/ProductAttributeLink"
import ProductAttributes from "@/components/product/ProductAttributes"
import ProductDetail from "@/components/product/Detail"
import ProductMedia from "@/components/product/ProductMedia"
import ProductPOS from "@/components/product/ProductPOS"
import ProductPriceGovernanceCard from "@/components/product/ProductPriceGovernanceCard"
import ProductPricing from "@/components/product/ProductPricing"
import ProductPricingStrategies from "@/components/product/PricingStrategy"
import ProductVariantManager from "@/components/product/productVariants/ProductVariantManager"
import OperationalStepSection from "@/components/setup/OperationalStepSection"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { readCookieValue } from "@/lib/authCookies"
import { formatCurrencyCompact } from "@/lib/currency-utils"
import {
  useGetMinimalProductQuery,
  useGetProductPriceHistoryQuery,
  useGetProductQuery,
  useGetProductVariantsQuery,
} from "@/redux/features/product/productAPISlice"

type ProductOperationsWorkspaceProps = {
  productId: string
}

export default function ProductOperationsWorkspace({ productId }: ProductOperationsWorkspaceProps) {
  const { data: product, isLoading: isProductLoading } = useGetProductQuery(productId)
  const { data: minimalProduct } = useGetMinimalProductQuery(productId)
  const { data: variants = [], isLoading: loadingVariants } = useGetProductVariantsQuery(productId)
  const { data: priceHistory = [] } = useGetProductPriceHistoryQuery({ productId })

  const currencyCode = readCookieValue("currency", getCookie) || "NGN"
  const variantCount = variants.length || product?.variant_count || 0
  const posVisibleVariants = variants.filter((variant) => variant.pos_visible).length
  const featuredVariants = variants.filter((variant) => variant.is_featured).length

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 lg:px-8">
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100 p-6 text-left text-inherit">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Link href="/product" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4" />
                Back to product setup
              </Link>
              <div>
                <CardTitle className="text-3xl tracking-tight">{isProductLoading ? "Loading product..." : product?.name || "Product operations"}</CardTitle>
                <CardDescription className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                  Move this product from a basic catalog record into a real selling asset: variants, attributes, pricing, POS behavior, and
                  analytics all live in one operational workspace now.
                </CardDescription>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Base price</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">
                  {formatCurrencyCompact(currencyCode, Number(product?.base_price ?? 0))}
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Variants</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingVariants ? "..." : variantCount}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">POS visible</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingVariants ? "..." : posVisibleVariants}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Price changes</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{priceHistory.length}</div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-6 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              <ShoppingBag className="h-4 w-4" />
              Quick sale
            </div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{product?.quick_sale ? "Enabled" : "Disabled"}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              <Layers3 className="h-4 w-4" />
              Featured variants
            </div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingVariants ? "..." : featuredVariants}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              <Tag className="h-4 w-4" />
              Discount cap
            </div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{product?.max_discount_percent ?? 0}%</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              <TrendingUp className="h-4 w-4" />
              POS ready
            </div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{product?.pos_ready ? "Yes" : "No"}</div>
          </div>
        </CardContent>
      </Card>

      <OperationalStepSection
        id="product-record"
        step={1}
        title="Maintain the core product record"
        description="Keep the product metadata, catalog category, pricing baseline, and commercial defaults accurate before you expand the sellable structure."
        helper="This is the source-of-truth layer for the product before variants and commercial rules start diverging."
        status={product ? "complete" : "in_progress"}
        facts={[
          { label: "Category", value: product?.category || "Not set" },
          { label: "Stock tracking", value: product?.track_stock ? "Tracked" : "Not tracked" },
          { label: "Status", value: product?.is_active ? "Active" : "Inactive" },
        ]}
      >
        <ProductDetail id={productId} />
      </OperationalStepSection>

      <OperationalStepSection
        id="variant-model"
        step={2}
        title="Build the variant and attribute model"
        description="Create sellable combinations, manage attribute links, and decide which variants belong in POS or featured catalog experiences."
        helper="This is where one product turns into multiple operational selling units."
        status={variantCount > 0 ? "complete" : "in_progress"}
        facts={[
          { label: "Variants", value: loadingVariants ? "..." : variantCount },
          { label: "POS visible", value: loadingVariants ? "..." : posVisibleVariants },
          { label: "Featured", value: loadingVariants ? "..." : featuredVariants },
        ]}
      >
        <div className="space-y-6">
          <div className="min-w-0 overflow-hidden">
            <ProductVariantManager
              productId={productId}
              ProductData={product || minimalProduct || {}}
            />
          </div>
          <div className="min-w-0 overflow-hidden">
            <ProductAttributeLinks
              productId={productId}
              product={product || minimalProduct || {}}
            />
          </div>
        </div>
      </OperationalStepSection>

      <OperationalStepSection
        id="commercial-controls"
        step={3}
        title="Manage shared attributes and product media assets"
        description="Create attribute definitions that this product can link to and maintain the media assets used across catalog and selling surfaces."
        helper="Attributes are shared building blocks across products. Media here covers the base product record, while variant media stays in the variant workspace."
        status={product?.attribute_links?.length ? "in_progress" : "pending"}
        facts={[
          { label: "Attribute links", value: product?.attribute_links?.length ?? 0 },
          { label: "Display image", value: product?.display_image ? "Present" : "Missing" },
          { label: "Variants", value: loadingVariants ? "..." : variantCount },
        ]}
      >
        <div className="space-y-6">
          <ProductAttributes productId={productId} />
          <ProductMedia productId={productId} />
        </div>
      </OperationalStepSection>

      <OperationalStepSection
        id="commercial-controls"
        step={4}
        title="Set pricing strategy and commercial guardrails"
        description="Manage pricing strategies, pricing rules, history, and approvals in the same place so the product’s commercial logic stays auditable."
        helper="Use strategies for baseline behavior and rules/history for specific campaign or approval-driven changes."
        status={priceHistory.length > 0 ? "complete" : "in_progress"}
        facts={[
          { label: "Price history", value: priceHistory.length },
          { label: "Base price", value: formatCurrencyCompact(currencyCode, Number(product?.base_price ?? 0)) },
          { label: "Cost price", value: formatCurrencyCompact(currencyCode, Number(product?.cost_price ?? 0)) },
        ]}
      >
        <div className="space-y-6">
          <div className="space-y-6">
            <div className="min-w-0 overflow-hidden">
              <ProductPricingStrategies productId={productId} product={product || minimalProduct || {}} />
            </div>
            <div className="min-w-0 overflow-hidden">
              <ProductPricing productId={productId} product={product || minimalProduct || {}} />
            </div>
          </div>
          <ProductPriceGovernanceCard productId={productId} productName={product?.name} />
        </div>
      </OperationalStepSection>

      <OperationalStepSection
        id="pos-readiness"
        step={5}
        title="Confirm POS readiness and monitor analytics"
        description="Once structure and pricing are stable, finish the POS-facing behavior and validate the product through its analytics and stock signals."
        helper="This is the final stage before relying on the product in live selling flows."
        status={product?.pos_ready ? "complete" : "in_progress"}
        facts={[
          { label: "Quick sale", value: product?.quick_sale ? "Enabled" : "Disabled" },
          { label: "POS ready", value: product?.pos_ready ? "Yes" : "No" },
          { label: "Tax rate", value: `${product?.tax_rate ?? 0}%` },
        ]}
      >
        <div className="space-y-6">
          <ProductPOS productId={productId} product={product || minimalProduct || {}} />
          <ProductAnalytics productId={productId} />
        </div>
      </OperationalStepSection>
    </div>
  )
}

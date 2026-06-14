"use client"

import { useMemo } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  useApprovePriceChangeMutation,
  useExportPriceHistoryCsvMutation,
  useExportVariantsCsvMutation,
  useGetPendingPriceApprovalsQuery,
  useGetPriceChangeHistoryQuery,
  useGetProductVariantsQuery,
  useGetPurchasePriceHistoryQuery,
  useRejectPriceChangeMutation,
} from "@/redux/features/product/productAPISlice"

type ProductPriceGovernanceCardProps = {
  productId: string
  productName?: string
}

const formatPrice = (value: number | string | undefined, currencyCode: string) => {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(amount)
}

export default function ProductPriceGovernanceCard({
  productId,
  productName,
}: ProductPriceGovernanceCardProps) {
  const currencyCode = "NGN"
  const { data: variants = [] } = useGetProductVariantsQuery(productId)
  const { data: priceHistory = [], refetch: refetchHistory } = useGetPriceChangeHistoryQuery({ product: productId })
  const { data: pendingApprovals = [], refetch: refetchPending } = useGetPendingPriceApprovalsQuery()
  const { data: purchaseHistory = [] } = useGetPurchasePriceHistoryQuery({ product: productId })
  const [exportVariants, { isLoading: isExportingVariants }] = useExportVariantsCsvMutation()
  const [exportPriceHistory, { isLoading: isExportingPriceHistory }] = useExportPriceHistoryCsvMutation()
  const [approvePriceChange, { isLoading: isApproving }] = useApprovePriceChangeMutation()
  const [rejectPriceChange, { isLoading: isRejecting }] = useRejectPriceChangeMutation()

  const variantIds = useMemo(() => new Set(variants.map((variant) => variant.id)), [variants])

  const relevantPendingApprovals = useMemo(
    () =>
      pendingApprovals.filter(
        (entry) => entry.product === productId || (productName ? entry.product_name === productName : false),
      ),
    [pendingApprovals, productId, productName],
  )

  const recentHistory = priceHistory.slice(0, 5)
  const recentPurchaseHistory = useMemo(
    () => purchaseHistory.filter((entry) => variantIds.has(entry.variant)).slice(0, 5),
    [purchaseHistory, variantIds],
  )

  const downloadCsv = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)
  }

  const handleExportVariants = async () => {
    try {
      const csv = await exportVariants({ product: productId }).unwrap()
      downloadCsv(csv, `${productName || "product"}-variants.csv`)
      toast.success("Variant export started.")
    } catch {
      toast.error("Failed to export variants.")
    }
  }

  const handleExportPriceHistory = async () => {
    try {
      const csv = await exportPriceHistory({ product: productId }).unwrap()
      downloadCsv(csv, `${productName || "product"}-price-history.csv`)
      toast.success("Price history export started.")
    } catch {
      toast.error("Failed to export price history.")
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await approvePriceChange(id).unwrap()
      toast.success("Price change approved.")
      await Promise.all([refetchHistory(), refetchPending()])
    } catch {
      toast.error("Failed to approve price change.")
    }
  }

  const handleReject = async (id: string) => {
    const reason = window.prompt("Reason for rejection") || ""
    try {
      await rejectPriceChange({ id, reason }).unwrap()
      toast.success("Price change rejected.")
      await Promise.all([refetchHistory(), refetchPending()])
    } catch {
      toast.error("Failed to reject price change.")
    }
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="p-6 text-left text-inherit">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Price history and approvals</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-600">
              Review recent price movement, handle pending approvals, and keep sight of the latest purchase-side pricing signals.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleExportVariants} disabled={isExportingVariants}>
              Export variants
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPriceHistory} disabled={isExportingPriceHistory}>
              Export price history
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6 pt-0">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-gray-900">Recent price history</h3>
              <div className="mt-3 space-y-3">
                {recentHistory.length ? (
                  recentHistory.map((entry) => (
                    <div key={entry.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900">{entry.variant_name || entry.product_name || "Price change"}</p>
                        <span className="text-xs uppercase tracking-wide text-gray-500">{entry.timestamp}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        {formatPrice(entry.old_price, currencyCode)} → {formatPrice(entry.new_price, currencyCode)} (
                        {entry.percentage_change?.toFixed?.(2) ?? entry.percentage_change}%)
                      </p>
                      {entry.reason ? <p className="mt-2 text-sm text-gray-600">{entry.reason}</p> : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-600">
                    No price change history is currently available for this product.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-gray-900">Recent purchase pricing</h3>
              <div className="mt-3 space-y-3">
                {recentPurchaseHistory.length ? (
                  recentPurchaseHistory.map((entry) => (
                    <div key={entry.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900">{entry.variant_name || entry.product_name || "Purchase price"}</p>
                        <span className="text-xs uppercase tracking-wide text-gray-500">{entry.effective_start}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        {formatPrice(entry.purchase_price, entry.currency || currencyCode)} • {entry.is_current ? "Current period" : "Historical"}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-600">
                    No purchase price history is currently available for this product.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900">Pending approvals</h3>
            <div className="mt-3 space-y-3">
              {relevantPendingApprovals.length ? (
                relevantPendingApprovals.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-gray-200 bg-white px-3 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">{entry.variant_name || entry.product_name || "Pending change"}</p>
                      <span className="text-xs uppercase tracking-wide text-yellow-600">pending</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {formatPrice(entry.old_price, currencyCode)} → {formatPrice(entry.new_price, currencyCode)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => handleApprove(entry.id)} disabled={isApproving}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(entry.id)} disabled={isRejecting}>
                        Reject
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-white px-3 py-4 text-sm text-gray-600">
                  No pending price approvals are currently waiting for this product.
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

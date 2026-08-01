"use client"

import { useMemo } from "react"
import { Activity, PackageOpen, Radio, Store } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { resolveAuditAssetUrl } from "@/lib/auditEventHelpers"
import { cn } from "@/lib/utils"
import type { DashboardFeedEntry, DashboardWorkspaceSnapshot } from "@/redux/features/audit/auditRealtimeDashboardTypes"
import type { DashboardSocketState } from "./useAuditRealtimeDashboard"

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })

const formatRelativeTime = (value: string) => {
  const deltaMinutes = Math.round((Date.now() - new Date(value).getTime()) / 60000)
  if (deltaMinutes <= 0) return "Just now"
  if (deltaMinutes < 60) return `${deltaMinutes}m ago`
  const deltaHours = Math.round(deltaMinutes / 60)
  if (deltaHours < 24) return `${deltaHours}h ago`
  return `${Math.round(deltaHours / 24)}d ago`
}

const variantFromSubtitle = (subtitle: string) => subtitle.split(" • ")[0] || ""

const ProductMetric = ({
  label,
  value,
  helper,
}: {
  label: string
  value: string | number
  helper: string
}) => (
  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">{label}</div>
    <div className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">{value}</div>
    <div className="mt-2 text-sm text-gray-600">{helper}</div>
  </div>
)

export default function LiveProductActivity({
  snapshot,
  socketState,
  isLoading,
}: {
  snapshot: DashboardWorkspaceSnapshot | null
  socketState: DashboardSocketState
  isLoading: boolean
}) {
  const salesFeed = useMemo(
    () =>
      (snapshot?.feed ?? [])
        .filter((entry): entry is DashboardFeedEntry => entry.stream_kind === "sale")
        .sort((left, right) => new Date(right.occurred_at).getTime() - new Date(left.occurred_at).getTime()),
    [snapshot?.feed],
  )

  const leaderboard = useMemo(() => {
    const lineCounts = new Map<string, { count: number; lastSeen: string }>()
    for (const sale of salesFeed) {
      const key = sale.title || sale.target_label || sale.reference_number
      const current = lineCounts.get(key)
      if (!current) {
        lineCounts.set(key, { count: 1, lastSeen: sale.occurred_at })
        continue
      }
      current.count += 1
      if (new Date(sale.occurred_at).getTime() > new Date(current.lastSeen).getTime()) {
        current.lastSeen = sale.occurred_at
      }
    }

    return (snapshot?.leaderboards.top_products_24h ?? [])
      .map((row) => ({
        key: row.entity_key,
        productName: row.title,
        variantName: row.subtitle,
        imageUrl: resolveAuditAssetUrl(row.image_url),
        quantity: Number(row.metric_value ?? 0),
        saleCount: lineCounts.get(row.title)?.count ?? 0,
        lastSeen: lineCounts.get(row.title)?.lastSeen ?? "",
      }))
      .sort((left, right) => {
        if (right.quantity !== left.quantity) {
          return right.quantity - left.quantity
        }
        return new Date(right.lastSeen || 0).getTime() - new Date(left.lastSeen || 0).getTime()
      })
  }, [salesFeed, snapshot?.leaderboards.top_products_24h])

  const topQuantity = Math.max(...leaderboard.map((item) => item.quantity), 0)
  const totalUnits = Number(snapshot?.metrics.sales_24h_units ?? 0)
  const totalOrders = Number(snapshot?.metrics.sales_24h_orders ?? 0)
  const latestSale = salesFeed[0]

  const connectionLabel =
    socketState === "connected" ? "Live stream online" : socketState === "connecting" ? "Connecting stream" : "Stream offline"

  return (
    <Card className="realtime-product-activity overflow-hidden border-gray-200 bg-white shadow-sm">
      <CardHeader className="border-b border-gray-100 bg-gray-100/50 p-5 text-left text-inherit">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
              <Radio className={cn("h-3.5 w-3.5", socketState === "connected" && "animate-pulse")} />
              Product sales live
            </div>
            <CardTitle className="mt-3 text-2xl tracking-tight text-gray-900">Realtime product movement</CardTitle>
            <CardDescription className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Paid POS orders flow into this board as product-level sale signals. Watch which products are climbing, who sold them, and where they were sold.
            </CardDescription>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-right">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">{connectionLabel}</div>
            <div className="mt-2 text-sm font-semibold text-gray-900">{totalOrders} paid order events loaded</div>
            <div className="mt-1 text-xs text-gray-500">Top products are projected by the audit service and refreshed via websocket.</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <ProductMetric
            label="Units in feed"
            value={totalUnits}
            helper="Projected from paid-order audit lines in the current dashboard window."
          />
          <ProductMetric
            label="Products moving"
            value={leaderboard.length}
            helper="Distinct products currently ranked by the audit projection."
          />
          <ProductMetric
            label="Latest sale"
            value={latestSale?.reference_number || "No sale yet"}
            helper={latestSale ? `${formatTime(latestSale.occurred_at)} • ${latestSale.actor_name || "System actor"}` : "Waiting for a paid POS order."}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Leaderboard</div>
                <div className="mt-1 text-sm text-gray-600">Products climb as fresh paid lines are projected into the dashboard.</div>
              </div>
              <Badge variant="outline" className="border-blue-200 bg-white text-blue-700">
                Top sellers
              </Badge>
            </div>

            <div className="mt-5 space-y-3">
              {leaderboard.filter((product) => product.quantity > 0).map((product, index) => (
                <div key={product.key} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.imageUrl} alt={product.productName} className="h-full w-full object-cover" />
                      ) : (
                        <PackageOpen className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-gray-900">
                            {index + 1}. {product.productName}
                          </div>
                          <div className="mt-1 truncate text-xs text-gray-500">
                            {product.variantName || "Base product"} • {product.saleCount} sale line{product.saleCount === 1 ? "" : "s"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">{product.quantity}</div>
                          <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">units</div>
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${topQuantity > 0 ? (product.quantity / topQuantity) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {!leaderboard.some((product) => product.quantity > 0) && !isLoading ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-12 text-center text-sm text-gray-500">
                  No paid product activity has reached the audit dashboard yet.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Recent sale stream</div>
                <div className="mt-1 text-sm text-gray-600">Operator, terminal, and location context for each sold line.</div>
              </div>
              <Badge variant="outline" className="border-blue-200 bg-white text-blue-700">
                <Activity className="mr-1 h-3.5 w-3.5" />
                Realtime
              </Badge>
            </div>

            <ScrollArea className="mt-5 h-[31rem] pr-3">
              <div className="space-y-3">
                {salesFeed.slice(0, 18).map((sale) => (
                  <div key={`${sale.audit_id}-${sale.reference_number}-${sale.title}-${sale.occurred_at}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 transition hover:border-blue-200 hover:bg-white">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white">
                        {sale.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={resolveAuditAssetUrl(sale.image_url)} alt={sale.title || sale.target_label} className="h-full w-full object-cover" />
                        ) : (
                          <PackageOpen className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-gray-900">{sale.title || sale.target_label}</div>
                            <div className="mt-1 truncate text-xs text-gray-500">
                              {variantFromSubtitle(sale.subtitle) || "Base product"}{sale.sku ? ` • SKU ${sale.sku}` : ""}
                            </div>
                          </div>
                          <div className="rounded-full border border-blue-200 bg-white px-3 py-1 text-sm font-semibold text-blue-700">
                            {sale.quantity} {sale.unit_label || "sold"}
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                          <div className="rounded-full border border-gray-200 bg-white px-3 py-1.5">
                            Seller: <span className="font-semibold text-gray-900">{sale.actor_name || "System actor"}</span>
                          </div>
                          <div className="rounded-full border border-gray-200 bg-white px-3 py-1.5">
                            Order: <span className="font-semibold text-gray-900">{sale.reference_number || "No order ref"}</span>
                          </div>
                          <div className="rounded-full border border-gray-200 bg-white px-3 py-1.5">
                            Terminal: <span className="font-semibold text-gray-900">{sale.terminal_name || "Unknown terminal"}</span>
                          </div>
                          <div className="rounded-full border border-gray-200 bg-white px-3 py-1.5">
                            <Store className="mr-1 inline h-3.5 w-3.5 text-gray-400" />
                            {sale.location_label || "No location snapshot"}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-gray-500">
                          <span>{formatTime(sale.occurred_at)}</span>
                          <span>{formatRelativeTime(sale.occurred_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {!salesFeed.length && !isLoading ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-12 text-center text-sm text-gray-500">
                    Waiting for paid POS orders to populate the live sales stream.
                  </div>
                ) : null}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useMemo } from "react"
import { PackageCheck, Radio } from "lucide-react"
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

const ReceivingMetric = ({
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

export default function LiveReceivingActivity({
  snapshot,
  socketState,
  isLoading,
}: {
  snapshot: DashboardWorkspaceSnapshot | null
  socketState: DashboardSocketState
  isLoading: boolean
}) {
  const receiptFeed = useMemo(
    () =>
      (snapshot?.feed ?? [])
        .filter((entry): entry is DashboardFeedEntry => entry.stream_kind === "receipt")
        .sort((left, right) => new Date(right.occurred_at).getTime() - new Date(left.occurred_at).getTime()),
    [snapshot?.feed],
  )

  const topLocations = useMemo(
    () =>
      (snapshot?.leaderboards.top_receiving_locations_24h ?? [])
        .map((row) => ({
          name: row.title,
          quantity: Number(row.metric_value ?? 0),
          subtitle: row.subtitle,
        }))
        .filter((row) => row.quantity > 0),
    [snapshot?.leaderboards.top_receiving_locations_24h],
  )

  const latestReceipt = receiptFeed[0]
  const totalUnitsReceived = Number(snapshot?.metrics.receiving_24h_units ?? 0)
  const totalReceiptLines = Number(snapshot?.metrics.receiving_24h_lines ?? 0)
  const activeSkus = new Set(receiptFeed.map((receipt) => receipt.sku || receipt.barcode || receipt.title).filter(Boolean)).size
  const connectionLabel =
    socketState === "connected" ? "Receiving stream online" : socketState === "connecting" ? "Connecting stream" : "Stream offline"

  return (
    <Card className="realtime-receiving-activity overflow-hidden border-gray-200 bg-white shadow-sm">
      <CardHeader className="border-b border-gray-100 bg-gray-100/50 p-5 text-left text-inherit">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
              <Radio className={cn("h-3.5 w-3.5", socketState === "connected" && "animate-pulse")} />
              Purchase receiving live
            </div>
            <CardTitle className="mt-3 text-2xl tracking-tight text-gray-900">Realtime receiving monitor</CardTitle>
            <CardDescription className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Goods-receipt line events land here as stock is received from purchase orders. This shows what arrived, where it was received, and how fast inbound stock is moving.
            </CardDescription>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-right">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">{connectionLabel}</div>
            <div className="mt-2 text-sm font-semibold text-gray-900">{totalReceiptLines} receiving lines loaded</div>
            <div className="mt-1 text-xs text-gray-500">Warehouse receipts are projected into the dashboard stream as they are posted.</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <ReceivingMetric
            label="Units received"
            value={totalUnitsReceived}
            helper="Projected from goods-receipt line audit events in the current window."
          />
          <ReceivingMetric
            label="Active SKUs"
            value={activeSkus}
            helper="Distinct products touched in the current receiving stream."
          />
          <ReceivingMetric
            label="Latest goods receipt"
            value={latestReceipt?.reference_number || "No receipt yet"}
            helper={latestReceipt ? `${formatTime(latestReceipt.occurred_at)} • ${latestReceipt.actor_name || "System actor"}` : "Waiting for a receiving action."}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Top receiving locations</div>
                <div className="mt-1 text-sm text-gray-600">Where inbound stock is landing right now.</div>
              </div>
              <Badge variant="outline" className="border-blue-200 bg-white text-blue-700">
                Receiving footprint
              </Badge>
            </div>
            <div className="mt-5 space-y-3">
              {topLocations.map((location, index) => (
                <div key={`${location.name}-${index}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-gray-900">
                        {index + 1}. {location.name}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {location.subtitle || "Purchase receiving"}
                      </div>
                    </div>
                    <div className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm font-semibold text-gray-900">
                      {location.quantity} units
                    </div>
                  </div>
                </div>
              ))}
              {topLocations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-sm text-gray-500">
                  No receiving data is visible yet in the selected audit window.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Recent receipt lines</div>
                <div className="mt-1 text-sm text-gray-600">Most recent purchase-order receiving actions across the workspace.</div>
              </div>
              <Badge variant="outline" className="border-blue-200 bg-white text-blue-700">
                Live feed
              </Badge>
            </div>
            <ScrollArea className="mt-5 h-[420px] pr-4">
              <div className="space-y-3">
                {receiptFeed.map((receipt) => (
                  <div key={`${receipt.audit_id}-${receipt.reference_number}-${receipt.title}-${receipt.occurred_at}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 transition hover:border-emerald-200 hover:bg-white">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white">
                        {receipt.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={resolveAuditAssetUrl(receipt.image_url)} alt={receipt.title || receipt.target_label} className="h-full w-full object-cover" />
                        ) : (
                          <PackageCheck className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-gray-900">{receipt.title || receipt.target_label}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                              <span>{receipt.subtitle || "Receiving line"}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="rounded-full border border-blue-200 bg-white px-3 py-1 text-sm font-semibold text-blue-700">
                              +{receipt.quantity}
                            </div>
                            <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
                              {receipt.unit_label || "received"}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                          <div className="rounded-full border border-gray-200 bg-white px-3 py-1.5">
                            Operator: <span className="font-semibold text-gray-900">{receipt.actor_name || "System actor"}</span>
                          </div>
                          <div className="rounded-full border border-gray-200 bg-white px-3 py-1.5">
                            Location: <span className="font-semibold text-gray-900">{receipt.location_label || "No location"}</span>
                          </div>
                          <div className="rounded-full border border-gray-200 bg-white px-3 py-1.5">
                            Trace: <span className="font-semibold text-gray-900">{receipt.sku || receipt.barcode || "No trace code"}</span>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-gray-500">
                          <div>{formatTime(receipt.occurred_at)}</div>
                          <div>{formatRelativeTime(receipt.occurred_at)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {!receiptFeed.length && !isLoading ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                    No receipt lines have been streamed into the current audit window yet.
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

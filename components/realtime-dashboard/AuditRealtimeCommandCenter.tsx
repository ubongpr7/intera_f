"use client"

import {
  AlertTriangle,
  Boxes,
  CreditCard,
  Loader2,
  PackageCheck,
  Radio,
  ReceiptText,
  ShieldAlert,
  ShoppingBag,
  Store,
  Wifi,
  WifiOff,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { resolveAuditAssetUrl } from "@/lib/auditEventHelpers"
import { formatCurrencyCompact } from "@/lib/currency-utils"
import { cn } from "@/lib/utils"
import type {
  DashboardRankingEntry,
  DashboardSeriesPoint,
  DashboardWorkspaceSnapshot,
} from "@/redux/features/audit/auditRealtimeDashboardTypes"
import type { DashboardSocketState } from "./useAuditRealtimeDashboard"

const readNumber = (value: number | string | undefined) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatRelativeTime = (value?: string) => {
  if (!value) return "No refresh yet"
  const deltaMinutes = Math.round((Date.now() - new Date(value).getTime()) / 60000)
  if (deltaMinutes <= 0) return "Just updated"
  if (deltaMinutes < 60) return `${deltaMinutes}m ago`
  const deltaHours = Math.round(deltaMinutes / 60)
  if (deltaHours < 24) return `${deltaHours}h ago`
  return `${Math.round(deltaHours / 24)}d ago`
}

const formatBucketLabel = (value: string) =>
  new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })

const formatEventStamp = (value?: string) => {
  if (!value) return "No timestamp"
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

const connectionBadge = (state: "connecting" | "connected" | "disconnected") => {
  if (state === "connected") {
    return {
      label: "Audit stream online",
      icon: Wifi,
      className: "border-blue-200 bg-blue-50 text-blue-700",
    }
  }
  if (state === "connecting") {
    return {
      label: "Connecting audit stream",
      icon: Loader2,
      className: "border-amber-200 bg-amber-50 text-amber-700",
    }
  }
  return {
    label: "Audit stream offline",
    icon: WifiOff,
    className: "border-gray-200 bg-gray-100 text-gray-600",
  }
}

const feedAccent = (streamKind: string) => {
  if (streamKind === "sale") {
    return {
      label: "Sale",
      icon: CreditCard,
      badgeClassName: "border-blue-200 bg-blue-50 text-blue-700",
      iconWrapClassName: "border-blue-200 bg-blue-50 text-blue-700",
    }
  }
  if (streamKind === "receipt") {
    return {
      label: "Receiving",
      icon: PackageCheck,
      badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
      iconWrapClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    }
  }
  if (streamKind === "purchase_order") {
    return {
      label: "Purchase order",
      icon: ReceiptText,
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
      iconWrapClassName: "border-amber-200 bg-amber-50 text-amber-700",
    }
  }
  return {
    label: "Audit event",
    icon: Boxes,
    badgeClassName: "border-gray-200 bg-gray-100 text-gray-600",
    iconWrapClassName: "border-gray-200 bg-gray-100 text-gray-600",
  }
}

const MetricCard = ({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string
  value: string | number
  helper: string
  tone?: "default" | "blue" | "green" | "amber" | "red"
}) => {
  const accentClassName =
    tone === "blue"
      ? "bg-blue-500"
      : tone === "green"
        ? "bg-emerald-500"
        : tone === "amber"
          ? "bg-amber-500"
          : tone === "red"
            ? "bg-red-500"
            : "bg-slate-400"

  return (
    <div className="min-w-0 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className={cn("mb-4 h-1.5 w-12 rounded-full", accentClassName)} />
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">{label}</div>
      <div className="mt-3 text-[28px] font-semibold tracking-tight text-gray-900">{value}</div>
      <div className="mt-2 break-words text-sm leading-5 text-gray-600">{helper}</div>
    </div>
  )
}

const SeriesPanel = ({
  title,
  description,
  points,
  accentClassName,
}: {
  title: string
  description: string
  points: DashboardSeriesPoint[]
  accentClassName: string
}) => {
  const condensed = points.slice(-8)
  const values = condensed.map((point) => readNumber(point.value))
  const maxValue = Math.max(...values, 0)
  const hasActivity = values.some((value) => value > 0)

  return (
    <div className="min-w-0 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">{title}</div>
      <div className="mt-1 text-sm text-gray-600">{description}</div>
      <div className="mt-6 flex h-40 items-end gap-3">
        {condensed.length && hasActivity ? (
          condensed.map((point) => {
            const value = readNumber(point.value)
            return (
              <div key={`${title}-${point.bucket}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-28 w-full items-end">
                  <div
                    className={cn("w-full rounded-t-[16px] transition-all", accentClassName)}
                    style={{ height: `${Math.max((value / Math.max(maxValue, 1)) * 100, value > 0 ? 14 : 0)}%` }}
                  />
                </div>
                <div className="text-[11px] font-semibold text-gray-900">{value.toLocaleString()}</div>
                <div className="text-[10px] uppercase tracking-[0.12em] text-gray-400">{formatBucketLabel(point.bucket)}</div>
              </div>
            )
          })
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
            No measurable activity in the current audit window.
          </div>
        )}
      </div>
    </div>
  )
}

const LeaderboardPanel = ({
  title,
  rows,
  unitLabel,
}: {
  title: string
  rows: DashboardRankingEntry[]
  unitLabel: string
}) => (
  <div className="min-w-0 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">{title}</div>
        <div className="mt-1 text-sm text-gray-600">Re-ranked from the audit snapshot on every refresh.</div>
      </div>
      <Badge variant="outline" className="border-blue-200 bg-white text-blue-700">
        Live ranking
      </Badge>
    </div>
    <div className="mt-5 space-y-3">
      {rows.some((row) => readNumber(row.metric_value) > 0) ? (
        rows.slice(0, 5).map((row, index) => {
          const imageUrl = resolveAuditAssetUrl(row.image_url)
          return (
            <div key={`${title}-${row.entity_key}-${index}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-500">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt={row.title} className="h-full w-full object-cover" />
                  ) : (
                    `${index + 1}`.padStart(2, "0")
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-gray-900">{row.title}</div>
                  <div className="mt-1 truncate text-xs text-gray-500">{row.subtitle || "No secondary context"}</div>
                </div>
                <div className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm font-semibold text-gray-900">
                  {readNumber(row.metric_value).toLocaleString()} {unitLabel}
                </div>
              </div>
            </div>
          )
        })
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
          No ranked activity yet for this audit scope.
        </div>
      )}
    </div>
  </div>
)

export default function AuditRealtimeCommandCenter({
  currencyCode,
  snapshot: activeSnapshot,
  socketState,
  isLoading,
  isFetching,
}: {
  currencyCode: string
  snapshot: DashboardWorkspaceSnapshot | null
  socketState: DashboardSocketState
  isLoading: boolean
  isFetching: boolean
}) {
  const metrics = activeSnapshot?.metrics ?? {}
  const alerts = activeSnapshot?.alerts ?? {}
  const charts = activeSnapshot?.charts ?? {}
  const leaderboards = activeSnapshot?.leaderboards ?? {}
  const feed = activeSnapshot?.feed ?? []
  const purchaseFeed = feed.filter((entry) => entry.stream_kind === "purchase_order")
  const alertCards = [
    {
      label: "High-severity activity",
      value: readNumber(metrics.high_severity_24h).toLocaleString(),
      helper: "Critical, high, and warning events that may need investigation.",
      icon: AlertTriangle,
      accent: "bg-red-500",
      badgeClassName: "border-red-200 bg-red-50 text-red-700",
    },
    {
      label: "Security and identity",
      value: readNumber(metrics.security_events_24h).toLocaleString(),
      helper: "Permissions, access, and identity changes derived from the audit ledger.",
      icon: ShieldAlert,
      accent: "bg-amber-500",
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    },
    {
      label: "Support access events",
      value: readNumber(metrics.support_access_24h).toLocaleString(),
      helper: "Temporary support grants, acceptances, revocations, and expiries.",
      icon: Boxes,
      accent: "bg-blue-500",
      badgeClassName: "border-blue-200 bg-blue-50 text-blue-700",
    },
  ]
  const badge = connectionBadge(socketState)

  const metricCards = [
    {
      label: "Sales value (24h)",
      value: formatCurrencyCompact(currencyCode, readNumber(metrics.sales_24h_amount)),
      helper: `${readNumber(metrics.sales_24h_orders).toLocaleString()} paid POS order${readNumber(metrics.sales_24h_orders) === 1 ? "" : "s"}`,
      tone: "blue" as const,
    },
    {
      label: "Units sold (24h)",
      value: readNumber(metrics.sales_24h_units).toLocaleString(),
      helper: "Paid-order units only",
      tone: "green" as const,
    },
    {
      label: "Units received (24h)",
      value: readNumber(metrics.receiving_24h_units).toLocaleString(),
      helper: `${readNumber(metrics.receiving_24h_lines).toLocaleString()} receipt line${readNumber(metrics.receiving_24h_lines) === 1 ? "" : "s"}`,
      tone: "green" as const,
    },
    {
      label: "Open PO pressure",
      value: readNumber(metrics.purchase_orders_pending).toLocaleString(),
      helper: `${readNumber(metrics.purchase_orders_approved).toLocaleString()} approved • ${readNumber(metrics.purchase_orders_issued).toLocaleString()} issued`,
      tone: "amber" as const,
    },
    {
      label: "Needs attention",
      value: (readNumber(alerts.total_attention_items) || readNumber(metrics.high_severity_24h)).toLocaleString(),
      helper: `${readNumber(metrics.high_severity_24h).toLocaleString()} high-risk • ${readNumber(metrics.security_events_24h).toLocaleString()} identity/security`,
      tone: "red" as const,
    },
  ]

  return (
    <Card className="realtime-command-center overflow-hidden border-gray-200 bg-white shadow-sm">
      <CardHeader className="border-b border-gray-100 bg-white p-5 text-left text-inherit">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
              <Radio className={cn("h-3.5 w-3.5", socketState === "connected" && "animate-pulse")} />
              Audit-derived operations intelligence
            </div>
            <CardTitle className="mt-3 text-2xl tracking-tight text-gray-900">Realtime command center</CardTitle>
            <CardDescription className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              This layer is fed from the audit service snapshot and websocket channel so live commercial, receiving, and risk signals come from one operational ledger.
            </CardDescription>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-right">
            <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]", badge.className)}>
              <badge.icon className={cn("h-3.5 w-3.5", socketState === "connecting" && "animate-spin")} />
              {badge.label}
            </div>
            <div className="mt-3 text-sm font-semibold text-gray-900">
              {activeSnapshot?.generated_at ? `Snapshot ${formatRelativeTime(activeSnapshot.generated_at)}` : "Waiting for snapshot"}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {isFetching ? "Refreshing from audit service" : isLoading ? "Loading audit-derived dashboard" : "Websocket deltas replace stale browser math"}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {metricCards.map((metric) => (
            <MetricCard key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} tone={metric.tone} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="grid min-w-0 gap-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <SeriesPanel
                title="Hourly sales"
                description="Paid POS order value aggregated from the audit projection."
                points={charts.sales_amount_by_hour ?? []}
                accentClassName="bg-[linear-gradient(180deg,_#60a5fa_0%,_#2563eb_100%)]"
              />
              <SeriesPanel
                title="Hourly receiving"
                description="Inbound stock units posted by goods-receipt line events."
                points={charts.receiving_units_by_hour ?? []}
                accentClassName="bg-[linear-gradient(180deg,_#86efac_0%,_#16a34a_100%)]"
              />
            </div>

            <div className="grid min-w-0 gap-6 xl:grid-cols-3">
              <LeaderboardPanel
                title="Top sold products"
                rows={leaderboards.top_products_24h ?? []}
                unitLabel="units"
              />
              <LeaderboardPanel
                title="Terminal pressure"
                rows={leaderboards.terminal_activity_24h ?? []}
                unitLabel="units"
              />
              <LeaderboardPanel
                title="Top receiving locations"
                rows={leaderboards.top_receiving_locations_24h ?? []}
                unitLabel="units"
              />
            </div>
          </div>

          <div className="grid min-w-0 gap-6">
            <div className="min-w-0 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Alert load</div>
                  <div className="mt-1 text-sm text-gray-600">What the audit ledger says needs scrutiny right now.</div>
                </div>
                <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                  <ShieldAlert className="mr-1 h-3.5 w-3.5" />
                  Risk view
                </Badge>
              </div>
              <div className="mt-5 grid gap-3">
                {alertCards.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className={cn("mb-3 h-1.5 w-10 rounded-full", item.accent)} />
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">{item.label}</div>
                          <div className="mt-2 text-2xl font-semibold text-gray-900">{item.value}</div>
                          <div className="mt-2 text-sm leading-5 text-gray-600">{item.helper}</div>
                        </div>
                        <div className={cn("rounded-full border p-2", item.badgeClassName)}>
                          <Icon className="h-4 w-4 shrink-0" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="min-w-0 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Purchase order flow</div>
                  <div className="mt-1 text-sm text-gray-600">Recent purchase-order lifecycle movement from the audit ledger.</div>
                </div>
                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                  <ShoppingBag className="mr-1 h-3.5 w-3.5" />
                  Purchasing
                </Badge>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Pending</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900">{readNumber(metrics.purchase_orders_pending).toLocaleString()}</div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Approved / Issued</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900">
                    {readNumber(metrics.purchase_orders_approved).toLocaleString()} / {readNumber(metrics.purchase_orders_issued).toLocaleString()}
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Received</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900">{readNumber(metrics.purchase_orders_received).toLocaleString()}</div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Completed</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900">{readNumber(metrics.purchase_orders_completed).toLocaleString()}</div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {purchaseFeed.length ? (
                  purchaseFeed.slice(0, 6).map((entry) => (
                    <div key={`${entry.audit_id}-${entry.reference_number}-${entry.occurred_at}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="break-words text-sm font-semibold leading-5 text-gray-900">{entry.title || entry.reference_number}</div>
                          <div className="mt-1 break-words text-xs leading-5 text-gray-500">{entry.subtitle || entry.summary}</div>
                        </div>
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 capitalize text-amber-700">
                          {entry.unit_label || "updated"}
                        </Badge>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-2">
                        <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
                          Actor: <span className="font-semibold text-gray-900">{entry.actor_name || "System actor"}</span>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
                          Destination: <span className="font-semibold text-gray-900">{entry.location_label || "No location snapshot"}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.16em] text-gray-400">
                        <span className="truncate">{entry.reference_number || entry.event_name}</span>
                        <span>{formatEventStamp(entry.occurred_at)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                    Purchase-order lifecycle events have not entered the current snapshot yet.
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Audit ledger feed</div>
                  <div className="mt-1 text-sm text-gray-600">Recent events from the dashboard snapshot, ready for drill-down.</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                    <CreditCard className="mr-1 h-3.5 w-3.5" />
                    POS
                  </Badge>
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    <ReceiptText className="mr-1 h-3.5 w-3.5" />
                    Receiving
                  </Badge>
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                    <ShoppingBag className="mr-1 h-3.5 w-3.5" />
                    Purchasing
                  </Badge>
                </div>
              </div>

              <ScrollArea className="mt-5 h-[32rem] pr-3">
                <div className="space-y-3">
                  {feed.length ? (
                    feed.map((entry) => {
                      const accent = feedAccent(entry.stream_kind)
                      const Icon = accent.icon
                      const imageUrl = resolveAuditAssetUrl(entry.image_url)
                      return (
                        <div key={`${entry.audit_id}-${entry.stream_kind}-${entry.occurred_at}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 transition hover:border-blue-200 hover:bg-white">
                          <div className="flex items-start gap-3">
                            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white", accent.iconWrapClassName)}>
                              {imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={imageUrl} alt={entry.title || entry.target_label} className="h-full w-full object-cover" />
                              ) : (
                                <Icon className="h-4 w-4" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="min-w-0 break-words text-sm font-semibold leading-5 text-gray-900">{entry.title || entry.summary}</div>
                                    <Badge variant="outline" className={accent.badgeClassName}>
                                      {accent.label}
                                    </Badge>
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs leading-5 text-gray-500">
                                    <span>{entry.source_service}</span>
                                    <span>&bull;</span>
                                    <span>{entry.feature_area}</span>
                                    {entry.reference_number ? (
                                      <>
                                        <span>&bull;</span>
                                        <span className="break-words">{entry.reference_number}</span>
                                      </>
                                    ) : null}
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "capitalize",
                                    entry.severity === "critical" || entry.severity === "high"
                                      ? "border-red-200 bg-red-50 text-red-700"
                                      : entry.severity === "warning"
                                        ? "border-amber-200 bg-amber-50 text-amber-700"
                                        : "border-gray-200 bg-white text-gray-600",
                                  )}
                                >
                                  {entry.severity}
                                </Badge>
                              </div>

                              <div className="mt-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-2 xl:grid-cols-3">
                                <span className="rounded-xl border border-gray-200 bg-white px-3 py-2">
                                  Actor: <span className="font-semibold text-gray-900">{entry.actor_name || "System actor"}</span>
                                </span>
                                <span className="rounded-xl border border-gray-200 bg-white px-3 py-2">
                                  <Store className="mr-1 inline h-3.5 w-3.5 text-gray-400" />
                                  {entry.location_label || entry.terminal_name || "No location snapshot"}
                                </span>
                                <span className="rounded-xl border border-gray-200 bg-white px-3 py-2">
                                  {entry.quantity ? (
                                    <>
                                      {entry.quantity} {entry.unit_label || "items"}
                                    </>
                                  ) : (
                                    <>
                                      {entry.target_label || entry.event_name}
                                    </>
                                  )}
                                </span>
                              </div>

                              <div className="mt-3 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.16em] text-gray-400">
                                <span className="truncate">{entry.sku || entry.barcode || entry.target_label || entry.event_name}</span>
                                <span>{formatEventStamp(entry.occurred_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                      No audit feed entries have been projected yet.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

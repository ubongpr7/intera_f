"use client"

import { useMemo, useState } from "react"
import { Activity, BarChart3, CalendarRange, Check, ChevronDown, MapPin, PackageSearch, Radio, Search, TrendingDown, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatCurrencyCompact } from "@/lib/currency-utils"
import type { DashboardFeedEntry, DashboardWorkspaceSnapshot } from "@/redux/features/audit/auditRealtimeDashboardTypes"
import type { DashboardSocketState } from "./useAuditRealtimeDashboard"

type ComparisonMode = "products" | "locations"
type StudioView = "overview" | "revenue" | "compare"
const SERIES_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"]

type ComparisonCatalogItem = { id: string; name: string; image_url?: string }

const getSeriesLabel = (entry: DashboardFeedEntry, mode: ComparisonMode) =>
  mode === "products" ? entry.title || entry.target_label || "Unknown product" : entry.location_label || "Unknown location"

const formatBucket = (value: Date) =>
  value.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })

const formatDateTimeLocal = (value: Date) => {
  const pad = (part: number) => String(part).padStart(2, "0")
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`
}

export default function RealtimeComparisonChart({
  snapshot,
  socketState,
  isLoading,
  catalogProducts = [],
  currencyCode = "NGN",
}: {
  snapshot: DashboardWorkspaceSnapshot | null
  socketState: DashboardSocketState
  isLoading: boolean
  catalogProducts?: ComparisonCatalogItem[]
  currencyCode?: string
}) {
  const [mode, setMode] = useState<ComparisonMode>("products")
  const [studioView, setStudioView] = useState<StudioView>("overview")
  const [fromDate, setFromDate] = useState<string>()
  const [toDate, setToDate] = useState<string>()
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [selectorSearch, setSelectorSearch] = useState("")
  const [renderedAt] = useState(() => new Date())
  const allSales = useMemo(
    () => (snapshot?.feed ?? []).filter((entry): entry is DashboardFeedEntry => entry.stream_kind === "sale"),
    [snapshot?.feed],
  )
  const latestSalesDate = useMemo(() => {
    const latest = Math.max(...allSales.map((sale) => new Date(sale.occurred_at).getTime()), renderedAt.getTime())
    return new Date(latest)
  }, [allSales, renderedAt])
  const defaultFromDate = useMemo(() => new Date(latestSalesDate.getTime() - 24 * 60 * 60 * 1000), [latestSalesDate])
  const effectiveFromDate = useMemo(() => (fromDate ? new Date(fromDate) : defaultFromDate), [defaultFromDate, fromDate])
  const effectiveToDate = useMemo(() => (toDate ? new Date(toDate) : latestSalesDate), [latestSalesDate, toDate])
  const sales = useMemo(
    () => {
      if (!allSales.length) return allSales
      const from = effectiveFromDate.getTime()
      const to = effectiveToDate.getTime()
      return allSales.filter((sale) => {
        const timestamp = new Date(sale.occurred_at).getTime()
        return timestamp >= from && timestamp <= to
      })
    },
    [allSales, effectiveFromDate, effectiveToDate],
  )
  const overviewPoints = snapshot?.charts.sales_amount_by_hour ?? []
  const overviewMax = Math.max(...overviewPoints.map((point) => Number(point.value) || 0), 1)
  const overviewTotal = overviewPoints.reduce((total, point) => total + (Number(point.value) || 0), 0)
  const paidOrders = Number(snapshot?.metrics.sales_24h_orders ?? 0)
  const unitsSold = Number(snapshot?.metrics.sales_24h_units ?? 0)
  const averageOrderValue = paidOrders ? overviewTotal / paidOrders : 0
  const unitsPerOrder = paidOrders ? unitsSold / paidOrders : 0
  const peakPoint = overviewPoints.reduce<{ bucket: string; value: number } | null>((peak, point) => {
    if (!peak || Number(point.value) > peak.value) return { bucket: point.bucket, value: Number(point.value) || 0 }
    return peak
  }, null)
  const trendDirection = overviewPoints.length > 1
    ? Number(overviewPoints[overviewPoints.length - 1].value) >= Number(overviewPoints[0].value) ? "up" : "down"
    : "flat"

  const options = useMemo(() => {
    const totals = new Map<string, { total: number; imageUrl?: string }>()
    if (mode === "products") {
      for (const product of catalogProducts) totals.set(product.name, { total: 0, imageUrl: product.image_url })
    }
    for (const sale of sales) {
      const label = getSeriesLabel(sale, mode)
      const current = totals.get(label) ?? { total: 0, imageUrl: sale.image_url }
      totals.set(label, { total: current.total + Number(sale.quantity || 0), imageUrl: current.imageUrl || sale.image_url })
    }
    return [...totals.entries()]
      .sort((left, right) => right[1].total - left[1].total)
      .map(([label, value]) => ({ label, total: value.total, imageUrl: value.imageUrl }))
  }, [catalogProducts, mode, sales])

  const [selected, setSelected] = useState<string[]>([])
  const selectedSeries = options.filter((option) => selected.includes(option.label))
  const visibleOptions = options.filter((option) => option.label.toLowerCase().includes(selectorSearch.trim().toLowerCase()))

  const chart = useMemo(() => {
    if (!sales.length || !selectedSeries.length) return null

    const durationMs = Math.max(effectiveToDate.getTime() - effectiveFromDate.getTime(), 12 * 60 * 1000)
    const buckets = Array.from({ length: 12 }, (_, index) => {
      const bucket = new Date(effectiveFromDate.getTime() + (durationMs / 11) * index)
      return bucket
    })
    const lines = selectedSeries.map((series) => {
      const values = buckets.map((bucket) =>
        sales
          .filter((sale) => getSeriesLabel(sale, mode) === series.label)
          .filter((sale) => {
            const ratio = (new Date(sale.occurred_at).getTime() - effectiveFromDate.getTime()) / durationMs
            const bucketIndex = Math.min(11, Math.max(0, Math.floor(ratio * 12)))
            return bucketIndex === buckets.indexOf(bucket)
          })
          .reduce((total, sale) => total + Number(sale.quantity || 0), 0),
      )
      return { ...series, values }
    })
    return { buckets, lines, max: Math.max(...lines.flatMap((line) => line.values), 1) }
  }, [effectiveFromDate, effectiveToDate, mode, sales, selectedSeries])

  const toggleSeries = (label: string) => {
    setSelected((current) => {
      if (current.includes(label)) return current.filter((item) => item !== label)
      return [...current, label]
    })
  }

  return (
    <Card className="overflow-hidden border-gray-200 bg-white shadow-sm">
      <CardHeader className="border-b border-gray-100 bg-gray-100/50 p-5 text-left text-inherit">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
              <Activity className="h-3.5 w-3.5" />
              Compare live sales
            </div>
          <CardTitle className="mt-3 text-2xl tracking-tight text-gray-900">Sales and revenue intelligence</CardTitle>
            <CardDescription className="mt-2 text-sm leading-6 text-gray-600">
              Understand money, activity, and basket behavior first; compare products or locations when you need to investigate a pattern.
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-blue-200 bg-white text-blue-700">
            <Radio className={socketState === "connected" ? "mr-1 h-3.5 w-3.5 animate-pulse" : "mr-1 h-3.5 w-3.5"} />
            {socketState === "connected" ? "Live" : socketState === "connecting" ? "Connecting" : "Snapshot mode"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <div className="inline-flex rounded-2xl border border-gray-200 bg-gray-50 p-1">
          {(["overview", "revenue", "compare"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStudioView(value)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${studioView === value ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-white hover:text-gray-900"}`}
            >
              {value === "compare" ? <Activity className="mr-2 inline h-4 w-4" /> : <BarChart3 className="mr-2 inline h-4 w-4" />}
              {value === "overview" ? "At a glance" : value === "revenue" ? "Revenue detail" : "Compare"}
            </button>
          ))}
        </div>

        {studioView === "overview" ? (
          <div className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">At a glance · last 24 hours</div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">{formatCurrencyCompact(currencyCode, overviewTotal)}</div>
              <div className="mt-2 text-sm leading-6 text-gray-600">Gross paid revenue, not item count. This is the total value of paid orders in the audit window.</div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-gray-200 bg-white p-3"><div className="text-xs text-gray-500">Paid orders</div><div className="mt-1 text-xl font-semibold text-gray-900">{paidOrders.toLocaleString()}</div><div className="mt-1 text-xs text-gray-500">Completed checkouts</div></div>
                <div className="rounded-2xl border border-gray-200 bg-white p-3"><div className="text-xs text-gray-500">Units sold</div><div className="mt-1 text-xl font-semibold text-gray-900">{unitsSold.toLocaleString()}</div><div className="mt-1 text-xs text-gray-500">Individual units</div></div>
                <div className="rounded-2xl border border-gray-200 bg-white p-3"><div className="text-xs text-gray-500">Average order</div><div className="mt-1 text-xl font-semibold text-gray-900">{formatCurrencyCompact(currencyCode, averageOrderValue)}</div><div className="mt-1 text-xs text-gray-500">Revenue ÷ paid orders</div></div>
                <div className="rounded-2xl border border-gray-200 bg-white p-3"><div className="text-xs text-gray-500">Units per order</div><div className="mt-1 text-xl font-semibold text-gray-900">{unitsPerOrder.toFixed(1)}</div><div className="mt-1 text-xs text-gray-500">Average basket size</div></div>
              </div>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex items-start justify-between gap-3"><div><div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Revenue by hour</div><div className="mt-1 text-sm text-gray-600">Each bar is paid revenue during that hour.</div></div><Badge variant="outline" className="border-blue-200 bg-white text-blue-700">{trendDirection === "up" ? <TrendingUp className="mr-1 h-3.5 w-3.5" /> : trendDirection === "down" ? <TrendingDown className="mr-1 h-3.5 w-3.5" /> : null}{trendDirection === "up" ? "Trending up" : trendDirection === "down" ? "Trending down" : "Live window"}</Badge></div>
              {overviewPoints.length ? <div className="mt-5 flex h-44 items-end gap-2">{overviewPoints.map((point) => { const value = Number(point.value) || 0; return <div key={point.bucket} className="group flex min-w-0 flex-1 flex-col items-center gap-2" title={`${new Date(point.bucket).toLocaleString()} · ${formatCurrencyCompact(currencyCode, value)}`}><div className="relative flex h-32 w-full items-end"><div className="w-full rounded-t-xl bg-gradient-to-t from-blue-600 to-cyan-400 transition-all group-hover:from-blue-700" style={{ height: `${Math.max((value / overviewMax) * 100, value > 0 ? 8 : 0)}%` }} /><span className="absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] font-semibold text-white group-hover:block">{formatCurrencyCompact(currencyCode, value)}</span></div><span className="text-[10px] text-gray-500">{new Date(point.bucket).toLocaleTimeString([], { hour: "numeric" })}</span></div> })}</div> : <div className="mt-5 flex h-44 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white text-sm text-gray-500">Waiting for sales activity.</div>}
              <div className="mt-4 grid gap-2 text-xs text-gray-600 sm:grid-cols-2"><div className="rounded-xl border border-gray-200 bg-white px-3 py-2"><span className="font-semibold text-gray-900">Peak hour:</span> {peakPoint ? `${new Date(peakPoint.bucket).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · ${formatCurrencyCompact(currencyCode, peakPoint.value)}` : "No sales yet"}</div><div className="rounded-xl border border-gray-200 bg-white px-3 py-2"><span className="font-semibold text-gray-900">Window:</span> trailing 24 hours · refreshed live</div></div>
            </div>
          </div>
        ) : null}

        {studioView === "revenue" ? (
          <div className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Revenue pulse</div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-emerald-950">{formatCurrencyCompact(currencyCode, overviewTotal)}</div>
              <div className="mt-2 text-sm leading-6 text-emerald-900">Gross paid-order value from completed checkouts. This is revenue, not profit: product cost and margin are not included in this stream yet.</div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="rounded-2xl border border-emerald-200 bg-white p-3"><div className="text-xs text-gray-500">Paid revenue</div><div className="mt-1 text-xl font-semibold text-gray-900">{formatCurrencyCompact(currencyCode, overviewTotal)}</div></div><div className="rounded-2xl border border-emerald-200 bg-white p-3"><div className="text-xs text-gray-500">Average order</div><div className="mt-1 text-xl font-semibold text-gray-900">{formatCurrencyCompact(currencyCode, averageOrderValue)}</div></div></div>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5"><div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Revenue trend</div><div className="mt-1 text-sm text-gray-600">Paid-order value by audit time bucket.</div>{overviewPoints.length ? <div className="mt-5 flex h-44 items-end gap-2">{overviewPoints.map((point) => { const value = Number(point.value) || 0; return <div key={point.bucket} className="group flex min-w-0 flex-1 flex-col items-center gap-2"><div className="relative flex h-32 w-full items-end"><div className="w-full rounded-t-xl bg-gradient-to-t from-emerald-600 to-teal-400 transition-all group-hover:from-emerald-700" style={{ height: `${Math.max((value / overviewMax) * 100, value > 0 ? 8 : 0)}%` }} /></div><span className="text-[10px] text-gray-500">{new Date(point.bucket).toLocaleTimeString([], { hour: "numeric" })}</span></div> })}</div> : <div className="mt-5 flex h-44 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white text-sm text-gray-500">Waiting for revenue activity.</div>}</div>
          </div>
        ) : null}

        {studioView === "compare" ? <>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-2xl border border-gray-200 bg-gray-50 p-1">
            {(["products", "locations"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setMode(value)
                  setSelected([])
                }}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${mode === value ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-white hover:text-gray-900"}`}
              >
                {value === "products" ? <PackageSearch className="mr-2 inline h-4 w-4" /> : <MapPin className="mr-2 inline h-4 w-4" />}
                {value === "products" ? "Products" : "Locations"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-44">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">From</div>
              <Input
                type="datetime-local"
                value={fromDate ?? formatDateTimeLocal(defaultFromDate)}
                max={formatDateTimeLocal(effectiveToDate)}
                onChange={(event) => setFromDate(event.target.value)}
                className="h-9 rounded-xl bg-white text-xs"
                aria-label="Comparison start date and time"
              />
            </div>
            <div className="w-44">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">To</div>
              <Input
                type="datetime-local"
                value={toDate ?? formatDateTimeLocal(latestSalesDate)}
                min={formatDateTimeLocal(effectiveFromDate)}
                max={formatDateTimeLocal(renderedAt)}
                onChange={(event) => setToDate(event.target.value)}
                className="h-9 rounded-xl bg-white text-xs"
                aria-label="Comparison end date and time"
              />
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
              <CalendarRange className="h-4 w-4" />
              Compare units sold · any number of series
            </div>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setSelectorOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
            aria-expanded={selectorOpen}
          >
            <span className="text-sm font-semibold text-gray-700">Choose {mode === "products" ? "products" : "locations"} to compare</span>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition ${selectorOpen ? "rotate-180" : ""}`} />
          </button>
          {selectorOpen ? (
            <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 shadow-xl">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  value={selectorSearch}
                  onChange={(event) => setSelectorSearch(event.target.value)}
                  placeholder={`Search ${mode === "products" ? "products" : "locations"}`}
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
                  autoFocus
                />
              </div>
              <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
                {visibleOptions.map((option, index) => {
                  const active = selected.includes(option.label)
                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => toggleSeries(option.label)}
                      className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-blue-50"
                    >
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 transition duration-200 group-hover:scale-125 group-hover:border-blue-300 group-hover:shadow-lg">
                        {option.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={option.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : <PackageSearch className="m-2 h-5 w-5 text-gray-400" />}
                      </div>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-700">{option.label}</span>
                      <span className="text-xs text-gray-400">{option.total.toLocaleString()} sold</span>
                      {active ? <Check className="h-4 w-4 text-blue-600" /> : <span className="h-4 w-4 rounded-full border border-gray-300" style={{ borderColor: SERIES_COLORS[index % SERIES_COLORS.length] }} />}
                    </button>
                  )
                })}
                {!visibleOptions.length ? <div className="px-2 py-5 text-center text-sm text-gray-500">No matching options.</div> : null}
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedSeries.map((option, index) => (
            <button key={option.label} type="button" onClick={() => toggleSeries(option.label)} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length] }} />
              {option.label}
            </button>
          ))}
          {!options.length && !isLoading ? <div className="text-sm text-gray-500">No products or locations are available for comparison yet.</div> : null}
        </div>

        <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
          {chart ? (
            <div className="overflow-x-auto">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-gray-600">
                <span><strong className="text-gray-900">{mode === "products" ? "Product" : "Location"} comparison:</strong> units sold in each time bucket</span>
                <span>{selectedSeries.length} series selected · {sales.length} live sale event{sales.length === 1 ? "" : "s"}</span>
              </div>
              <svg viewBox="0 0 900 300" className="min-w-[680px] w-full" role="img" aria-label={`${mode} sales comparison chart`}>
                {[0, 1, 2, 3].map((step) => {
                  const y = 32 + step * 62
                  return <line key={step} x1="42" x2="880" y1={y} y2={y} stroke="#dbe3ef" strokeDasharray="4 8" />
                })}
                {chart.lines.map((line, lineIndex) => {
                  const points = line.values
                    .map((value, index) => {
                      const x = 42 + (index / Math.max(chart.buckets.length - 1, 1)) * 838
                      const y = 274 - (value / chart.max) * 224
                      return `${x},${y}`
                    })
                    .join(" ")
                  const color = SERIES_COLORS[lineIndex % SERIES_COLORS.length]
                  return (
                    <g key={line.label}>
                      <polyline points={points} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                      {line.values.map((value, index) => {
                        const x = 42 + (index / Math.max(chart.buckets.length - 1, 1)) * 838
                        const y = 274 - (value / chart.max) * 224
                        return <circle key={`${line.label}-${index}`} cx={x} cy={y} r="5" fill="white" stroke={color} strokeWidth="3" />
                      })}
                    </g>
                  )
                })}
                {chart.buckets.map((bucket, index) => {
                  if (index % 2 !== 0 && index !== chart.buckets.length - 1) return null
                  const x = 42 + (index / Math.max(chart.buckets.length - 1, 1)) * 838
                  return <text key={bucket.toISOString()} x={x} y="296" textAnchor="middle" fontSize="11" fill="#64748b">{formatBucket(bucket)}</text>
                })}
              </svg>
            </div>
          ) : (
            <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-5 text-center text-sm text-gray-500">
              Select at least one {mode === "products" ? "product" : "location"} to draw a live comparison.
            </div>
          )}
        </div>
        </> : null}
      </CardContent>
    </Card>
  )
}

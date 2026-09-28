"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  Barcode,
  Bolt,
  Download,
  Loader2,
  PackageOpen,
  RefreshCcw,
  Search,
  Shield,
  Wifi,
  WifiOff,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TabsContent, TabsList, TabsTrigger, UrlTabs } from "@/components/ui/tabs"
import { extractGoodsReceiptEntries, extractPosSaleEntries, getAuditEventImageUrl, getAuditEventProductContext } from "@/lib/auditEventHelpers"
import { getAuditReviewModel } from "@/lib/auditReviewModel"
import { getActiveWorkspaceId, getAuditWebSocketBaseUrl, getRealtimeAccessToken, requestRealtimeWebSocketTicket } from "@/lib/serviceRealtime"
import { cn } from "@/lib/utils"
import { useGetAuditFilterOptionsQuery, useListAuditEventsQuery } from "@/redux/features/audit/auditApiSlice"
import type { AuditEventRecord } from "@/redux/features/audit/auditTypes"

const formatDateTime = (value?: string | null) => {
  if (!value) return "Unknown time"
  return new Date(value).toLocaleString()
}

const formatRelativeTime = (value?: string | null) => {
  if (!value) return "No timestamp"
  const delta = new Date(value).getTime() - Date.now()
  const minutes = Math.round(delta / 60000)
  if (Math.abs(minutes) < 1) return "Just now"
  if (Math.abs(minutes) < 60) return `${Math.abs(minutes)}m ${minutes < 0 ? "ago" : "from now"}`
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return `${Math.abs(hours)}h ${hours < 0 ? "ago" : "from now"}`
  const days = Math.round(hours / 24)
  return `${Math.abs(days)}d ${days < 0 ? "ago" : "from now"}`
}

const safeObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }
  return value as Record<string, unknown>
}

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—"
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (Array.isArray(value)) return value.length ? value.map((item) => formatValue(item)).join(", ") : "—"
  return JSON.stringify(value, null, 2)
}

const previewValue = (value: unknown): string => {
  const serialized = formatValue(value)
  return serialized.length > 180 ? `${serialized.slice(0, 180)}…` : serialized
}

const titleCase = (value?: string | null) =>
  String(value || "")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())

const severityVariant = (severity?: string) => {
  switch ((severity || "").toLowerCase()) {
    case "critical":
    case "high":
      return "destructive" as const
    case "warning":
      return "secondary" as const
    default:
      return "outline" as const
  }
}

const severityTone = (severity?: string) => {
  switch ((severity || "").toLowerCase()) {
    case "critical":
    case "high":
      return {
        border: "border-l-red-500",
        pill: "border-red-200 bg-red-50 text-red-700",
      }
    case "warning":
      return {
        border: "border-l-amber-500",
        pill: "border-amber-200 bg-amber-50 text-amber-800",
      }
    default:
      return {
        border: "border-l-blue-400",
        pill: "border-blue-200 bg-blue-50 text-blue-700",
      }
  }
}

type AuditRealtimeEnvelope = {
  type?: string
  workspace_id?: string
  event?: AuditEventRecord
}

const withRealtimeMetadata = (event: AuditEventRecord): AuditEventRecord => ({
  ...event,
  metadata_json: {
    ...(event.metadata_json || {}),
    realtime: true,
  },
})

const matchesTextFilters = (event: AuditEventRecord, search: string, barcode: string) => {
  const normalizedSearch = search.trim().toLowerCase()
  const normalizedBarcode = barcode.trim().toLowerCase()
  if (normalizedBarcode && (event.entity_barcode || "").toLowerCase() !== normalizedBarcode) {
    return false
  }
  if (!normalizedSearch) {
    return true
  }
  const haystack = [
    event.summary,
    event.event_name,
    event.actor_name,
    event.actor_email,
    event.reference_number,
    event.entity_barcode,
    event.entity_sku,
    event.target_label,
    event.target_type,
    event.action,
    event.search_text,
    event.feature_area,
    event.source_service,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
  return haystack.includes(normalizedSearch)
}

const matchesFacetFilters = (
  event: AuditEventRecord,
  severityFilter: string,
  serviceFilter: string,
  featureFilter: string,
  dateRangeFilter: string,
) => {
  if (severityFilter !== "all" && (event.severity || "").toLowerCase() !== severityFilter) {
    return false
  }
  if (serviceFilter !== "all" && event.source_service !== serviceFilter) {
    return false
  }
  if (featureFilter !== "all" && event.feature_area !== featureFilter) {
    return false
  }
  if (dateRangeFilter !== "all") {
    const occurredAt = new Date(event.occurred_at).getTime()
    const now = Date.now()
    const rangeMap: Record<string, number> = {
      today: 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    }
    const cutoff = rangeMap[dateRangeFilter]
    if (cutoff && now - occurredAt > cutoff) {
      return false
    }
  }
  return true
}

const getOccurredFrom = (range: string) => {
  const daysByRange: Record<string, number> = { today: 1, "7d": 7, "30d": 30 }
  const days = daysByRange[range]
  if (!days) return undefined
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

const connectionBadge = (state: "connecting" | "connected" | "disconnected") => {
  if (state === "connected") {
      return {
        label: "Live connected",
        icon: Wifi,
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      }
  }
  if (state === "connecting") {
    return {
      label: "Connecting",
      icon: Loader2,
      className: "border-amber-200 bg-amber-50 text-amber-800",
    }
  }
  return {
    label: "Disconnected",
    icon: WifiOff,
    className: "border-gray-200 bg-gray-100 text-gray-600",
  }
}

const getChangeRows = (event: AuditEventRecord) => {
  const changes = safeObject(event.changes_json)
  const before = safeObject(changes.before)
  const after = safeObject(changes.after)
  const beforeKeys = Object.keys(before)
  const afterKeys = Object.keys(after)

  if (beforeKeys.length || afterKeys.length) {
    return Array.from(new Set([...beforeKeys, ...afterKeys])).map((key) => ({
      key,
      before: before[key],
      after: after[key],
    }))
  }

  return Object.entries(changes).map(([key, value]) => ({
    key,
    before: undefined,
    after: value,
  }))
}

const getMetadataRows = (event: AuditEventRecord) =>
  Object.entries(safeObject(event.metadata_json))
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .sort(([leftKey], [rightKey]) => {
      const priority = [
        "channel",
        "delivery_status",
        "notification_type",
        "permission",
        "permission_name",
        "ip_address",
        "client_ip",
        "user_agent",
        "device",
        "origin",
        "source",
      ]
      const leftIndex = priority.indexOf(leftKey)
      const rightIndex = priority.indexOf(rightKey)
      if (leftIndex === -1 && rightIndex === -1) {
        return leftKey.localeCompare(rightKey)
      }
      if (leftIndex === -1) {
        return 1
      }
      if (rightIndex === -1) {
        return -1
      }
      return leftIndex - rightIndex
    })

const buildEventNarrative = (event: AuditEventRecord) => {
  const actor = event.actor_name || event.actor_email || "A system process"
  const action = titleCase(event.action || event.event_name || "updated").toLowerCase()
  const target = event.target_label || titleCase(event.target_type) || "a record"
  const reference = event.reference_number || event.entity_sku || event.entity_barcode
  const referenceText = reference ? ` under reference ${reference}` : ""
  return `${actor} ${action} ${target}${referenceText}.`
}

export default function AuditTrailWorkspace() {
  const [searchInput, setSearchInput] = useState("")
  const [barcodeInput, setBarcodeInput] = useState("")
  const [submittedSearch, setSubmittedSearch] = useState("")
  const [submittedBarcode, setSubmittedBarcode] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [serviceFilter, setServiceFilter] = useState("all")
  const [featureFilter, setFeatureFilter] = useState("all")
  const [dateRangeFilter, setDateRangeFilter] = useState("all")
  const [page, setPage] = useState(1)
  const pageSize = 50
  const [realtimeEvents, setRealtimeEvents] = useState<AuditEventRecord[]>([])
  const [socketState, setSocketState] = useState<"connecting" | "connected" | "disconnected">("disconnected")
  const [selectedEventId, setSelectedEventId] = useState("")

  const queryArgs = useMemo(
    () => ({
      limit: pageSize,
      offset: (page - 1) * pageSize,
      search: submittedSearch || undefined,
      barcode: submittedBarcode || undefined,
      severity: severityFilter === "all" ? undefined : severityFilter,
      source_service: serviceFilter === "all" ? undefined : serviceFilter,
      feature_area: featureFilter === "all" ? undefined : featureFilter,
      occurred_from: getOccurredFrom(dateRangeFilter),
    }),
    [dateRangeFilter, featureFilter, page, serviceFilter, severityFilter, submittedBarcode, submittedSearch],
  )

  const { data, isLoading, isFetching, refetch } = useListAuditEventsQuery(queryArgs, {
    pollingInterval: 60000,
  })
  const workspaceId = getActiveWorkspaceId()
  const accessToken = getRealtimeAccessToken()
  const { data: filterOptions } = useGetAuditFilterOptionsQuery(workspaceId ? { workspace_id: workspaceId } : undefined)

  useEffect(() => {
    if (!workspaceId || !accessToken) {
      return
    }

    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let disposed = false

    const connect = async () => {
      const ticket = await requestRealtimeWebSocketTicket()
      if (!ticket || disposed) return
      socket = new WebSocket(
        `${getAuditWebSocketBaseUrl()}/api/v1/audits/ws/workspaces/${encodeURIComponent(workspaceId)}/audits?ws_ticket=${encodeURIComponent(ticket)}`,
      )

      socket.onopen = () => {
        setSocketState("connected")
      }

      socket.onmessage = (message) => {
        try {
          const envelope = JSON.parse(message.data) as AuditRealtimeEnvelope
          const incomingEvent = envelope.event
          if (
            !incomingEvent ||
            !matchesTextFilters(incomingEvent, submittedSearch, submittedBarcode) ||
            !matchesFacetFilters(incomingEvent, severityFilter, serviceFilter, featureFilter, dateRangeFilter)
          ) {
            return
          }
          const eventWithLiveMetadata = withRealtimeMetadata(incomingEvent)
          setRealtimeEvents((current) => {
            const deduplicated = current.filter((item) => item.id !== eventWithLiveMetadata.id)
            return [eventWithLiveMetadata, ...deduplicated].slice(0, 120)
          })
        } catch {
          return
        }
      }

      socket.onclose = () => {
        setSocketState("disconnected")
        if (disposed) {
          return
        }
        reconnectTimer = setTimeout(() => {
          setSocketState("connecting")
          connect()
        }, 3000)
      }

      socket.onerror = () => {
        setSocketState("disconnected")
      }
    }

    connect()

    return () => {
      disposed = true
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      socket?.close()
    }
  }, [accessToken, dateRangeFilter, featureFilter, serviceFilter, severityFilter, submittedBarcode, submittedSearch, workspaceId])

  const mergedEvents = useMemo(() => {
    const merged = new Map<string, AuditEventRecord>()
    for (const event of realtimeEvents) {
      merged.set(event.id, event)
    }
    for (const event of data?.results ?? []) {
      if (!merged.has(event.id)) {
        merged.set(event.id, event)
      }
    }
    return Array.from(merged.values()).sort(
      (left, right) => new Date(right.occurred_at).getTime() - new Date(left.occurred_at).getTime(),
    )
  }, [data?.results, realtimeEvents])

  const serviceOptions = filterOptions?.source_services ?? []
  const featureOptions = filterOptions?.feature_areas ?? []

  const events = useMemo(
    () =>
      mergedEvents
        .filter((event) => matchesTextFilters(event, submittedSearch, submittedBarcode))
        .filter((event) => matchesFacetFilters(event, severityFilter, serviceFilter, featureFilter, dateRangeFilter))
        .slice(0, pageSize),
    [dateRangeFilter, featureFilter, mergedEvents, pageSize, serviceFilter, severityFilter, submittedBarcode, submittedSearch],
  )

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? events[0] ?? null,
    [events, selectedEventId],
  )

  const serverMatchCount = data?.count ?? 0
  const liveRealtimeCount = events.filter((event) => Boolean(event.metadata_json?.realtime)).length
  const criticalCount = events.filter((event) => ["critical", "high", "warning"].includes((event.severity || "").toLowerCase())).length
  const totalPages = Math.max(1, Math.ceil(serverMatchCount / pageSize))
  const connection = connectionBadge(socketState)
  const ConnectionIcon = connection.icon
  const changeRows = selectedEvent ? getChangeRows(selectedEvent) : []
  const metadataRows = selectedEvent ? getMetadataRows(selectedEvent) : []
  const eventNarrative = selectedEvent ? buildEventNarrative(selectedEvent) : ""
  const machineSignals = metadataRows.slice(0, 8)
  const selectedEventProductContext = selectedEvent ? getAuditEventProductContext(selectedEvent) : null
  const selectedEventImageUrl = selectedEvent ? getAuditEventImageUrl(selectedEvent) : ""
  const selectedEventSales = selectedEvent ? extractPosSaleEntries(selectedEvent) : []
  const selectedEventReceipts = selectedEvent ? extractGoodsReceiptEntries(selectedEvent) : []
  const selectedEventReviewModel = selectedEvent ? getAuditReviewModel(selectedEvent) : null
  const traceContextRows = selectedEvent
    ? [
        ["Event name", selectedEvent.event_name],
        ["Action", selectedEvent.action],
        ["Feature area", selectedEvent.feature_area],
        ["Visibility", selectedEvent.visibility_scope],
        ["Workspace", selectedEvent.workspace_id],
        ["Target id", selectedEvent.target_id],
        ["Support grant", selectedEvent.support_access_grant_id],
        ["Terminal", selectedEvent.terminal_id],
        ["Location", selectedEvent.location_id],
        ["Correlation id", selectedEvent.correlation_id],
        ["Request id", selectedEvent.request_id],
      ].filter(([, value]) => Boolean(value))
    : []
  const topActor = useMemo(() => {
    const counts = new Map<string, number>()
    for (const event of events) {
      const actor = event.actor_name || event.actor_email || "System"
      counts.set(actor, (counts.get(actor) || 0) + 1)
    }
    return Array.from(counts.entries()).sort((left, right) => right[1] - left[1])[0] ?? null
  }, [events])
  const topTargetType = useMemo(() => {
    const counts = new Map<string, number>()
    for (const event of events) {
      const target = titleCase(event.target_type || "Unknown")
      counts.set(target, (counts.get(target) || 0) + 1)
    }
    return Array.from(counts.entries()).sort((left, right) => right[1] - left[1])[0] ?? null
  }, [events])
  const trendBuckets = useMemo(() => {
    const labels = Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - (6 - index))
      return {
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString(undefined, { weekday: "short" }),
      }
    })
    const counts = new Map(labels.map((item) => [item.key, 0]))
    for (const event of events) {
      const key = new Date(event.occurred_at).toISOString().slice(0, 10)
      if (counts.has(key)) {
        counts.set(key, (counts.get(key) || 0) + 1)
      }
    }
    const max = Math.max(...Array.from(counts.values()), 1)
    return labels.map((item) => ({
      ...item,
      count: counts.get(item.key) || 0,
      height: `${Math.max(((counts.get(item.key) || 0) / max) * 100, 12)}%`,
    }))
  }, [events])

  const applyFilters = () => {
    setSubmittedSearch(searchInput.trim())
    setSubmittedBarcode(barcodeInput.trim())
    setPage(1)
  }

  const clearFilters = () => {
    setSearchInput("")
    setBarcodeInput("")
    setSubmittedSearch("")
    setSubmittedBarcode("")
    setSeverityFilter("all")
    setServiceFilter("all")
    setFeatureFilter("all")
    setDateRangeFilter("all")
    setPage(1)
  }

  const exportVisibleEvents = () => {
    const rows = events.map((event) => ({
      occurred_at: event.occurred_at,
      summary: event.summary,
      source_service: event.source_service,
      feature_area: event.feature_area,
      severity: event.severity,
      actor_name: event.actor_name,
      actor_email: event.actor_email,
      target_type: event.target_type,
      target_label: event.target_label,
      reference_number: event.reference_number,
      entity_barcode: event.entity_barcode,
      entity_sku: event.entity_sku,
      event_name: event.event_name,
      action: event.action,
    }))
    const headers = Object.keys(rows[0] || {
      occurred_at: "",
      summary: "",
      source_service: "",
      feature_area: "",
      severity: "",
      actor_name: "",
      actor_email: "",
      target_type: "",
      target_label: "",
      reference_number: "",
      entity_barcode: "",
      entity_sku: "",
      event_name: "",
      action: "",
    })
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => `"${String(row[header as keyof typeof row] || "").replaceAll("\"", "\"\"")}"`)
          .join(","),
      ),
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `audit-events-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="audit-workspace mx-auto w-full max-w-[1800px] space-y-6 px-4 pb-8 pt-6 text-gray-900 lg:px-8 2xl:px-10">
      <Card className="overflow-hidden border-gray-200 bg-white shadow-sm">
        <CardHeader className="gap-4 border-b border-gray-100 bg-gray-100/50 p-6 text-left">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
            <Shield className="h-3.5 w-3.5" />
            Workspace Audit
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-semibold tracking-tight text-gray-900">Audit command center</CardTitle>
            <CardDescription className="max-w-4xl text-sm leading-6 text-gray-600">
              Search by actor, record, barcode, service, and date range. Review activity as an audit feed first, then drill into changes and trace details only when needed.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Server matches</div>
              <div className="mt-2 text-3xl font-semibold text-gray-900">{serverMatchCount}</div>
              <div className="mt-2 text-xs text-gray-600">Records matching the submitted server-side filters.</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Visible now</div>
              <div className="mt-2 text-3xl font-semibold text-gray-900">{events.length}</div>
              <div className="mt-2 text-xs text-gray-600">Records visible on the current page, including live arrivals.</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Needs attention</div>
              <div className="mt-2 text-3xl font-semibold text-gray-900">{criticalCount}</div>
              <div className="mt-2 text-xs text-gray-600">Warning, high, or critical entries within the visible set.</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Live arrivals</div>
              <div className="mt-2 text-3xl font-semibold text-gray-900">{liveRealtimeCount}</div>
              <div className="mt-2 text-xs text-gray-600">Entries injected by the realtime audit stream.</div>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)_170px_170px_170px_170px_auto]">
            <Input
              placeholder="Search actor, summary, SKU, barcode, reference, target..."
              className="border-gray-200 bg-white text-gray-900 placeholder:text-gray-400"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  applyFilters()
                }
              }}
            />
            <Input
              placeholder="Exact barcode"
              className="border-gray-200 bg-white text-gray-900 placeholder:text-gray-400"
              value={barcodeInput}
              onChange={(event) => setBarcodeInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  applyFilters()
                }
              }}
            />
            <Select value={severityFilter} onValueChange={(value) => { setSeverityFilter(value); setPage(1) }}>
              <SelectTrigger className="border-gray-200 bg-white text-gray-900">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={serviceFilter} onValueChange={(value) => { setServiceFilter(value); setPage(1) }}>
              <SelectTrigger className="border-gray-200 bg-white text-gray-900">
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All services</SelectItem>
                {serviceOptions.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={featureFilter} onValueChange={(value) => { setFeatureFilter(value); setPage(1) }}>
              <SelectTrigger className="border-gray-200 bg-white text-gray-900">
                <SelectValue placeholder="Feature area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All features</SelectItem>
                {featureOptions.map((feature) => (
                  <SelectItem key={feature} value={feature}>
                    {titleCase(feature)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateRangeFilter} onValueChange={(value) => { setDateRangeFilter(value); setPage(1) }}>
              <SelectTrigger className="border-gray-200 bg-white text-gray-900">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All dates</SelectItem>
                <SelectItem value="today">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-3">
              <Button onClick={applyFilters} className="bg-blue-600 text-white hover:bg-blue-700">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                disabled={
                  !searchInput &&
                  !barcodeInput &&
                  !submittedSearch &&
                  !submittedBarcode &&
                  severityFilter === "all" &&
                  serviceFilter === "all" &&
                  featureFilter === "all" &&
                  dateRangeFilter === "all"
                }
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching} className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900">
              {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
            <Badge variant="outline" className={connection.className}>
              <ConnectionIcon className={cn("mr-2 h-3.5 w-3.5", socketState === "connecting" && "animate-spin")} />
              {connection.label}
            </Badge>
            {submittedSearch ? <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">search: {submittedSearch}</Badge> : null}
            {submittedBarcode ? <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">barcode: {submittedBarcode}</Badge> : null}
            {severityFilter !== "all" ? <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">severity: {severityFilter}</Badge> : null}
            {serviceFilter !== "all" ? <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">service: {serviceFilter}</Badge> : null}
            {featureFilter !== "all" ? <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">feature: {titleCase(featureFilter)}</Badge> : null}
            {dateRangeFilter !== "all" ? <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">range: {dateRangeFilter}</Badge> : null}
            <Button variant="outline" onClick={exportVisibleEvents} disabled={!events.length} className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900">
              <Download className="mr-2 h-4 w-4" />
              Export current page
            </Button>
            <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
              <span>Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>
                Next
              </Button>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Seven-day activity</div>
                  <div className="mt-1 text-sm text-gray-600">A quick volume view before you drill into individual events.</div>
                </div>
                <div className="text-right text-sm font-semibold text-gray-900">{events.length} visible events</div>
              </div>
              <div className="mt-5 grid h-36 grid-cols-7 gap-3">
                {trendBuckets.map((bucket) => (
                  <div key={bucket.key} className="flex flex-col items-center justify-end gap-2">
                    <div className="flex h-full w-full items-end">
                      <div
                        className={cn(
                          "w-full rounded-t-2xl bg-gradient-to-b from-sky-300 via-sky-500 to-blue-700 transition-all",
                          bucket.count === 0 && "from-gray-200 via-gray-300 to-gray-400",
                        )}
                        style={{ height: bucket.height }}
                      />
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-semibold text-gray-900">{bucket.count}</div>
                      <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">{bucket.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Top actor</div>
                <div className="mt-2 text-lg font-semibold text-gray-900">{topActor?.[0] || "—"}</div>
                <div className="mt-1 text-xs text-gray-600">{topActor ? `${topActor[1]} changes in view` : "No actor data in the current filter"}</div>
              </div>
              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Impacted object</div>
                <div className="mt-2 text-lg font-semibold text-gray-900">{topTargetType?.[0] || "—"}</div>
                <div className="mt-1 text-xs text-gray-600">{topTargetType ? `${topTargetType[1]} events in view` : "No object data in the current filter"}</div>
              </div>
              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Review mode</div>
                <div className="mt-2 text-lg font-semibold text-gray-900">{submittedBarcode ? "Record trace" : "Global audit scan"}</div>
                <div className="mt-1 text-xs text-gray-600">
                  {submittedBarcode ? "Pinned to one barcode for item-level investigation." : "Cross-service workspace history with scoped filters."}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="h-[65vh] animate-pulse rounded-3xl border border-gray-200 bg-white" />
      ) : events.length === 0 ? (
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-3 p-10 text-center">
            <Activity className="h-8 w-8 text-gray-400" />
            <div className="text-lg font-semibold text-gray-900">No audit events matched</div>
            <div className="max-w-2xl text-sm text-gray-600">
              Adjust the filters, then generate new catalog, POS, inventory, or access-control activity. Matching events will appear here live when the websocket is connected.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
          <Card className="overflow-hidden border-gray-200 bg-white shadow-sm">
            <CardHeader className="border-b border-gray-100 p-6 text-left">
              <CardTitle className="text-xl text-gray-900">Realtime event stream</CardTitle>
              <CardDescription className="text-sm leading-6 text-gray-600">
                Select an event to inspect the target, review business context, and compare before/after changes without leaving the page.
              </CardDescription>
            </CardHeader>
            <ScrollArea className="h-[70vh]">
              <CardContent className="space-y-3 p-4">
                {events.map((event) => {
                  const tone = severityTone(event.severity)
                  const isSelected = event.id === selectedEvent?.id
                  const eventImageUrl = getAuditEventImageUrl(event)
                  const eventProductContext = getAuditEventProductContext(event)
                  const eventReviewModel = getAuditReviewModel(event)
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setSelectedEventId(event.id)}
                      className={cn(
                        "w-full rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40",
                        "border-l-4",
                        tone.border,
                        isSelected && "border-blue-300 bg-blue-50 shadow-[0_18px_44px_-32px_rgba(59,130,246,0.35)] hover:bg-blue-50 hover:border-blue-300",
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                          {eventImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={eventImageUrl} alt={eventProductContext.title || event.target_label || "Audit target"} className="h-full w-full object-cover" />
                          ) : (
                            <PackageOpen className={cn("h-5 w-5 text-gray-400", isSelected && "text-blue-600")} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={severityVariant(event.severity)} className={isSelected ? "border-blue-200 bg-white text-blue-700" : tone.pill}>
                              {event.severity || "info"}
                            </Badge>
                            <Badge variant="outline" className={isSelected ? "border-blue-200 bg-white text-blue-700" : "border-gray-200 bg-gray-50 text-gray-700"}>
                              {event.source_service || "unknown"}
                            </Badge>
                            <Badge variant="outline" className={isSelected ? "border-blue-200 bg-white text-blue-700" : eventReviewModel.badgeClassName}>
                              {eventReviewModel.label}
                            </Badge>
                            {Boolean(event.metadata_json?.realtime) ? (
                              <Badge variant="outline" className={isSelected ? "border-cyan-200 bg-white text-cyan-700" : "border-cyan-200 bg-cyan-50 text-cyan-700"}>
                                <Bolt className="mr-1 h-3 w-3" />
                                Live
                              </Badge>
                            ) : null}
                          </div>
                          <div className={cn("text-base font-semibold leading-6 text-gray-900", isSelected && "text-gray-950")}>
                            {event.summary || event.event_name}
                          </div>
                          {eventProductContext.title ? (
                            <div className={cn("rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2", isSelected && "border-blue-100 bg-white")}>
                              <div className={cn("truncate text-sm font-semibold text-gray-900", isSelected && "text-gray-950")}>{eventProductContext.title}</div>
                              {eventProductContext.subtitle ? (
                                <div className={cn("mt-1 truncate text-xs text-gray-500", isSelected && "text-gray-600")}>{eventProductContext.subtitle}</div>
                              ) : null}
                            </div>
                          ) : eventReviewModel.summary ? (
                            <div className={cn("rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-600", isSelected && "border-blue-100 bg-white text-gray-700")}>
                              {eventReviewModel.summary}
                            </div>
                          ) : null}
                          <div className={cn("grid gap-2 text-xs text-gray-500 md:grid-cols-2", isSelected && "text-gray-600")}>
                            <div>{event.actor_name || event.actor_email || "System actor"}</div>
                            <div>{event.target_label || titleCase(event.target_type) || "Unknown target"}</div>
                            <div>{formatDateTime(event.occurred_at)}</div>
                            <div>{formatRelativeTime(event.occurred_at)}</div>
                          </div>
                        </div>
                        <div className={cn("shrink-0 text-right text-xs text-gray-500", isSelected && "text-gray-600")}>
                          <div>{event.reference_number || event.entity_sku || "No ref"}</div>
                          <div className="mt-2">{event.entity_barcode || "No barcode"}</div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {event.feature_area ? (
                          <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", isSelected ? "bg-white text-blue-700" : "bg-gray-100 text-gray-700")}>
                            {titleCase(event.feature_area)}
                          </span>
                        ) : null}
                        {event.action ? (
                          <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", isSelected ? "bg-white text-blue-700" : "bg-gray-100 text-gray-700")}>
                            {titleCase(event.action)}
                          </span>
                        ) : null}
                        {event.entity_sku ? (
                          <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", isSelected ? "bg-white text-blue-700" : "bg-gray-100 text-gray-700")}>
                            SKU {event.entity_sku}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  )
                })}
              </CardContent>
            </ScrollArea>
          </Card>

          <Card className="overflow-hidden border-gray-200 bg-white shadow-sm">
            {selectedEvent ? (
              <>
                <CardHeader className="border-b border-gray-100 bg-gray-100/50 p-6 text-left text-gray-900">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={severityVariant(selectedEvent.severity)} className={severityTone(selectedEvent.severity).pill}>
                      {selectedEvent.severity || "info"}
                    </Badge>
                    <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
                      {selectedEvent.source_service || "unknown"}
                    </Badge>
                    {selectedEventReviewModel ? (
                      <Badge variant="outline" className={selectedEventReviewModel.badgeClassName}>
                        {selectedEventReviewModel.label}
                      </Badge>
                    ) : null}
                    {selectedEvent.feature_area ? (
                      <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
                        {titleCase(selectedEvent.feature_area)}
                      </Badge>
                    ) : null}
                    {Boolean(selectedEvent.metadata_json?.realtime) ? (
                      <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-700">
                        <Bolt className="mr-1 h-3 w-3" />
                        Realtime
                      </Badge>
                    ) : null}
                  </div>
                  <CardTitle className="text-2xl font-semibold leading-8 text-gray-900">
                    {selectedEvent.summary || selectedEvent.event_name}
                  </CardTitle>
                  <CardDescription className="text-sm leading-6 text-gray-600">
                    {formatDateTime(selectedEvent.occurred_at)} • {selectedEvent.actor_name || selectedEvent.actor_email || "System actor"} •{" "}
                    {selectedEvent.target_label || titleCase(selectedEvent.target_type) || "Unknown target"}
                  </CardDescription>
                </CardHeader>

                <ScrollArea className="h-[70vh]">
                  <CardContent className="space-y-5 p-6">
                  <div className="grid gap-4 md:grid-cols-2">
                      {selectedEventProductContext?.title || selectedEventImageUrl || selectedEventSales.length ? (
                        <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-4 md:col-span-2">
                          <div className="flex items-start gap-4">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-gray-200 bg-white">
                              {selectedEventImageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={selectedEventImageUrl} alt={selectedEventProductContext?.title || selectedEvent.target_label || "Audit target"} className="h-full w-full object-cover" />
                              ) : (
                                <PackageOpen className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Product context</div>
                              <div className="mt-3 text-lg font-semibold text-gray-900">
                                {selectedEventProductContext?.title || selectedEvent.target_label || "No product snapshot"}
                              </div>
                              {selectedEventProductContext?.subtitle ? (
                                <div className="mt-1 text-sm text-gray-600">{selectedEventProductContext.subtitle}</div>
                              ) : null}
                              {selectedEventSales.length ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
                                    {selectedEventSales.length} sale line{selectedEventSales.length === 1 ? "" : "s"}
                                  </Badge>
                                  <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
                                    {selectedEventSales.reduce((sum, sale) => sum + sale.quantity, 0)} unit{selectedEventSales.reduce((sum, sale) => sum + sale.quantity, 0) === 1 ? "" : "s"}
                                  </Badge>
                                  {selectedEventSales[0]?.terminalName ? (
                                    <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
                                      {selectedEventSales[0].terminalName}
                                    </Badge>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ) : null}
                      <div className="rounded-[24px] border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                          <Shield className="h-3.5 w-3.5" />
                          Actor
                        </div>
                        <div className="mt-3 text-sm font-semibold text-gray-900">{selectedEvent.actor_name || selectedEvent.actor_email || "System actor"}</div>
                        <div className="mt-1 text-xs text-gray-600">{selectedEvent.actor_role ? titleCase(selectedEvent.actor_role) : "No role provided"}</div>
                      </div>
                      <div className="rounded-[24px] border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                          <Activity className="h-3.5 w-3.5" />
                          Target
                        </div>
                        <div className="mt-3 text-sm font-semibold text-gray-900">{selectedEvent.target_label || titleCase(selectedEvent.target_type) || "Unknown target"}</div>
                        <div className="mt-1 text-xs text-gray-600">{selectedEvent.target_id || "No target id"}</div>
                      </div>
                      <div className="rounded-[24px] border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                          <Barcode className="h-3.5 w-3.5" />
                          Reference
                        </div>
                        <div className="mt-3 text-sm font-semibold text-gray-900">{selectedEvent.reference_number || selectedEvent.entity_sku || "—"}</div>
                        <div className="mt-1 text-xs text-gray-600">{selectedEvent.entity_barcode || "No barcode"}</div>
                      </div>
                      <div className="rounded-[24px] border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                          Correlation
                        </div>
                        <div className="mt-3 break-all text-sm font-semibold text-gray-900">{selectedEvent.correlation_id || "No correlation id"}</div>
                        <div className="mt-1 break-all text-xs text-gray-600">{selectedEvent.request_id || "No request id"}</div>
                      </div>
                    </div>

                    <div className={cn("rounded-[24px] border p-4", selectedEventReviewModel?.cardClassName || "border-blue-200 bg-blue-50/80")}>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Event narrative</div>
                      <div className="mt-2 text-sm leading-6 text-gray-700">{selectedEventReviewModel?.summary || eventNarrative}</div>
                    </div>

                    <UrlTabs defaultValue="review" tabValues={["review", "changes", "trace"]} tabParam="audit_tab" className="w-full">
                      <TabsList className="grid h-auto w-full grid-cols-3 gap-2 rounded-2xl border border-gray-200 bg-gray-100 p-2">
                        <TabsTrigger value="review" className="rounded-xl border border-transparent bg-transparent text-gray-600 data-[state=active]:border-blue-200 data-[state=active]:bg-white data-[state=active]:text-blue-700">
                          Review
                        </TabsTrigger>
                        <TabsTrigger value="changes" className="rounded-xl border border-transparent bg-transparent text-gray-600 data-[state=active]:border-blue-200 data-[state=active]:bg-white data-[state=active]:text-blue-700">
                          Changes
                        </TabsTrigger>
                        <TabsTrigger value="trace" className="rounded-xl border border-transparent bg-transparent text-gray-600 data-[state=active]:border-blue-200 data-[state=active]:bg-white data-[state=active]:text-blue-700">
                          Trace
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="review" className="mt-4 space-y-4">
                        {selectedEventReviewModel?.statCards?.length ? (
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {selectedEventReviewModel.statCards.map((card) => (
                              <div key={card.label} className="rounded-[22px] border border-gray-200 bg-white p-4">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">{card.label}</div>
                                <div className="mt-3 text-lg font-semibold text-gray-900">{card.value}</div>
                                {card.helper ? <div className="mt-1 text-xs leading-5 text-gray-600">{card.helper}</div> : null}
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-[24px] border border-gray-200 bg-white p-5">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Operational summary</div>
                            <div className="mt-3 text-sm leading-6 text-gray-700">
                              {selectedEventReviewModel?.summary || selectedEvent.summary || eventNarrative}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              {selectedEvent.action ? (
                                <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-700">
                                  {titleCase(selectedEvent.action)}
                                </Badge>
                              ) : null}
                              {selectedEvent.feature_area ? (
                                <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-700">
                                  {titleCase(selectedEvent.feature_area)}
                                </Badge>
                              ) : null}
                              {selectedEvent.visibility_scope ? (
                                <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-700">
                                  {titleCase(selectedEvent.visibility_scope)}
                                </Badge>
                              ) : null}
                            </div>
                          </div>

                          <div className="rounded-[24px] border border-gray-200 bg-white p-5">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Investigation prompts</div>
                            <div className="mt-3 space-y-3 text-sm text-gray-700">
                              {(selectedEventReviewModel?.focusPoints?.length ? selectedEventReviewModel.focusPoints : [
                                "Confirm the actor, target, and reference first. That establishes whether the right workspace object was touched.",
                                "Use Changes for before/after field comparison when the event modified data.",
                                "Use Trace only when you need deeper technical context such as request, correlation, device, or delivery signals.",
                              ]).map((point) => (
                                <div key={point} className="rounded-2xl bg-gray-50 px-4 py-3">
                                  {point}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {selectedEventReviewModel?.referenceRows?.length ? (
                          <div className="rounded-[24px] border border-gray-200 bg-white p-5">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Operational references</div>
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              {selectedEventReviewModel.referenceRows.map((row) => (
                                <div key={`${row.label}-${row.value}`} className="rounded-[20px] border border-gray-200 bg-gray-50 p-4">
                                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">{row.label}</div>
                                  <div className="mt-2 break-words text-sm font-semibold text-gray-900">{row.value || "—"}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        <div className="grid gap-3 md:grid-cols-2">
                          {[
                            ["Actor role", selectedEvent.actor_role ? titleCase(selectedEvent.actor_role) : "No role provided"],
                            ["Target record", selectedEvent.target_label || titleCase(selectedEvent.target_type) || "Unknown target"],
                            ["Reference", selectedEvent.reference_number || selectedEvent.entity_sku || "—"],
                            ["Barcode", selectedEvent.entity_barcode || "No barcode"],
                            ["Occurred", formatDateTime(selectedEvent.occurred_at)],
                            ["Received", formatDateTime(selectedEvent.ingested_at)],
                          ].map(([label, value]) => (
                            <div key={label} className="rounded-[22px] border border-gray-200 bg-white p-4">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">{label}</div>
                              <div className="mt-3 text-sm font-semibold text-gray-900">{value}</div>
                            </div>
                          ))}
                        </div>

                        {selectedEventReviewModel?.highlightedLines?.length ? (
                          <div className="rounded-[24px] border border-gray-200 bg-white p-5">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Highlighted lines</div>
                            <div className="mt-4 space-y-3">
                              {selectedEventReviewModel.highlightedLines.map((line, index) => (
                                <div key={`${line.title}-${line.trailing}-${index}`} className="rounded-[20px] border border-gray-200 bg-gray-50 p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="truncate text-sm font-semibold text-gray-900">{line.title}</div>
                                      <div className="mt-1 text-xs text-gray-600">{line.subtitle}</div>
                                    </div>
                                    <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
                                      {line.trailing}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {machineSignals.length ? (
                          <div className="rounded-[24px] border border-gray-200 bg-white p-5">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Machine signals</div>
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              {machineSignals.map(([key, value]) => (
                                <div key={key} className="rounded-[20px] border border-gray-200 bg-gray-50 p-4">
                                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">{titleCase(key)}</div>
                                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-xs text-gray-700">
                                    {previewValue(value)}
                                  </pre>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {selectedEventSales.length ? (
                          <div className="rounded-[24px] border border-gray-200 bg-white p-5">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Sale lines</div>
                            <div className="mt-4 space-y-3">
                              {selectedEventSales.map((sale) => (
                                <div key={sale.id} className="rounded-[20px] border border-gray-200 bg-gray-50 p-4">
                                  <div className="flex items-start gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[16px] border border-gray-200 bg-white">
                                      {sale.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={sale.imageUrl} alt={sale.productName} className="h-full w-full object-cover" />
                                      ) : (
                                        <PackageOpen className="h-4 w-4 text-gray-400" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div className="min-w-0">
                                          <div className="truncate text-sm font-semibold text-gray-900">{sale.productName}</div>
                                          <div className="mt-1 truncate text-xs text-gray-600">
                                            {sale.variantName || "Base product"}{sale.sku ? ` • SKU ${sale.sku}` : ""}
                                          </div>
                                        </div>
                                        <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
                                          {sale.quantity} sold
                                        </Badge>
                                      </div>
                                      <div className="mt-3 grid gap-2 text-xs text-gray-600 md:grid-cols-2">
                                        <div>{sale.actorName}</div>
                                        <div>{sale.terminalName || sale.terminalLocationName || "No terminal snapshot"}</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {selectedEventReceipts.length ? (
                          <div className="rounded-[24px] border border-gray-200 bg-white p-5">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Receiving lines</div>
                            <div className="mt-4 space-y-3">
                              {selectedEventReceipts.map((receipt) => (
                                <div key={receipt.id} className="rounded-[20px] border border-gray-200 bg-gray-50 p-4">
                                  <div className="flex items-start gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[16px] border border-gray-200 bg-white">
                                      {receipt.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={receipt.imageUrl} alt={receipt.inventoryName} className="h-full w-full object-cover" />
                                      ) : (
                                        <PackageOpen className="h-4 w-4 text-gray-400" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div className="min-w-0">
                                          <div className="truncate text-sm font-semibold text-gray-900">{receipt.inventoryName}</div>
                                          <div className="mt-1 truncate text-xs text-gray-600">
                                            {receipt.purchaseOrderReference || "No PO"} • {receipt.goodsReceiptReference || "No GR"}
                                            {receipt.sku ? ` • SKU ${receipt.sku}` : receipt.barcode ? ` • ${receipt.barcode}` : ""}
                                          </div>
                                        </div>
                                        <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
                                          +{receipt.receivedQuantity} received
                                        </Badge>
                                      </div>
                                      <div className="mt-3 grid gap-2 text-xs text-gray-600 md:grid-cols-2">
                                        <div>{receipt.actorName}</div>
                                        <div>{receipt.stockLocationName || "No stock location"}</div>
                                        <div>To date: {receipt.quantityReceivedToDate}</div>
                                        <div>Remaining: {receipt.remainingQuantity}</div>
                                        {receipt.lotNumber ? <div>Lot: {receipt.lotNumber}</div> : null}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </TabsContent>

                      <TabsContent value="changes" className="mt-4">
                        {changeRows.length ? (
                          <div className="space-y-4">
                            <div className="grid gap-3 md:grid-cols-3">
                              <div className="rounded-[22px] border border-gray-200 bg-white p-4">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Fields touched</div>
                                <div className="mt-2 text-2xl font-semibold text-gray-900">{changeRows.length}</div>
                              </div>
                              <div className="rounded-[22px] border border-gray-200 bg-white p-4">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Record</div>
                                <div className="mt-2 text-sm font-semibold text-gray-900">{selectedEvent.target_label || titleCase(selectedEvent.target_type) || "Unknown target"}</div>
                              </div>
                              <div className="rounded-[22px] border border-gray-200 bg-white p-4">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Severity</div>
                                <div className="mt-2 text-sm font-semibold text-gray-900">{titleCase(selectedEvent.severity || "info")}</div>
                              </div>
                            </div>

                            <div className="overflow-hidden rounded-[24px] border border-gray-200 bg-white">
                              <div className="grid grid-cols-[minmax(0,180px)_minmax(0,1fr)_minmax(0,1fr)] border-b border-gray-200 bg-gray-100 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                                <div>Field</div>
                                <div>Before</div>
                                <div>After</div>
                              </div>
                              {changeRows.map((row) => (
                                <div
                                  key={row.key}
                                  className="grid grid-cols-[minmax(0,180px)_minmax(0,1fr)_minmax(0,1fr)] gap-4 border-b border-gray-100 px-4 py-4 last:border-b-0"
                                >
                                  <div className="text-sm font-semibold text-gray-900">{titleCase(row.key)}</div>
                                  <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-2xl bg-red-50 px-3 py-2 text-xs text-red-700">
                                    {previewValue(row.before)}
                                  </pre>
                                  <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-2xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                                    {previewValue(row.after)}
                                  </pre>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-[24px] border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
                            No structured change payload was attached to this event.
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="trace" className="mt-4 space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          {traceContextRows.map(([label, value]) => (
                            <div key={label} className="rounded-[22px] border border-gray-200 bg-white p-4">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">{label}</div>
                              <div className="mt-3 break-words text-sm font-semibold text-gray-900">{value}</div>
                            </div>
                          ))}
                        </div>

                        {(selectedEvent.changes_json && Object.keys(selectedEvent.changes_json).length > 0) || (selectedEvent.metadata_json && Object.keys(selectedEvent.metadata_json).length > 0) ? (
                          <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                            <div className="flex items-center gap-2 font-semibold">
                              <AlertTriangle className="h-4 w-4" />
                              Trace note
                            </div>
                            <div className="mt-2 leading-6">
                              This event carries structured machine payload. Keep the normal investigation in <span className="font-semibold">Review</span> and <span className="font-semibold">Changes</span>; expand the raw payload below only when you need a forensic trace.
                            </div>
                          </div>
                        ) : null}

                        <details className="rounded-[24px] border border-gray-200 bg-white p-5">
                          <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900">
                            Open raw metadata payload
                          </summary>
                          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words rounded-2xl bg-gray-50 p-4 text-xs text-gray-700">
                            {JSON.stringify(selectedEvent.metadata_json || {}, null, 2)}
                          </pre>
                        </details>

                        <details className="rounded-[24px] border border-gray-200 bg-white p-5">
                          <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900">
                            Open raw changes payload
                          </summary>
                          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words rounded-2xl bg-gray-50 p-4 text-xs text-gray-700">
                            {JSON.stringify(selectedEvent.changes_json || {}, null, 2)}
                          </pre>
                        </details>
                      </TabsContent>
                    </UrlTabs>
                  </CardContent>
                </ScrollArea>
              </>
            ) : null}
          </Card>
        </div>
      )}
    </div>
  )
}

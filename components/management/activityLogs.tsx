"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity, RefreshCw, Wifi, WifiOff } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getActiveWorkspaceId, getAuditWebSocketBaseUrl, getRealtimeAccessToken, requestRealtimeWebSocketTicket } from "@/lib/serviceRealtime"
import { useListAuditEventsQuery } from "@/redux/features/audit/auditApiSlice"
import type { AuditEventRecord } from "@/redux/features/audit/auditTypes"

type ActivityLogsProps = {
  userId: string
  refetchData: boolean
  onRefetchComplete: () => void
}

type AuditRealtimeEnvelope = {
  type?: string
  workspace_id?: string
  event?: AuditEventRecord
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

const titleCase = (value?: string | null) =>
  String(value || "")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())

const eventTone = (severity?: string) => {
  switch ((severity || "").toLowerCase()) {
    case "critical":
    case "high":
      return "border-red-400/40 bg-red-500/15 text-red-200"
    case "warning":
      return "border-amber-300/40 bg-amber-400/15 text-amber-200"
    default:
      return "border-sky-300/40 bg-sky-400/15 text-sky-200"
  }
}

const withRealtimeMetadata = (event: AuditEventRecord): AuditEventRecord => ({
  ...event,
  metadata_json: {
    ...(event.metadata_json || {}),
    realtime: true,
  },
})

export default function ActivityLogs({ userId, refetchData, onRefetchComplete }: ActivityLogsProps) {
  const workspaceId = getActiveWorkspaceId()
  const [realtimeEvents, setRealtimeEvents] = useState<AuditEventRecord[]>([])
  const [socketState, setSocketState] = useState<"connected" | "disconnected">("disconnected")
  const { data, isLoading, isFetching, error, refetch } = useListAuditEventsQuery(
    {
      workspace_id: workspaceId,
      actor_user_id: userId,
      limit: 50,
      offset: 0,
    },
    {
      skip: !workspaceId || !userId || userId === "0",
      pollingInterval: 15000,
    },
  )

  useEffect(() => {
    if (!refetchData) return
    refetch().finally(onRefetchComplete)
  }, [refetchData, refetch, onRefetchComplete])

  useEffect(() => {
    if (!workspaceId || !userId || userId === "0") return
    const accessToken = getRealtimeAccessToken()
    if (!accessToken) {
      return
    }

    let socket: WebSocket | null = null
    let disposed = false
    const connect = async () => {
      const ticket = await requestRealtimeWebSocketTicket()
      if (!ticket || disposed) return
      socket = new WebSocket(
        `${getAuditWebSocketBaseUrl()}/api/v1/audits/ws/workspaces/${encodeURIComponent(workspaceId)}/audits?ws_ticket=${encodeURIComponent(ticket)}`,
      )

      socket.onopen = () => setSocketState("connected")
      socket.onclose = () => setSocketState("disconnected")
      socket.onerror = () => setSocketState("disconnected")
      socket.onmessage = (message) => {
      try {
        const envelope = JSON.parse(message.data) as AuditRealtimeEnvelope
        if (!envelope.event || `${envelope.event.actor_user_id}` !== `${userId}`) return
        setRealtimeEvents((current) => {
          const next = [withRealtimeMetadata(envelope.event as AuditEventRecord), ...current.filter((event) => event.id !== envelope.event?.id)]
          return next.slice(0, 50)
        })
      } catch {
        // Ignore malformed realtime envelopes.
      }
      }
    }
    void connect()

    return () => {
      disposed = true
      socket?.close()
    }
  }, [userId, workspaceId])

  const events = useMemo(() => {
    const merged = new Map<string, AuditEventRecord>()
    for (const event of realtimeEvents) {
      if (`${event.actor_user_id}` === `${userId}` && (!workspaceId || `${event.workspace_id}` === `${workspaceId}`)) {
        merged.set(event.id, event)
      }
    }
    for (const event of data?.results || []) {
      if (`${event.actor_user_id}` === `${userId}`) {
        merged.set(event.id, event)
      }
    }
    return Array.from(merged.values()).sort(
      (left, right) => new Date(right.occurred_at || right.ingested_at).getTime() - new Date(left.occurred_at || left.ingested_at).getTime(),
    )
  }, [data?.results, realtimeEvents, userId, workspaceId])

  if (error) {
    return (
      <div className="rounded-3xl border border-red-400/40 bg-red-500/15 p-5 text-sm text-red-200">
        Unable to load staff audit activity. Confirm this user has audit-trail access or owner privileges.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-800 bg-slate-950/80 p-4 shadow-[0_20px_55px_rgba(2,6,23,0.28)]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-200">
              <Activity className="h-3.5 w-3.5" />
              Audit-backed staff activity
            </div>
            <Badge variant="outline" className={socketState === "connected" ? "border-[#98fcc2]/40 bg-[#98fcc2]/10 text-[#98fcc2]" : "border-slate-600 bg-slate-900 text-slate-300"}>
              {socketState === "connected" ? <Wifi className="mr-1 h-3 w-3" /> : <WifiOff className="mr-1 h-3 w-3" />}
              {socketState === "connected" ? "Live" : "Fallback polling"}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Showing audit events where this staff member is the actor. New matching events stream in live, with a 15-second fallback refresh.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => void refetch()} disabled={isFetching} className="rounded-full border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white">
          <RefreshCw className="mr-2 h-4 w-4" />
          {isFetching ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 text-sm text-slate-400">Loading audit activity...</div>
      ) : events.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/60 p-8 text-center">
          <p className="text-base font-semibold text-slate-100">No audit activity for this staff member yet.</p>
          <p className="mt-2 text-sm text-slate-400">When the user performs catalog, POS, inventory, purchase, or access-control actions, matching audit events will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4 shadow-[0_12px_30px_rgba(2,6,23,0.2)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={eventTone(event.severity)}>
                      {titleCase(event.severity || "info")}
                    </Badge>
                    <Badge variant="outline" className="border-slate-700 bg-slate-900 text-slate-300">
                      {titleCase(event.feature_area || event.source_service || "platform")}
                    </Badge>
                    {event.metadata_json?.realtime ? (
                      <Badge variant="outline" className="border-[#98fcc2]/40 bg-[#98fcc2]/10 text-[#98fcc2]">
                        Live arrival
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-100">{event.summary || titleCase(event.event_name)}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {event.target_label || titleCase(event.target_type)} {event.reference_number ? `• Ref: ${event.reference_number}` : ""}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>{formatRelativeTime(event.occurred_at || event.ingested_at)}</p>
                  <p className="mt-1">{new Date(event.occurred_at || event.ingested_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

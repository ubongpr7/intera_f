"use client"

import { useEffect, useState } from "react"
import { getAuditWebSocketBaseUrl, getRealtimeAccessToken, getActiveWorkspaceId, requestRealtimeWebSocketTicket } from "@/lib/serviceRealtime"
import { useGetRealtimeDashboardSnapshotQuery } from "@/redux/features/audit/auditApiSlice"
import type { DashboardRealtimeEnvelope, DashboardWorkspaceSnapshot } from "@/redux/features/audit/auditRealtimeDashboardTypes"

export type DashboardSocketState = "connecting" | "connected" | "disconnected"

export function useAuditRealtimeDashboard() {
  const workspaceId = getActiveWorkspaceId()
  const accessToken = getRealtimeAccessToken()
  const [liveSnapshot, setLiveSnapshot] = useState<DashboardWorkspaceSnapshot | null>(null)
  const [socketState, setSocketState] = useState<DashboardSocketState>(() =>
    workspaceId && accessToken ? "connecting" : "disconnected",
  )
  const { data, isLoading, isFetching } = useGetRealtimeDashboardSnapshotQuery(workspaceId ?? "", {
    skip: !workspaceId,
  })

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
        `${getAuditWebSocketBaseUrl()}/api/v1/realtime/ws/workspaces/${encodeURIComponent(workspaceId)}/dashboard?ws_ticket=${encodeURIComponent(ticket)}`,
      )

      socket.onopen = () => setSocketState("connected")
      socket.onerror = () => setSocketState("disconnected")
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

      socket.onmessage = (message) => {
        try {
          const payload = JSON.parse(message.data) as DashboardRealtimeEnvelope
          if (payload.snapshot) {
            setLiveSnapshot(payload.snapshot)
          }
        } catch {
          return
        }
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
  }, [accessToken, workspaceId])

  const snapshot =
    workspaceId && liveSnapshot && liveSnapshot.workspace_id === workspaceId
      ? liveSnapshot
      : data ?? null
  const effectiveSocketState: DashboardSocketState =
    workspaceId && accessToken ? socketState : "disconnected"

  return {
    workspaceId,
    snapshot,
    socketState: effectiveSocketState,
    isLoading,
    isFetching,
  }
}

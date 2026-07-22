"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowRight, Bell, CheckCheck, Loader2, MailOpen, RefreshCcw, ShieldCheck, Wifi, WifiOff } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatMachineLabel } from "@/lib/displayLabels"
import { getNotificationPresentation } from "@/lib/notificationEventHelpers"
import {
  canReachNotificationService,
  getNotificationWebSocketBaseUrl,
  getRealtimeAccessToken,
} from "@/lib/serviceRealtime"
import {
  useGetNotificationUnreadCountQuery,
  useListNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/redux/features/notification/notificationApiSlice"
import type { NotificationRecord } from "@/redux/features/notification/notificationTypes"

const formatDateTime = (value?: string | null) => {
  if (!value) return "Unknown time"
  return new Date(value).toLocaleString()
}

type NotificationRealtimeEnvelope = {
  type?: string
  payload?: {
    notifications?: NotificationRecord[]
  }
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
      className: "border-amber-200 bg-amber-50 text-amber-700",
    }
  }
  return {
    label: "Disconnected",
    icon: WifiOff,
    className: "border-gray-200 bg-gray-50 text-gray-600",
  }
}

export default function NotificationCenterWorkspace() {
  const [liveNotifications, setLiveNotifications] = useState<NotificationRecord[]>([])
  const [socketState, setSocketState] = useState<"connecting" | "connected" | "disconnected">("disconnected")
  const [notificationServiceReady, setNotificationServiceReady] = useState(false)
  const {
    data: notificationResponse,
    isLoading,
    isFetching,
    refetch,
  } = useListNotificationsQuery(
    { limit: 50, offset: 0 },
    { pollingInterval: 15000, skip: !notificationServiceReady },
  )
  const {
    data: unreadResponse,
    isFetching: unreadFetching,
    refetch: refetchUnreadCount,
  } = useGetNotificationUnreadCountQuery(undefined, {
    pollingInterval: 15000,
    skip: !notificationServiceReady,
  })
  const [markNotificationRead, { isLoading: markingRead }] = useMarkNotificationReadMutation()
  const [markAllNotificationsRead, { isLoading: markingAllRead }] = useMarkAllNotificationsReadMutation()
  const accessToken = getRealtimeAccessToken()

  useEffect(() => {
    let disposed = false
    void canReachNotificationService().then((available) => {
      if (!disposed) {
        setNotificationServiceReady(available)
      }
    })
    return () => {
      disposed = true
    }
  }, [])

  useEffect(() => {
    if (!notificationServiceReady) {
      return
    }
    if (!accessToken) {
      return
    }

    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let disposed = false

    const connect = () => {
      socket = new WebSocket(
        `${getNotificationWebSocketBaseUrl()}/ws/notifications?token=${encodeURIComponent(accessToken)}`,
      )

      socket.onopen = () => {
        setSocketState("connected")
      }

      socket.onmessage = (message) => {
        try {
          const envelope = JSON.parse(message.data) as NotificationRealtimeEnvelope
          const incomingNotifications = envelope.payload?.notifications ?? []
          if (!incomingNotifications.length) {
            return
          }
          setLiveNotifications((current) => {
            const existing = new Map(current.map((item) => [item.id, item]))
            for (const notification of incomingNotifications) {
              existing.set(notification.id, notification)
            }
            return Array.from(existing.values()).sort(
              (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
            )
          })
          window.dispatchEvent(
            new CustomEvent("inventory-notification-received", {
              detail: { notifications: incomingNotifications },
            }),
          )
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
  }, [accessToken, notificationServiceReady])

  const notifications = useMemo(() => {
    const merged = new Map<string, NotificationRecord>()
    for (const notification of liveNotifications) {
      merged.set(notification.id, notification)
    }
    for (const notification of notificationResponse?.results ?? []) {
      if (!merged.has(notification.id)) {
        merged.set(notification.id, notification)
      }
    }
    return Array.from(merged.values()).sort(
      (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    )
  }, [liveNotifications, notificationResponse?.results])
  const unreadCount = notifications.filter((item) => !item.is_read).length
  const categoryCounts = useMemo(() => {
    return notifications.reduce<Record<string, number>>((acc, notification) => {
      const key = notification.category || "system"
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})
  }, [notifications])

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id).unwrap()
      setLiveNotifications((current) =>
        (current.length ? current : notifications).map((item) =>
          item.id === id
            ? {
                ...item,
                is_read: true,
                read_at: new Date().toISOString(),
              }
            : item,
        ),
      )
      window.dispatchEvent(new CustomEvent("inventory-notification-read"))
      await Promise.all([refetch(), refetchUnreadCount()])
      toast.success("Notification marked as read.")
    } catch (error) {
      toast.error("Unable to mark notification as read.")
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead().unwrap()
      setLiveNotifications((current) =>
        (current.length ? current : notifications).map((item) => ({
          ...item,
          is_read: true,
          read_at: item.read_at || new Date().toISOString(),
        })),
      )
      window.dispatchEvent(new CustomEvent("inventory-notification-read-all"))
      await Promise.all([refetch(), refetchUnreadCount()])
      toast.success("All notifications marked as read.")
    } catch (error) {
      toast.error("Unable to mark all notifications as read.")
    }
  }

  const liveConnection = connectionBadge(socketState)
  const LiveConnectionIcon = liveConnection.icon

  return (
    <div className="space-y-6">
      <Card className="border-gray-200 bg-white shadow-sm">
        <CardHeader className="gap-3 p-6 text-left">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            Notification Service
          </div>
          <CardTitle className="text-3xl font-semibold tracking-tight text-gray-900">Notification center</CardTitle>
          <CardDescription className="max-w-4xl text-sm leading-6 text-gray-600">
            Review support-access changes, purchase-order updates, stock alerts, POS activity, and system events delivered to the current user.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6 pt-0">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Unread</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{unreadCount}</div>
            </div>
            <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Loaded</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{notifications.length}</div>
            </div>
            <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Refresh state</div>
              <div className="mt-2 text-sm font-semibold text-gray-900">
                {isFetching || unreadFetching ? "Refreshing..." : "Up to date"}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
            <Badge variant="outline" className={liveConnection.className}>
              <LiveConnectionIcon className={`mr-2 h-3.5 w-3.5 ${socketState === "connecting" ? "animate-spin" : ""}`} />
              {liveConnection.label}
            </Badge>
            <Button variant="outline" onClick={handleMarkAllRead} disabled={markingAllRead || unreadCount === 0}>
              {markingAllRead ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
              Mark all read
            </Button>
          </div>

          {Object.keys(categoryCounts).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryCounts).map(([category, count]) => (
                <Badge key={category} variant="outline" className="rounded-full border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
                  {formatMachineLabel(category)}: {count}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`notification-loading-${index}`} className="h-48 animate-pulse rounded-2xl border border-gray-200 bg-white" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Bell className="h-8 w-8 text-gray-400" />
            <div className="text-lg font-semibold text-gray-900">No notifications yet</div>
            <div className="max-w-2xl text-sm text-gray-600">
              Once purchase-order, stock, support-access, or POS events target this user, they will appear here.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {notifications.map((notification) => {
            const presentation = getNotificationPresentation(notification)

            return (
            <Card
              key={notification.id}
              className={`overflow-hidden shadow-sm ${notification.is_read ? "border-gray-200" : "border-blue-200 bg-blue-50/20"}`}
            >
              <div className={`h-1.5 w-full ${notification.is_read ? "bg-slate-200" : "bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-400"}`} />
              <CardHeader className="gap-3 p-6 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={notification.is_read ? "outline" : "default"}>
                    {notification.is_read ? "Read" : "Unread"}
                  </Badge>
                  <Badge variant="outline" className={presentation.tone.badgeClassName}>
                    {presentation.categoryLabel}
                  </Badge>
                  <Badge variant="outline">{notification.scope}</Badge>
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">{notification.title || "Notification"}</CardTitle>
                <CardDescription className="text-sm leading-6 text-gray-600">
                  {notification.message || "No message was attached to this notification."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6 pt-0">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className={`rounded-2xl border p-4 ${presentation.tone.panelClassName}`}>
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Target
                    </div>
                    <div className="mt-2 text-sm font-semibold text-gray-900">{presentation.targetLabel}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Workspace</div>
                    <div className="mt-2 text-sm font-semibold text-gray-900">{presentation.workspaceLabel}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Created</div>
                    <div className="mt-2 text-sm font-semibold text-gray-900">{formatDateTime(notification.created_at)}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Read at</div>
                    <div className="mt-2 text-sm font-semibold text-gray-900">{formatDateTime(notification.read_at)}</div>
                  </div>
                </div>

                {presentation.recipientNames.length > 0 ? (
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Recipients</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {presentation.recipientNames.map((recipient) => (
                        <Badge key={`${notification.id}-${recipient}`} variant="outline" className="rounded-full px-3 py-1">
                          {recipient}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                {presentation.grantedPermissions.length > 0 || presentation.revokedPermissions.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Granted</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {presentation.grantedPermissions.length > 0 ? presentation.grantedPermissions.map((permission) => (
                          <Badge key={`${notification.id}-granted-${permission}`} variant="outline" className="border-emerald-200 bg-white text-emerald-700">
                            {permission}
                          </Badge>
                        )) : <span className="text-sm text-emerald-800">No new permissions added.</span>}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">Revoked</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {presentation.revokedPermissions.length > 0 ? presentation.revokedPermissions.map((permission) => (
                          <Badge key={`${notification.id}-revoked-${permission}`} variant="outline" className="border-rose-200 bg-white text-rose-700">
                            {permission}
                          </Badge>
                        )) : <span className="text-sm text-rose-800">No permissions removed.</span>}
                      </div>
                    </div>
                  </div>
                ) : null}

                {presentation.metadataRows.length > 0 ? (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Additional context</div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {presentation.metadataRows.map((row) => (
                        <div key={`${notification.id}-${row.label}`} className="rounded-2xl border border-white bg-white p-3 shadow-sm">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{row.label}</div>
                          <div className="mt-1 text-sm font-medium text-gray-900">{row.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  {notification.action_url ? (
                    <Button asChild>
                      <Link href={notification.action_url}>
                        Open action
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : null}
                  {!notification.is_read ? (
                    <Button variant="outline" onClick={() => void handleMarkRead(notification.id)} disabled={markingRead}>
                      {markingRead ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MailOpen className="mr-2 h-4 w-4" />}
                      Mark read
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

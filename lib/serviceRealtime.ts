import { getCookie } from "cookies-next"

import { readCookieValue } from "@/lib/authCookies"
import { getDecodedToken } from "@/lib/utils"
import { getFrontendOrigin } from "@/lib/frontendOrigin"
import { persistAuthSession } from "@/redux/services/apiSlice"

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "")

const toWebSocketBaseUrl = (httpBase: string) => {
  if (httpBase.startsWith("https://")) {
    return `wss://${httpBase.slice("https://".length)}`
  }
  if (httpBase.startsWith("http://")) {
    return `ws://${httpBase.slice("http://".length)}`
  }
  return httpBase
}

const resolvePublicUrl = (value: string, fallback: string) => {
  const resolved = (value || fallback).trim()
  return stripTrailingSlash(resolved)
}

export const getRealtimeAccessToken = () =>
  readCookieValue("accessToken", (name) => getCookie(name))

export const getRealtimeAuthorizationContext = () =>
  readCookieValue("authorizationContext", (name) => getCookie(name))

const getRealtimeRefreshToken = () =>
  readCookieValue("refreshToken", (name) => getCookie(name))

let websocketTicketPromise: Promise<string | null> | null = null

const refreshRealtimeSession = async (backend: string) => {
  const refreshToken = getRealtimeRefreshToken()
  if (!refreshToken) return false

  try {
    const response = await fetch(`${backend}/auth/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Intera-Frontend-Origin": getFrontendOrigin(),
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({ refresh: refreshToken }),
      credentials: "include",
    })
    if (!response.ok) return false

    const payload = await response.json()
    if (!payload.access || !payload.authorization_context) return false
    persistAuthSession(payload)
    return true
  } catch {
    return false
  }
}

const requestWebSocketTicket = async (
  backend: string,
  accessToken: string,
  authorizationContext: string,
) => {
  const response = await fetch(`${backend}/accounts/websocket-ticket/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Intera-Authorization-Context": authorizationContext,
      "X-Intera-Frontend-Origin": getFrontendOrigin(),
    },
    credentials: "include",
  })

  if (!response.ok) return null
  const payload = (await response.json()) as { ticket?: string }
  return payload.ticket || null
}

export const requestRealtimeWebSocketTicket = async () => {
  if (!websocketTicketPromise) {
    websocketTicketPromise = (async () => {
      const backend = resolvePublicUrl(process.env.NEXT_PUBLIC_BACKEND_HOST_URL || "", "")
      let accessToken = getRealtimeAccessToken()
      let authorizationContext = getRealtimeAuthorizationContext()
      if (!accessToken) return null

      if (!authorizationContext) {
        if (!(await refreshRealtimeSession(backend))) return null
        accessToken = getRealtimeAccessToken()
        authorizationContext = getRealtimeAuthorizationContext()
      }
      if (!accessToken || !authorizationContext) return null

      const ticket = await requestWebSocketTicket(backend, accessToken, authorizationContext)
      if (ticket) return ticket

      // Contexts are bound to the access-token jti. Refresh once when a rotated
      // access token is paired with an older context cookie.
      if (!(await refreshRealtimeSession(backend))) return null
      accessToken = getRealtimeAccessToken()
      authorizationContext = getRealtimeAuthorizationContext()
      if (!accessToken || !authorizationContext) return null
      return requestWebSocketTicket(backend, accessToken, authorizationContext)
    })()
      .catch(() => null)
      .finally(() => {
        websocketTicketPromise = null
      })
  }
  return websocketTicketPromise
}

export const getActiveWorkspaceId = () => {
  const cookieWorkspaceId = readCookieValue("profileId", (name) => getCookie(name))
  if (cookieWorkspaceId) {
    return cookieWorkspaceId
  }
  const decoded = getDecodedToken() as { profile_id?: string | number } | null
  if (decoded?.profile_id !== undefined && decoded?.profile_id !== null) {
    return `${decoded.profile_id}`
  }
  return undefined
}

export const getAuditWebSocketBaseUrl = () =>
  toWebSocketBaseUrl(
    resolvePublicUrl(process.env.NEXT_PUBLIC_AUDIT_BACKEND_URL || "", "http://localhost:8091"),
  )

export const getNotificationHttpBaseUrl = () =>
  resolvePublicUrl(process.env.NEXT_PUBLIC_NOTIFICATION_BACKEND_URL || "", "http://localhost:8092")

export const getNotificationWebSocketBaseUrl = () =>
  toWebSocketBaseUrl(getNotificationHttpBaseUrl())

let notificationServiceAvailabilityPromise: Promise<boolean> | null = null

export const canReachNotificationService = async () => {
  if (typeof window === "undefined") {
    return false
  }

  if (!notificationServiceAvailabilityPromise) {
    notificationServiceAvailabilityPromise = (async () => {
      try {
        const controller = new AbortController()
        const timeoutId = window.setTimeout(() => controller.abort(), 3000)
        try {
          const response = await fetch(`${getNotificationHttpBaseUrl()}/health`, {
            method: "GET",
            signal: controller.signal,
            credentials: "include",
            headers: { "X-Intera-Frontend-Origin": getFrontendOrigin() },
          })
          return response.ok
        } finally {
          window.clearTimeout(timeoutId)
        }
      } catch {
        return false
      }
    })().finally(() => {
      notificationServiceAvailabilityPromise = null
    })
  }

  return notificationServiceAvailabilityPromise
}

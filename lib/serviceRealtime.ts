import { getCookie } from "cookies-next"

import { readCookieValue } from "@/lib/authCookies"
import { getDecodedToken } from "@/lib/utils"

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

export const getNotificationWebSocketBaseUrl = () =>
  toWebSocketBaseUrl(
    resolvePublicUrl(process.env.NEXT_PUBLIC_NOTIFICATION_BACKEND_URL || "", "http://localhost:8092"),
  )

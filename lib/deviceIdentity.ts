"use client"

import { getCookie, setCookie } from "cookies-next"

const POS_DEVICE_COOKIE = "interaims_posDeviceId"
const POS_DEVICE_MAX_AGE = 60 * 60 * 24 * 365 * 5

export const readPosDeviceId = (): string | undefined => {
  const value = getCookie(POS_DEVICE_COOKIE)
  return value ? `${value}` : undefined
}

export const getOrCreatePosDeviceId = (): string | undefined => {
  if (typeof window === "undefined") {
    return undefined
  }

  const existing = readPosDeviceId()
  if (existing) {
    return existing
  }

  const generated = window.crypto?.randomUUID?.() || `pos-device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  setCookie(POS_DEVICE_COOKIE, generated, {
    maxAge: POS_DEVICE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  })
  return generated
}

export const getPosDeviceLabel = (): string => {
  if (typeof window === "undefined") {
    return ""
  }

  const hostname = window.location.hostname || "local-device"
  const platform = window.navigator.platform || ""
  return [hostname, platform].filter(Boolean).join(" • ")
}

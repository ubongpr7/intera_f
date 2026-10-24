"use client"

import { useEffect, useState } from "react"

const ADMIN_HOSTNAMES = new Set([
  "admin.dev.interaims.com",
  "admin.interaims.com",
])

export function isAdminHostname(hostname: string) {
  return ADMIN_HOSTNAMES.has(hostname.trim().toLowerCase())
}

// Keep route guards dormant until the browser host has been identified. This
// prevents an admin page from briefly running workspace/subscription guards.
export function useAdminHost() {
  const [isAdminHost, setIsAdminHost] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsAdminHost(isAdminHostname(window.location.hostname))
    setIsReady(true)
  }, [])

  return { isAdminHost, isReady }
}

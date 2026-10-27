"use client"

import { useEffect, useState } from "react"

const SUPPORT_HOSTNAMES = new Set(["support.interaims.com", "www.support.interaims.com"])

export function isSupportHostname(hostname: string) {
  return SUPPORT_HOSTNAMES.has(hostname.trim().toLowerCase())
}

export function useSupportHost() {
  const [isSupportHost, setIsSupportHost] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsSupportHost(isSupportHostname(window.location.hostname))
    setIsReady(true)
  }, [])

  return { isSupportHost, isReady }
}

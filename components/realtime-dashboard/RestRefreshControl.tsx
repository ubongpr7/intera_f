"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { RefreshCw } from "lucide-react"

type RestRefreshControlProps = {
  onRefresh: () => Promise<unknown> | unknown
  intervalMs?: number
  label?: string
}

const formatElapsed = (value: Date | null) => {
  if (!value) return "Not refreshed yet"
  const seconds = Math.max(0, Math.round((Date.now() - value.getTime()) / 1000))
  if (seconds < 5) return "Updated just now"
  if (seconds < 60) return `Updated ${seconds}s ago`
  return `Updated ${Math.floor(seconds / 60)}m ago`
}

export default function RestRefreshControl({
  onRefresh,
  intervalMs = 60_000,
  label = "Refresh REST data",
}: RestRefreshControlProps) {
  const callbackRef = useRef(onRefresh)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [, setClock] = useState(0)

  callbackRef.current = onRefresh

  const refresh = useCallback(async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    try {
      await callbackRef.current()
      setLastRefreshed(new Date())
    } finally {
      setIsRefreshing(false)
    }
  }, [isRefreshing])

  useEffect(() => {
    const timer = window.setInterval(() => void refresh(), intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs, refresh])

  useEffect(() => {
    const timer = window.setInterval(() => setClock((value) => value + 1), 5_000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-[11px] font-medium text-gray-500 sm:inline">{formatElapsed(lastRefreshed)} · Auto 60s</span>
      <button
        type="button"
        onClick={() => void refresh()}
        disabled={isRefreshing}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-wait disabled:opacity-60"
        aria-label={label}
      >
        <RefreshCw className={isRefreshing ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
        {isRefreshing ? "Refreshing" : "Refresh"}
      </button>
    </div>
  )
}

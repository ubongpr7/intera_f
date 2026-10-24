"use client"

import { useCallback, useEffect, useState } from "react"
import { CheckCircle2, CircleAlert, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type HealthState = "checking" | "healthy" | "unhealthy"
type ServiceHealth = { name: string; state: HealthState; latencyMs?: number; detail?: string }

const services = ["Users", "Product", "Inventory", "POS", "Payment", "Subscriptions", "Notifications", "Audit"]

const initialHealth = (): ServiceHealth[] => services.map((name) => ({ name, state: "checking" }))

export default function AdminServiceHealth() {
  const [health, setHealth] = useState<ServiceHealth[]>(initialHealth)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const checkHealth = useCallback(async () => {
    setIsRefreshing(true)
    setHealth(initialHealth())
    try {
      const response = await fetch("/api/admin/health", { cache: "no-store" })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const payload = await response.json() as { services?: ServiceHealth[] }
      setHealth(payload.services ?? initialHealth())
    } catch {
      setHealth(services.map((name) => ({ name, state: "unhealthy" as const, detail: "Health proxy unavailable" })))
    }
    setIsRefreshing(false)
  }, [])

  useEffect(() => {
    void checkHealth()
    const interval = window.setInterval(() => void checkHealth(), 30000)
    return () => window.clearInterval(interval)
  }, [checkHealth])

  const healthyCount = health.filter((item) => item.state === "healthy").length
  const unhealthyCount = health.filter((item) => item.state === "unhealthy").length

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-100 bg-gray-50/70">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Service health</CardTitle>
            <CardDescription>Live checks against each production-facing service health endpoint. Refreshes every 30 seconds.</CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={() => void checkHealth()} disabled={isRefreshing} className="gap-2">
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Check now
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 pt-3 text-xs font-semibold">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800">{healthyCount} healthy</span>
          <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-red-800">{unhealthyCount} unavailable</span>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
        {health.map((item) => (
          <div key={item.name} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-3">
            <div className="flex min-w-0 items-center gap-2">
              {item.state === "checking" ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gray-400" /> : item.state === "healthy" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <CircleAlert className="h-4 w-4 shrink-0 text-red-600" />}
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-950">{item.name}</p><p className="text-xs text-gray-500">{item.detail || "Checking..."}</p></div>
            </div>
            {item.latencyMs !== undefined ? <span className="ml-2 shrink-0 text-xs font-medium text-gray-500">{item.latencyMs}ms</span> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

"use client"

import { useCallback, useEffect, useState } from "react"
import { CheckCircle2, CircleAlert, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type HealthState = "checking" | "healthy" | "unhealthy"
type HealthGroup = "Core APIs" | "MCP services" | "Agent runtime"
type ServiceHealth = { key: string; group: HealthGroup; name: string; endpoint?: string; state: HealthState; latencyMs?: number; detail?: string }

const serviceGroups: Array<{ name: HealthGroup; keys: string[] }> = [
  { name: "Core APIs", keys: ["users-api", "inventory-api", "product-api", "pos-api", "subscriptions-api", "notifications-api", "audit-api"] },
  { name: "MCP services", keys: ["users-mcp", "inventory-mcp", "product-mcp", "pos-mcp", "subscriptions-mcp", "notifications-mcp", "audit-mcp"] },
  { name: "Agent runtime", keys: ["a2a-gateway", "a2a-proxy"] },
]

const initialHealth = (): ServiceHealth[] => serviceGroups.flatMap((group) => group.keys.map((key) => ({ key, group: group.name, name: key, state: "checking" as const })))

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
      setHealth(initialHealth().map((item) => ({ ...item, state: "unhealthy" as const, detail: "Health proxy unavailable" })))
    } finally { setIsRefreshing(false) }
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
          <div><CardTitle>Service health</CardTitle><CardDescription>Named checks for every public API, MCP service, and A2A runtime endpoint. Refreshes every 30 seconds.</CardDescription></div>
          <Button type="button" variant="outline" onClick={() => void checkHealth()} disabled={isRefreshing} className="gap-2">{isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Check now</Button>
        </div>
        <div className="flex flex-wrap gap-2 pt-3 text-xs font-semibold"><span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800">{healthyCount} healthy</span><span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-red-800">{unhealthyCount} unavailable</span></div>
      </CardHeader>
      <CardContent className="space-y-6 p-5">
        {serviceGroups.map((group) => {
          const items = health.filter((item) => item.group === group.name)
          const groupHealthy = items.filter((item) => item.state === "healthy").length
          return <section key={group.name} aria-label={group.name}>
            <div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-950 dark:text-white">{group.name}</h3><span className="text-xs font-medium text-gray-500 dark:text-slate-300">{groupHealthy}/{items.length} healthy</span></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map((item) => <div key={item.key} className="rounded-xl border border-gray-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950">
              <div className="flex items-start justify-between gap-2"><div className="flex min-w-0 items-start gap-2">{item.state === "checking" ? <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-gray-400" /> : item.state === "healthy" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />}<div className="min-w-0"><p className="text-sm font-semibold text-slate-950 dark:text-white">{item.name}</p><p className="mt-0.5 font-mono text-[11px] text-gray-500 dark:text-slate-300">{item.endpoint || "checking"}</p></div></div>{item.latencyMs !== undefined ? <span className="shrink-0 text-xs font-medium text-gray-500 dark:text-slate-300">{item.latencyMs}ms</span> : null}</div>
              <p className={`mt-3 text-xs font-semibold ${item.state === "healthy" ? "text-emerald-700 dark:text-emerald-300" : item.state === "unhealthy" ? "text-red-700 dark:text-red-300" : "text-slate-500 dark:text-slate-300"}`}>{item.detail || "Checking..."}</p>
            </div>)}</div>
          </section>
        })}
      </CardContent>
    </Card>
  )
}

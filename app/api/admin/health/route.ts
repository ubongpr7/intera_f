import { headers } from "next/headers"
import { NextResponse } from "next/server"

type HealthGroup = "Core APIs" | "MCP services" | "Agent runtime"
type HealthCheck = { key: string; group: HealthGroup; name: string; baseUrl?: string; fallbackUrl: (production: boolean) => string; path: string }

const checks: HealthCheck[] = [
  { key: "users-web", group: "Core APIs", name: "Users web service", baseUrl: process.env.USERS_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_HOST_URL, fallbackUrl: (p) => p ? "https://users.api.interaims.com" : "https://users.dev.interaims.com", path: "/healthz/" },
  { key: "inventory-web", group: "Core APIs", name: "Inventory web service", baseUrl: process.env.INVENTORY_INTERNAL_URL || process.env.NEXT_PUBLIC_INVENNTORY_BACKEND_URL, fallbackUrl: (p) => p ? "https://inventory.api.interaims.com" : "https://inventory.dev.interaims.com", path: "/healthz/" },
  { key: "product-web", group: "Core APIs", name: "Product web service", baseUrl: process.env.PRODUCT_INTERNAL_URL || process.env.NEXT_PUBLIC_PRODUCT_BACKEND_URL, fallbackUrl: (p) => p ? "https://product.api.interaims.com" : "https://product.dev.interaims.com", path: "/healthz/" },
  { key: "pos-web", group: "Core APIs", name: "POS web service", baseUrl: process.env.POS_INTERNAL_URL || process.env.NEXT_PUBLIC_POS_BACKEND_URL, fallbackUrl: (p) => p ? "https://pos.api.interaims.com" : "https://pos.dev.interaims.com", path: "/healthz/" },
  { key: "subscriptions-web", group: "Core APIs", name: "Subscriptions web service", baseUrl: process.env.SUBSCRIPTIONS_INTERNAL_URL || process.env.NEXT_PUBLIC_SUBSCRIPTIONS_BACKEND_URL, fallbackUrl: (p) => p ? "https://subscriptions.api.interaims.com" : "https://subscriptions.dev.interaims.com", path: "/healthz/" },
  { key: "notifications-web", group: "Core APIs", name: "Notifications web service", baseUrl: process.env.NOTIFICATION_INTERNAL_URL || process.env.NEXT_PUBLIC_NOTIFICATION_BACKEND_URL, fallbackUrl: (p) => p ? "https://notifications.api.interaims.com" : "https://notifications.dev.interaims.com", path: "/health" },
  { key: "audit-web", group: "Core APIs", name: "Audit web service", baseUrl: process.env.AUDIT_INTERNAL_URL || process.env.NEXT_PUBLIC_AUDIT_BACKEND_URL, fallbackUrl: (p) => p ? "https://audit.api.interaims.com" : "https://audit.dev.interaims.com", path: "/health" },
  { key: "chat-api", group: "Core APIs", name: "Chat API", baseUrl: process.env.CHAT_INTERNAL_URL || process.env.NEXT_PUBLIC_CHAT_BACKEND_URL, fallbackUrl: (p) => p ? "https://chat.api.interaims.com" : "https://chat.dev.interaims.com", path: "/health" },
  { key: "users-mcp", group: "MCP services", name: "Users MCP", baseUrl: process.env.USERS_MCP_URL, fallbackUrl: (p) => p ? "https://users-mcp.api.interaims.com" : "https://users-mcp.dev.interaims.com", path: "/health" },
  { key: "inventory-mcp", group: "MCP services", name: "Inventory MCP", baseUrl: process.env.INVENTORY_MCP_URL, fallbackUrl: (p) => p ? "https://inventory-mcp.api.interaims.com" : "https://inventory-mcp.dev.interaims.com", path: "/health" },
  { key: "product-mcp", group: "MCP services", name: "Product MCP", baseUrl: process.env.PRODUCT_MCP_URL, fallbackUrl: (p) => p ? "https://product-mcp.api.interaims.com" : "https://product-mcp.dev.interaims.com", path: "/health" },
  { key: "pos-mcp", group: "MCP services", name: "POS MCP", baseUrl: process.env.POS_MCP_URL, fallbackUrl: (p) => p ? "https://pos-mcp.api.interaims.com" : "https://pos-mcp.dev.interaims.com", path: "/health" },
  { key: "subscriptions-mcp", group: "MCP services", name: "Subscriptions MCP", baseUrl: process.env.SUBSCRIPTIONS_MCP_URL, fallbackUrl: (p) => p ? "https://subscriptions-mcp.api.interaims.com" : "https://subscriptions-mcp.dev.interaims.com", path: "/health" },
  { key: "notifications-mcp", group: "MCP services", name: "Notifications MCP", baseUrl: process.env.NOTIFICATIONS_MCP_URL, fallbackUrl: (p) => p ? "https://notifications-mcp.api.interaims.com" : "https://notifications-mcp.dev.interaims.com", path: "/health" },
  { key: "audit-mcp", group: "MCP services", name: "Audit MCP", baseUrl: process.env.AUDIT_MCP_URL, fallbackUrl: (p) => p ? "https://audit-mcp.api.interaims.com" : "https://audit-mcp.dev.interaims.com", path: "/health" },
  { key: "a2a-gateway", group: "Agent runtime", name: "A2A Gateway", baseUrl: process.env.A2A_GATEWAY_URL, fallbackUrl: (p) => p ? "https://agents.api.interaims.com" : "https://agents.dev.interaims.com", path: "/health" },
  { key: "a2a-proxy", group: "Agent runtime", name: "A2A Proxy", baseUrl: process.env.A2A_PROXY_URL, fallbackUrl: (p) => p ? "https://a2a.api.interaims.com" : "https://a2a.dev.interaims.com", path: "/health" },
]

export async function GET() {
  const requestHeaders = await headers()
  const host = (requestHeaders.get("x-forwarded-host") || requestHeaders.get("host"))?.split(",")[0]?.split(":")[0]?.trim().toLowerCase() || ""
  const production = host === "admin.interaims.com" || host === "www.admin.interaims.com" || host === "support.interaims.com" || host === "www.support.interaims.com" || host === "interaims.com" || host === "www.interaims.com"
  const results = await Promise.all(checks.map(async (check) => {
    const started = Date.now()
    const endpoint = `${(check.baseUrl || check.fallbackUrl(production)).replace(/\/+$/, "")}${check.path}`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    try {
      const response = await fetch(endpoint, { cache: "no-store", signal: controller.signal })
      return { key: check.key, group: check.group, name: check.name, endpoint: check.path, state: response.ok ? "healthy" : "unhealthy", latencyMs: Date.now() - started, detail: response.ok ? "Healthy" : `HTTP ${response.status}` }
    } catch (error) {
      return { key: check.key, group: check.group, name: check.name, endpoint: check.path, state: "unhealthy", latencyMs: Date.now() - started, detail: error instanceof Error && error.name === "AbortError" ? "Timed out" : "Unavailable" }
    } finally { clearTimeout(timeout) }
  }))
  return NextResponse.json({ generated_at: new Date().toISOString(), services: results }, { headers: { "Cache-Control": "no-store" } })
}

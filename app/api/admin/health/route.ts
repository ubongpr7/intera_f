import { NextResponse } from "next/server"

const serviceUrls = {
  users: process.env.USERS_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_HOST_URL,
  product: process.env.PRODUCT_INTERNAL_URL || process.env.NEXT_PUBLIC_PRODUCT_BACKEND_URL,
  inventory: process.env.INVENTORY_INTERNAL_URL || process.env.NEXT_PUBLIC_INVENNTORY_BACKEND_URL,
  pos: process.env.POS_INTERNAL_URL || process.env.NEXT_PUBLIC_POS_BACKEND_URL,
  payment: process.env.PAYMENT_INTERNAL_URL || process.env.NEXT_PUBLIC_PAYMENT_BACKEND_URL,
  subscriptions: process.env.SUBSCRIPTIONS_INTERNAL_URL || process.env.NEXT_PUBLIC_SUBSCRIPTIONS_BACKEND_URL,
  notification: process.env.NOTIFICATION_INTERNAL_URL || process.env.NEXT_PUBLIC_NOTIFICATION_BACKEND_URL,
  audit: process.env.AUDIT_INTERNAL_URL || process.env.NEXT_PUBLIC_AUDIT_BACKEND_URL,
} as const

const serviceNames: Record<keyof typeof serviceUrls, string> = {
  users: "Users",
  product: "Product",
  inventory: "Inventory",
  pos: "POS",
  payment: "Payment",
  subscriptions: "Subscriptions",
  notification: "Notifications",
  audit: "Audit",
}

export async function GET() {
  const results = await Promise.all(
    Object.entries(serviceUrls).map(async ([key, baseUrl]) => {
      const started = Date.now()
      if (!baseUrl) {
        return { key, name: serviceNames[key as keyof typeof serviceUrls], state: "unhealthy", detail: "Service URL is not configured" }
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      try {
        const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/health`, {
          cache: "no-store",
          signal: controller.signal,
        })
        return {
          key,
          name: serviceNames[key as keyof typeof serviceUrls],
          state: response.ok ? "healthy" : "unhealthy",
          latencyMs: Date.now() - started,
          detail: response.ok ? "Healthy" : `HTTP ${response.status}`,
        }
      } catch (error) {
        return {
          key,
          name: serviceNames[key as keyof typeof serviceUrls],
          state: "unhealthy",
          latencyMs: Date.now() - started,
          detail: error instanceof Error && error.name === "AbortError" ? "Timed out" : "Unavailable",
        }
      } finally {
        clearTimeout(timeout)
      }
    }),
  )

  return NextResponse.json({ generated_at: new Date().toISOString(), services: results }, { headers: { "Cache-Control": "no-store" } })
}

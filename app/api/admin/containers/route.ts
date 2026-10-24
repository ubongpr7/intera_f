import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const host = (await headers()).get("host")?.split(":")[0] || ""
  const production = host === "admin.interaims.com"
  const endpoint = process.env.CONTAINER_HEALTH_URL || (production ? "https://health.api.interaims.com/health/containers" : "https://health.dev.interaims.com/health/containers")
  const token = process.env.CONTAINER_HEALTH_TOKEN
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
      signal: controller.signal,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    const payload = await response.json().catch(() => ({ containers: [] }))
    return NextResponse.json(payload, { status: response.status, headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    return NextResponse.json({ containers: [], error: error instanceof Error && error.name === "AbortError" ? "Timed out" : "Unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } })
  } finally {
    clearTimeout(timeout)
  }
}

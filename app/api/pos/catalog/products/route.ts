import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const getProductServiceUrl = () =>
  (process.env.PRODUCT_INTERNAL_URL || process.env.NEXT_PUBLIC_PRODUCT_BACKEND_URL || "http://localhost:7003").replace(/\/+$/, "")

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${getProductServiceUrl()}/product_api/pos/products/${request.nextUrl.search}`, {
      headers: {
        ...(request.headers.get("authorization") ? { Authorization: request.headers.get("authorization") as string } : {}),
        ...(request.headers.get("x-device-id") ? { "X-Device-ID": request.headers.get("x-device-id") as string } : {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })

    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store",
      },
    })
  } catch {
    return NextResponse.json({ detail: "Product catalog service is unavailable." }, { status: 502 })
  }
}

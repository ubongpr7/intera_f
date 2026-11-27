import { headers } from "next/headers";
import { NextResponse } from "next/server";

function isProductionHost(host: string) {
  return [
    "interaims.com",
    "www.interaims.com",
    "admin.interaims.com",
    "www.admin.interaims.com",
  ].includes(host);
}

function getUsersHealthUrl(host: string) {
  const configuredBaseUrl = process.env.USERS_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_HOST_URL;
  const fallbackBaseUrl = isProductionHost(host)
    ? "https://users.api.interaims.com"
    : "https://users.dev.interaims.com";
  const baseUrl = (configuredBaseUrl || fallbackBaseUrl).replace(/\/+$/, "");
  return `${baseUrl}/healthz/`;
}

export async function GET() {
  const requestHeaders = await headers();
  const host = (requestHeaders.get("x-forwarded-host") || requestHeaders.get("host"))
    ?.split(",")[0]
    ?.split(":")[0]
    ?.trim()
    .toLowerCase() || "";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(getUsersHealthUrl(host), {
      cache: "no-store",
      signal: controller.signal,
    });

    return NextResponse.json(
      { available: response.ok },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { available: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  } finally {
    clearTimeout(timeout);
  }
}

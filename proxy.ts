import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getCookieCandidates, type AuthCookieKey } from "./lib/authCookies"
import { isSsoMfaBypassProvider } from "./lib/authProvider"

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  // Amplify/CloudFront can pass the internal origin host into Next while the
  // browser is using the public custom domain. Prefer the forwarded public
  // host so admin routes are not mistaken for public-site routes.
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
  const hostname = (forwardedHost || request.headers.get("host") || request.nextUrl.hostname)
    .split(":")[0]
    .toLowerCase()
  const isAdminDevHost = hostname === "admin.dev.interaims.com" || hostname === "www.admin.dev.interaims.com"
  const isAdminProdHost = hostname === "admin.interaims.com" || hostname === "www.admin.interaims.com"
  const isAdminHost = isAdminDevHost || isAdminProdHost
  const isSupportHost = hostname === "support.interaims.com" || hostname === "www.support.interaims.com"
  const adminSiteUrl = isAdminDevHost
    ? "https://admin.dev.interaims.com"
    : "https://admin.interaims.com"

  if (isSupportHost && (path === "/" || path === "/dashboard")) {
    const supportUrl = request.nextUrl.clone()
    supportUrl.pathname = "/support-portal"
    return NextResponse.rewrite(supportUrl)
  }

  if (isAdminHost && (path === "/" || path === "/dashboard" || path === "/admin-portal")) {
    const adminUrl = request.nextUrl.clone()
    adminUrl.pathname = "/admin"
    return NextResponse.rewrite(adminUrl)
  }

  if (isAdminHost && path === "/admin-portal/catalog") {
    const adminUrl = request.nextUrl.clone()
    adminUrl.pathname = "/product/global-catalog-admin"
    return NextResponse.rewrite(adminUrl)
  }
  if (isAdminHost && path === "/admin-portal/affiliates") {
    const adminUrl = request.nextUrl.clone()
    adminUrl.pathname = "/admin/affiliates"
    return NextResponse.rewrite(adminUrl)
  }
  if (isAdminHost && path === "/admin-portal/invitations") {
    const adminUrl = request.nextUrl.clone()
    adminUrl.pathname = "/admin/invitations"
    return NextResponse.rewrite(adminUrl)
  }

  if (!isAdminHost && (path === "/admin-portal" || path.startsWith("/admin-portal/") || path === "/admin" || path.startsWith("/admin/") || path === "/payment-admin" || path.startsWith("/payment-admin/") || path === "/product/global-catalog-admin" || path.startsWith("/product/global-catalog-admin/"))) {
    return NextResponse.redirect(new URL("/", adminSiteUrl))
  }
  const waitlistMode = process.env.NEXT_PUBLIC_WAITLIST_MODE?.trim().toLowerCase() === "true"
  const isPublicAsset =
    path.startsWith("/assets/") ||
    path.startsWith("/landing/") ||
    path === "/site.webmanifest" ||
    /\.[a-z0-9]+$/i.test(path)
  const isMfaPath = path.startsWith("/accounts/mfa")
  // OAuth callbacks must reach their callback pages even when the browser
  // already has an authenticated web session. Native callbacks need to hand
  // the authorization code to the Kotlin deep link instead of going to the
  // dashboard or an MFA page.
  const isNativeOAuthCallbackPath = /^\/accounts\/login\/oauth2\/code\/[^/]+\/native\/?$/.test(path)
  const isInvitationPath =
    path === "/accounts/invitations" ||
    path.startsWith("/accounts/invitations/") ||
    path === "/invitations/accept"
  const isActivationPath = path.startsWith("/activate/")
  const isLegalPath = path === "/privacy" || path === "/terms"
  const isContactPath = path === "/contact"
  const readCookie = (key: AuthCookieKey) => {
    for (const name of getCookieCandidates(key)) {
      const value = request.cookies.get(name)?.value
      if (value) {
        return value
      }
    }
    return ""
  }

  const isPublicPath =
    isPublicAsset ||
    path.startsWith("/accounts") ||
    isActivationPath ||
    path === "/invitations/accept" ||
    path === "/" ||
    path === "/pricing" ||
    path === "/about" ||
    path === "/contact" ||
    isLegalPath ||
    path === "/blog" ||
    path.startsWith("/blog/") ||
    path.startsWith("/docs") ||
    path.startsWith("/docs/") ||
    path.startsWith("/api") ||
    path.startsWith("/_next/static") ||
    path.startsWith("/_next/image")

  if (path.startsWith("/api/")) {
    if (waitlistMode && path !== "/api/waitlist" && path !== "/api/contact") {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  if (waitlistMode && !isAdminHost && !isNativeOAuthCallbackPath && path !== "/" && !isPublicAsset && !isLegalPath && !isContactPath) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (isNativeOAuthCallbackPath) {
    return NextResponse.next()
  }

  const refreshToken = readCookie("refreshToken")
  const accessToken = readCookie("accessToken")
  const hasAuthCookie = Boolean(refreshToken || accessToken)
  const mfaVerifiedCookie = readCookie("mfaVerified")
  const mfaVerified = mfaVerifiedCookie === "true"
  const mfaSetupRequired = readCookie("mfaSetupRequired") === "true"
  const authProvider = readCookie("provider")
  const mfaTargetPath = mfaSetupRequired ? "/accounts/mfa/setup" : "/accounts/mfa/verify"
  const shouldEnforceMfa =
    hasAuthCookie &&
    mfaVerifiedCookie === "false" &&
    !isSsoMfaBypassProvider(authProvider)

  if (!hasAuthCookie) {
    if (isMfaPath) {
      return NextResponse.next()
    }
    if (!isPublicPath) {
      const loginUrl = new URL("/accounts/signin", request.url)
      loginUrl.searchParams.set("next", path)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  if (isMfaPath) {
    if (mfaVerified) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return NextResponse.next()
  }

  if (shouldEnforceMfa) {
    return NextResponse.redirect(new URL(mfaTargetPath, request.url))
  }

  if (isPublicPath && mfaVerified && !isInvitationPath && !isActivationPath && !isLegalPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
}

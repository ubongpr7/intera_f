import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getCookieCandidates, type AuthCookieKey } from "./lib/authCookies"

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isPublicAsset =
    path.startsWith("/assets/") ||
    path.startsWith("/landing/") ||
    path === "/site.webmanifest" ||
    /\.[a-z0-9]+$/i.test(path)
  const isMfaPath = path.startsWith("/accounts/mfa")
  const isInvitationPath =
    path === "/accounts/invitations" ||
    path.startsWith("/accounts/invitations/") ||
    path === "/invitations/accept"
  const isActivationPath = path.startsWith("/activate/")
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
    path === "/blog" ||
    path.startsWith("/blog/") ||
    path.startsWith("/docs") ||
    path.startsWith("/docs/") ||
    path.startsWith("/api") ||
    path.startsWith("/_next/static") ||
    path.startsWith("/_next/image")

  const refreshToken = readCookie("refreshToken")
  const accessToken = readCookie("accessToken")
  const hasAuthCookie = Boolean(refreshToken || accessToken)
  const mfaVerifiedCookie = readCookie("mfaVerified")
  const mfaVerified = mfaVerifiedCookie === "true"
  const mfaSetupRequired = readCookie("mfaSetupRequired") === "true"
  const mfaTargetPath = mfaSetupRequired ? "/accounts/mfa/setup" : "/accounts/mfa/verify"
  const shouldEnforceMfa = hasAuthCookie && mfaVerifiedCookie === "false"

  if (!hasAuthCookie) {
    if (!isPublicPath || isMfaPath) {
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

  if (isPublicPath && mfaVerified && !isInvitationPath && !isActivationPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
}

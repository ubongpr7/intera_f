import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path.startsWith('/accounts')|| path === '/' || path === '/features'

  // Get the token from the cookies
  const token = request.cookies.get("refreshToken")?.value || ""

  // Redirect logic
  if (isPublicPath && token) {
    // If user is logged in and tries to access a public path, redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (!isPublicPath && !token) {
    // If user is not logged in and tries to access a protected path, redirect to login
    return NextResponse.redirect(new URL("/accounts/signin", request.url))
  }

  return NextResponse.next()
}

// Configure which paths should be processed by the middleware
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

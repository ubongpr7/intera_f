"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import { useGetAdminContextQuery } from "@/redux/features/users/userApiSlice"
import { useAdminHost } from "@/lib/adminHost"
import { getDecodedToken } from "@/lib/utils"
import { truthyAdminClaim } from "@/lib/adminAccess"

type AdminTokenClaims = {
  is_staff?: boolean | string | number | null
  is_superuser?: boolean | string | number | null
}

const SUPERUSER_ONLY_PATHS = [/^\/payment-admin(?:\/|$)/, /^\/admin\/(?:affiliates|invitations|settings)(?:\/|$)/]

export default function AdminPortalGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isReady: isAdminHostReady } = useAdminHost()
  const { data, isLoading, isError } = useGetAdminContextQuery(undefined, {
    skip: !isAdminHostReady,
  })
  const tokenClaims = getDecodedToken() as AdminTokenClaims | null
  const tokenHasAdminClaim = truthyAdminClaim(tokenClaims?.is_staff) || truthyAdminClaim(tokenClaims?.is_superuser)
  const hasAdminAccess = Boolean(data?.is_staff || tokenHasAdminClaim)
  const isSuperuser = Boolean(data?.is_superuser || truthyAdminClaim(tokenClaims?.is_superuser))
  const superuserOnly = SUPERUSER_ONLY_PATHS.some((pattern) => pattern.test(pathname || ""))

  useEffect(() => {
    // Do not turn an authenticated admin API failure into a sign-in/dashboard
    // redirect loop. The access token already carries the staff boundary; the
    // admin context endpoint remains the authoritative enrichment source.
    if (!isLoading && !isError && data && !hasAdminAccess) {
      router.replace(`/accounts/signin?next=${encodeURIComponent(pathname || "/dashboard")}`)
    }
  }, [data, hasAdminAccess, isError, isLoading, pathname, router])

  if (!isAdminHostReady || isLoading) return <main className="min-h-screen bg-slate-950 p-10 text-slate-200">Checking staff access...</main>
  if (superuserOnly && !isSuperuser) return <main className="min-h-screen bg-slate-950 p-10 text-slate-200"><h1 className="text-2xl font-semibold">Superuser access required</h1><p className="mt-2 text-slate-400">This area contains sensitive financial or access-management controls.</p></main>
  if (isError && tokenHasAdminClaim) return <>{children}</>
  if (isError || !hasAdminAccess) return <main className="min-h-screen bg-slate-950 p-10 text-slate-200">Staff access required.</main>
  return <>{children}</>
}

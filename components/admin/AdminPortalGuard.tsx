"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import { useGetAdminContextQuery } from "@/redux/features/users/userApiSlice"
import { useAdminHost } from "@/lib/adminHost"
import { getDecodedToken } from "@/lib/utils"

type AdminTokenClaims = {
  is_staff?: boolean | string | number | null
  is_superuser?: boolean | string | number | null
}

const truthyClaim = (value: unknown) => {
  if (value === true || value === 1) return true
  return typeof value === "string" && ["true", "1", "yes"].includes(value.trim().toLowerCase())
}

export default function AdminPortalGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isReady: isAdminHostReady } = useAdminHost()
  const { data, isLoading, isError } = useGetAdminContextQuery(undefined, {
    skip: !isAdminHostReady,
  })
  const tokenClaims = getDecodedToken() as AdminTokenClaims | null
  const tokenHasAdminClaim = truthyClaim(tokenClaims?.is_staff) || truthyClaim(tokenClaims?.is_superuser)
  const hasAdminAccess = Boolean(data?.is_staff || tokenHasAdminClaim)

  useEffect(() => {
    // Do not turn an authenticated admin API failure into a sign-in/dashboard
    // redirect loop. The access token already carries the staff boundary; the
    // admin context endpoint remains the authoritative enrichment source.
    if (!isLoading && !isError && data && !hasAdminAccess) {
      router.replace(`/accounts/signin?next=${encodeURIComponent(pathname || "/dashboard")}`)
    }
  }, [data, hasAdminAccess, isError, isLoading, pathname, router])

  if (!isAdminHostReady || isLoading) return <main className="min-h-screen bg-slate-950 p-10 text-slate-200">Checking staff access...</main>
  if (isError && tokenHasAdminClaim) return <>{children}</>
  if (isError || !hasAdminAccess) return <main className="min-h-screen bg-slate-950 p-10 text-slate-200">Staff access required.</main>
  return <>{children}</>
}

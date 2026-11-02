"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import type { ReactNode } from "react"
import { getDecodedToken } from "@/lib/utils"

type AffiliateClaims = {
  is_affiliate_marketer?: boolean | string | number
}

const truthy = (value: AffiliateClaims["is_affiliate_marketer"]) =>
  value === true || value === 1 || `${value ?? ""}`.trim().toLowerCase() === "true"

export default function AffiliateMarketerGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const claims = getDecodedToken() as AffiliateClaims | null
  const isAffiliate = truthy(claims?.is_affiliate_marketer)
  const isAffiliateArea = pathname === "/affiliate/dashboard" || pathname === "/user/settings" || pathname.startsWith("/user/settings/")

  useEffect(() => {
    if (isAffiliate && !isAffiliateArea) {
      router.replace("/affiliate/dashboard")
    }
  }, [isAffiliate, isAffiliateArea, router])

  if (!isAffiliate || isAffiliateArea) {
    return <>{children}</>
  }

  return <main className="flex min-h-[70vh] items-center justify-center px-6 py-12" aria-live="polite"><div className="text-center text-sm text-slate-500">Opening your affiliate dashboard...</div></main>
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { UsersRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getDecodedToken } from "@/lib/utils"

type AffiliateClaims = {
  is_affiliate_marketer?: boolean | string | number
}

const truthy = (value: AffiliateClaims["is_affiliate_marketer"]) =>
  value === true || value === 1 || `${value ?? ""}`.trim().toLowerCase() === "true"

export default function AffiliateMarketerGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const claims = getDecodedToken() as AffiliateClaims | null
  const isAffiliate = truthy(claims?.is_affiliate_marketer)
  const isAffiliateArea = pathname === "/user/settings" || pathname.startsWith("/user/settings/")

  if (!isAffiliate || isAffiliateArea) {
    return <>{children}</>
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6 py-12">
      <section className="w-full max-w-xl rounded-3xl border border-emerald-200/20 bg-slate-900/80 p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
          <UsersRound className="h-7 w-7" />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">Affiliate account</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Your account is set up for partnerships</h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          Affiliate accounts do not create workspaces or subscribe to inventory plans. Open your profile to view your referral link and earnings.
        </p>
        <Button asChild className="mt-7">
          <Link href="/user/settings?tab=referrals">Open affiliate dashboard</Link>
        </Button>
      </section>
    </main>
  )
}

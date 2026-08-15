"use client"

import type { ReactNode } from "react"
import { useEffect, useMemo } from "react"
import { jwtDecode } from "jwt-decode"
import { getCookie } from "cookies-next"
import { usePathname, useRouter } from "next/navigation"
import { LockKeyhole } from "lucide-react"
import { Button } from "@/components/ui/button"
import { readCookieValue } from "@/lib/authCookies"
import { useGetCurrentEntitlementsQuery } from "@/redux/features/payment/paymentAPISlice"

type Claims = {
  user_id?: string | number
  owner_id?: string | number
  membership_role?: string
  role?: string
}

const EXEMPT_PATHS = ["/subscription", "/profile/create", "/companies"]

const readOwnerStatus = () => {
  const token = readCookieValue("accessToken", (name) => getCookie(name))
  if (!token) return false
  try {
    const claims = jwtDecode<Claims>(token)
    const role = `${claims.membership_role ?? claims.role ?? ""}`.trim().toLowerCase()
    return role === "owner" || (
      claims.user_id !== undefined &&
      claims.owner_id !== undefined &&
      `${claims.user_id}` === `${claims.owner_id}`
    )
  } catch {
    return false
  }
}

export function SubscriptionRequiredGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const owner = useMemo(() => readOwnerStatus(), [])
  const exempt = EXEMPT_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  const { data, isLoading, isError } = useGetCurrentEntitlementsQuery()
  const hasSubscription = Boolean(data?.subscription)
  const shouldBlock = !exempt && !isLoading && !isError && data && !hasSubscription
  const showError = !exempt && isError

  useEffect(() => {
    if (shouldBlock && owner) {
      router.replace("/subscription")
    }
  }, [owner, router, shouldBlock])

  if (exempt) {
    return <>{children}</>
  }

  if (showError) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="rounded-full bg-amber-100 p-4 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
          <LockKeyhole className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Subscription check unavailable</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            We could not verify workspace billing right now. Please try again.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.refresh()}>Retry</Button>
      </div>
    )
  }

  if (!shouldBlock) {
    return <>{children}</>
  }

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-amber-100 p-4 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
        <LockKeyhole className="h-8 w-8" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold">Subscription setup required</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          This workspace needs an active plan or trial before the web workspace can be used. Ask the workspace owner to choose a plan.
        </p>
      </div>
      <Button variant="outline" onClick={() => router.refresh()}>Check again</Button>
    </div>
  )
}

"use client"

import type { ReactNode } from "react"
import { LockKeyhole } from "lucide-react"
import { useGetCurrentEntitlementsQuery } from "@/redux/features/payment/paymentAPISlice"

type Props = {
  feature: string
  children: ReactNode
  fallback?: ReactNode
}

export function EntitlementGuard({ feature, children, fallback }: Props) {
  const { data, isLoading } = useGetCurrentEntitlementsQuery()
  if (isLoading) return null
  if (data?.features[feature]) return <>{children}</>
  return fallback ?? (
    <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <LockKeyhole className="h-4 w-4" />
      This capability is not included in the current plan.
    </div>
  )
}

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import { useGetAdminContextQuery } from "@/redux/features/users/userApiSlice"
import { useAdminHost } from "@/lib/adminHost"

export default function AdminPortalGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isReady: isAdminHostReady } = useAdminHost()
  const { data, isLoading, isError } = useGetAdminContextQuery(undefined, {
    skip: !isAdminHostReady,
  })
  useEffect(() => {
    if (!isLoading && (isError || !data?.is_staff)) {
      router.replace(`/accounts/signin?next=${encodeURIComponent(pathname || "/dashboard")}`)
    }
  }, [data?.is_staff, isError, isLoading, pathname, router])
  if (!isAdminHostReady || isLoading) return <main className="min-h-screen bg-slate-950 p-10 text-slate-200">Checking staff access...</main>
  if (isError || !data?.is_staff) return <main className="min-h-screen bg-slate-950 p-10 text-slate-200">Staff access required.</main>
  return <>{children}</>
}

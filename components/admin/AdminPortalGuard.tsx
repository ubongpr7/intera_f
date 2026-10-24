"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useGetAdminContextQuery } from "@/redux/features/users/userApiSlice"

export default function AdminPortalGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { data, isLoading, isError } = useGetAdminContextQuery()
  useEffect(() => {
    if (!isLoading && (isError || !data?.is_staff)) router.replace("/accounts/signin?next=/dashboard")
  }, [data?.is_staff, isError, isLoading, router])
  if (isLoading) return <main className="min-h-screen bg-slate-950 p-10 text-slate-200">Checking staff access...</main>
  if (isError || !data?.is_staff) return <main className="min-h-screen bg-slate-950 p-10 text-slate-200">Staff access required.</main>
  return <>{children}</>
}

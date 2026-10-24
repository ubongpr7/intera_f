"use client"

import type React from "react"
import DashboardHeader from "@/components/wrapper/dashboardHeader"
import AdminPortalGuard from "@/components/admin/AdminPortalGuard"

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardHeader>
      <AdminPortalGuard>{children}</AdminPortalGuard>
    </DashboardHeader>
  )
}

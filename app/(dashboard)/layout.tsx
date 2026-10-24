"use client"

import type React from "react"
import DashboardHeader from "@/components/wrapper/dashboardHeader";
import { RouteAccessGuard } from "@/lib/permissionsGuard";
import { SubscriptionRequiredGuard } from "@/components/subscription/SubscriptionRequiredGuard";
import AdminPortalGuard from "@/components/admin/AdminPortalGuard";
import { useEffect, useState } from "react";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAdminHost, setIsAdminHost] = useState(false)

  useEffect(() => {
    const hostname = window.location.hostname.toLowerCase()
    setIsAdminHost(hostname === "admin.dev.interaims.com" || hostname === "admin.interaims.com")
  }, [])

  return (
    <DashboardHeader>
      {isAdminHost ? (
        <AdminPortalGuard>{children}</AdminPortalGuard>
      ) : (
        <RouteAccessGuard>
          <SubscriptionRequiredGuard>{children}</SubscriptionRequiredGuard>
        </RouteAccessGuard>
      )}
    </DashboardHeader>
  )
}

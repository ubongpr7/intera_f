"use client"

import type React from "react"
import DashboardHeader from "@/components/wrapper/dashboardHeader";
import { RouteAccessGuard } from "@/lib/permissionsGuard";
import { SubscriptionRequiredGuard } from "@/components/subscription/SubscriptionRequiredGuard";
import AdminPortalGuard from "@/components/admin/AdminPortalGuard";
import { useAdminHost } from "@/lib/adminHost";
import AffiliateMarketerGuard from "@/components/affiliate/AffiliateMarketerGuard"
import { useSupportHost } from "@/lib/supportHost"


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAdminHost, isReady } = useAdminHost()
  const { isSupportHost, isReady: isSupportHostReady } = useSupportHost()

  if (!isReady || !isSupportHostReady) {
    return (
      <DashboardHeader>
        <main className="min-h-screen bg-slate-950 p-10 text-slate-200">
          Loading Intera IMS...
        </main>
      </DashboardHeader>
    )
  }

  // Support is a separate operational surface and must not run workspace
  // subscription, affiliate, or permission guards before it can render.
  if (isSupportHost) {
    return <DashboardHeader>{children}</DashboardHeader>
  }

  return (
    <DashboardHeader>
      {isAdminHost ? (
        <AdminPortalGuard>{children}</AdminPortalGuard>
      ) : (
        <RouteAccessGuard>
          <AffiliateMarketerGuard>
            <SubscriptionRequiredGuard>{children}</SubscriptionRequiredGuard>
          </AffiliateMarketerGuard>
        </RouteAccessGuard>
      )}
    </DashboardHeader>
  )
}

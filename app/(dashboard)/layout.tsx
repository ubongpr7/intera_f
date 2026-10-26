"use client"

import type React from "react"
import DashboardHeader from "@/components/wrapper/dashboardHeader";
import { RouteAccessGuard } from "@/lib/permissionsGuard";
import { SubscriptionRequiredGuard } from "@/components/subscription/SubscriptionRequiredGuard";
import AdminPortalGuard from "@/components/admin/AdminPortalGuard";
import { useAdminHost } from "@/lib/adminHost";
import AffiliateMarketerGuard from "@/components/affiliate/AffiliateMarketerGuard"


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAdminHost, isReady } = useAdminHost()

  if (!isReady) {
    return (
      <DashboardHeader>
        <main className="min-h-screen bg-slate-950 p-10 text-slate-200">
          Loading Intera IMS...
        </main>
      </DashboardHeader>
    )
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

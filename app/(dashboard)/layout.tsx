"use client"

import type React from "react"
import DashboardHeader from "@/components/wrapper/dashboardHeader";
import { RouteAccessGuard } from "@/lib/permissionsGuard";
import { SubscriptionRequiredGuard } from "@/components/subscription/SubscriptionRequiredGuard";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardHeader>
      <RouteAccessGuard>
        <SubscriptionRequiredGuard>
          {children}
        </SubscriptionRequiredGuard>
      </RouteAccessGuard>
    </DashboardHeader>
  )
}

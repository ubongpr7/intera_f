"use client"

import type React from "react"
import DashboardHeader from "@/components/wrapper/dashboardHeader";
import { RouteAccessGuard } from "@/lib/permissionsGuard";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardHeader>
      <RouteAccessGuard>{children}</RouteAccessGuard>
    </DashboardHeader>
  )
}

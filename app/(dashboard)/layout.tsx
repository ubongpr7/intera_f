"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useGetLoggedInUserQuery } from "@/redux/features/users/userApiSlice";
import DashboardHeader from "@/components/wrapper/dashboardHeader";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <DashboardHeader>
        

        {children}
        

        </DashboardHeader>
  )
}

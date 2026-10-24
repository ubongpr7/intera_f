"use client"

import type React from "react"
import { ToastContainer } from "react-toastify";
import { CookieConsentNotice, CookieConsentProvider } from "@/components/legal/CookieConsentProvider";


export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <CookieConsentProvider>
      <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
        <ToastContainer position="top-right" autoClose={3000} />
        {children}
        <CookieConsentNotice />
      </div>
    </CookieConsentProvider>
  )
}

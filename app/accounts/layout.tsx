"use client"

import type React from "react"
import { ToastContainer } from "react-toastify";


export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
        
<div className={`flex bg-gray-50 text-gray-900  min-h-screen flex-col w-full h-full`}>
    <ToastContainer position="top-right" autoClose={3000} />

{children}
</div>


  )
}

"use client"

import type React from "react"
import { ToastContainer } from "react-toastify";


export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
        
<div className={`flex bg-gray-50 text-gray-900   flex-col w-full `}>
    <ToastContainer position="top-right" autoClose={3000} />

{children}
</div>


  )
}

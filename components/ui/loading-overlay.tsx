"use client"

import { cn } from "@/lib/utils"

interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  className?: string
}

export function LoadingOverlay({ isLoading, message = "Loading...", className }: LoadingOverlayProps) {
  if (!isLoading) return null

  return (
    <div
      className={cn(
        "absolute inset-0 bg-gray-100/80 backdrop-blur-sm flex items-center justify-center z-50",
        className,
      )}
    >
      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  )
}

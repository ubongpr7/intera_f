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
        "absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50",
        className,
      )}
    >
      <div className="flex items-center gap-3 bg-card p-4 rounded-lg shadow-lg border">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  )
}

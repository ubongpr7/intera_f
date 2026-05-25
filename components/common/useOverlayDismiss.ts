"use client"

import { useEffect } from "react"

type UseOverlayDismissOptions = {
  enabled?: boolean
  onClose: () => void
}

export function useOverlayDismiss({ enabled = true, onClose }: UseOverlayDismissOptions) {
  useEffect(() => {
    if (!enabled) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [enabled, onClose])
}

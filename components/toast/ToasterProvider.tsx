"use client"

import { toast } from "react-toastify"

type ToastMessage = {
  type?: "success" | "error" | "info" | "warning"
  message: string
}

export function useToast() {
  return {
    setToastMessage: ({ type = "info", message }: ToastMessage) => {
      const showToast = toast[type] ?? toast.info
      showToast(message)
    },
  }
}

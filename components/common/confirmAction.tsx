"use client"

import { createRoot } from "react-dom/client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

type ConfirmActionOptions = {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
}

export function confirmAction({
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive,
}: ConfirmActionOptions): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false)

  return new Promise((resolve) => {
    const container = document.createElement("div")
    document.body.appendChild(container)
    const root = createRoot(container)

    const cleanup = () => {
      window.setTimeout(() => {
        root.unmount()
        container.remove()
      }, 0)
    }

    const close = (confirmed: boolean) => {
      resolve(confirmed)
      cleanup()
    }

    root.render(
      <AlertDialog open onOpenChange={(open) => !open && close(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => close(false)}>{cancelText}</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant={destructive ? "destructive" : "default"}
                onClick={() => close(true)}
              >
                {confirmText}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    )
  })
}

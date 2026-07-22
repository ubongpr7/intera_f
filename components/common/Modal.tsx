"use client"

import type React from "react"

import { X } from "lucide-react"
import { useOverlayDismiss } from "./useOverlayDismiss"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl"
}

export default function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  useOverlayDismiss({ enabled: isOpen, onClose })

  if (!isOpen) return null

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-md" onClick={onClose} />
      <div
        className={`relative mx-4 w-full max-h-[92vh] overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950/95 text-slate-50 shadow-[0_32px_80px_-24px_rgba(2,6,23,0.95)] ${sizeClasses[size]}`}
      >
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-5">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-300/80">Workspace modal</p>
            <h2 className="text-xl font-semibold tracking-tight text-slate-50">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900/80 text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-white"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="max-h-[calc(92vh-90px)] overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_35%)]">
          {children}
        </div>
      </div>
    </div>
  )
}

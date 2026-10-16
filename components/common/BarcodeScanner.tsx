"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Camera, Loader2, ScanLine, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type DetectedBarcode = { rawValue?: string }
type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<DetectedBarcode[]>
}
type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorLike

const preferredFormats = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "code_93",
  "itf",
  "qr_code",
]

interface BarcodeScannerProps {
  onDetected: (value: string) => void
  disabled?: boolean
  className?: string
  label?: string
}

export function BarcodeScanner({ onDetected, disabled = false, className, label = "Scan barcode" }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)
  const detectingRef = useRef(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stopCamera = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    detectingRef.current = false
  }, [])

  const closeScanner = useCallback(() => {
    stopCamera()
    setIsOpen(false)
    setIsStarting(false)
  }, [stopCamera])

  const handleDetected = useCallback((value: string) => {
    const normalizedValue = value.trim()
    if (!normalizedValue) return
    onDetected(normalizedValue)
    closeScanner()
  }, [closeScanner, onDetected])

  useEffect(() => () => stopCamera(), [stopCamera])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        closeScanner()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [closeScanner, isOpen])

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false
    const start = async () => {
      setIsStarting(true)
      setError(null)

      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera access is unavailable. Use HTTPS or localhost, then allow camera access.")
        setIsStarting(false)
        return
      }

      const detectorConstructor = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector
      if (!detectorConstructor) {
        setError("This browser does not support live barcode scanning. Paste the barcode into the search field instead.")
        setIsStarting(false)
        return
      }

      try {
        const supportedFormats = typeof (detectorConstructor as BarcodeDetectorConstructor & { getSupportedFormats?: () => Promise<string[]> }).getSupportedFormats === "function"
          ? await (detectorConstructor as BarcodeDetectorConstructor & { getSupportedFormats: () => Promise<string[]> }).getSupportedFormats()
          : preferredFormats
        const formats = preferredFormats.filter((format) => supportedFormats.includes(format))
        const detector = formats.length > 0 ? new detectorConstructor({ formats }) : new detectorConstructor()
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        if (!videoRef.current) return
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsStarting(false)

        const scan = async () => {
          if (cancelled || !videoRef.current || !streamRef.current) return
          if (!detectingRef.current && videoRef.current.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            detectingRef.current = true
            try {
              const results = await detector.detect(videoRef.current)
              const value = results.find((result) => result.rawValue?.trim())?.rawValue
              if (value) {
                handleDetected(value)
                return
              }
            } catch {
              // Keep scanning; transient detector failures are common between video frames.
            } finally {
              detectingRef.current = false
            }
          }
          frameRef.current = requestAnimationFrame(() => void scan())
        }
        frameRef.current = requestAnimationFrame(() => void scan())
      } catch (cameraError) {
        setIsStarting(false)
        setError(cameraError instanceof DOMException && cameraError.name === "NotAllowedError"
          ? "Camera access was denied. Allow camera access in the browser and try again."
          : "Unable to start the camera. Check that a camera is available and not being used by another app.")
        stopCamera()
      }
    }

    void start()
    return () => {
      cancelled = true
      stopCamera()
    }
  }, [handleDetected, isOpen, stopCamera])

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("rounded-full", className)}
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        title={label}
      >
        <ScanLine className="mr-1.5 h-4 w-4" />
        {label}
      </Button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={label}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeScanner()
          }}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-950 text-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <p className="flex items-center gap-2 text-base font-semibold"><Camera className="h-5 w-5 text-blue-300" /> Scan a variant barcode</p>
                <p className="mt-1 text-xs text-slate-400">Hold the barcode inside the frame. The result will be applied to the current search.</p>
              </div>
              <Button type="button" variant="ghost" size="icon" className="rounded-full text-slate-300 hover:bg-slate-800 hover:text-white" onClick={closeScanner} aria-label="Close scanner">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-5">
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-blue-400/60 bg-slate-900">
                <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
                <div className="pointer-events-none absolute inset-[15%] rounded-2xl border-2 border-blue-300 shadow-[0_0_0_999px_rgba(2,6,23,0.32)]" />
                {isStarting ? <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60"><Loader2 className="h-8 w-8 animate-spin text-blue-300" /></div> : null}
              </div>
              {error ? <p className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">{error}</p> : null}
              <Button type="button" variant="outline" className="mt-4 w-full rounded-full border-slate-700 bg-transparent text-white hover:bg-slate-800" onClick={closeScanner}>Close scanner</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

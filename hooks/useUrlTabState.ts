"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

type UrlTabStateOptions<T extends string> = {
  defaultValue: T
  values: readonly T[]
  param?: string
  onValueChange?: (value: T) => void
}

export function useUrlTabState<T extends string>({
  defaultValue,
  values,
  param = "tab",
  onValueChange,
}: UrlTabStateOptions<T>) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedValue = searchParams.get(param)
  const urlValue = (requestedValue && values.includes(requestedValue as T) ? requestedValue : defaultValue) as T
  const [activeValue, setActiveValue] = useState<T>(urlValue)
  const lastNotifiedValue = useRef<T | null>(null)
  const lastRequestedValue = useRef<string | null>(requestedValue)

  useEffect(() => {
    if (lastRequestedValue.current === requestedValue) {
      return
    }

    lastRequestedValue.current = requestedValue
    setActiveValue(urlValue)
  }, [requestedValue, urlValue])

  useEffect(() => {
    if (requestedValue && values.includes(requestedValue as T)) {
      return
    }

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set(param, activeValue)
    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false })
  }, [activeValue, param, pathname, requestedValue, router, searchParams, values])

  useEffect(() => {
    if (lastNotifiedValue.current === activeValue) {
      return
    }

    lastNotifiedValue.current = activeValue
    onValueChange?.(activeValue)
  }, [activeValue, onValueChange])

  const setUrlTabValue = (nextValue: T) => {
    if (!values.includes(nextValue) || nextValue === activeValue) {
      return
    }

    setActiveValue(nextValue)
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set(param, nextValue)
    window.history.pushState(null, "", `${pathname}?${nextParams.toString()}`)
  }

  return { activeValue, setActiveValue: setUrlTabValue }
}

"use client"

import { useCallback, useEffect, useState } from "react"
import { getCookie, setCookie } from "cookies-next"

import { readCookieValue } from "@/lib/authCookies"
import { normalizeStructuralLocationIds } from "@/lib/structuralLocationScope"

const SCOPE_COOKIE = "interaStructuralLocationScopes"
const SCOPE_EVENT = "intera-structural-location-scope-changed"

type StoredScopes = Record<string, string[]>

const getWorkspaceKey = () => readCookieValue("companyCode", (name) => getCookie(name)) || "default"

const readScopes = (): StoredScopes => {
  if (typeof window === "undefined") return {}
  try {
    const value = getCookie(SCOPE_COOKIE)
    if (!value || typeof value !== "string") return {}
    const parsed = JSON.parse(value) as unknown
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as StoredScopes : {}
  } catch {
    return {}
  }
}

const readCurrentScope = () => normalizeStructuralLocationIds(readScopes()[getWorkspaceKey()] ?? [])

const persistCurrentScope = (locationIds: string[]) => {
  const scopes = readScopes()
  scopes[getWorkspaceKey()] = locationIds
  setCookie(SCOPE_COOKIE, JSON.stringify(scopes), {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  })
}

export const useStructuralLocationScope = () => {
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>(readCurrentScope)

  useEffect(() => {
    const synchronizeScope = (event: Event) => {
      const nextValues = (event as CustomEvent<{ workspace: string; locationIds: string[] }>).detail
      if (!nextValues || nextValues.workspace !== getWorkspaceKey()) return
      setSelectedLocationIds(normalizeStructuralLocationIds(nextValues.locationIds))
    }

    window.addEventListener(SCOPE_EVENT, synchronizeScope)
    return () => window.removeEventListener(SCOPE_EVENT, synchronizeScope)
  }, [])

  const updateSelectedLocationIds = useCallback((locationIds: string[]) => {
    const normalized = normalizeStructuralLocationIds(locationIds)
    setSelectedLocationIds(normalized)
    persistCurrentScope(normalized)
    window.dispatchEvent(new CustomEvent(SCOPE_EVENT, {
      detail: { workspace: getWorkspaceKey(), locationIds: normalized },
    }))
  }, [])

  return [selectedLocationIds, updateSelectedLocationIds] as const
}

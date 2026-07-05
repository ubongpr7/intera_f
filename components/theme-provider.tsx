"use client"

import type React from "react"
import { useEffect } from "react"
import { useAppSelector, useAppDispatch } from "../redux/hooks"
import { syncThemePreferences, updateSystemTheme } from "../redux/state"

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { isDarkMode, isSystemTheme } = useAppSelector((state) => state.global)
  const dispatch = useAppDispatch()

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== "globalSettings" || !event.newValue) return

      try {
        const nextState = JSON.parse(event.newValue) as {
          isDarkMode?: unknown
          isSystemTheme?: unknown
        }
        if (typeof nextState.isDarkMode !== "boolean" || typeof nextState.isSystemTheme !== "boolean") {
          return
        }
        dispatch(syncThemePreferences({
          isDarkMode: nextState.isDarkMode,
          isSystemTheme: nextState.isSystemTheme,
        }))
      } catch {
        return
      }
    }

    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [dispatch])

  // Handle system theme changes
  useEffect(() => {
    if (!isSystemTheme) return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    dispatch(updateSystemTheme(mediaQuery.matches))

    const handleChange = (e: MediaQueryListEvent) => {
      dispatch(updateSystemTheme(e.matches))
    }

    mediaQuery.addEventListener("change", handleChange)

    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [isSystemTheme, dispatch])

  // Apply theme class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
      document.documentElement.classList.remove("light")
    } else {
      document.documentElement.classList.remove("dark")
      document.documentElement.classList.add("light")
    }

    return () => {
      document.documentElement.classList.remove("light")
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  return <>{children}</>
}

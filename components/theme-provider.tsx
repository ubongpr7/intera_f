"use client"

import type React from "react"
import { useEffect } from "react"
import { useAppSelector, useAppDispatch } from "../redux/hooks"
import { setIsDarkMode, updateSystemTheme } from "../redux/state"

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { isDarkMode, isSystemTheme } = useAppSelector((state) => state.global)
  const dispatch = useAppDispatch()

  // Handle system theme changes
  useEffect(() => {
    if (!isSystemTheme) return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const handleChange = (e: MediaQueryListEvent) => {
      dispatch(updateSystemTheme(e.matches)) // Use the new action
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
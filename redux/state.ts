import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

// Helper function to safely get system theme
const getSystemTheme = () => {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

// Default initial state
const defaultState = {
  isSidebarCollapsed: true,
  isDarkMode: false,
  isSystemTheme: true,
}

// Load state from localStorage if available
const loadInitialState = () => {
  if (typeof window === "undefined") return defaultState

  try {
    const savedState = localStorage.getItem("globalSettings")
    if (savedState) {
      return JSON.parse(savedState)
    }
  } catch (error) {
    console.error("Failed to load state from localStorage:", error)
  }

  // Fallback to system theme
  return {
    ...defaultState,
    isDarkMode: getSystemTheme(),
  }
}

interface InitialStateTypes {
  isSidebarCollapsed: boolean
  isDarkMode: boolean
  isSystemTheme: boolean
}

const initialState: InitialStateTypes = loadInitialState()

export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setIsSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isSidebarCollapsed = action.payload
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("globalSettings", JSON.stringify(state))
        } catch (error) {
          console.error("Failed to save state to localStorage:", error)
        }
      }
    },
    setIsDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload
      state.isSystemTheme = false // User explicitly set theme
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("globalSettings", JSON.stringify(state))
        } catch (error) {
          console.error("Failed to save state to localStorage:", error)
        }
      }
    },
    updateSystemTheme: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload
      // Do NOT change isSystemTheme, so it remains true
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("globalSettings", JSON.stringify(state))
        } catch (error) {
          console.error("Failed to save state to localStorage:", error)
        }
      }
    },
    resetToSystemTheme: (state) => {
      state.isDarkMode = getSystemTheme()
      state.isSystemTheme = true
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("globalSettings", JSON.stringify(state))
        } catch (error) {
          console.error("Failed to save state to localStorage:", error)
        }
      }
    },
  },
})

export const { setIsSidebarCollapsed, setIsDarkMode, updateSystemTheme, resetToSystemTheme } = globalSlice.actions
export default globalSlice.reducer
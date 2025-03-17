// features/globalSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Helper function to safely get system theme
const getSystemTheme = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Load initial state with SSR support
const loadInitialState = () => {
  if (typeof window === 'undefined') return {
    isSidebarCollapsed: false,
    isDarkMode: false,
    isSystemTheme: true
  };

  const savedState = localStorage.getItem('globalSettings');
  
  // Return saved state if exists
  if (savedState) return JSON.parse(savedState);

  // Fallback to system theme
  return {
    isSidebarCollapsed: true,
    isDarkMode: getSystemTheme(),
    isSystemTheme: true
  };
};

interface InitialStateTypes {
  isSidebarCollapsed: boolean;
  isDarkMode: boolean;
  isSystemTheme: boolean;
}

const initialState: InitialStateTypes = loadInitialState();

export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setIsSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isSidebarCollapsed = action.payload;
    },
    setIsDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
      state.isSystemTheme = false; // User explicitly set theme
    },
    resetToSystemTheme: (state) => {
      state.isDarkMode = getSystemTheme();
      state.isSystemTheme = true;
    }
  },
});

export const { setIsSidebarCollapsed, setIsDarkMode, resetToSystemTheme } = globalSlice.actions;
export default globalSlice.reducer;
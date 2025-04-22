import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const getSystemTheme = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

interface InitialStateTypes {
  isSidebarCollapsed: boolean;
  isDarkMode: boolean;
  isSystemTheme: boolean;
}

const initialState: InitialStateTypes = {
  isSidebarCollapsed: false,
  isDarkMode: getSystemTheme(),
  isSystemTheme: true // Start with system theme by default
};

export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setIsSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isSidebarCollapsed = action.payload;
    },
    setIsDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
      state.isSystemTheme = false;
    },
    resetToSystemTheme: (state) => {
      state.isDarkMode = getSystemTheme();
      state.isSystemTheme = true;
    }
  },
});

export const { setIsSidebarCollapsed, setIsDarkMode, resetToSystemTheme } = globalSlice.actions;
export default globalSlice.reducer;
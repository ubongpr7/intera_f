"use client"

import type React from "react"
import { forwardRef, useState } from "react"
import Select, { type Props as ReactSelectProps, type StylesConfig } from "react-select"
import CreatableSelect from "react-select/creatable"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string | number
  label: string
}

export type ReactSelectFieldProps = ReactSelectProps<SelectOption, boolean> & {
  error?: string
  label?: string
  helperText?: string
  inputId?: string
  creatable?: boolean
  [key: string]: any
}

const isDarkMode = () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")

const customStyles: StylesConfig<SelectOption, boolean> = {
  control: (provided, state) => ({
    ...provided,
    minHeight: 48,
    borderRadius: 18,
    backgroundColor: state.isDisabled ? "#f9fafb" : "#ffffff",
    borderColor: state.isFocused ? "#60a5fa" : "#e5e7eb",
    boxShadow: state.isFocused ? "0 0 0 4px rgba(59, 130, 246, 0.14)" : "0 10px 24px rgba(15, 23, 42, 0.05)",
    "&:hover": {
      borderColor: state.isFocused ? "#60a5fa" : "#d1d5db",
    },
    ...(isDarkMode() && {
      backgroundColor: state.isDisabled ? "#111827" : "#111827",
      borderColor: state.isFocused ? "#60a5fa" : "#374151",
      color: "#f3f4f6",
      boxShadow: state.isFocused ? "0 0 0 4px rgba(59, 130, 246, 0.16)" : "0 12px 28px rgba(2, 6, 23, 0.42)",
    }),
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
    ...(isDarkMode() && {
      backgroundColor: "#111827",
    }),
  }),
  placeholder: (provided) => ({
    ...provided,
    color: isDarkMode() ? "#9ca3af" : "#94a3b8",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#dbeafe" : "transparent",
    color: state.isSelected ? "#ffffff" : "#111827",
    "&:active": {
      backgroundColor: "#3b82f6",
    },
    ...(isDarkMode() && {
      backgroundColor: state.isSelected ? "#2563eb" : state.isFocused ? "#1e3a8a" : "#111827",
      color: "#f3f4f6",
    }),
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#111827",
    ...(isDarkMode() && {
      color: "#f3f4f6",
    }),
  }),
  input: (provided) => ({
    ...provided,
    color: "#111827",
    ...(isDarkMode() && {
      color: "#f3f4f6",
    }),
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 9999,
  }),
}

export const ReactSelectField = forwardRef<any, ReactSelectFieldProps>(
  (
    {
      className,
      error,
      label,
      helperText,
      inputId,
      creatable = false,
      menuPortalTarget,
      menuPosition,
      menuPlacement,
      styles,
      onMenuOpen,
      onMenuClose,
      ...props
    },
    ref,
  ) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const resolvedPortalTarget = menuPortalTarget
    const SelectComponent = creatable ? CreatableSelect : Select

    return (
      <div className={cn("relative space-y-1", isMenuOpen ? "z-[120]" : "z-0", className)}>
        {label ? <label className="block text-sm font-medium text-gray-700">{label}</label> : null}
        <SelectComponent
          ref={ref}
          styles={{
            ...customStyles,
            ...styles,
          }}
          classNames={{
            control: () =>
              cn(
                "rounded-2xl border bg-white px-2 py-1 dark:bg-gray-800/90",
                error ? "border-red-500 dark:border-red-500" : "border-gray-200 dark:border-gray-700",
              ),
            menu: () => "p-1 dark:bg-gray-950",
          }}
          inputId={inputId}
          menuPortalTarget={resolvedPortalTarget}
          menuPosition={menuPosition ?? (resolvedPortalTarget ? "fixed" : "absolute")}
          menuPlacement={menuPlacement ?? "auto"}
          onMenuOpen={() => {
            setIsMenuOpen(true)
            onMenuOpen?.()
          }}
          onMenuClose={() => {
            setIsMenuOpen(false)
            onMenuClose?.()
          }}
          {...props}
        />
        {helperText ? <p className={cn("text-xs", error ? "text-red-500" : "text-gray-500")}>{helperText}</p> : null}
      </div>
    )
  },
)

ReactSelectField.displayName = "ReactSelectField"

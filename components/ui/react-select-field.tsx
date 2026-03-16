"use client"

import type React from "react"
import { forwardRef } from "react"
import Select, { type Props as ReactSelectProps, type StylesConfig } from "react-select"
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
}

const isDarkMode = () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")

const customStyles: StylesConfig<SelectOption, boolean> = {
  control: (provided, state) => ({
    ...provided,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: state.isDisabled ? "#f9fafb" : "#ffffff",
    borderColor: state.isFocused ? "#60a5fa" : "#e5e7eb",
    boxShadow: state.isFocused ? "0 0 0 4px rgba(59, 130, 246, 0.14)" : "0 1px 2px rgba(15, 23, 42, 0.06)",
    "&:hover": {
      borderColor: state.isFocused ? "#60a5fa" : "#cbd5e1",
    },
    ...(isDarkMode() && {
      backgroundColor: "#1f2937",
      borderColor: state.isFocused ? "#60a5fa" : "#4b5563",
      color: "#f9fafb",
    }),
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
    ...(isDarkMode() && {
      backgroundColor: "#1f2937",
    }),
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#bfdbfe" : "transparent",
    color: state.isSelected || state.isFocused ? "#ffffff" : "#111827",
    "&:active": {
      backgroundColor: "#3b82f6",
    },
    ...(isDarkMode() && {
      backgroundColor: state.isSelected ? "#60a5fa" : state.isFocused ? "#93c5fd" : "#1f2937",
      color: state.isSelected || state.isFocused ? "#ffffff" : "#f9fafb",
    }),
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#111827",
    ...(isDarkMode() && {
      color: "#f9fafb",
    }),
  }),
  input: (provided) => ({
    ...provided,
    color: "#111827",
    ...(isDarkMode() && {
      color: "#f9fafb",
    }),
  }),
}

export const ReactSelectField = forwardRef<any, ReactSelectFieldProps>(
  ({ className, error, label, helperText, inputId, ...props }, ref) => (
    <div className={cn("space-y-1", className)}>
      {label ? <label className="block text-sm font-medium text-gray-700">{label}</label> : null}
      <Select
        ref={ref}
        styles={customStyles}
        classNames={{
          control: () =>
            cn(
              "rounded-xl border bg-white px-1.5 py-0.5",
              error ? "border-red-500" : "border-gray-200",
            ),
          menu: () => "p-1",
        }}
        inputId={inputId}
        {...props}
      />
      {helperText ? <p className={cn("text-xs", error ? "text-red-500" : "text-gray-500")}>{helperText}</p> : null}
    </div>
  ),
)

ReactSelectField.displayName = "ReactSelectField"

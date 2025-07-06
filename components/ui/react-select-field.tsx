"use client"

import type React from "react"
import { forwardRef } from "react"
import Select, { type Props as ReactSelectProps, type StylesConfig, type GroupBase } from "react-select"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: any
  label: string
}

export type ReactSelectFieldProps<
  Option = SelectOption,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
> = ReactSelectProps<Option, IsMulti, Group> & {
  error?: string
  label?: string
  helperText?: string
  inputId?: string
}

const customStyles: StylesConfig<SelectOption, boolean, GroupBase<SelectOption>> = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: state.isDisabled ? '#f9fafb' : 'transparent', // Light mode bg, adjust for dark
    borderColor: state.isFocused ? '#3b82f6' : '#d1d5db', // Tailwind blue-600, gray-300
    boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : '#9ca3af', // gray-400
    },
    ...(state.isDarkMode && {
      backgroundColor: '#1f2937', // Tailwind gray-800 for dark mode
      borderColor: state.isFocused ? '#60a5fa' : '#4b5563', // blue-400, gray-600
      color: '#f9fafb', // Light text for dark mode
    }),
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: '#ffffff', // Light mode bg
    ...(typeof document !== 'undefined' && document.documentElement.classList.contains('dark') && {
      backgroundColor: '#1f2937', // gray-800 for dark mode
    }),
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#bfdbfe' : 'transparent', // blue-600, blue-200
    color: state.isSelected || state.isFocused ? '#ffffff' : '#111827', // white, gray-900
    '&:active': {
      backgroundColor: '#3b82f6', // blue-600
    },
    ...(typeof document !== 'undefined' && document.documentElement.classList.contains('dark') && {
      backgroundColor: state.isSelected ? '#60a5fa' : state.isFocused ? '#93c5fd' : '#1f2937', // blue-400, blue-300, gray-800
      color: state.isSelected || state.isFocused ? '#ffffff' : '#f9fafb', // white, gray-50
    }),
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#111827', // gray-900
    ...(typeof document !== 'undefined' && document.documentElement.classList.contains('dark') && {
      color: '#f9fafb', // gray-50
    }),
  }),
  input: (provided) => ({
    ...provided,
    color: '#111827', // gray-900
    ...(typeof document !== 'undefined' && document.documentElement.classList.contains('dark') && {
      color: '#f9fafb', // gray-50
    }),
  }),
}

export const ReactSelectField = forwardRef(
  <Option extends SelectOption, IsMulti extends boolean = false, Group extends GroupBase<Option> = GroupBase<Option>>(
    { className, error, label, helperText, inputId, ...props }: ReactSelectFieldProps<Option, IsMulti, Group>,
    ref: React.ForwardedRef<any>,
  ) => {
    return (
      <div className={cn("space-y-1", className)}>
        {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
        <Select
          ref={ref}
          styles={customStyles}
          classNames={{
            control: () => cn("border rounded-md p-1", error ? "border-red-500" : "border-gray-300 dark:border-gray-600"),
            menu: () => "p-1",
          }}
          inputId={inputId}
          {...props}
        />
        {helperText && (
          <p className={cn("text-xs", error ? "text-red-500 dark:text-red-400" : "text-gray-500 dark:text-gray-400")}>
            {helperText}
          </p>
        )}
      </div>
    )
  },
)

ReactSelectField.displayName = "ReactSelectField"
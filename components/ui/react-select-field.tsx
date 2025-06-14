"use client"

import type React from "react"
import { forwardRef } from "react"
import Select, { type Props as ReactSelectProps, type StylesConfig, type GroupBase } from "react-select"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
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

export const ReactSelectField = forwardRef(
  <Option extends SelectOption, IsMulti extends boolean = false, Group extends GroupBase<Option> = GroupBase<Option>>(
    { className, error, label, helperText, inputId, ...props }: ReactSelectFieldProps<Option, IsMulti, Group>,
    ref: React.ForwardedRef<any>,
  ) => {
    // Custom styles that match your Tailwind theme
    const customStyles: StylesConfig<Option, IsMulti, Group> = {
      control: (provided, state) => ({
        ...provided,
        backgroundColor: "var(--color-gray-100)", 
        borderColor: error
          ? "var(--color-red-500)" 
          : state.isFocused
            ? "var(--color-blue-500)"
            : "var(--color-gray-200)", 
        borderRadius: "0.375rem",
        boxShadow: state.isFocused ? "0 0 0 2px var(--color-blue-500 / 0.3)" : "none",
        "&:hover": {
          borderColor: state.isFocused
            ? "var(--color-blue-500)"
            : "var(--color-gray-300)", 
        },
        padding: "1px",
        minHeight: "40px",
      }),
      menu: (provided) => ({
        ...provided,
        backgroundColor: "var(--color-white)", 
        borderRadius: "0.375rem",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        zIndex: 9999,
      }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected
          ? "var(--color-blue-500)" 
          : state.isFocused
            ? "var(--color-blue-500 / 0.9)" 
            : "var(--color-gray-50)",
        color: state.isSelected
          ? "var(--color-white)" 
          : "var(--color-gray-900)",
        cursor: "pointer",
        padding: "8px 12px",
        "&:active": {
          backgroundColor: state.isSelected
            ? "var(--color-blue-600)"
            : "var(--color-blue-500 / 0.9)",
        },
      }),
      multiValue: (provided) => ({
        ...provided,
        backgroundColor: "var(--color-blue-500 / 0.9)",
        borderRadius: "0.25rem",
      }),
      multiValueLabel: (provided) => ({
        ...provided,
        color: "var(--color-blue-500)",
        fontSize: "0.875rem",
        padding: "2px 6px",
      }),
      multiValueRemove: (provided) => ({
        ...provided,
        color: "var(--color-blue-500)",
        "&:hover": {
          backgroundColor: "var(--color-blue-500)",
          color: "var(--color-white)",
        },
      }),
      input: (provided) => ({
        ...provided,
        color: "var(--color-gray-900)",
      }),
      placeholder: (provided) => ({
        ...provided,
        color: "var(--color-gray-400)", 
      }),
      singleValue: (provided) => ({
        ...provided,
        color: "var(--color-gray-900)",
      }),
    }

    return (
      <div className={cn("space-y-1", className)}>
        {label && <label className="block text-sm font-medium text-gray-700 ">{label}</label>}
        <Select
          ref={ref}
          styles={customStyles}
          classNames={{
            container: () => "text-sm",
          }}
          inputId={inputId}
          {...props}
        />
        {helperText && (
          <p className={cn("text-xs", error ? "text-red-500" : "text-gray-500 ")}>{helperText}</p>
        )}
      </div>
    )
  },
)


ReactSelectField.displayName = "ReactSelectField"
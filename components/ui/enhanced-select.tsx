"use client"

import type React from "react"
import { forwardRef } from "react"
import ReactSelect, { type Props as ReactSelectProps, type StylesConfig, type GroupBase } from "react-select"
import { cn } from "@/lib/utils"

export type EnhancedSelectProps<
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
> = ReactSelectProps<Option, IsMulti, Group> & {
  error?: boolean
  label?: string
  helperText?: string
}

export const EnhancedSelect = forwardRef(
  <Option, IsMulti extends boolean = false, Group extends GroupBase<Option> = GroupBase<Option>>(
    { className, error, label, helperText, ...props }: EnhancedSelectProps<Option, IsMulti, Group>,
    ref: React.ForwardedRef<any>,
  ) => {
    // Custom styles that match your design system
    const customStyles: StylesConfig<Option, IsMulti, Group> = {
      control: (provided, state) => ({
        ...provided,
        backgroundColor: "rgb(243, 244, 246)", // bg-gray-100
        borderColor: error ? "rgb(239, 68, 68)" : state.isFocused ? "rgb(59, 130, 246)" : "rgb(229, 231, 235)",
        borderRadius: "0.375rem",
        boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.3)" : "none",
        "&:hover": {
          borderColor: state.isFocused ? "rgb(59, 130, 246)" : "rgb(209, 213, 219)",
        },
        padding: "1px",
        minHeight: "40px",
      }),
      menu: (provided) => ({
        ...provided,
        borderRadius: "0.375rem",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        zIndex: 9999,
      }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected
          ? "rgb(59, 130, 246)"
          : state.isFocused
            ? "rgba(59, 130, 246, 0.1)"
            : "transparent",
        color: state.isSelected ? "white" : "inherit",
        cursor: "pointer",
        padding: "8px 12px",
        "&:active": {
          backgroundColor: state.isSelected ? "rgb(37, 99, 235)" : "rgba(59, 130, 246, 0.2)",
        },
      }),
      multiValue: (provided) => ({
        ...provided,
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderRadius: "0.25rem",
      }),
      multiValueLabel: (provided) => ({
        ...provided,
        color: "rgb(59, 130, 246)",
        fontSize: "0.875rem",
        padding: "2px 6px",
      }),
      multiValueRemove: (provided) => ({
        ...provided,
        color: "rgb(59, 130, 246)",
        "&:hover": {
          backgroundColor: "rgb(59, 130, 246)",
          color: "white",
        },
      }),
      input: (provided) => ({
        ...provided,
        color: "rgb(17, 24, 39)",
      }),
      placeholder: (provided) => ({
        ...provided,
        color: "rgb(156, 163, 175)",
      }),
      singleValue: (provided) => ({
        ...provided,
        color: "rgb(17, 24, 39)",
      }),
    }

    return (
      <div className={cn("space-y-1", className)}>
        {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
        <ReactSelect
          ref={ref}
          styles={customStyles}
          classNames={{
            container: () => "text-sm",
          }}
          {...props}
        />
        {helperText && <p className={cn("text-xs", error ? "text-red-500" : "text-gray-500")}>{helperText}</p>}
      </div>
    )
  },
)

EnhancedSelect.displayName = "EnhancedSelect"

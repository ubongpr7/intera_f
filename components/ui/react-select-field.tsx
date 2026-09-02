"use client"

import type React from "react"
import { forwardRef, useState } from "react"
import Select, { components as reactSelectComponents, type Props as ReactSelectProps, type StylesConfig } from "react-select"
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
  formatCreateLabel?: (inputValue: string) => React.ReactNode
}

const customStyles: StylesConfig<SelectOption, boolean> = {
  control: (provided, state) => ({
    ...provided,
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: "var(--select-surface, #ffffff)",
    borderColor: state.isFocused ? "var(--select-ring, #3b82f6)" : "var(--select-border, #d1d5db)",
    boxShadow: state.isFocused ? "0 0 0 4px rgba(59, 130, 246, 0.16)" : "0 16px 36px rgba(2, 6, 23, 0.18)",
    color: "var(--select-text, #111827)",
    "&:hover": {
      borderColor: state.isFocused ? "var(--select-ring, #3b82f6)" : "var(--select-border, #94a3b8)",
    },
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "var(--select-menu-surface, #ffffff)",
    borderRadius: 18,
    overflow: "hidden",
    border: "1px solid var(--select-border, #d1d5db)",
    boxShadow: "0 24px 64px rgba(2, 6, 23, 0.3)",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "var(--select-muted, #64748b)",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? "var(--select-selected, #2563eb)" : state.isFocused ? "var(--select-focused, #dbeafe)" : "var(--select-menu-surface, #ffffff)",
    color: state.isSelected ? "#ffffff" : "var(--select-text, #111827)",
    "&:active": {
      backgroundColor: "var(--select-selected, #2563eb)",
    },
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "var(--select-text, #111827)",
  }),
  input: (provided) => ({
    ...provided,
    color: "var(--select-text, #111827)",
  }),
  valueContainer: (provided) => ({
    ...provided,
    color: "var(--select-text, #111827)",
    paddingLeft: "0.5rem",
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    color: "var(--select-muted, #64748b)",
  }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.isFocused ? "var(--select-text, #111827)" : "var(--select-muted, #64748b)",
    "&:hover": {
      color: "var(--select-text, #111827)",
    },
  }),
  clearIndicator: (provided) => ({
    ...provided,
    color: "var(--select-muted, #64748b)",
    "&:hover": {
      color: "var(--select-text, #111827)",
    },
  }),
  indicatorSeparator: () => ({
    backgroundColor: "var(--select-border, #d1d5db)",
  }),
  menuList: (provided) => ({
    ...provided,
    padding: 6,
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
      <div className={cn("react-select-field relative space-y-1", isMenuOpen ? "z-[120]" : "z-0", className)}>
        {label ? <label className="block text-sm font-medium text-gray-300">{label}</label> : null}
        <SelectComponent
          ref={ref}
          styles={{
            ...customStyles,
            ...styles,
          }}
          components={{
            ...props.components,
            Input: (inputProps) => (
              <reactSelectComponents.Input {...inputProps} autoComplete="off" autoCorrect="off" spellCheck={false} />
            ),
          }}
          classNames={{
            control: () =>
              cn(
                "rounded-2xl border px-2 py-1 transition-colors",
                error ? "border-red-500" : "border-gray-700",
            ),
            menu: () => "p-1",
            singleValue: () => "",
            placeholder: () => "",
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
        {helperText ? <p className={cn("text-xs", error ? "text-red-400" : "text-gray-400")}>{helperText}</p> : null}
      </div>
    )
  },
)

ReactSelectField.displayName = "ReactSelectField"

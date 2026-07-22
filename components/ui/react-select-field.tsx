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
  [key: string]: any
}

const customStyles: StylesConfig<SelectOption, boolean> = {
  control: (provided, state) => ({
    ...provided,
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: "hsl(var(--background))",
    borderColor: state.isFocused ? "hsl(var(--ring))" : "hsl(var(--border))",
    boxShadow: state.isFocused ? "0 0 0 4px rgba(59, 130, 246, 0.16)" : "0 16px 36px rgba(2, 6, 23, 0.18)",
    color: "hsl(var(--foreground))",
    "&:hover": {
      borderColor: state.isFocused ? "hsl(var(--ring))" : "hsl(var(--muted-foreground))",
    },
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "hsl(var(--popover))",
    borderRadius: 18,
    overflow: "hidden",
    border: "1px solid hsl(var(--border))",
    boxShadow: "0 24px 64px rgba(2, 6, 23, 0.3)",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "hsl(var(--muted-foreground))",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? "hsl(var(--primary))" : state.isFocused ? "rgba(59, 130, 246, 0.14)" : "transparent",
    color: "hsl(var(--popover-foreground))",
    "&:active": {
      backgroundColor: "hsl(var(--primary))",
    },
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "hsl(var(--foreground))",
  }),
  input: (provided) => ({
    ...provided,
    color: "hsl(var(--foreground))",
  }),
  valueContainer: (provided) => ({
    ...provided,
    color: "hsl(var(--foreground))",
    paddingLeft: "0.5rem",
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    color: "hsl(var(--muted-foreground))",
  }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.isFocused ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
    "&:hover": {
      color: "hsl(var(--foreground))",
    },
  }),
  clearIndicator: (provided) => ({
    ...provided,
    color: "hsl(var(--muted-foreground))",
    "&:hover": {
      color: "hsl(var(--foreground))",
    },
  }),
  indicatorSeparator: () => ({
    backgroundColor: "hsl(var(--border))",
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
      <div className={cn("relative space-y-1", isMenuOpen ? "z-[120]" : "z-0", className)}>
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
            singleValue: () => "text-gray-100",
            placeholder: () => "text-gray-400",
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

"use client"
import Select from "react-select"
import { selectStyles } from "@/utils/select-styles"

export interface MultiSelectOption {
  label: string
  value: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  isDisabled?: boolean
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options",
  isDisabled = false,
  className,
}: MultiSelectProps) {
  // Convert selected values to options format
  const selectedOptions = selected?.map((value) => {
    const option = options.find((opt) => opt.value === value)
    return option || { value, label: value }
  })

  // Handle change
  const handleChange = (selectedOptions: readonly MultiSelectOption[]) => {
    onChange(selectedOptions?.map((option) => option.value))
  }

  return (
    <Select
      isMulti
      options={options}
      value={selectedOptions}
      onChange={handleChange as any}
      placeholder={placeholder}
      isDisabled={isDisabled}
      styles={selectStyles}
      className={`react-select-container [--select-border:#d1d5db] [--select-chip:#e0e7ff] [--select-focused:#dbeafe] [--select-menu-surface:#fff] [--select-muted:#6b7280] [--select-selected:#2563eb] [--select-surface:#fff] [--select-text:#111827] dark:[--select-border:#475569] dark:[--select-chip:#334155] dark:[--select-focused:#1e3a5f] dark:[--select-menu-surface:#0f172a] dark:[--select-muted:#94a3b8] dark:[--select-selected:#2563eb] dark:[--select-surface:#1e293b] dark:[--select-text:#f8fafc] ${className || ""}`}
      classNamePrefix="react-select"
    />
  )
}

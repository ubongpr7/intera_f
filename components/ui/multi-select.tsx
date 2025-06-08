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
      className={`react-select-container ${className || ""}`}
      classNamePrefix="react-select"
    />
  )
}

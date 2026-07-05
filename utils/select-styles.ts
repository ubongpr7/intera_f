import type { StylesConfig } from "react-select"

import type { SelectOption } from "@/components/ui/react-select-field"

export const selectStyles: StylesConfig<SelectOption, true> = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "var(--select-surface, #ffffff)",
    color: "var(--select-text, #111827)",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
    minHeight: "2.75rem",
    "&:hover": {
      borderColor: state.isFocused ? "#3b82f6" : "#9ca3af",
    },
  }),
  menu: (base) => ({
    ...base,
    zIndex: 60,
    backgroundColor: "var(--select-menu-surface, #ffffff)",
    border: "1px solid var(--select-border, #e5e7eb)",
    overflow: "hidden",
  }),
  menuList: (base) => ({
    ...base,
    padding: 4,
    backgroundColor: "var(--select-menu-surface, #ffffff)",
  }),
  option: (base, state) => ({
    ...base,
    borderRadius: 8,
    backgroundColor: state.isSelected
      ? "var(--select-selected, #2563eb)"
      : state.isFocused
        ? "var(--select-focused, #dbeafe)"
        : "transparent",
    color: state.isSelected ? "#ffffff" : "var(--select-text, #111827)",
    cursor: "pointer",
  }),
  placeholder: (base) => ({
    ...base,
    color: "var(--select-muted, #6b7280)",
  }),
  input: (base) => ({
    ...base,
    color: "var(--select-text, #111827)",
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "var(--select-chip, #e0e7ff)",
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "var(--select-text, #111827)",
  }),
}

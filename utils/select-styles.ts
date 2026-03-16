import type { StylesConfig } from "react-select"

import type { SelectOption } from "@/components/ui/react-select-field"

export const selectStyles: StylesConfig<SelectOption, true> = {
  control: (base, state) => ({
    ...base,
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
  }),
}

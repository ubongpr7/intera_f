"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { MultiSelect } from "@/components/ui/multi-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useListStockLocationsQuery } from "@/redux/features/stock/stockAPISlice"
import type { StockLocation } from "@/redux/features/stock/stockTypes"
import { isAllStructuralLocationScope, normalizeStructuralLocationIds } from "@/lib/structuralLocationScope"

type StructuralLocationScopeSelectProps = {
  value?: string
  onChange?: (value: string) => void
  values?: string[]
  onValuesChange?: (values: string[]) => void
  id?: string
  label?: string
  description?: string
  allLabel?: string
  className?: string
  disabled?: boolean
  allowMultiSelect?: boolean
}

const formatStructuralLocationLabel = (location: StockLocation) =>
  [location.parent_name, location.name].filter((value) => value && String(value).trim().length > 0).join(" / ") ||
  location.name ||
  String(location.id)

export default function StructuralLocationScopeSelect({
  value = "all",
  onChange,
  values,
  onValuesChange,
  id = "structural-location-scope",
  label = "Structural location",
  description,
  allLabel = "All structural locations",
  className = "",
  disabled = false,
  allowMultiSelect = false,
}: StructuralLocationScopeSelectProps) {
  const { data: locations = [], isLoading, isError, error } = useListStockLocationsQuery({ structural: true, ordering: "name" })
  const normalizedValues = normalizeStructuralLocationIds(values)
  const isAllSelected = isAllStructuralLocationScope(normalizedValues)
  const options = locations.map((location) => ({
    value: String(location.id),
    label: formatStructuralLocationLabel(location),
  }))
  const errorStatus =
    error && typeof error === "object" && "status" in error && error.status != null ? String(error.status) : ""
  const errorMessage =
    isError
      ? `Structural locations could not be loaded${errorStatus ? ` (${errorStatus})` : ""}. Check your access or refresh the page.`
      : null

  if (allowMultiSelect) {
    return (
      <div className={`space-y-2 ${className}`.trim()}>
        <Label htmlFor={id}>{label}</Label>
        {description ? <p className="text-xs leading-5 text-gray-500">{description}</p> : null}
        {errorMessage ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {errorMessage}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={isAllSelected ? "default" : "outline"}
            size="sm"
            disabled={disabled || isLoading}
            onClick={() => onValuesChange?.([])}
          >
            {allLabel}
          </Button>
          <p className="text-xs text-gray-500">
            {isAllSelected
              ? "No specific structural location selected. Queries will span all locations."
              : `${normalizedValues.length} structural location${normalizedValues.length === 1 ? "" : "s"} selected.`}
          </p>
        </div>
        <MultiSelect
          options={options}
          selected={normalizedValues}
          onChange={(nextValues) => onValuesChange?.(nextValues)}
          placeholder="Select one or more structural locations"
          isDisabled={disabled || isLoading}
          className="w-full"
        />
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <Label htmlFor={id}>{label}</Label>
      {description ? <p className="text-xs leading-5 text-gray-500">{description}</p> : null}
      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMessage}
        </p>
      ) : null}
      <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={allLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {locations.map((location) => (
            <SelectItem key={String(location.id)} value={String(location.id)}>
              {formatStructuralLocationLabel(location)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

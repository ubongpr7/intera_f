"use client"
import React from "react"
import { startTransition, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { type LucideIcon, QrCode, Barcode, Search, SlidersHorizontal, X } from 'lucide-react'
import { FieldInfo } from "../fileFieldInfor"
import LoadingAnimation from "../LoadingAnimation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ReactSelectField, type SelectOption } from "@/components/ui/react-select-field"
import { cn } from "@/lib/utils"
import { formatMachineLabel } from "@/lib/displayLabels"

export interface Column<T> {
  header: string
  accessor: keyof T | ((row: T) => React.ReactNode)
  className?: string
  headerClassName?: string
  render?: (value: any, row: T) => React.ReactNode
  info?: string
}

export interface ActionButton<T> {
  label: string
  icon?: LucideIcon
  onClick: (row: T, event: React.MouseEvent) => void
  className?: string
  variant?: "primary" | "secondary" | "danger" | "success" | "warning"
  disabled?: (row: T) => boolean
  hidden?: (row: T) => boolean
  tooltip?: string
}

export interface SecondaryButton<T> {
  label: string
  icon?: LucideIcon
  onClick: (event: React.MouseEvent) => void
  className?: string
  disabled?: boolean
  hidden?: boolean
  tooltip?: string
}

export interface GeneralButton<T> {
  label: string
  icon?: LucideIcon
  onClick: (selectedIds: string[], selectedRows: T[], event: React.MouseEvent) => void
  className?: string
  variant?: "primary" | "secondary" | "danger" | "success" | "warning"
  disabled?: boolean
  tooltip?: string
}

export type DataTableFilterOption = SelectOption

export type DataTableQueryState = {
  searchTerm: string
  filters: Record<string, string>
  rangeFilters: Record<string, { from: string; to: string }>
  sortConfig: { key: string; direction: "ascending" | "descending" } | null
}

type TableViewState<T> = {
  searchTerm: string
  filters: Record<keyof T, string>
  rangeFilters: Record<keyof T, { from: string; to: string }>
  sortConfig: { key: keyof T; direction: "ascending" | "descending" } | null
}

const toDataTableQueryState = <T,>(state: TableViewState<T>): DataTableQueryState => ({
  searchTerm: state.searchTerm,
  filters: Object.fromEntries(Object.entries(state.filters).map(([key, value]) => [String(key), value])) as Record<string, string>,
  rangeFilters: Object.fromEntries(Object.entries(state.rangeFilters).map(([key, value]) => [String(key), value])) as Record<string, { from: string; to: string }>,
  sortConfig: state.sortConfig ? { key: String(state.sortConfig.key), direction: state.sortConfig.direction } : null,
})

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  error?: unknown
  errorMessage?: string
  onRetry?: () => unknown
  onRowClick?: (row: T) => void
  actionButtons?: ActionButton<T>[]
  secondaryButton?: SecondaryButton<T>
  showActionsColumn?: boolean
  actionsColumnHeader?: string
  actionsColumnWidth?: string
  showRowNumbers?: boolean
  rowNumberHeader?: string
  startNumberFrom?: number
  title?: string
  onClose?: () => void
  generalButtons?: GeneralButton<T>[]
  getRowId?: (row: T) => string
  showSelectAll?: boolean
  searchableFields?: (keyof T)[]
  filterableFields?: (keyof T)[]
  rangeFilterFields?: (keyof T)[]
  sortableFields?: (keyof T)[]
  qrScannableField?: keyof T; // Field to extract from QR code for filtering
  barcodeScannableField?: keyof T; // Field to extract from Barcode for filtering
  onScanSuccess?: (scannedItem: T) => void; // Callback after successful scan and item retrieval
  // Supply this when multiple tables with the same title appear on one route.
  urlStateKey?: string
  // Server-owned tables receive results that already match the URL filter state.
  serverSide?: boolean
  filterOptions?: Partial<Record<keyof T, DataTableFilterOption[]>>
  onQueryStateChange?: (state: DataTableQueryState) => void
}

const humanizeFieldName = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const getSingleSelectOption = (option: SelectOption | readonly SelectOption[] | null): SelectOption | null => {
  if (Array.isArray(option)) {
    return null
  }
  return option as SelectOption | null
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  error,
  errorMessage = "Unable to load records.",
  onRetry,
  onRowClick,
  actionButtons = [],
  secondaryButton,
  showActionsColumn = true,
  actionsColumnHeader = "Actions",
  actionsColumnWidth = "w-32",
  showRowNumbers = true,
  rowNumberHeader = "#",
  startNumberFrom = 1,
  generalButtons,
  getRowId,
  showSelectAll,
  searchableFields = [],
  filterableFields = [],
  rangeFilterFields = [],
  sortableFields = [],
  qrScannableField,
  barcodeScannableField,
  onScanSuccess,
  urlStateKey,
  serverSide = false,
  filterOptions: suppliedFilterOptions,
  onQueryStateChange,
  title,
  onClose,
}: DataTableProps<T>) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [scanValue, setScanValue] = useState("")
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const selectMenuPortalTarget = typeof document === "undefined" ? undefined : document.body

  const tableStateKey = useMemo(() => {
    const source = urlStateKey || title || columns.map((column) => column.header).join("-") || "records"
    const normalized = source
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
    return `table_${normalized || "records"}`
  }, [columns, title, urlStateKey])

  const searchKey = `${tableStateKey}_search`
  const sortKey = `${tableStateKey}_sort`
  const directionKey = `${tableStateKey}_direction`
  const urlState = useMemo<TableViewState<T>>(() => {
    const requestedSortField = searchParams.get(sortKey) as keyof T | null
    const requestedSortDirection = searchParams.get(directionKey)

    return {
      searchTerm: searchParams.get(searchKey) || "",
      filters: Object.fromEntries(
        filterableFields.map((field) => [field, searchParams.get(`${tableStateKey}_filter_${String(field)}`) || ""]),
      ) as Record<keyof T, string>,
      rangeFilters: Object.fromEntries(
        rangeFilterFields.map((field) => [
          field,
          {
            from: searchParams.get(`${tableStateKey}_from_${String(field)}`) || "",
            to: searchParams.get(`${tableStateKey}_to_${String(field)}`) || "",
          },
        ]),
      ) as Record<keyof T, { from: string; to: string }>,
      sortConfig: requestedSortField && sortableFields.includes(requestedSortField)
        ? { key: requestedSortField, direction: requestedSortDirection === "descending" ? "descending" : "ascending" }
        : null,
    }
  }, [
    directionKey,
    filterableFields,
    rangeFilterFields,
    searchKey,
    searchParams,
    sortableFields,
    sortKey,
    tableStateKey,
  ])

  const [tableViewState, setTableViewState] = useState<TableViewState<T>>(urlState)
  const lastObservedUrlState = useRef(JSON.stringify(urlState))
  const lastReportedQueryState = useRef("")

  useEffect(() => {
    const nextStateSignature = JSON.stringify(urlState)
    if (lastObservedUrlState.current === nextStateSignature) {
      return
    }

    lastObservedUrlState.current = nextStateSignature
    startTransition(() => {
      setTableViewState(urlState)
    })
  }, [urlState])

  useEffect(() => {
    if (!onQueryStateChange) {
      return
    }

    const nextQueryState = toDataTableQueryState(tableViewState)
    const nextQueryStateSignature = JSON.stringify(nextQueryState)
    if (lastReportedQueryState.current === nextQueryStateSignature) {
      return
    }

    lastReportedQueryState.current = nextQueryStateSignature
    onQueryStateChange(nextQueryState)
  }, [onQueryStateChange, tableViewState])

  useEffect(() => {
    if (!isFilterDrawerOpen && !isFilterModalOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFilterDrawerOpen(false)
        setIsFilterModalOpen(false)
      }
    }

    document.addEventListener("keydown", closeOnEscape)
    return () => document.removeEventListener("keydown", closeOnEscape)
  }, [isFilterDrawerOpen, isFilterModalOpen])

  const { searchTerm, filters, rangeFilters, sortConfig } = tableViewState

  const updateUrlState = (
    updates: Record<string, string | null>,
    historyMode: "push" | "replace" = "push",
  ) => {
    const nextParams = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        nextParams.set(key, value)
      } else {
        nextParams.delete(key)
      }
    })
    const query = nextParams.toString()
    const href = query ? `${pathname}?${query}` : pathname
    if (typeof window !== "undefined" && `${window.location.pathname}${window.location.search}` !== href) {
      if (historyMode === "replace") {
        window.history.replaceState(window.history.state, "", href)
      } else {
        window.history.pushState(window.history.state, "", href)
      }
    }
  }

  const pageKey = `${tableStateKey}_page`
  const setSearchTerm = (value: string) => {
    const nextState = { ...tableViewState, searchTerm: value }
    setTableViewState(nextState)
    // Keep one history entry while the user types, but preserve each discrete filter change.
    updateUrlState({ [searchKey]: value.trim() || null, [pageKey]: null }, "replace")
  }
  const setFilter = (field: keyof T, value: string) => {
    const nextState = { ...tableViewState, filters: { ...tableViewState.filters, [field]: value } }
    setTableViewState(nextState)
    updateUrlState({ [`${tableStateKey}_filter_${String(field)}`]: value || null, [pageKey]: null })
  }
  const setRangeFilter = (field: keyof T, edge: "from" | "to", value: string) => {
    const nextState = {
      ...tableViewState,
      rangeFilters: {
        ...tableViewState.rangeFilters,
        [field]: { ...tableViewState.rangeFilters[field], [edge]: value },
      },
    }
    setTableViewState(nextState)
    updateUrlState({ [`${tableStateKey}_${edge}_${String(field)}`]: value || null, [pageKey]: null })
  }

  const derivedFilterOptions = useMemo(() => {
    const options: Record<keyof T, string[]> = {} as Record<keyof T, string[]>
    filterableFields.forEach((field) => {
      const uniqueValues = [
        ...new Set(
          data
            .map((row) => row[field])
            .filter((value) => value !== null && value !== undefined && String(value).trim() !== "")
            .map((value) => String(value)),
        ),
      ]
      options[field] = uniqueValues
    })
    return options
  }, [data, filterableFields])

  const availableFilterOptions = useMemo(() => {
    const options = {} as Record<keyof T, DataTableFilterOption[]>
    filterableFields.forEach((field) => {
      if (suppliedFilterOptions?.[field]) {
        options[field] = suppliedFilterOptions[field]!
        return
      }
      options[field] = (derivedFilterOptions[field] || []).map((value) => ({ value, label: formatMachineLabel(value) }))
    })
    return options
  }, [derivedFilterOptions, filterableFields, suppliedFilterOptions])

  const sortOptions = useMemo<SelectOption[]>(
    () => sortableFields.flatMap((field) => [
      {
        value: `${String(field)}:ascending`,
        label: `${humanizeFieldName(String(field))}: A-Z / low-high`,
      },
      {
        value: `${String(field)}:descending`,
        label: `${humanizeFieldName(String(field))}: Z-A / high-low`,
      },
    ]),
    [sortableFields],
  )

  const sortedData = useMemo(() => {
    const sortableData = [...data]
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      })
    }
    return sortableData
  }, [data, sortConfig])

  const filteredAndSortedData = serverSide
    ? data
    : sortedData.filter((row) => {
        if (searchTerm === "") return true
        return searchableFields.some((field) => {
          const value = row[field]
          if (typeof value === "string") {
            return value.toLowerCase().includes(searchTerm.toLowerCase())
          }
          return false
        })
      }).filter((row) => {
        const exactMatch = Object.entries(filters).every(([field, value]) => {
          if (value === "") return true
          return String(row[field as keyof T] ?? "") === value
        })
        const rangeMatch = rangeFilterFields.every((field) => {
          const filter = rangeFilters[field]
          if (!filter || (filter.from === "" && filter.to === "")) return true
          const numValue = parseFloat(row[field] as any)
          if (isNaN(numValue)) return true
          const from = filter.from !== "" ? parseFloat(filter.from) : undefined
          const to = filter.to !== "" ? parseFloat(filter.to) : undefined
          return !(from !== undefined && numValue < from) && !(to !== undefined && numValue > to)
        })
        return exactMatch && rangeMatch
      })

  const activeFiltersCount = useMemo(() => {
    const exactFiltersCount = Object.values(filters).filter((value) => value !== "").length
    const rangeFiltersCount = rangeFilterFields.filter((field) => {
      const rangeFilter = rangeFilters[field]
      return Boolean(rangeFilter && (rangeFilter.from !== "" || rangeFilter.to !== ""))
    }).length

    return exactFiltersCount + rangeFiltersCount
  }, [filters, rangeFilterFields, rangeFilters])

  const hasActiveSearchOrFilters = searchTerm.trim().length > 0 || activeFiltersCount > 0

  const requestSort = (key: keyof T) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    const nextState = { ...tableViewState, sortConfig: { key, direction } }
    setTableViewState(nextState)
    updateUrlState({
      [sortKey]: String(key),
      [directionKey]: direction,
      [pageKey]: null,
    })
  }

  const clearAllFilters = () => {
    const nextState = {
      ...tableViewState,
      searchTerm: "",
      filters: {} as Record<keyof T, string>,
      rangeFilters: {} as Record<keyof T, { from: string; to: string }>,
      sortConfig: null,
    }
    setTableViewState(nextState)
    const updates: Record<string, null> = {
      [searchKey]: null,
      [sortKey]: null,
      [directionKey]: null,
      [pageKey]: null,
    }
    filterableFields.forEach((field) => {
      updates[`${tableStateKey}_filter_${String(field)}`] = null
    })
    rangeFilterFields.forEach((field) => {
      updates[`${tableStateKey}_from_${String(field)}`] = null
      updates[`${tableStateKey}_to_${String(field)}`] = null
    })
    updateUrlState(updates)
  }

  // Handle individual row selection
  const handleRowSelect = (rowId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedIds((prev) => [...prev, rowId])
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== rowId))
    }
  }

  // Handle select all functionality
  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      const allIds = filteredAndSortedData.map((row) => getRowId?.(row) || "").filter(Boolean)
      setSelectedIds(allIds)
    } else {
      setSelectedIds([])
    }
  }

  const allVisibleSelected = useMemo(() => {
    if (!filteredAndSortedData.length || !getRowId) return false
    const allIds = filteredAndSortedData.map((row) => getRowId(row)).filter(Boolean)
    return allIds.length > 0 && allIds.every((id) => selectedIds.includes(id))
  }, [filteredAndSortedData, getRowId, selectedIds])

  const hasGeneralButtons = generalButtons && generalButtons.length > 0 && getRowId
  const hasSelections = selectedIds.length > 0

  const getButtonVariantClasses = (variant: ActionButton<T>["variant"] = "secondary") => {
    const baseClasses =
      "inline-flex items-center rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-sm transition-[background-color,color,border-color,box-shadow,transform] duration-200 hover:-translate-y-px focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    switch (variant) {
      case "primary":
        return `${baseClasses} text-white bg-blue-600 border-blue-600 hover:bg-blue-700 focus:ring-blue-500`
      case "danger":
        return `${baseClasses} !text-white bg-red-600 border-red-600 hover:bg-red-700 focus:ring-red-500 dark:!text-white dark:bg-red-500 dark:border-red-500 dark:hover:bg-red-600`
      case "success":
        return `${baseClasses} text-white bg-green-600 border-green-600 hover:bg-green-700 focus:ring-green-500`
      case "warning":
        return `${baseClasses} text-white bg-yellow-600 border-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500`
      case "secondary":
      default:
        return `${baseClasses} text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-blue-500`
    }
  }

  const getSecondaryButtonClasses = () => {
    return "inline-flex items-center px-3 py-1 text-xs font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  }

  const handleActionClick = (action: ActionButton<T>, row: T, event: React.MouseEvent) => {
    event.stopPropagation()
    action.onClick(row, event)
  }

  const handleSecondaryClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    secondaryButton?.onClick(event)
  }

  const renderActionButtons = (row: T) => {
    const visibleActions = actionButtons.filter((action) => !action.hidden?.(row))
    if (visibleActions.length === 0) return null

    return (
      <div className="flex items-center space-x-1">
        {visibleActions.map((action, index) => {
          const isDisabled = action.disabled?.(row) || false
          const IconComponent = action.icon
          return (
            <button
              key={index}
              onClick={(e) => handleActionClick(action, row, e)}
              disabled={isDisabled}
              className={`${getButtonVariantClasses(action.variant)} ${action.className || ""}`}
              title={action.tooltip}
            >
              {IconComponent && (
                <IconComponent 
                  size={14} 
                  className={action.label ? "mr-1" : ""} 
                />
              )}
              {action.label}
            </button>
          )
        })}
      </div>
    )
  }

  const renderGeneralButtons = () => {
    if (!hasGeneralButtons) return null

    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">
          {selectedIds.length} item{selectedIds.length !== 1 ? "s" : ""} selected
        </span>
        {generalButtons!.map((button, index) => {
          const isDisabled = !hasSelections || button.disabled
          const selectedRows = filteredAndSortedData.filter((row) => selectedIds.includes(getRowId!(row)))
          const IconComponent = button.icon
          return (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation()
                if (!isDisabled) {
                  button.onClick(selectedIds, selectedRows, e)
                }
              }}
              disabled={isDisabled}
              className={`${getButtonVariantClasses(button.variant)} ${button.className || ""}`}
              title={button.tooltip}
            >
              {IconComponent && (
                <IconComponent 
                  size={14} 
                  className={button.label ? "mr-1" : ""} 
                />
              )}
              {button.label}
            </button>
          )
        })}
      </div>
    )
  }

  const hasActions = actionButtons.length > 0 && showActionsColumn

  const handleScan = (scannedValue: string, scanType: 'qr' | 'barcode') => {
    if (scanType === 'qr' && qrScannableField) {
      setSearchTerm(scannedValue);
      const foundItem = data.find(item => String(item[qrScannableField]) === scannedValue);
      if (foundItem && onScanSuccess) {
        onScanSuccess(foundItem);
      }
    } else if (scanType === 'barcode' && barcodeScannableField) {
      setSearchTerm(scannedValue);
      const foundItem = data.find(item => String(item[barcodeScannableField]) === scannedValue);
      if (foundItem && onScanSuccess) {
        onScanSuccess(foundItem);
      }
    }
  };

  const submitScanValue = (scanType: 'qr' | 'barcode') => {
    const normalizedScanValue = scanValue.trim()
    if (!normalizedScanValue) return
    handleScan(normalizedScanValue, scanType)
    setScanValue("")
  };

  const filterFieldCount = filterableFields.length + rangeFilterFields.length
  const hasFilterControls = filterFieldCount > 0 || sortableFields.length > 0
  const usesFilterDrawer = filterFieldCount > 4
  const hasTableControls = searchableFields.length > 0 || hasFilterControls
  const hasTableActions = Boolean(qrScannableField || barcodeScannableField || hasGeneralButtons)
  const activeFilterControlCount = activeFiltersCount + (sortConfig ? 1 : 0)
  const activeTableControlCount = activeFilterControlCount + (searchTerm.trim() ? 1 : 0)

  const renderFilterControls = (className: string) => (
    <div className={className}>
      {filterableFields.map((field) => {
        const options = availableFilterOptions[field] || []
        const isBooleanFilter = options.length > 0 && options.every((option) => ["true", "false"].includes(String(option.value).toLowerCase()))
        const filterValue = filters[field] || ""

        if (isBooleanFilter) {
          const isEnabled = filterValue === "true"
          const statusLabel = filterValue === "" ? "All" : isEnabled ? "On" : "Off"

          return (
            <div key={field as string} className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Filter by {humanizeFieldName(String(field)).toLowerCase()}</span>
              <div className="flex h-11 items-center gap-3 rounded-xl border border-border bg-card px-3">
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked) => setFilter(field, checked ? "true" : "false")}
                  aria-label={`Filter by ${humanizeFieldName(String(field)).toLowerCase()}: ${statusLabel}`}
                  className="focus-visible:ring-offset-[rgb(7,16,31)]"
                />
                <span className="min-w-8 text-sm font-medium text-foreground">{statusLabel}</span>
                {filterValue !== "" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-8 rounded-full px-3"
                    onClick={() => setFilter(field, "")}
                  >
                    Clear
                  </Button>
                ) : null}
              </div>
            </div>
          )
        }

        return (
          <ReactSelectField
            key={field as string}
            inputId={`${tableStateKey}-filter-${String(field)}`}
            label={`Filter by ${humanizeFieldName(String(field)).toLowerCase()}`}
            options={options}
            value={options.find((option) => String(option.value) === filterValue) || null}
            onChange={(option: SelectOption | readonly SelectOption[] | null) => {
              const nextOption = getSingleSelectOption(option)
              setFilter(field, nextOption ? String(nextOption.value) : "")
            }}
            placeholder={`All ${humanizeFieldName(String(field)).toLowerCase()}`}
            isClearable
            menuPortalTarget={selectMenuPortalTarget}
          />
        )
      })}

      {rangeFilterFields.map((field) => (
        <div key={field as string} className="space-y-2">
          <span className="text-sm font-semibold text-foreground">{humanizeFieldName(String(field))} range</span>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="From"
              value={rangeFilters[field]?.from || ""}
              onChange={(event) => setRangeFilter(field, "from", event.target.value)}
              className="h-11 rounded-xl border-border bg-card text-sm text-foreground shadow-none"
            />
            <Input
              type="number"
              placeholder="To"
              value={rangeFilters[field]?.to || ""}
              onChange={(event) => setRangeFilter(field, "to", event.target.value)}
              className="h-11 rounded-xl border-border bg-card text-sm text-foreground shadow-none"
            />
          </div>
        </div>
      ))}

      {sortableFields.length > 0 ? (
        <ReactSelectField
          inputId={`${tableStateKey}-sort`}
          label="Sort by"
          options={sortOptions}
          value={sortOptions.find((option) => option.value === (sortConfig ? `${String(sortConfig.key)}:${sortConfig.direction}` : "")) || null}
          onChange={(option: SelectOption | readonly SelectOption[] | null) => {
            const nextOption = getSingleSelectOption(option)
            if (!nextOption) {
              const nextState = { ...tableViewState, sortConfig: null }
              setTableViewState(nextState)
              updateUrlState({ [sortKey]: null, [directionKey]: null, [pageKey]: null })
              return
            }
            const [key, direction] = String(nextOption.value).split(":")
            const nextDirection: "ascending" | "descending" = direction === "descending" ? "descending" : "ascending"
            const nextState = {
              ...tableViewState,
              sortConfig: { key: key as keyof T, direction: nextDirection },
            }
            setTableViewState(nextState)
            updateUrlState({ [sortKey]: key, [directionKey]: direction, [pageKey]: null })
          }}
          placeholder="Default order"
          isClearable
          menuPortalTarget={selectMenuPortalTarget}
        />
      ) : null}
    </div>
  )

  const renderTableActions = () => {
    if (!hasTableActions) return null

    return (
      <div className="flex flex-wrap items-center gap-2">
        {(qrScannableField || barcodeScannableField) ? (
          <div className="flex flex-wrap items-center gap-2 rounded-full border border-border bg-card px-2 py-1">
            <Input
              value={scanValue}
              onChange={(event) => setScanValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return
                event.preventDefault()
                submitScanValue(barcodeScannableField ? "barcode" : "qr")
              }}
              placeholder="Scan or paste code"
              className="h-9 w-44 rounded-full border-0 bg-transparent px-3 text-sm shadow-none focus-visible:ring-0"
            />
            {qrScannableField ? (
              <Button type="button" size="sm" className="rounded-full px-3" onClick={() => submitScanValue("qr")}>
                <QrCode size={14} /> QR
              </Button>
            ) : null}
            {barcodeScannableField ? (
              <Button type="button" size="sm" variant="secondary" className="rounded-full px-3" onClick={() => submitScanValue("barcode")}>
                <Barcode size={14} /> Barcode
              </Button>
            ) : null}
          </div>
        ) : null}
        {hasGeneralButtons && showSelectAll !== false ? (
          <Button type="button" variant="ghost" size="sm" className="rounded-full px-3" onClick={() => handleSelectAll(!allVisibleSelected)}>
            {allVisibleSelected ? "Deselect all" : "Select all"}
          </Button>
        ) : null}
        {hasGeneralButtons && selectedIds.length > 0 ? (
          <Button type="button" variant="ghost" size="sm" className="rounded-full px-3" onClick={() => setSelectedIds([])}>
            Clear selection
          </Button>
        ) : null}
        {renderGeneralButtons()}
      </div>
    )
  }

  return (
    <div className="data-table overflow-hidden rounded-[28px] border border-border bg-card text-card-foreground shadow-[0_18px_50px_-34px_rgba(15,23,42,0.28)]">
      {(title || onClose) && (
        <div className="flex items-center justify-between border-b border-border bg-card/90 px-5 py-4 backdrop-blur">
          {title && <h1 className="text-lg font-semibold text-foreground md:text-xl">{title}</h1>}
          {onClose && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-full px-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              <span className="hidden sm:inline">New {title}</span>
            </Button>
          )}
        </div>
      )}
      {hasTableControls || hasTableActions ? (
        <div className="border-b border-border bg-muted/70 p-4">
          {hasTableControls ? (
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3">
                {searchableFields.length > 0 ? (
                  <label className="min-w-[16rem] flex-1 space-y-2 sm:max-w-md">
                    <span className="text-sm font-semibold text-foreground">Search {title ? title.toLowerCase() : "records"}</span>
                    <span className="relative block">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder={`Search ${title ? title.toLowerCase() : "records"}`}
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="h-11 rounded-xl border-border bg-card pl-11 pr-10 text-sm text-foreground shadow-none"
                      />
                      {searchTerm ? (
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          onClick={() => setSearchTerm("")}
                          aria-label="Clear search"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : null}
                    </span>
                  </label>
                ) : null}

                {hasFilterControls ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-11 rounded-full border-border bg-card px-4 shadow-sm"
                    aria-expanded={usesFilterDrawer ? isFilterDrawerOpen : isFilterModalOpen}
                    aria-controls={usesFilterDrawer ? `${tableStateKey}-filters-drawer` : `${tableStateKey}-filters-modal`}
                    onClick={() => {
                      if (usesFilterDrawer) {
                        setIsFilterDrawerOpen(true)
                        return
                      }
                      setIsFilterModalOpen(true)
                    }}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Open filters
                    {activeFilterControlCount > 0 ? (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                        {activeFilterControlCount} active
                      </span>
                    ) : null}
                  </Button>
                ) : null}
              </div>

              {activeTableControlCount > 0 ? (
                <Button type="button" variant="ghost" className="h-11 rounded-full px-4" onClick={clearAllFilters}>
                  Clear controls
                </Button>
              ) : null}
            </div>
          ) : null}

          {hasTableActions ? (
            <div className={cn(hasTableControls && "mt-4 border-t border-border pt-4")}>
              {renderTableActions()}
            </div>
          ) : null}
        </div>
      ) : null}

      {hasFilterControls && !usesFilterDrawer && isFilterModalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-foreground/35 backdrop-blur-[2px]"
            onClick={() => setIsFilterModalOpen(false)}
            aria-label="Close filters"
          />
          <section
            id={`${tableStateKey}-filters-modal`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${tableStateKey}-filters-modal-title`}
            className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-400/30 bg-[rgba(7,16,31,0.96)] text-slate-100 shadow-[0_28px_90px_rgba(0,0,0,0.58)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-400/30 bg-[rgba(7,16,31,0.98)] p-5">
              <div>
                <h2 id={`${tableStateKey}-filters-modal-title`} className="text-lg font-semibold text-foreground">Filters</h2>
                <p className="mt-1 text-sm text-muted-foreground">Changes update the table immediately.</p>
              </div>
              <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={() => setIsFilterModalOpen(false)} aria-label="Close filters">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {renderFilterControls("grid gap-5 sm:grid-cols-2")}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-400/30 bg-[rgba(7,16,31,0.98)] p-5">
              {activeFilterControlCount > 0 ? (
                <Button type="button" variant="ghost" className="rounded-full px-4" onClick={clearAllFilters}>
                  Clear controls
                </Button>
              ) : <span />}
              <Button type="button" className="rounded-full px-5" onClick={() => setIsFilterModalOpen(false)}>
                Done
              </Button>
            </div>
          </section>
        </div>
      ) : null}

      {hasFilterControls && usesFilterDrawer && isFilterDrawerOpen ? (
        <div className="fixed inset-0 z-[100] flex justify-end" role="presentation">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-foreground/25 backdrop-blur-[1px]"
            onClick={() => setIsFilterDrawerOpen(false)}
            aria-label="Close filters"
          />
          <aside
            id={`${tableStateKey}-filters-drawer`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${tableStateKey}-filters-title`}
            className="relative flex h-full w-full max-w-xl flex-col border-l border-slate-400/30 bg-[rgba(7,16,31,0.90)] text-slate-100 shadow-[-24px_0_60px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-400/30 bg-[rgba(7,16,31,0.95)] p-5">
              <div>
                <h2 id={`${tableStateKey}-filters-title`} className="text-lg font-semibold text-foreground">Filters</h2>
                <p className="mt-1 text-sm text-muted-foreground">Changes update the table immediately.</p>
              </div>
              <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={() => setIsFilterDrawerOpen(false)} aria-label="Close filters">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {renderFilterControls("grid gap-5 sm:grid-cols-2")}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-400/30 bg-[rgba(7,16,31,0.95)] p-5">
              {activeFilterControlCount > 0 ? (
                <Button type="button" variant="ghost" className="rounded-full px-4" onClick={clearAllFilters}>
                  Clear controls
                </Button>
              ) : <span />}
              <Button type="button" className="rounded-full px-5" onClick={() => setIsFilterDrawerOpen(false)}>
                Done
              </Button>
            </div>
          </aside>
        </div>
      ) : null}

      {/* Render secondary button outside the table */}
      {secondaryButton && !secondaryButton.hidden && (
        <div className="border-b border-border bg-muted/70 p-4">
          <button
            onClick={handleSecondaryClick}
            disabled={secondaryButton.disabled || false}
            className={`${getSecondaryButtonClasses()} ${secondaryButton.className || ""}`}
            title={secondaryButton.tooltip}
          >
            {secondaryButton.icon && (
              <secondaryButton.icon 
                size={14} 
                className={secondaryButton.label ? "mr-1" : ""} 
              />
            )}
            {secondaryButton.label}
          </button>
        </div>
      )}

      <div className="overflow-x-auto overflow-y-visible">
        <table className="min-w-full table-auto border-separate border-spacing-0">
          <thead className="sticky top-0 bg-muted/90 backdrop-blur">
            <tr>
              {hasGeneralButtons && (
                <th className="w-12 whitespace-nowrap px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-border text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              {showRowNumbers && (
                <th className="w-16 whitespace-nowrap px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {rowNumberHeader}
                </th>
              )}
              {columns.map((column, idx) => (
                <th
                  key={idx}
                  className={`px-3 whitespace-nowrap py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground ${
                    column.headerClassName || ""
                  }`}
                  onClick={() => sortableFields.includes(column.accessor as keyof T) && requestSort(column.accessor as keyof T)}
                >
                  {column.header}
                  {sortableFields.includes(column.accessor as keyof T) && (
                    <span>
                      {sortConfig?.key === column.accessor && (sortConfig?.direction === "ascending" ? " ↑" : " ↓")}
                    </span>
                  )}
                  {column.info && <FieldInfo info={column.info} displayBelow={true} />}
                </th>
              ))}
              {hasActions && (
                <th
                  className={`px-3 whitespace-nowrap py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground ${actionsColumnWidth}`}
                >
                  {actionsColumnHeader}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-card">
            {filteredAndSortedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row)}
                className={`data-table-row ${onRowClick ? "cursor-pointer" : ""} relative transition-colors`}
              >
                {hasGeneralButtons && (
                  <td className="w-12 whitespace-nowrap px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(getRowId!(row))}
                      onChange={(e) => {
                        e.stopPropagation()
                        handleRowSelect(getRowId!(row), e.target.checked)
                      }}
                      className="rounded border-border text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                )}
                {showRowNumbers && (
                  <td className="w-16 whitespace-nowrap px-4 py-4 text-sm font-medium text-muted-foreground">{startNumberFrom + rowIndex}</td>
                )}
                {columns.map((column, colIndex) => {
                  const value =
                    typeof column.accessor === "function" ? column.accessor(row) : row[column.accessor as keyof T]
                  return (
                    <td key={colIndex} className={`relative whitespace-nowrap px-3 py-3 text-sm text-foreground ${column.className || ""}`}>
                      {column.render ? column.render(value, row) : (value as React.ReactNode)}
                    </td>
                  )
                })}
                {hasActions && (
                  <td className={`px-3 py-4 text-sm whitespace-nowrap ${actionsColumnWidth}`}>{renderActionButtons(row)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && Boolean(error) && filteredAndSortedData.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
            <p className="text-base font-semibold text-destructive">{errorMessage}</p>
            <p className="max-w-md text-sm text-muted-foreground">Try again. If this continues, check your connection or contact support.</p>
            {onRetry ? (
              <Button type="button" variant="outline" className="rounded-full px-4" onClick={() => void onRetry()}>
                Retry
              </Button>
            ) : null}
          </div>
        )}
        {!isLoading && !Boolean(error) && filteredAndSortedData.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
            <p className="text-base font-semibold text-foreground">
              {hasActiveSearchOrFilters ? "No records match the current view." : "No records found."}
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              {hasActiveSearchOrFilters
                ? "Adjust the search or filters to widen the result set."
                : "This table will populate once records are available."}
            </p>
            {hasActiveSearchOrFilters ? (
              <Button type="button" variant="outline" className="rounded-full px-4" onClick={clearAllFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
        )}
        {isLoading && filteredAndSortedData.length === 0 && (
          <div className="flex items-center justify-center py-10 text-center text-muted-foreground">
            <LoadingAnimation text="Loading..." ringColor="#3b82f6" />
          </div>
        )}
      </div>
    </div>
  )
}

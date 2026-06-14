"use client"
import React from "react"
import { useState, useEffect, useMemo } from "react"
import { type LucideIcon, QrCode, Barcode, Filter, Search, SlidersHorizontal, X } from 'lucide-react'
import { FieldInfo } from "../fileFieldInfor"
import LoadingAnimation from "../LoadingAnimation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
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
}

const humanizeFieldName = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

export function DataTable<T>({
  columns,
  data,
  isLoading,
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
  title,
  onClose,
}: DataTableProps<T>) {
  const filterDropdownRef = React.useRef<HTMLDivElement>(null)
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  useEffect(() => {
    if (!filterDropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setFilterDropdownOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setFilterDropdownOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [filterDropdownOpen])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<Record<keyof T, string>>({} as Record<keyof T, string>)
  const [rangeFilters, setRangeFilters] = useState<Record<keyof T, {from: string, to: string}>>({} as Record<keyof T, {from: string, to: string}>)
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: "ascending" | "descending" } | null>(null)

  const filterOptions = useMemo(() => {
    const options: Record<keyof T, string[]> = {} as Record<keyof T, string[]>
    filterableFields.forEach((field) => {
      const uniqueValues = [...new Set(data.map((row) => row[field] as string))]
      options[field] = uniqueValues
    })
    return options
  }, [data, filterableFields])

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

  const filteredAndSortedData = sortedData.filter((row) => {
    if (searchTerm === "") return true
    return searchableFields.some((field) => {
      const value = row[field]
      if (typeof value === "string") {
        return value.toLowerCase().includes(searchTerm.toLowerCase())
      }
      return false
    })
  }).filter((row) => {
    // Handle exact filters
    const exactMatch = Object.entries(filters).every(([field, value]) => {
      if (value === "") return true
      return row[field as keyof T] === value
    })
    // Handle range filters
    const rangeMatch = rangeFilterFields.every((field) => {
      const filter = rangeFilters[field]
      if (!filter || (filter.from === "" && filter.to === "")) return true
      const rowValue = row[field]
      const numValue = parseFloat(rowValue as any)
      if (isNaN(numValue)) return true // ignore non-numeric
      const from = filter.from !== "" ? parseFloat(filter.from) : undefined
      const to = filter.to !== "" ? parseFloat(filter.to) : undefined
      if (from !== undefined && numValue < from) return false
      if (to !== undefined && numValue > to) return false
      return true
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
    setSortConfig({ key, direction })
  }

  const clearAllFilters = () => {
    setSearchTerm("")
    setFilters({} as Record<keyof T, string>)
    setRangeFilters({} as Record<keyof T, { from: string; to: string }>)
    setFilterDropdownOpen(false)
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
      "inline-flex items-center px-2 py-1 text-xs font-medium rounded border focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    switch (variant) {
      case "primary":
        return `${baseClasses} text-white bg-blue-600 border-blue-600 hover:bg-blue-700 focus:ring-blue-500`
      case "danger":
        return `${baseClasses} text-white bg-red-600 border-red-600 hover:bg-red-700 focus:ring-red-500`
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

  // Mock scan functions - replace with actual scanner integrations
  const startQrCodeScan = () => {
    // In a real application, this would open a QR code scanner
    // For demonstration, we'll simulate a scan result
    const mockQrData = prompt("Simulate QR Code Scan (enter value):");
    if (mockQrData) {
      handleScan(mockQrData, 'qr');
    }
  };

  const startBarcodeScan = () => {
    // In a real application, this would open a barcode scanner
    // For demonstration, we'll simulate a scan result
    const mockBarcodeData = prompt("Simulate Barcode Scan (enter value):");
    if (mockBarcodeData) {
      handleScan(mockBarcodeData, 'barcode');
    }
  };

  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-card text-card-foreground shadow-[0_18px_50px_-34px_rgba(15,23,42,0.28)]">
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
      <div className="border-b border-border bg-muted/70 p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <div className="relative min-w-0 flex-1 md:max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search records"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 rounded-full border-border bg-card pl-11 pr-10 text-sm text-foreground shadow-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="relative" ref={filterDropdownRef}>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-full border-border bg-card px-4"
                onClick={() => setFilterDropdownOpen((open) => !open)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 ? (
                  <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                    {activeFiltersCount}
                  </span>
                ) : null}
              </Button>

              {filterDropdownOpen && (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(92vw,320px)] rounded-[24px] border border-border bg-card p-4 text-card-foreground shadow-[0_22px_50px_-24px_rgba(15,23,42,0.35)]">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Filter workspace</p>
                      <p className="mt-1 text-sm text-muted-foreground">Narrow the current list without leaving the table.</p>
                    </div>
                    {hasActiveSearchOrFilters ? (
                      <Button type="button" variant="ghost" size="sm" className="rounded-full px-3" onClick={clearAllFilters}>
                        Reset
                      </Button>
                    ) : null}
                  </div>

                  <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                    {filterableFields.map((field) => (
                      <div key={field as string}>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          {humanizeFieldName(String(field))}
                        </label>
                        <select
                          value={filters[field] || ""}
                          onChange={(e) => setFilters({ ...filters, [field]: e.target.value })}
                          className="h-11 w-full rounded-2xl border border-border bg-card px-3 text-sm text-foreground outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
                        >
                          <option value="">All {humanizeFieldName(String(field))}</option>
                          {filterOptions[field]?.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}

                    {rangeFilterFields.map((field) => (
                      <div key={field as string}>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          {humanizeFieldName(String(field))} Range
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            placeholder="From"
                            value={rangeFilters[field]?.from || ""}
                            onChange={(e) => setRangeFilters({
                              ...rangeFilters,
                              [field]: {
                                ...rangeFilters[field],
                                from: e.target.value,
                              },
                            })}
                            className="rounded-2xl border-border bg-card text-sm shadow-none"
                          />
                          <Input
                            type="number"
                            placeholder="To"
                            value={rangeFilters[field]?.to || ""}
                            onChange={(e) => setRangeFilters({
                              ...rangeFilters,
                              [field]: {
                                ...rangeFilters[field],
                                to: e.target.value,
                              },
                            })}
                            className="rounded-2xl border-border bg-card text-sm shadow-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button type="button" className="rounded-full px-4" onClick={() => setFilterDropdownOpen(false)}>
                      Apply filters
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {hasActiveSearchOrFilters ? (
              <Button type="button" variant="ghost" className="h-11 rounded-full px-4 md:self-stretch" onClick={clearAllFilters}>
                Clear search & filters
              </Button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {qrScannableField && (
              <Button type="button" size="sm" className="rounded-full px-4" onClick={startQrCodeScan} title="Scan QR Code">
                <QrCode size={14} /> QR Scan
              </Button>
            )}
            {barcodeScannableField && (
              <Button type="button" size="sm" variant="secondary" className="rounded-full px-4" onClick={startBarcodeScan} title="Scan Barcode">
                <Barcode size={14} /> Barcode Scan
              </Button>
            )}
            {hasGeneralButtons && showSelectAll !== false && (
              <>
                <Button type="button" variant="ghost" size="sm" className="rounded-full px-3" onClick={() => handleSelectAll(!allVisibleSelected)}>
                  {allVisibleSelected ? "Deselect all" : "Select all"}
                </Button>
                {selectedIds.length > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full px-3"
                    onClick={() => {
                      setSelectedIds([])
                    }}
                  >
                    Clear selection
                  </Button>
                ) : null}
              </>
            )}
            {renderGeneralButtons()}
          </div>
        </div>
      </div>

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
        <table className="min-w-full table-auto divide-y divide-border">
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
                      {sortConfig?.key === column.accessor && (sortConfig?.direction === "ascending" ? " 🔼" : " 🔽")}
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
          <tbody className="divide-y divide-border bg-card">
            {filteredAndSortedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row)}
                className={`${onRowClick ? "cursor-pointer hover:bg-muted/60" : ""} relative transition-colors`}
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
        {!isLoading && filteredAndSortedData.length === 0 && (
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

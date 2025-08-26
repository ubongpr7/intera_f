"use client"
import React from "react"
import { useState, useEffect, useMemo } from "react"
import { type LucideIcon, QrCode, Barcode, Filter } from 'lucide-react'
import { FieldInfo } from "../fileFieldInfor"
import LoadingAnimation from "../LoadingAnimation"

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
  const [selectAll, setSelectAll] = useState(false)
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
    let sortableData = [...data]
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
      let rowValue = row[field]
      let numValue = parseFloat(rowValue as any)
      if (isNaN(numValue)) return true // ignore non-numeric
      let from = filter.from !== "" ? parseFloat(filter.from) : undefined
      let to = filter.to !== "" ? parseFloat(filter.to) : undefined
      if (from !== undefined && numValue < from) return false
      if (to !== undefined && numValue > to) return false
      return true
    })
    return exactMatch && rangeMatch
  })

  const requestSort = (key: keyof T) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Handle individual row selection
  const handleRowSelect = (rowId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedIds((prev) => [...prev, rowId])
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== rowId))
      setSelectAll(false)
    }
  }

  // Handle select all functionality
  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      const allIds = filteredAndSortedData.map((row) => getRowId?.(row) || "").filter(Boolean)
      setSelectedIds(allIds)
      setSelectAll(true)
    } else {
      setSelectedIds([])
      setSelectAll(false)
    }
  }

  // Update select all state when individual selections change
  useEffect(() => {
    if (filteredAndSortedData.length > 0 && getRowId) {
      const allIds = filteredAndSortedData.map((row) => getRowId(row)).filter(Boolean)
      setSelectAll(allIds.length > 0 && allIds.every((id) => selectedIds.includes(id)))
    }
  }, [selectedIds, filteredAndSortedData, getRowId])

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
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      {(title || onClose) && (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
          {title && <h1 className="text-lg md:text-xl font-semibold">{title}</h1>}
          {onClose && (
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded border border-gray-300 bg-white hover:bg-gray-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              <span className="hidden sm:inline">New {title}</span>
            </button>
          )}

          
        </div>
      )}
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="relative w-56">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm w-full pr-8"
          />
          {searchTerm && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
        <div className="relative">
          <button
            className="border border-gray-300 flex rounded-md px-3 py-1 text-sm bg-white"
            onClick={() => setFilterDropdownOpen((open) => !open)}
          >
            Filter <Filter size={14} className="ml-1" />
          </button>
          {filterDropdownOpen && (
            <div ref={filterDropdownRef} className="absolute z-50 bg-white border border-gray-200 rounded shadow-lg p-4 min-w-[250px] right-0 -top-20 max-h-50 overflow-y-auto">
              <div className="space-y-2">
                {filterableFields.map((field) => (
                  <div key={field as string}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{String(field)}</label>
                    <select
                      value={filters[field] || ""}
                      onChange={(e) => setFilters({ ...filters, [field]: e.target.value })}
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm w-full"
                    >
                      <option value="">All {String(field)}</option>
                      {filterOptions[field]?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                {rangeFilterFields.map((field) => (
                  <div key={field as string} className="flex flex-col">
                    <label className="block text-xs font-medium text-gray-700 mb-1">{String(field)} (Range)</label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="From"
                        value={rangeFilters[field]?.from || ""}
                        onChange={(e) => setRangeFilters({
                          ...rangeFilters,
                          [field]: {
                            ...rangeFilters[field],
                            from: e.target.value
                          }
                        })}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm w-1/2"
                      />
                      <input
                        type="number"
                        placeholder="To"
                        value={rangeFilters[field]?.to || ""}
                        onChange={(e) => setRangeFilters({
                          ...rangeFilters,
                          [field]: {
                            ...rangeFilters[field],
                            to: e.target.value
                          }
                        })}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm w-1/2"
                      />
                    </div>
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <button
                    className="px-3 py-1 text-xs font-medium rounded bg-blue-500 text-white hover:bg-blue-600"
                    onClick={() => setFilterDropdownOpen(false)}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {qrScannableField && (
            <button
              onClick={startQrCodeScan}
              className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600"
              title="Scan QR Code"
            >
              <QrCode size={14} className="mr-1" /> QR Scan
            </button>
          )}
          {barcodeScannableField && (
            <button
              onClick={startBarcodeScan}
              className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md bg-green-500 text-white hover:bg-green-600"
              title="Scan Barcode"
            >
              <Barcode size={14} className="mr-1" /> Barcode Scan
            </button>
          )}
        </div>
        {hasGeneralButtons && (
          <div className="flex items-center space-x-4">
            {showSelectAll !== false && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleSelectAll(!selectAll)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {selectAll ? "Deselect All" : "Select All"}
                </button>
                {selectedIds.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedIds([])
                      setSelectAll(false)
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {renderGeneralButtons()}
      </div>

      {/* Render secondary button outside the table */}
      {secondaryButton && !secondaryButton.hidden && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
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

      {/* Table container with proper overflow handling */}
      <div className="overflow-x-auto overflow-y-visible">
        <table className="min-w-full divide-y divide-gray-200 table-auto">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {/* Selection header */}
              {hasGeneralButtons && (
                <th className="px-2 py-1 whitespace-nowrap text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              {/* Row number header */}
              {showRowNumbers && (
                <th className="px-2 py-1 whitespace-nowrap text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  {rowNumberHeader}
                </th>
              )}
              {columns.map((column, idx) => (
                <th
                  key={idx}
                  className={`px-2 whitespace-nowrap py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
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
                  className={`px-3 whitespace-nowrap py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${actionsColumnWidth}`}
                >
                  {actionsColumnHeader}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row)}
                className={`${onRowClick ? "cursor-pointer hover:bg-gray-50" : ""} transition-colors relative`}
              >
                {/* Selection cell */}
                {hasGeneralButtons && (
                  <td className="px-4 py-4 w-12 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(getRowId!(row))}
                      onChange={(e) => {
                        e.stopPropagation()
                        handleRowSelect(getRowId!(row), e.target.checked)
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                )}
                {/* Row number cell */}
                {showRowNumbers && (
                  <td className="px-4 py-4 text-sm font-medium text-gray-500 w-16 whitespace-nowrap">{startNumberFrom + rowIndex}</td>
                )}
                {columns.map((column, colIndex) => {
                  const value =
                    typeof column.accessor === "function" ? column.accessor(row) : row[column.accessor as keyof T]
                  return (
                    <td key={colIndex} className={`px-3 py-1 text-sm text-gray-900 relativewhitespace-nowrap ${column.className || ""}`}>
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
        {!isLoading && filteredAndSortedData.length === 0 && <div className="text-center py-8 text-gray-500">No records found</div>}
        {isLoading && filteredAndSortedData.length === 0 && (
          <div className="text-center flex items-center justify-center py-8 text-gray-500">
            <LoadingAnimation text="Loading..." ringColor="#3b82f6" />
          </div>
        )}
      </div>
    </div>
  )
}
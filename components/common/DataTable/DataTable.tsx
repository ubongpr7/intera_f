"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
  icon?: React.ReactNode
  onClick: (row: T, event: React.MouseEvent) => void
  className?: string
  variant?: "primary" | "secondary" | "danger" | "success" | "warning"
  disabled?: (row: T) => boolean
  hidden?: (row: T) => boolean
  tooltip?: string
}

export interface SecondaryButton<T> {
  label: string
  icon?: React.ReactNode
  onClick: (event: React.MouseEvent) => void // Changed to not depend on row
  className?: string
  disabled?: boolean
  hidden?: boolean
  tooltip?: string
}

export interface GeneralButton<T> {
  label: string
  icon?: React.ReactNode
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
  showRowNumbers?: boolean // New prop to control row numbering
  rowNumberHeader?: string // Customizable header for row numbers
  startNumberFrom?: number // Allow starting from a different number (useful for pagination)
  generalButtons?: GeneralButton<T>[] // New prop for bulk action buttons
  getRowId?: (row: T) => string // Function to extract ID from row
  showSelectAll?: boolean // Whether to show select all functionality
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
  showRowNumbers = true, // Default to true to show row numbers
  rowNumberHeader = "#", // Default header for row numbers
  startNumberFrom = 1, // Default starting number
  generalButtons,
  getRowId,
  showSelectAll,
}: DataTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

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
      const allIds = data.map((row) => getRowId?.(row) || "").filter(Boolean)
      setSelectedIds(allIds)
      setSelectAll(true)
    } else {
      setSelectedIds([])
      setSelectAll(false)
    }
  }

  // Update select all state when individual selections change
  useEffect(() => {
    if (data.length > 0 && getRowId) {
      const allIds = data.map((row) => getRowId(row)).filter(Boolean)
      setSelectAll(allIds.length > 0 && allIds.every((id) => selectedIds.includes(id)))
    }
  }, [selectedIds, data, getRowId])

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
    event.stopPropagation() // Prevent row click when action is clicked
    action.onClick(row, event)
  }

  const handleSecondaryClick = (event: React.MouseEvent) => {
    event.stopPropagation() // Prevent any unintended row click propagation
    secondaryButton?.onClick(event)
  }

  const renderActionButtons = (row: T) => {
    const visibleActions = actionButtons.filter((action) => !action.hidden?.(row))
    if (visibleActions.length === 0) return null

    return (
      <div className="flex items-center space-x-1">
        {visibleActions.map((action, index) => {
          const isDisabled = action.disabled?.(row) || false
          return (
            <button
              key={index}
              onClick={(e) => handleActionClick(action, row, e)}
              disabled={isDisabled}
              className={`${getButtonVariantClasses(action.variant)} ${action.className || ""}`}
              title={action.tooltip}
            >
              {action.icon && <span className={action.label ? "mr-1" : ""}>{action.icon}</span>}
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
          const selectedRows = data.filter((row) => selectedIds.includes(getRowId!(row)))

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
              {button.icon && <span className={button.label ? "mr-1" : ""}>{button.icon}</span>}
              {button.label}
            </button>
          )
        })}
      </div>
    )
  }

  const hasActions = actionButtons.length > 0 && showActionsColumn

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      {/* General buttons section */}
      {hasGeneralButtons && (
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
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
          {renderGeneralButtons()}
        </div>
      )}
      {/* Render secondary button outside the table, e.g., above it */}
      {secondaryButton && !secondaryButton.hidden && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <button
            onClick={handleSecondaryClick}
            disabled={secondaryButton.disabled || false}
            className={`${getSecondaryButtonClasses()} ${secondaryButton.className || ""}`}
            title={secondaryButton.tooltip}
          >
            {secondaryButton.icon && (
              <span className={secondaryButton.label ? "mr-1" : ""}>{secondaryButton.icon}</span>
            )}
            {secondaryButton.label}
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {/* Selection header */}
              {hasGeneralButtons && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  {rowNumberHeader}
                </th>
              )}

              {columns.map((column, idx) => (
                <th
                  key={idx}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.headerClassName || ""
                  }`}
                >
                  {column.header}
                  {column.info && <FieldInfo info={column.info} displayBelow={true} />}
                </th>
              ))}

              {hasActions && (
                <th
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${actionsColumnWidth}`}
                >
                  {actionsColumnHeader}
                </th>
              )}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row)}
                className={`${onRowClick ? "cursor-pointer hover:bg-gray-50" : ""} transition-colors`}
              >
                {/* Selection cell */}
                {hasGeneralButtons && (
                  <td className="px-4 py-4 whitespace-nowrap w-12">
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
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-500 w-16">
                    {startNumberFrom + rowIndex}
                  </td>
                )}

                {columns.map((column, colIndex) => {
                  const value =
                    typeof column.accessor === "function" ? column.accessor(row) : row[column.accessor as keyof T]
                  return (
                    <td
                      key={colIndex}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${column.className || ""}`}
                    >
                      {column.render ? column.render(value, row) : (value as React.ReactNode)}
                    </td>
                  )
                })}

                {hasActions && (
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${actionsColumnWidth}`}>
                    {renderActionButtons(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {!isLoading && data.length === 0 && <div className="text-center py-8 text-gray-500">No records found</div>}

        {isLoading && data.length === 0 && (
          <div className="text-center flex items-center justify-center py-8 text-gray-500">
            <LoadingAnimation text="Loading..." ringColor="#3b82f6" />
          </div>
        )}
      </div>
    </div>
  )
}

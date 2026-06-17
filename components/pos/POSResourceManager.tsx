"use client"

import { useState } from "react"
import { DataTable, type Column } from "@/components/common/DataTable/DataTable"
import CustomCreateCard from "@/components/common/createCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { extractErrorMessage } from "@/lib/utils"
import { Plus } from "lucide-react"
import { toast } from "react-toastify"
import { POSConfiguration } from "@/redux/features/product/productTypes"
import type { ActionButton } from "@/components/common/DataTable/DataTable"

type SelectOptions<T extends { id: string }> = Partial<Record<keyof T, Array<{ value: string; text: string }>>>

type POSResourceManagerProps<T extends { id: string }> = {
  title: string
  description: string
  data?: T[]
  isLoading?: boolean
  columns: Column<T>[]
  interfaceKeys: (keyof T)[]
  onCreate: (data: Partial<T>) => Promise<unknown>
  onUpdate: (id: string, data: Partial<T>) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
  createLabel?: string
  itemTitle?: string
  selectOptions?: SelectOptions<T>
  optionalFields?: (keyof T)[]
  hiddenFields?: Partial<Record<keyof T, unknown>>
  notEditableFields?: (keyof T)[]
  readOnlyFields?: (keyof T)[]
  emptyState?: string
  confirmDeleteMessage?: (row: T) => string
  actionButtons?: ActionButton<T>[]
}

export default function POSResourceManager<T extends { id: string }>({
  title,
  description,
  data = [],
  isLoading,
  columns,
  interfaceKeys,
  onCreate,
  onUpdate,
  onDelete,
  createLabel = "Create record",
  itemTitle = "Record",
  selectOptions,
  optionalFields,
  hiddenFields,
  notEditableFields,
  readOnlyFields,
  emptyState = "No records have been created yet.",
  confirmDeleteMessage,
  actionButtons = [],
}: POSResourceManagerProps<T>) {
  const [isEditorOpen, setEditorOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<T | null>(null)
  const [isSubmitting, setSubmitting] = useState(false)
  const defaultValues = {
    tax_inclusive: false,
    allow_negative_stock: false,
    require_customer: false,
    auto_print_receipt: false,
    allow_split_payment: false,
    is_active: true,
  } as Partial<POSConfiguration>


  const handleCreate = async (formData: Partial<T>) => {
    setSubmitting(true)
    try {
      await onCreate(formData)
      toast.success(`${itemTitle} created successfully`)
      setEditorOpen(false)
    } catch (error) {
      toast.error(extractErrorMessage(error, interfaceKeys.map(String)))
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (formData: Partial<T>) => {
    if (!editingRow) {
      return
    }

    setSubmitting(true)
    try {
      await onUpdate(editingRow.id, formData)
      toast.success(`${itemTitle} updated successfully`)
      setEditingRow(null)
      setEditorOpen(false)
    } catch (error) {
      toast.error(extractErrorMessage(error, interfaceKeys.map(String)))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (row: T) => {
    const message = confirmDeleteMessage?.(row) ?? `Delete this ${itemTitle.toLowerCase()}?`
    if (!window.confirm(message)) {
      return
    }

    setSubmitting(true)
    try {
      await onDelete(row.id)
      toast.success(`${itemTitle} deleted successfully`)
    } catch (error) {
      toast.error(extractErrorMessage(error, interfaceKeys.map(String)))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-100 p-5 text-left text-inherit">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="mt-2 text-sm leading-6 text-gray-600">{description}</CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditingRow(null)
              setEditorOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            {createLabel}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {data.length === 0 && !isLoading ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">{emptyState}</div>
        ) : (
          <DataTable
            columns={columns}
            data={data}
            isLoading={isLoading}
            actionButtons={[
              {
                label: "Edit",
                onClick: (row) => {
                  setEditingRow(row)
                  setEditorOpen(true)
                },
              },
              {
                label: "Delete",
                variant: "danger",
                onClick: (row) => void handleDelete(row),
              },
              ...actionButtons,
            ]}
            showActionsColumn
          />
        )}
      </CardContent>

      {isEditorOpen ? (
        <CustomCreateCard<T>
          defaultValues={(editingRow ?? defaultValues) as Partial<T>}
          onClose={() => {
            setEditorOpen(false)
            setEditingRow(null)
          }}
          onSubmit={editingRow ? handleUpdate : handleCreate}
          isLoading={isSubmitting}
          interfaceKeys={interfaceKeys}
          itemTitle={editingRow ? `Update ${itemTitle}` : `Create ${itemTitle}`}
          selectOptions={selectOptions}
          optionalFields={optionalFields}
          hiddenFields={hiddenFields}
          notEditableFields={notEditableFields}
          readOnlyFields={readOnlyFields}
        />
      ) : null}
    </Card>
  )
}

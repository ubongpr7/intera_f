"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { extractErrorMessage } from "@/lib/utils"
import type { POSTable } from "@/redux/features/pos/posTypes"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "react-toastify"

interface POSTableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tables: POSTable[]
  onAssignTable: (tableId: string | null) => Promise<void>
  accessNotice?: {
    requiredPermission: string
    message: string
  }
}

export default function POSTableDialog({
  open,
  onOpenChange,
  tables,
  onAssignTable,
  accessNotice,
}: POSTableDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredTables = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) {
      return tables
    }

    return tables.filter((table) =>
      [table.number, table.name].some((value) => value?.toLowerCase().includes(query)),
    )
  }, [tables, searchTerm])

  const closeDialog = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setSearchTerm("")
    }
  }

  const handleAssign = async (tableId: string | null) => {
    try {
      await onAssignTable(tableId)
      closeDialog(false)
    } catch (error) {
      toast.error(extractErrorMessage(error, ["detail", "table"]) || "Unable to update table assignment.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-w-lg border-gray-200 bg-white p-0 text-gray-900">
        <DialogHeader className="border-b border-gray-100 px-6 py-5">
          <DialogTitle>Table assignment</DialogTitle>
          <DialogDescription>
            Attach the draft to a service table or clear the table for counter, takeout, or delivery flow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          {accessNotice ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-red-600">Permission required</div>
              <div className="mt-2 font-mono text-sm font-semibold text-red-900">{accessNotice.requiredPermission}</div>
              <div className="mt-2 text-sm text-red-800">{accessNotice.message}</div>
            </div>
          ) : null}

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
              placeholder="Search table number or name"
              disabled={!!accessNotice}
            />
          </div>

          <ScrollArea className="h-[320px] rounded-xl border border-gray-200">
            <div className="grid gap-3 p-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => void handleAssign(null)}
                disabled={!!accessNotice}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <p className="text-sm font-semibold text-gray-900">No table</p>
                <p className="mt-1 text-xs text-gray-500">Use counter, takeout, or delivery flow.</p>
              </button>

              {filteredTables.map((table) => (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => void handleAssign(table.sync_identifier || table.id)}
                  disabled={!table.is_active || !!accessNotice}
                  className="rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <p className="text-sm font-semibold text-gray-900">{table.name || `Table ${table.number}`}</p>
                  <p className="mt-1 text-xs text-gray-500">Number {table.number}</p>
                  <p className="mt-1 text-xs text-gray-500">Capacity {table.capacity}</p>
                  {!table.is_active ? <p className="mt-2 text-xs font-medium text-red-600">Inactive</p> : null}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="border-t border-gray-100 px-6 py-4">
          <Button variant="outline" onClick={() => closeDialog(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

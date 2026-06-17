
"use client"

import { useMemo, useState } from "react"
import { type Column } from "@/components/common/DataTable/DataTable"
import POSResourceManager from "@/components/pos/POSResourceManager"
import { getPosDeviceLabel } from "@/lib/deviceIdentity"
import { extractErrorMessage } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  useAssignCurrentDeviceTerminalMutation,
  useCreateTerminalMutation,
  useDetachCurrentDeviceTerminalMutation,
  useDetachTerminalBindingMutation,
  useGetCurrentTerminalBindingQuery,
  useDeleteTerminalMutation,
  useGetConfigurationsQuery,
  useGetTerminalsQuery,
  useUpdateTerminalMutation,
} from "@/redux/features/pos/posAPISlice"
import type { POSTerminal } from "@/redux/features/pos/posTypes"
import { useListStockLocationsQuery } from "@/redux/features/stock/stockAPISlice"
import type { StockLocation } from "@/redux/features/stock/stockTypes"
import { toast } from "react-toastify"

const columns: Column<POSTerminal>[] = [
  { header: "Name", accessor: "name" },
  { header: "Terminal key", accessor: "sync_identifier" },
  { header: "Location", accessor: "location" },
  { header: "Status", accessor: "is_active", render: (value) => (value ? "Active" : "Inactive") },
  {
    header: "Browser assignment",
    accessor: "assigned_device_identifier",
    render: (_value, row) =>
      row.assigned_device_identifier
        ? row.is_bound_to_current_device
          ? "Assigned to this browser"
          : "Assigned elsewhere"
        : "Unassigned",
  },
]

const formatStructuralLocationLabel = (location: StockLocation) =>
  [location.parent_name, location.name].filter((value) => value && String(value).trim().length > 0).join(" / ") || location.name

export default function Terminals() {
  const { data: terminals = [], isLoading, refetch } = useGetTerminalsQuery()
  const { data: configurations = [] } = useGetConfigurationsQuery()
  const { data: structuralLocations = [] } = useListStockLocationsQuery({ structural: true, ordering: "name" })
  const { data: currentBinding, refetch: refetchBinding } = useGetCurrentTerminalBindingQuery()
  const [createTerminal] = useCreateTerminalMutation()
  const [updateTerminal] = useUpdateTerminalMutation()
  const [deleteTerminal] = useDeleteTerminalMutation()
  const [assignCurrentDeviceTerminal, { isLoading: isAssigningTerminal }] = useAssignCurrentDeviceTerminalMutation()
  const [detachCurrentDeviceTerminal, { isLoading: isDetachingTerminal }] = useDetachCurrentDeviceTerminalMutation()
  const [detachTerminalBinding, { isLoading: isForceDetachingTerminal }] = useDetachTerminalBindingMutation()
  const [selectedTerminalId, setSelectedTerminalId] = useState("")

  const availableAssignmentTargets = useMemo(
    () =>
      terminals.filter(
        (terminal) =>
          terminal.is_active && (!terminal.assigned_device_identifier || terminal.is_bound_to_current_device),
      ),
    [terminals],
  )

  const terminalLocationOptions = useMemo(() => {
    const seen = new Set<string>()
    const options: Array<{ value: string; text: string }> = []

    structuralLocations.forEach((location) => {
      const label = formatStructuralLocationLabel(location)
      if (!label || seen.has(label)) {
        return
      }
      seen.add(label)
      options.push({ value: label, text: label })
    })

    terminals.forEach((terminal) => {
      const label = terminal.location?.trim()
      if (!label || seen.has(label)) {
        return
      }
      seen.add(label)
      options.push({ value: label, text: label })
    })

    return options
  }, [structuralLocations, terminals])

  const bindingTerminalName = useMemo(() => {
    if (!currentBinding?.terminal) {
      return ""
    }
    const bound = terminals.find(
      (terminal) => terminal.sync_identifier === currentBinding.terminal || terminal.id === currentBinding.terminal,
    )
    return bound?.name || currentBinding.terminal_name || "Assigned terminal"
  }, [currentBinding, terminals])

  const handleAssignCurrentBrowser = async () => {
    if (!selectedTerminalId) {
      toast.error("Choose a terminal before assigning this browser.")
      return
    }

    try {
      await assignCurrentDeviceTerminal({
        terminal_id: selectedTerminalId,
        device_label: getPosDeviceLabel(),
      }).unwrap()
      await Promise.all([refetch(), refetchBinding()])
      toast.success("This browser is now assigned to the selected terminal.")
    } catch (error) {
      toast.error(extractErrorMessage(error, ["terminal_id"]))
    }
  }

  const handleDetachCurrentBrowser = async () => {
    if (!window.confirm("Detach this browser from its assigned terminal? Cashiers on this machine will no longer be able to use POS until an admin reassigns it.")) {
      return
    }

    try {
      await detachCurrentDeviceTerminal().unwrap()
      await Promise.all([refetch(), refetchBinding()])
      setSelectedTerminalId("")
      toast.success("This browser has been detached from its terminal.")
    } catch (error) {
      toast.error(extractErrorMessage(error, ["terminal_id"]))
    }
  }

  const handleForceDetachTerminal = async (terminal: POSTerminal) => {
    const assignedLabel = terminal.assigned_device_label?.trim() || terminal.assigned_device_identifier || "the assigned device"
    if (
      !window.confirm(
        `Force-detach ${terminal.name} from ${assignedLabel}? Use this only when the original device is lost or unavailable.`,
      )
    ) {
      return
    }

    try {
      await detachTerminalBinding(terminal.id).unwrap()
      await Promise.all([refetch(), refetchBinding()])
      if (currentBinding?.terminal === terminal.sync_identifier || currentBinding?.terminal === terminal.id) {
        setSelectedTerminalId("")
      }
      toast.success(`${terminal.name} has been detached from its assigned device.`)
    } catch (error) {
      toast.error(extractErrorMessage(error, ["terminal_id"]))
    }
  }

  return (
    <div className="space-y-5">
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100 p-5 text-left text-inherit">
          <CardTitle className="text-lg">This browser&apos;s POS terminal</CardTitle>
          <CardDescription className="mt-2 text-sm leading-6 text-gray-600">
            Assign this browser or machine to exactly one terminal. Cashiers using this browser will inherit that
            terminal automatically, and only an administrator can detach it later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          {currentBinding ? (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="text-sm font-semibold text-blue-900">Assigned terminal</div>
              <div className="mt-2 text-lg font-semibold text-gray-900">{bindingTerminalName}</div>
              <div className="mt-2 text-xs text-blue-900">
                This browser is locked to that terminal until an administrator detaches it.
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              This browser is not assigned to any selling terminal yet. Cashiers on this machine cannot use POS until
              an administrator assigns one here.
            </div>
          )}

          {!currentBinding ? (
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div className="space-y-2">
                <Label>Assign this browser to terminal</Label>
                <Select value={selectedTerminalId} onValueChange={setSelectedTerminalId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Choose an available terminal" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAssignmentTargets.map((terminal) => (
                      <SelectItem key={terminal.id} value={terminal.sync_identifier || terminal.id}>
                        {terminal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => void handleAssignCurrentBrowser()} disabled={!selectedTerminalId || isAssigningTerminal}>
                {isAssigningTerminal ? "Assigning..." : "Assign browser"}
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => void handleDetachCurrentBrowser()} disabled={isDetachingTerminal}>
              {isDetachingTerminal ? "Detaching..." : "Detach this browser"}
            </Button>
          )}
        </CardContent>
      </Card>

      <POSResourceManager<POSTerminal>
        title="Selling terminals"
        description="Create the physical checkout endpoints that cashiers will open sessions against."
        data={terminals}
        isLoading={isLoading}
        columns={columns}
        createLabel="New terminal"
        itemTitle="Terminal"
        interfaceKeys={["name", "location", "is_active", "configuration"]}
        selectOptions={{
          configuration: configurations.map((configuration) => ({
            value: configuration.sync_identifier || configuration.id,
            text: configuration.name,
          })),
          location: terminalLocationOptions,
        }}
        optionalFields={["location"]}
        onCreate={async (data) => {
          await createTerminal(data).unwrap()
          await refetch()
        }}
        onUpdate={async (id, data) => {
          await updateTerminal({ id, data }).unwrap()
          await refetch()
        }}
        onDelete={async (id) => {
          await deleteTerminal(id).unwrap()
          await refetch()
        }}
        actionButtons={[
          {
            label: "Force detach",
            variant: "warning",
            hidden: (row) => !row.assigned_device_identifier,
            disabled: (row) => isForceDetachingTerminal || !row.assigned_device_identifier,
            onClick: (row) => void handleForceDetachTerminal(row),
          },
        ]}
        emptyState="Create at least one active terminal so staff can open POS sessions."
      />
    </div>
  )
}

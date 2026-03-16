
"use client"

import { type Column } from "@/components/common/DataTable/DataTable"
import POSResourceManager from "@/components/pos/POSResourceManager"
import {
  useCreateTerminalMutation,
  useDeleteTerminalMutation,
  useGetConfigurationsQuery,
  useGetTerminalsQuery,
  useUpdateTerminalMutation,
} from "@/redux/features/pos/posAPISlice"
import type { POSTerminal } from "@/redux/features/pos/posTypes"

const columns: Column<POSTerminal>[] = [
  { header: "Name", accessor: "name" },
  { header: "Terminal key", accessor: "sync_identifier" },
  { header: "Location", accessor: "location" },
  { header: "Status", accessor: "is_active", render: (value) => (value ? "Active" : "Inactive") },
]

export default function Terminals() {
  const { data: terminals = [], isLoading, refetch } = useGetTerminalsQuery()
  const { data: configurations = [] } = useGetConfigurationsQuery()
  const [createTerminal] = useCreateTerminalMutation()
  const [updateTerminal] = useUpdateTerminalMutation()
  const [deleteTerminal] = useDeleteTerminalMutation()

  return (
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
      emptyState="Create at least one active terminal so staff can open POS sessions."
    />
  )
}

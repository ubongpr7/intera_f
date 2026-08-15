
"use client"

import { type Column } from "@/components/common/DataTable/DataTable"
import POSResourceManager from "@/components/pos/POSResourceManager"
import { useCreateTableMutation, useDeleteTableMutation, useGetTablesQuery, useUpdateTableMutation } from "@/redux/features/pos/posAPISlice"
import type { POSTable } from "@/redux/features/pos/posTypes"

const columns: Column<POSTable>[] = [
  { header: "Number", accessor: "number" },
  { header: "Name", accessor: "name" },
  { header: "Capacity", accessor: "capacity" },
  { header: "Status", accessor: "is_active", render: (value) => (value ? "Active" : "Inactive") },
]

export default function Tables() {
  const { data: tables = [], isLoading, refetch } = useGetTablesQuery()
  const [createTable] = useCreateTableMutation()
  const [updateTable] = useUpdateTableMutation()
  const [deleteTable] = useDeleteTableMutation()

  return (
    <POSResourceManager<POSTable>
      title="Service tables"
      description="If your workflow uses table service, maintain the table map here so draft orders can attach correctly."
      data={tables}
      isLoading={isLoading}
      columns={columns}
      createLabel="New table"
      itemTitle="Table"
      interfaceKeys={["number", "name", "capacity", "is_active"]}
      optionalFields={["name"]}
      onCreate={async (data) => {
        await createTable(data).unwrap()
        await refetch()
      }}
      onUpdate={async (id, data) => {
        await updateTable({ id, data }).unwrap()
        await refetch()
      }}
      onDelete={async (id) => {
        await deleteTable(id).unwrap()
        await refetch()
      }}
      emptyState="Create tables only if you run seated service or want table-linked tickets."
    />
  )
}

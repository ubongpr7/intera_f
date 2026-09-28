
"use client"

import { useDeferredValue, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { type Column, type DataTableQueryState } from "@/components/common/DataTable/DataTable"
import POSResourceManager from "@/components/pos/POSResourceManager"
import { useCreateTableMutation, useDeleteTableMutation, useGetTablesPageQuery, useUpdateTableMutation } from "@/redux/features/pos/posAPISlice"
import type { POSTable } from "@/redux/features/pos/posTypes"

const columns: Column<POSTable>[] = [
  { header: "Number", accessor: "number" },
  { header: "Name", accessor: "name" },
  { header: "Capacity", accessor: "capacity" },
  { header: "Status", accessor: "is_active", render: (value) => (value ? "Active" : "Inactive") },
]

export default function Tables() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const tableStateKey = "table_pos_service_tables"
  const [queryState, setQueryState] = useState<DataTableQueryState | null>(null)
  const search = queryState?.searchTerm ?? searchParams.get(`${tableStateKey}_search`) ?? ""
  const active = queryState?.filters.is_active ?? searchParams.get(`${tableStateKey}_filter_is_active`) ?? undefined
  const orderingField = queryState?.sortConfig?.key ?? searchParams.get(`${tableStateKey}_sort`)
  const direction = queryState?.sortConfig?.direction ?? searchParams.get(`${tableStateKey}_direction`)
  const ordering = orderingField && ["number", "name", "capacity", "created_at"].includes(orderingField)
    ? `${direction === "descending" ? "-" : ""}${orderingField}`
    : undefined
  const page = Number(searchParams.get(`${tableStateKey}_page`)) || 1
  const { data: tablePage, isLoading, refetch, error } = useGetTablesPageQuery({
    page,
    page_size: 20,
    search: useDeferredValue(search.trim()) || undefined,
    is_active: active === undefined ? undefined : active === "true",
    ordering,
  })
  const tables = tablePage?.results ?? []
  const [createTable] = useCreateTableMutation()
  const [updateTable] = useUpdateTableMutation()
  const [deleteTable] = useDeleteTableMutation()

  return (
    <POSResourceManager<POSTable>
      title="Service tables"
      description="If your workflow uses table service, maintain the table map here so draft orders can attach correctly."
      data={tables}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
      columns={columns}
      serverSide
      urlStateKey="pos_service_tables"
      searchableFields={["number", "name"]}
      filterableFields={["is_active"]}
      filterOptions={{ is_active: [{ value: "true", label: "Active" }, { value: "false", label: "Inactive" }] }}
      sortableFields={["number", "name", "capacity", "created_at"]}
      onQueryStateChange={setQueryState}
      pagination={{
        count: tablePage?.count ?? 0,
        page: tablePage?.page ?? page,
        totalPages: tablePage?.total_pages ?? 0,
        onPageChange: (nextPage) => {
          const params = new URLSearchParams(searchParams.toString())
          params.set(`${tableStateKey}_page`, String(nextPage))
          router.push(`${pathname}?${params.toString()}`, { scroll: false })
        },
      }}
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

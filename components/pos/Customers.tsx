
"use client"

import { useDeferredValue, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { type Column, type DataTableQueryState } from "@/components/common/DataTable/DataTable"
import POSResourceManager from "@/components/pos/POSResourceManager"
import {
  useCreateCustomerMutation,
  useDeleteCustomerMutation,
  useGetCustomersPageQuery,
  useUpdateCustomerMutation,
} from "@/redux/features/pos/posAPISlice"
import type { POSCustomer } from "@/redux/features/pos/posTypes"

const columns: Column<POSCustomer>[] = [
  { header: "Name", accessor: "name" },
  { header: "Email", accessor: "email" },
  { header: "Phone", accessor: "phone" },
  { header: "Loyalty", accessor: "loyalty_points" },
]

export default function Customers() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const tableStateKey = "table_pos_customers"
  const [queryState, setQueryState] = useState<DataTableQueryState | null>(null)
  const search = queryState?.searchTerm ?? searchParams.get(`${tableStateKey}_search`) ?? ""
  const orderingField = queryState?.sortConfig?.key ?? searchParams.get(`${tableStateKey}_sort`)
  const direction = queryState?.sortConfig?.direction ?? searchParams.get(`${tableStateKey}_direction`)
  const ordering = orderingField && ["name", "email", "created_at"].includes(orderingField)
    ? `${direction === "descending" ? "-" : ""}${orderingField}`
    : undefined
  const page = Number(searchParams.get(`${tableStateKey}_page`)) || 1
  const { data: customerPage, isLoading, refetch, error } = useGetCustomersPageQuery({
    page,
    page_size: 20,
    search: useDeferredValue(search.trim()) || undefined,
    ordering,
  })
  const customers = customerPage?.results ?? []
  const [createCustomer] = useCreateCustomerMutation()
  const [updateCustomer] = useUpdateCustomerMutation()
  const [deleteCustomer] = useDeleteCustomerMutation()

  return (
    <POSResourceManager<POSCustomer>
      title="Customers"
      description="Maintain returning customers, contact details, and loyalty balances for repeat sales."
      data={customers}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
      columns={columns}
      serverSide
      urlStateKey="pos_customers"
      searchableFields={["name", "email", "phone"]}
      sortableFields={["name", "email", "created_at"]}
      onQueryStateChange={setQueryState}
      pagination={{
        count: customerPage?.count ?? 0,
        page: customerPage?.page ?? page,
        totalPages: customerPage?.total_pages ?? 0,
        onPageChange: (nextPage) => {
          const params = new URLSearchParams(searchParams.toString())
          params.set(`${tableStateKey}_page`, String(nextPage))
          router.push(`${pathname}?${params.toString()}`, { scroll: false })
        },
      }}
      createLabel="New customer"
      itemTitle="Customer"
      interfaceKeys={["name", "email", "phone", "address", "loyalty_points"]}
      optionalFields={["email", "phone", "address"]}
      createDefaultValues={{ loyalty_points: 0 }}
      onCreate={async (data) => {
        await createCustomer(data).unwrap()
        await refetch()
      }}
      onUpdate={async (id, data) => {
        await updateCustomer({ id, data }).unwrap()
        await refetch()
      }}
      onDelete={async (id) => {
        await deleteCustomer(id).unwrap()
        await refetch()
      }}
      emptyState="Create customers here if your POS flow should remember repeat buyers."
    />
  )
}

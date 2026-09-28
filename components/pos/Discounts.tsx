
"use client"

import { useDeferredValue, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { type Column, type DataTableQueryState } from "@/components/common/DataTable/DataTable"
import POSResourceManager from "@/components/pos/POSResourceManager"
import {
  useCreateDiscountMutation,
  useDeleteDiscountMutation,
  useGetDiscountsPageQuery,
  useUpdateDiscountMutation,
} from "@/redux/features/pos/posAPISlice"
import type { POSDiscount } from "@/redux/features/pos/posTypes"

const columns: Column<POSDiscount>[] = [
  { header: "Name", accessor: "name" },
  { header: "Type", accessor: "discount_type" },
  { header: "Value", accessor: "value" },
  { header: "Approval", accessor: "requires_approval", render: (value) => (value ? "Required" : "Auto") },
]

const discountTypeOptions = [
  { value: "percentage", text: "Percentage" },
  { value: "fixed", text: "Fixed amount" },
]

export default function Discounts() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const tableStateKey = "table_pos_discounts"
  const [queryState, setQueryState] = useState<DataTableQueryState | null>(null)
  const search = queryState?.searchTerm ?? searchParams.get(`${tableStateKey}_search`) ?? ""
  const type = queryState?.filters.discount_type ?? searchParams.get(`${tableStateKey}_filter_discount_type`) ?? undefined
  const active = queryState?.filters.is_active ?? searchParams.get(`${tableStateKey}_filter_is_active`) ?? undefined
  const orderingField = queryState?.sortConfig?.key ?? searchParams.get(`${tableStateKey}_sort`)
  const direction = queryState?.sortConfig?.direction ?? searchParams.get(`${tableStateKey}_direction`)
  const ordering = orderingField && ["name", "value", "created_at"].includes(orderingField)
    ? `${direction === "descending" ? "-" : ""}${orderingField}`
    : undefined
  const page = Number(searchParams.get(`${tableStateKey}_page`)) || 1
  const { data: discountPage, isLoading, refetch, error } = useGetDiscountsPageQuery({
    page,
    page_size: 20,
    search: useDeferredValue(search.trim()) || undefined,
    discount_type: type,
    is_active: active === "true" ? true : active === "false" ? false : undefined,
    ordering,
  })
  const discounts = discountPage?.results ?? []
  const [createDiscount] = useCreateDiscountMutation()
  const [updateDiscount] = useUpdateDiscountMutation()
  const [deleteDiscount] = useDeleteDiscountMutation()

  return (
    <POSResourceManager<POSDiscount>
      title="Discount controls"
      description="Create reusable discount policies that cashiers can apply safely during live selling."
      data={discounts}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
      columns={columns}
      serverSide
      urlStateKey="pos_discounts"
      searchableFields={["name"]}
      filterableFields={["discount_type", "is_active"]}
      filterOptions={{
        discount_type: discountTypeOptions.map(({ value, text }) => ({ value, label: text })),
        is_active: [{ value: "true", label: "Active" }, { value: "false", label: "Inactive" }],
      }}
      sortableFields={["name", "value", "created_at"]}
      onQueryStateChange={setQueryState}
      pagination={{
        count: discountPage?.count ?? 0,
        page: discountPage?.page ?? page,
        totalPages: discountPage?.total_pages ?? 0,
        onPageChange: (nextPage) => {
          const params = new URLSearchParams(searchParams.toString())
          params.set(`${tableStateKey}_page`, String(nextPage))
          router.push(`${pathname}?${params.toString()}`, { scroll: false })
        },
      }}
      createLabel="New discount"
      itemTitle="Discount"
      interfaceKeys={["name", "discount_type", "value", "is_active", "requires_approval", "min_order_amount", "max_discount_amount"]}
      optionalFields={["min_order_amount", "max_discount_amount"]}
      createDefaultValues={{ requires_approval: false }}
      selectOptions={{ discount_type: discountTypeOptions }}
      onCreate={async (data) => {
        await createDiscount(data).unwrap()
        await refetch()
      }}
      onUpdate={async (id, data) => {
        await updateDiscount({ id, data }).unwrap()
        await refetch()
      }}
      onDelete={async (id) => {
        await deleteDiscount(id).unwrap()
        await refetch()
      }}
      emptyState="Add discount policies if your checkout team needs controlled promotional or override tools."
    />
  )
}

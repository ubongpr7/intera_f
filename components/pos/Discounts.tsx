
"use client"

import { type Column } from "@/components/common/DataTable/DataTable"
import POSResourceManager from "@/components/pos/POSResourceManager"
import {
  useCreateDiscountMutation,
  useDeleteDiscountMutation,
  useGetDiscountsQuery,
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
  const { data: discounts = [], isLoading, refetch } = useGetDiscountsQuery()
  const [createDiscount] = useCreateDiscountMutation()
  const [updateDiscount] = useUpdateDiscountMutation()
  const [deleteDiscount] = useDeleteDiscountMutation()

  return (
    <POSResourceManager<POSDiscount>
      title="Discount controls"
      description="Create reusable discount policies that cashiers can apply safely during live selling."
      data={discounts}
      isLoading={isLoading}
      columns={columns}
      createLabel="New discount"
      itemTitle="Discount"
      interfaceKeys={["name", "discount_type", "value", "is_active", "requires_approval", "min_order_amount", "max_discount_amount"]}
      optionalFields={["min_order_amount", "max_discount_amount"]}
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

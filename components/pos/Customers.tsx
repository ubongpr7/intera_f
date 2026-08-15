
"use client"

import { type Column } from "@/components/common/DataTable/DataTable"
import POSResourceManager from "@/components/pos/POSResourceManager"
import {
  useCreateCustomerMutation,
  useDeleteCustomerMutation,
  useGetCustomersQuery,
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
  const { data: customers = [], isLoading, refetch } = useGetCustomersQuery()
  const [createCustomer] = useCreateCustomerMutation()
  const [updateCustomer] = useUpdateCustomerMutation()
  const [deleteCustomer] = useDeleteCustomerMutation()

  return (
    <POSResourceManager<POSCustomer>
      title="Customers"
      description="Maintain returning customers, contact details, and loyalty balances for repeat sales."
      data={customers}
      isLoading={isLoading}
      columns={columns}
      createLabel="New customer"
      itemTitle="Customer"
      interfaceKeys={["name", "email", "phone", "address", "loyalty_points"]}
      optionalFields={["email", "phone", "address"]}
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

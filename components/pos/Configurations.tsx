
"use client"

import { type Column } from "@/components/common/DataTable/DataTable"
import POSResourceManager from "@/components/pos/POSResourceManager"
import { getCurrencySymbol } from "@/lib/currency-utils"
import { CURRENCY_CODES } from "@/lib/currencyCode"
import {
  useCreateConfigurationMutation,
  useDeleteConfigurationMutation,
  useGetConfigurationsQuery,
  useUpdateConfigurationMutation,
} from "@/redux/features/pos/posAPISlice"
import type { POSConfiguration } from "@/redux/features/pos/posTypes"

const columns: Column<POSConfiguration>[] = [
  { header: "Name", accessor: "name" },
  { header: "Currency", accessor: "currency", render: (value) => `${getCurrencySymbol(String(value))} ${value}` },
  { header: "Tax mode", accessor: "tax_inclusive", render: (value) => (value ? "Inclusive" : "Exclusive") },
  { header: "Split payments", accessor: "allow_split_payment", render: (value) => (value ? "Enabled" : "Disabled") },
  { header: "Default tax", accessor: "default_tax_rate" },
]

const currencyOptions = CURRENCY_CODES.map((currency) => ({
  value: currency,
  text: `${getCurrencySymbol(currency)} ${currency}`,
}))

export default function Configurations() {
  const { data: configurations = [], isLoading, refetch } = useGetConfigurationsQuery()
  const [createConfiguration] = useCreateConfigurationMutation()
  const [updateConfiguration] = useUpdateConfigurationMutation()
  const [deleteConfiguration] = useDeleteConfigurationMutation()

  return (
    <POSResourceManager<POSConfiguration>
      title="POS policy"
      description="Define currency, tax, split-payment, and receipt behavior before cashiers start transacting."
      data={configurations}
      isLoading={isLoading}
      columns={columns}
      createLabel="New configuration"
      itemTitle="Configuration"
      interfaceKeys={[
        "name",
        "currency",
        "tax_inclusive",
        "default_tax_rate",
        "allow_negative_stock",
        "require_customer",
        "auto_print_receipt",
        "receipt_header",
        "receipt_footer",
        "allow_split_payment",
        "max_discount_percent",
      ]}
      selectOptions={{ currency: currencyOptions }}
      optionalFields={["receipt_header", "receipt_footer", "default_tax_rate","tax_inclusive", "max_discount_percent", "allow_negative_stock", "require_customer", "auto_print_receipt", "allow_split_payment"]}
      onCreate={async (data) => {
        await createConfiguration(data).unwrap()
        await refetch()
      }}
      onUpdate={async (id, data) => {
        await updateConfiguration({ id, data }).unwrap()
        await refetch()
      }}
      onDelete={async (id) => {
        await deleteConfiguration(id).unwrap()
        await refetch()
      }}
      emptyState="Create the first POS configuration to control tax and receipt behavior."
    />
  )
}

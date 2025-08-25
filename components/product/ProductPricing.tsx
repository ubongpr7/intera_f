"use client"

import type React from "react"
import { useState } from "react"
import {
  useGetPricingRulesQuery,
  useCreatePricingRuleMutation,
  useUpdatePricingRuleMutation,
  useDeletePricingRuleMutation,
  useTogglePricingRuleActiveMutation,
} from "@/redux/features/product/productAPISlice"
import { useGetProductVariantsQuery } from "@/redux/features/product/productAPISlice"
import { PageHeader } from "../inventory/PageHeader"
import { useRouter } from "nextjs-toploader/app"
import { Column, DataTable } from "../common/DataTable/DataTable"
import { PricingRule, Product, ProductCategory, ProductVariant } from "../interfaces/product"
import CustomCreateCard from "../common/createCard"
import LoadingAnimation from "../common/LoadingAnimation"

interface ProductPricingProps {
  productId: string;
  product:Partial<Product>
  
}

const pricingRuleColumns: Column<PricingRule>[] = [
  {
    header: 'Name',
    accessor: 'name',
    className: 'font-medium',
  },
  {
    header: 'Rule Type',
    accessor: 'rule_type',
    render: (value) => value || 'N/A',
    info: 'Type of pricing rule',
  },
  {
    header: 'Discount Type',
    accessor: 'discount_type',
    render: (value) => value || 'N/A',
    info: 'Type of discount applied',
  },
  {
    header: 'Value',
    accessor: 'value',
    render: (value) => {
      if (!value) return 'N/A'
      return value ? `$${Number(value).toFixed(2)}` : '0.00'
    },
    info: 'Discount value or percentage',
  },
  {
    header: 'Active',
    accessor: 'is_active',
    render: (value) => (value ? 'Yes' : 'No'),
    info: 'Is the rule currently active?',
  },
  {
    header: 'Active Now',
    accessor: 'is_active_now',
    render: (value) => (value ? 'Yes' : 'No'),
    info: 'Is the rule currently applicable?',
  },
  {
    header: 'Priority',
    accessor: 'priority',
    render: (value) => value || '0',
    info: 'Rule application priority',
  },
  {
    header: 'Usage',
    accessor: 'usage_percentage',
    render: (value) => value ? `${Number(value).toFixed(1)}%` : '0%',
    info: 'Percentage of usage limit consumed',
  },
]


const interfaceKeys: (keyof PricingRule)[] = [
  'name',
  'rule_type',
  'discount_type',
  'value',
  'variant',
  'start_date',
  'end_date',
  'min_quantity',
  'max_quantity',
  'min_amount',
  // 'customer_groups',
  // 'specific_customers',
  'usage_limit',
  'usage_limit_per_customer',
  'is_active',
  'priority',
  'description',
]

export default function ProductPricing({ productId,product }: ProductPricingProps) {
  const router = useRouter()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null)

  const { 
    data: pricingRules, 
    isLoading, 
    refetch, 
    error 
  } = useGetPricingRulesQuery({ productId })


  const { 
    data: variants = [], 
    isLoading: isVariantsLoading 
  } = useGetProductVariantsQuery(productId)

  const [createPricingRule, { isLoading: createLoading }] = useCreatePricingRuleMutation()
  const [updatePricingRule, { isLoading: updateLoading }] = useUpdatePricingRuleMutation()
  const [deletePricingRule, { isLoading: deleteLoading }] = useDeletePricingRuleMutation()
  const [toggleActive] = useTogglePricingRuleActiveMutation()

  const variantOptions = variants.map((variant: ProductVariant) => ({
    value: variant.id,
    text: variant.pos_name,
  }))


const defaultValues: Partial<PricingRule> = {
  name: '',
  rule_type: 'PROMO',
  discount_type: 'PERCENTAGE',
  value: 0,
  is_active: true,
  priority: 0,
  usage_count: 0,
  description: '',
  product:productId
}

  const ruleTypeOptions = [
    { value: 'BATCH', text: 'Stock Batch Override' },
    { value: 'CUSTOMER', text: 'Customer Specific' },
    { value: 'CUSTOMER_GROUP', text: 'Customer Group' },
    { value: 'PROMO', text: 'Time-Limited Promotion' },
    { value: 'VOLUME', text: 'Volume Discount' },
    { value: 'SEASONAL', text: 'Seasonal Pricing' },
    { value: 'CLEARANCE', text: 'Clearance Sale' },
    { value: 'LOYALTY', text: 'Loyalty Discount' },
    { value: 'BUNDLE', text: 'Bundle Discount' },
  ]

  const discountTypeOptions = [
    { value: 'PERCENTAGE', text: 'Percentage' },
    { value: 'FIXED_AMOUNT', text: 'Fixed Amount' },
    { value: 'FIXED_PRICE', text: 'Fixed Price' },
  ]

  const selectOptions = {
    variant: variantOptions,
    rule_type: ruleTypeOptions,
    discount_type: discountTypeOptions,
  }


  const handleCreate = async (data: Partial<PricingRule>) => {
      const ruleData = { ...data, product: productId }
      await createPricingRule(ruleData).unwrap()
      setIsCreateOpen(false)
      refetch()
    
  }

  const handleUpdate = async (data: Partial<PricingRule>) => {
    if (!editingRule) return
      await updatePricingRule({ id: editingRule.id, data }).unwrap()
      setEditingRule(null)
      setIsCreateOpen(false)
      refetch()
  }

  const handleDelete = async (ruleId: string) => {
    try {
      await deletePricingRule(ruleId).unwrap()
      refetch()
    } catch (error) {
      console.error('Failed to delete pricing rule:', error)
    }
  }

  const handleToggleActive = async (ruleId: string, isActive: boolean) => {
    try {
      await toggleActive({ id: ruleId, is_active: !isActive }).unwrap()
      refetch()
    } catch (error) {
      console.error('Failed to toggle active status:', error)
    }
  }

  const handleRowClick = (row: PricingRule) => {
    setEditingRule(row)
    setIsCreateOpen(true)
  }

  const handleRefresh = async () => {
    await refetch()
  }

  const notEditableFields: (keyof PricingRule)[] = [
    'id',
    'created_at',
    'updated_at',
    'usage_count',
    'is_active_now',
    'usage_percentage',
    'product_details',
    'variant_details',
    'category_details',
    'created_by_details',
  ]

  const actionButtons = [
    {
      label: 'Toggle Active',
      onClick: (row: PricingRule) => handleToggleActive(row.id, row.is_active),
    },
    {
      label: 'Delete',
      onClick: (row: PricingRule) => handleDelete(row.id),
      className: 'text-red-500',
    },
  ]

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading pricing rules: {(error as any).message || 'Unknown error'}
      </div>
    )
  }

  if (isLoading || isVariantsLoading ) {
    return <LoadingAnimation />
  }

  return (
    <div className="p-4">
      <PageHeader
        title={`Pricing Rules for ${product?.name || 'Product'}`}
        onClose={() => setIsCreateOpen(true)}
      />
      
      <DataTable<PricingRule>
        columns={pricingRuleColumns}
        data={pricingRules || []}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        searchableFields={['name']}
        filterableFields={['rule_type', 'discount_type']}
        sortableFields={['name', 'rule_type', 'discount_type']}
        actionButtons={actionButtons}
      />

      {/* Create/Edit Pricing Rule Modal */}
      <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${isCreateOpen ? 'block' : 'hidden'}`}>
        <CustomCreateCard
          defaultValues={editingRule|| defaultValues}
          onClose={() => {
            setIsCreateOpen(false)
            setEditingRule(null)
          }}
          onSubmit={ editingRule?handleUpdate:handleCreate}
          isLoading={updateLoading || createLoading}
          selectOptions={selectOptions}
          keyInfo={{value:'Discount Value'}}
          notEditableFields={notEditableFields}
          interfaceKeys={interfaceKeys}
          optionalFields={[
            'variant',
            'category',
            'start_date',
            'end_date',
            'min_quantity',
            'max_quantity',
            'min_amount',
            'customer_groups',
            'specific_customers',
            'usage_limit',
            'usage_limit_per_customer',
            'description',

          ]}
        readOnlyFields={[]}
          itemTitle={`${editingRule?'Update':'Create'} Pricing Rule`}

            
        />
      </div>
    </div>
  )
}
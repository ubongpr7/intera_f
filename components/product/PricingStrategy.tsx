"use client"

import type React from "react"
import { useState } from "react"
import {
  useGetPricingStrategiesQuery,
  useCreatePricingStrategyMutation,
  useUpdatePricingStrategyMutation,
  useDeletePricingStrategyMutation,
  
} from "@/redux/features/product/productAPISlice"
import { PageHeader } from "../inventory/PageHeader"
import { useRouter } from "nextjs-toploader/app"
import { Column, DataTable } from "../common/DataTable/DataTable"
import { PricingStrategy, Product } from "../interfaces/product"
import CustomCreateCard from "../common/createCard"
import LoadingAnimation from "../common/LoadingAnimation"

interface ProductPricingStrategiesProps {
  productId: string;
  product:Partial<Product>
}

const pricingStrategyColumns: Column<PricingStrategy>[] = [
  {
    header: 'Name',
    accessor: 'name',
    className: 'font-medium',
  },
  {
    header: 'Strategy Type',
    accessor: 'strategy',
    render: (value) => {
      const displayMap: Record<string, string> = {
        margin: 'Cost-Plus Margin',
        multiplier: 'Market Multiplier',
        fixed: 'Fixed Price',
        dynamic: 'Dynamic Pricing',
        tiered: 'Tiered Pricing',
      }
      return displayMap[value] || value || 'N/A'
    },
    info: 'Type of pricing strategy',
  },
  {
    header: 'Margin %',
    accessor: 'margin_percentage',
    render: (value) => (value ? `${Number(value).toFixed(2)}%` : 'N/A'),
    info: 'Markup percentage for cost-plus strategy',
  },
  {
    header: 'Multiplier',
    accessor: 'market_multiplier',
    render: (value) => (value ? Number(value).toFixed(2) : 'N/A'),
    info: 'Market multiplier value',
  },
  {
    header: 'Min Price',
    accessor: 'min_price',
    render: (value) => (value ? `$${Number(value).toFixed(2)}` : 'N/A'),
    info: 'Minimum price floor',
  },
  {
    header: 'Max Price',
    accessor: 'max_price',
    render: (value) => (value ? `$${Number(value).toFixed(2)}` : 'N/A'),
    info: 'Maximum price ceiling',
  },
  {
    header: 'Active',
    accessor: 'is_active',
    render: (value) => (value ? 'Yes' : 'No'),
    info: 'Is the strategy currently active?',
  },
]

const defaultValues: Partial<PricingStrategy> = {
  name: '',
  strategy: 'margin',
  margin_percentage: undefined,
  market_multiplier: undefined,
  min_price: undefined,
  max_price: undefined,
  demand_factor: 1.0,
  seasonal_factor: 1.0,
  tier_1_quantity: 1,
  tier_1_discount: 1,
  tier_2_quantity: 1,
  tier_2_discount: 1,
  tier_3_quantity: 1,
  tier_3_discount: 1,
  is_active: true,
}

const interfaceKeys: (keyof PricingStrategy)[] = [
  'name',
  'strategy',
  'tier_1_quantity',
  'tier_1_discount',
  'tier_2_quantity',
  'tier_2_discount',
  'tier_3_quantity',
  'tier_3_discount',
  'margin_percentage',
  'market_multiplier',
  'min_price',
  'max_price',
  'demand_factor',
  'seasonal_factor',
  'is_active',
  
]

export default function ProductPricingStrategies({ productId,product }: ProductPricingStrategiesProps) {
  const router = useRouter()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingStrategy, setEditingStrategy] = useState<PricingStrategy | null>(null)

  const { 
    data: pricingStrategies, 
    isLoading, 
    refetch, 
    error 
  } = useGetPricingStrategiesQuery({ productId })


  const [createPricingStrategy, { isLoading: createLoading }] = useCreatePricingStrategyMutation()
  const [updatePricingStrategy, { isLoading: updateLoading }] = useUpdatePricingStrategyMutation()
  const [deletePricingStrategy, { isLoading: deleteLoading }] = useDeletePricingStrategyMutation()

  const strategyOptions = [
    { value: 'margin', text: 'Cost-Plus Margin' },
    { value: 'multiplier', text: 'Market Multiplier' },
    { value: 'fixed', text: 'Fixed Price' },
    { value: 'dynamic', text: 'Dynamic Pricing' },
    { value: 'tiered', text: 'Tiered Pricing' },
  ]

  const selectOptions = {
    strategy: strategyOptions,
  }

  const handleCreate = async (data: Partial<PricingStrategy>) => {
      const strategyData = { ...data, product: productId }
      await createPricingStrategy(strategyData).unwrap()
      setIsCreateOpen(false)
      refetch()
   
  }

  const handleUpdate = async (data: Partial<PricingStrategy>) => {
    if (!editingStrategy) return
      await updatePricingStrategy({ id: editingStrategy.id,data }).unwrap()
      setEditingStrategy(null)
      setIsCreateOpen(false)
      refetch()
    
  }

  const handleDelete = async (strategyId: string) => {
    try {
      await deletePricingStrategy(strategyId).unwrap()
      refetch()
    } catch (error) {
      console.error('Failed to delete pricing strategy:', error)
    }
  }

  const handleRowClick = (row: PricingStrategy) => {
    setEditingStrategy(row)
    setIsCreateOpen(true)
  }

  const handleRefresh = async () => {
    await refetch()
  }

  const notEditableFields: (keyof PricingStrategy)[] = [
    'id',
    'created_at',
    'updated_at',
    'calculated_price_example',
  ]

  const actionButtons = [
    {
      label: 'Delete',
      onClick: (row: PricingStrategy) => handleDelete(row.id),
      className: 'text-red-500',
    },
  ]

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading pricing strategies: {(error as any).message || 'Unknown error'}
      </div>
    )
  }

  if (isLoading ) {
    return <LoadingAnimation />
  }

  return (
    <div className="p-4">
      <PageHeader
        title={`Pricing Strategies for ${product?.name || 'Product'}`}
        onClose={() => setIsCreateOpen(true)}
      />
      
      <DataTable<PricingStrategy>
        columns={pricingStrategyColumns}
        data={pricingStrategies || []}
        isLoading={isLoading}
        onRowClick={handleRowClick}
      />

      {/* Create/Edit Pricing Strategy Modal */}
      {isCreateOpen && (

        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${isCreateOpen ? 'block' : 'hidden'}`}>
          <CustomCreateCard
            defaultValues={ editingStrategy || defaultValues}
            onClose={() => {
              setIsCreateOpen(false)
            }}
            onSubmit={editingStrategy?handleUpdate:handleCreate}
            isLoading={editingStrategy?updateLoading:createLoading }
            selectOptions={selectOptions}
            keyInfo={{
              margin_percentage: 'Required for Cost-Plus Margin strategy',
              market_multiplier: 'Required for Market Multiplier strategy',
              min_price: 'Optional price floor for calculations',
              max_price: 'Optional price ceiling for calculations',
              demand_factor: 'Multiplier for demand-based pricing (Dynamic strategy)',
              seasonal_factor: 'Multiplier for seasonal pricing (Dynamic strategy)',
              tier_1_quantity: 'Minimum quantity for Tier 1 discount (Tiered strategy)',
              tier_1_discount: 'Discount percentage for Tier 1 (Tiered strategy)',
              tier_2_quantity: 'Minimum quantity for Tier 2 discount (Tiered strategy)',
              tier_2_discount: 'Discount percentage for Tier 2 (Tiered strategy)',
              tier_3_quantity: 'Minimum quantity for Tier 3 discount (Tiered strategy)',
              tier_3_discount: 'Discount percentage for Tier 3 (Tiered strategy)',
            }}
            notEditableFields={notEditableFields}
            interfaceKeys={interfaceKeys}
            optionalFields={[
              'margin_percentage',
              'market_multiplier',
              'min_price',
              'max_price',
              'demand_factor',
              'seasonal_factor',
              
            ]}
              itemTitle={`${editingStrategy?'Update':'Create'} Strategy`}
          />
        </div>
      )}
    </div>
  )
}
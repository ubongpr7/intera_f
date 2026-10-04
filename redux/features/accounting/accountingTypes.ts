export type EntityId = string | number

export interface MarginRow {
  inventory_item_id?: EntityId | null
  inventory_item_name?: string | null
  period?: string | null
  revenue: string | number
  cogs: string | number
  gross_margin: string | number
}

export interface SalesMarginResponse {
  products: MarginRow[]
  periods: MarginRow[]
}

export interface CustomerReturnLine {
  id: EntityId
  shipment_line: EntityId
  inventory_name?: string
  quantity_returned: string | number
  quantity_received: string | number
  remaining_quantity: string | number
  stock_quantity_returned?: string | number
  stock_quantity_received?: string | number
  remaining_stock_quantity?: string | number
  unit_cost: string | number
  cogs_reversal: string | number
  revenue_reversal: string | number
  reason?: string
}

export interface CustomerReturn {
  id: EntityId
  reference: string
  sales_order?: EntityId | null
  status: string
  return_date: string
  reason?: string
  notes?: string
  lines: CustomerReturnLine[]
  created_at?: string
}

export interface JournalLine {
  id: EntityId
  account_code: string
  debit: string | number
  credit: string | number
  memo?: string
}

export interface JournalEntry {
  id: EntityId
  entry_type: string
  reference_type?: string
  reference_id?: string
  entry_date: string
  currency_code: string
  memo?: string
  lines: JournalLine[]
  created_at?: string
}

export interface ValuationSnapshot {
  id: EntityId
  snapshot_date: string
  inventory_item: EntityId
  inventory_item_name?: string
  stock_location: EntityId
  stock_location_name?: string
  costing_method: string
  quantity_on_hand: string | number
  unit_cost: string | number
  total_value: string | number
  currency_code: string
  created_at?: string
}

export interface CreateCustomerReturnPayload {
  sales_order_id?: EntityId | null
  return_date?: string
  reason?: string
  notes?: string
  return_items: Array<{ shipment_line_id: EntityId; quantity: string | number; reason?: string }>
}

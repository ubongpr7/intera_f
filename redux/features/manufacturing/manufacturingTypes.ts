export type Id = string | number

export type Recipe = {
  id: Id
  name: string
  finished_good: Id
  version: number
  status: string
  output_quantity: string | number
  output_uom_code: string
  costing_method: string
  standard_unit_cost: string | number
}

export type ProductionOrder = {
  id: Id
  order_number: string
  recipe: Id
  recipe_name?: string
  finished_good: Id
  finished_good_name?: string
  stock_location: Id
  status: string
  planned_quantity: string | number
  actual_quantity: string | number
  scrap_quantity: string | number
  costing_period?: Id | null
  material_issue_count?: number
  output_count?: number
  created_at?: string
}

export type ProductionCostSummary = {
  material_cost: string | number
  additional_cost: string | number
  waste_cost: string | number
  actual_cost: string | number
  weighted_average_cost: string | number
  standard_cost: string | number
  variance: string | number
  costing_method: string
  total_cost: string | number
  output_quantity: string | number
  unit_cost: string | number
  allocation_valid?: boolean
  unallocated_cost?: string | number
  currency_code?: string
}

export type MaterialRequirement = {
  id: Id
  production_order: Id
  recipe_line: Id
  component: Id
  required_quantity: string | number
  reserved_quantity: string | number
  issued_quantity: string | number
  remaining_quantity: string | number
  quantity_uom_code: string
  status: string
}

export type WasteRecord = {
  id: Id
  production_order: Id
  inventory_item: Id
  source_stock_lot?: Id | null
  quantity: string | number
  quantity_uom_code: string
  unit_cost: string | number
  disposal_cost: string | number
  recovery_value: string | number
  net_cost: string | number
  waste_type: string
  disposition: string
  reason_code: string
  recorded_at?: string
}

export type CostingPeriod = {
  id: Id
  name: string
  period_start: string
  period_end: string
  status: string
  closed_at?: string | null
}

export type WorkCenter = {
  id: Id
  code: string
  name: string
  active: boolean
  hourly_labor_rate: string | number
  hourly_overhead_rate: string | number
  capacity_minutes_per_day: number
}

export type WorkCenterBlock = {
  id: Id
  work_center: Id
  starts_at: string
  ends_at: string
  reason: string
  active: boolean
  created_at?: string
}

export type WorkCenterCapacity = {
  work_center: Id
  date_from: string
  date_to: string
  days: number
  capacity_minutes: number
  blocked_minutes: number
  available_minutes: number
  planned_minutes: number
  utilization_percent: number
}

export type Nonconformance = {
  id: Id
  number: string
  production_order: Id
  inspection?: Id | null
  status: string
  severity: string
  category: string
  description: string
  root_cause: string
  containment_action: string
  corrective_action: string
  owner_user_id?: Id | null
  due_date?: string | null
  closed_at?: string | null
}

export type ListResponse<T> = T[] | { results?: T[] }

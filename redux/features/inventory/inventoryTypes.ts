import type { UserData } from "../users/userTypes";

export const inventoryTypes = [
  { id: "raw_material", text: "Raw Material" },
  { id: "finished_good", text: "Finished Good" },
  { id: "consumable", text: "Consumable" },
  { id: "work_in_progress", text: "Work In Progress" },
  { id: "maintenance_spare_part", text: "Maintenance Spare Part" },
  { id: "tooling", text: "Tooling" },
  { id: "packaging", text: "Packaging" },
] as const;

export type InventoryUserReference = Partial<UserData> & {
  id?: number | string;
};

export interface CategoryData {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  is_active?: boolean;
  structural?: boolean;
  parent?: string | null;
  parent_name?: string | null;
  default_location?: string | null;
  inventory_count?: number;
  children?: CategoryData[];
  created_at?: string;
  modified_at?: string;
  created_by?: number | string | null;
  modified_by?: number | string | null;
  created_by_details?: InventoryUserReference | null;
  modified_by_details?: InventoryUserReference | null;
}

export interface InventoryStockAnalytics {
  total_locations: number;
  average_purchase_price: string | number;
  stock_turnover_rate?: string | number;
  days_since_last_movement?: string | null;
  expiring_soon_count: number;
  quantity_reserved?: string | number;
  quantity_available?: string | number;
  location_breakdown?: Array<Record<string, unknown>>;
}

export interface InventoryData {
  id: string;
  name: string;
  description?: string | null;
  external_system_id?: string | null;
  inventory_type?: string;
  unit?: string | null;
  unit_name?: string | null;
  category?: string | null;
  category_name?: string | null;
  category_details?: CategoryData | null;
  active?: boolean;
  current_stock_level?: string | number;
  current_stock?: string | number;
  stock_status?: string;
  total_stock_value?: string | number;
  minimum_stock_level?: string | number;
  re_order_point?: string | number;
  re_order_quantity?: string | number;
  reorder_strategy?: string | null;
  reorder_strategy_name?: string | null;
  expiration_policy?: string | null;
  expiration_policy_name?: string | null;
  recall_policy?: string | null;
  recall_policy_name?: string | null;
  near_expiry_policy?: string | null;
  forecast_method?: string | null;
  forecast_method_name?: string | null;
  calculated_safety_stock?: string | number;
  safety_stock_level?: string | number;
  supplier_lead_time?: number | null;
  internal_processing_time?: number | null;
  holding_cost_per_unit?: string | number | null;
  ordering_cost?: string | number | null;
  stockout_cost?: string | number | null;
  default_supplier?: string | null;
  officer_in_charge?: string | number | null;
  created_by?: string | number | null;
  modified_by?: string | number | null;
  created_at?: string;
  modified_at?: string;
  batch_tracking_enabled?: boolean;
  automate_reorder?: boolean;
  assembly?: boolean;
  component?: boolean;
  trackable?: boolean;
  purchaseable?: boolean;
  salable?: boolean;
  locked?: boolean;
  testable?: boolean;
  virtual?: boolean;
  officer_in_charge_details?: InventoryUserReference | null;
  created_by_details?: InventoryUserReference | null;
  modified_by_details?: InventoryUserReference | null;
  stock_analytics?: InventoryStockAnalytics;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface InventorySummary extends InventoryData {
  current_stock_level?: string | number;
}

export interface InventoryStockSummary {
  total_quantity: string | number;
  quantity_reserved: string | number;
  quantity_available: string | number;
  total_locations: number;
  avg_purchase_price: string | number;
  total_value: string | number;
  location_breakdown: Array<Record<string, unknown>>;
  stock_status: string;
  expiring_lots: Array<Record<string, unknown>>;
}

export interface AdjustStockPayload {
  location_id: string;
  quantity_change: string | number;
  reason?: string;
}

export interface AdjustStockResponse {
  message: string;
  old_quantity: string | number;
  new_quantity: string | number;
  change: string | number;
}

export interface InventoryAnalytics {
  total_inventories: number;
  active_inventories: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_stock_value: string | number;
  category_breakdown: Array<Record<string, unknown>>;
  stock_status_distribution: Record<string, number>;
  top_value_items: Array<Record<string, unknown>>;
  expiring_soon: Array<Record<string, unknown>>;
}

export interface StockAnalytics {
  total_stock_items: number;
  total_locations: number;
  total_stock_value: string | number;
  location_distribution: Array<Record<string, unknown>>;
  aging_analysis: Record<string, unknown>;
}

export interface OrderAnalytics {
  total_purchase_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_order_value: string | number;
  monthly_trends: Array<Record<string, unknown>>;
  supplier_performance: Array<Record<string, unknown>>;
  status_distribution: Record<string, unknown>;
}

export interface InventoryListParams {
  active?: boolean;
  inventory_type?: string;
  category?: string;
  stock_status?: "low_stock" | "out_of_stock" | "needs_reorder";
  search?: string;
  ordering?: string;
}

export interface InventoryCategoryListParams {
  is_active?: boolean;
  structural?: boolean;
  parent?: string;
  search?: string;
  ordering?: string;
}

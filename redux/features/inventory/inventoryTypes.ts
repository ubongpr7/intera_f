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
  lot_count?: number;
  serial_count?: number;
  last_movement_at?: string | null;
}

export interface InventoryData {
  id: string;
  name: string;
  name_snapshot?: string;
  description?: string | null;
  sku_snapshot?: string;
  barcode_snapshot?: string;
  inventory_type?: string;
  default_uom_code?: string | null;
  stock_uom_code?: string | null;
  inventory_category?: string | null;
  status?: string | null;
  category_name?: string | null;
  category_details?: CategoryData | null;
  current_stock_level?: string | number;
  current_stock?: string | number;
  stock_status?: string;
  quantity_available?: string | number;
  quantity_reserved?: string | number;
  total_stock_value?: string | number;
  minimum_stock_level?: string | number;
  reorder_point?: string | number;
  reorder_quantity?: string | number;
  calculated_safety_stock?: string | number;
  safety_stock_level?: string | number;
  default_supplier?: string | null;
  default_supplier_name?: string | null;
  created_by?: string | number | null;
  modified_by?: string | number | null;
  created_at?: string;
  updated_at?: string;
  modified_at?: string;
  track_stock?: boolean;
  track_lot?: boolean;
  track_serial?: boolean;
  track_expiry?: boolean;
  allow_negative_stock?: boolean;
  product_template_id?: string | null;
  product_variant_id?: string | null;
  created_by_details?: InventoryUserReference | null;
  modified_by_details?: InventoryUserReference | null;
  updated_by_details?: InventoryUserReference | null;
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
  expiry_date?: string | null;
  lot_count?: number;
  serial_count?: number;
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
  total_inventory_items?: number;
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
  status?: string;
  inventory_type?: string;
  inventory_category?: string;
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

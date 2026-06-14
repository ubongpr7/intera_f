import type { UserData } from "../users/userTypes";

export interface StockLocationType {
  id: number | string;
  name: string;
  description?: string | null;
  [key: string]: unknown;
}

export interface StockLocationSummary {
  id: number | string;
  name: string;
  code?: string;
  parent_name?: string;
  location_type_name?: string;
  stock_count?: number;
  structural?: boolean;
  external?: boolean;
  physical_address?: string | null;
}

export interface StockLocation extends StockLocationSummary {
  created_at?: string;
  updated_at?: string;
  description?: string | null;
  official?: string | number | null;
  official_details?: Partial<UserData> | null;
  parent?: string | number | null;
  children?: StockLocationSummary[];
  stock_summary?: Record<string, unknown>;
  location_type?: string | number | null;
  physical_address?: string | null;
  code?: string;
}

export interface StockMovement {
  id: string;
  inventory_item?: string;
  inventory_item_name?: string;
  movement_type: string;
  movement_type_display?: string;
  quantity: string | number;
  unit_cost?: string | number | null;
  reference_type?: string | null;
  reference_id?: string | null;
  occurred_at?: string;
  from_location_id?: string | null;
  from_location_name?: string | null;
  to_location_id?: string | null;
  to_location_name?: string | null;
  lot_number?: string | null;
  serial_number?: string | null;
  notes?: string | null;
  actor_details?: Partial<UserData> | null;
}

export interface StockBalanceRow {
  id: string;
  inventory_item_id?: string | null;
  inventory_item_name?: string | null;
  stock_location_id?: string | null;
  stock_location_name?: string | null;
  stock_lot_id?: string | null;
  lot_number?: string | null;
  quantity_on_hand?: string | number;
  quantity_reserved?: string | number;
  quantity_available?: string | number;
}

export interface StockLot {
  id: string;
  inventory_item_id?: string | null;
  inventory_item_name?: string | null;
  lot_number: string;
  expiry_date?: string | null;
  unit_cost?: string | number | null;
  currency_code?: string | null;
  received_quantity?: string | number;
  remaining_quantity?: string | number;
  status?: string | null;
  supplier_name?: string | null;
  created_at?: string;
}

export interface StockSerial {
  id: string;
  inventory_item_id?: string | null;
  inventory_item_name?: string | null;
  serial_number: string;
  status?: string | null;
  stock_location_id?: string | null;
  stock_location_name?: string | null;
  stock_lot_id?: string | null;
  lot_number?: string | null;
  created_at?: string;
}

export interface InventoryItem {
  id: string;
  name?: string;
  description?: string | null;
  sku?: string;
  serial?: string | null;
  quantity?: string | number;
  quantity_reserved?: string | number;
  quantity_available?: string | number;
  status?: string;
  inventory_name?: string;
  location_name?: string;
  location_breakdown?: Array<Record<string, unknown>>;
  location_count?: number;
  expiry_date?: string | null;
  days_to_expiry?: number | null;
  purchase_price?: string | number | null;
  total_stock_value?: string | number | null;
  created_at?: string;
  updated_at?: string;
  quantity_w_unit?: string;
  product_variant?: string | null;
  display_image?: string | null;
  product_variant_image_url?: string | null;
  inventory_type?: string | null;
  inventory_category?: string | null;
  default_supplier?: string | null;
  track_stock?: boolean;
  track_lot?: boolean;
  track_serial?: boolean;
  track_expiry?: boolean;
  allow_negative_stock?: boolean;
  product_template_id?: string | null;
  product_variant_id?: string | null;
  metadata?: Record<string, unknown>;
  minimum_stock_level?: string | number;
  reorder_point?: string | number;
  reorder_quantity?: string | number;
  safety_stock_level?: string | number;
  lot_count?: number;
  serial_count?: number;
  current_pricing?: Record<string, unknown> | null;
  balances?: StockBalanceRow[];
  lots?: StockLot[];
  serials?: StockSerial[];
  active_reservations?: StockReservation[];
  recent_movements?: StockMovement[];
  created_by_user_id?: string | number | null;
  updated_by_user_id?: string | number | null;
  created_by_details?: Partial<UserData> | null;
  updated_by_details?: Partial<UserData> | null;
  inventory?: string | number | null;
  location?: string | number | null;
  parent?: string | number | null;
  packaging?: string | null;
  belongs_to?: string | number | null;
  notes?: string | null;
  link?: string | null;
  delete_on_deplete?: boolean;
  barcode_snapshot?: string | null;
}

export type StockItem = InventoryItem;

export interface StockTrackingEntry {
  id: string;
  tracking_type: string;
  tracking_type_display?: string;
  date?: string;
  notes?: string | null;
  deltas?: Record<string, unknown> | null;
  user_details?: Partial<UserData> | null;
}

export interface LowStockItem {
  id: string;
  name: string;
  sku?: string;
  quantity: string | number;
  inventory_name: string;
  minimum_stock_level: string | number;
  reorder_point: string | number;
  shortfall: string | number;
  product_variant?: string;
  display_image?: string | null;
}

export interface StockReservation {
  id: string;
  inventory_item?: string;
  inventory_item_name?: string;
  stock_lot?: string | null;
  lot_number?: string | null;
  stock_serial?: string | null;
  serial_number?: string | null;
  stock_location: string;
  location_name?: string;
  external_order_type: string;
  external_order_id: string;
  external_order_line_id?: string | null;
  reserved_quantity: string | number;
  fulfilled_quantity: string | number;
  remaining_quantity?: string | number;
  status: string;
  expires_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StockReservationListParams {
  inventory?: string;
  inventory_item?: string;
  stock_location?: string;
  status?: string;
  external_order_type?: string;
  external_order_id?: string;
  external_order_line_id?: string;
}

export interface StockReservationPayload {
  inventory_item_id: string;
  location_id: string;
  quantity: string | number;
  external_order_type: string;
  external_order_id: string;
  external_order_line_id?: string;
  stock_lot_id?: string;
  stock_serial_id?: string;
  serial_number?: string;
  expires_at?: string;
  notes?: string;
}

export interface StockReservationMutationPayload {
  quantity?: string | number;
  notes?: string;
}

export interface StockTransferPayload {
  to_location_id: string;
  quantity: string | number;
  inventory_item_id?: string;
  stock_lot_id?: string;
  stock_serial_id?: string;
  serial_number?: string;
}

export interface StockTransferResponse {
  message: string;
  transferred_quantity: string | number;
  from_location: string;
  to_location: string;
}

export interface StockStatusUpdatePayload {
  status: string;
  reason?: string;
}

export interface StockStatusUpdateResponse {
  message: string;
  old_status: string;
  new_status: string;
}

export interface CreateInventoryVariantPayload {
  product_variant: string;
  name?: string;
  description?: string;
  inventory_category_id?: string;
  inventory_type?: string;
  default_uom_code?: string;
  stock_uom_code?: string;
  track_stock?: boolean;
  track_lot?: boolean;
  track_serial?: boolean;
  track_expiry?: boolean;
  allow_negative_stock?: boolean;
  reorder_point?: string | number;
  reorder_quantity?: string | number;
  minimum_stock_level?: string | number;
  safety_stock_level?: string | number;
}

export interface StockAnalyticsResponse {
  total_inventory_items: number;
  total_stock_items?: number;
  total_locations: number;
  total_stock_value: string | number;
  location_distribution: Array<Record<string, unknown>>;
  aging_analysis: Record<string, unknown>;
}

export interface StockLocationResponse {
  results: StockLocation[];
  count: number;
  next: string | null;
}

export interface InventoryItemListParams {
  inventory_item?: string;
  inventory_category?: string;
  location?: string;
  purchase_order?: string;
  sales_order?: string;
  product_variant?: string;
  expiry_status?: "expired" | "expiring_soon";
  quantity_filter?: "zero" | "low";
  status?: string;
  search?: string;
  ordering?: string;
}

export type StockItemListParams = InventoryItemListParams;

export interface StockBalanceListParams {
  inventory_item?: string;
  stock_location?: string;
  stock_lot?: string;
  search?: string;
  ordering?: string;
}

export interface StockLotListParams {
  inventory_item?: string;
  supplier?: string;
  status?: string;
  search?: string;
  ordering?: string;
}

export interface StockSerialListParams {
  inventory_item?: string;
  stock_location?: string;
  stock_lot?: string;
  status?: string;
  search?: string;
  ordering?: string;
}

export interface StockMovementListParams {
  inventory_item?: string;
  movement_type?: string;
  reference_type?: string;
  reference_id?: string;
  stock_location?: string;
  from_location?: string;
  to_location?: string;
  stock_lot?: string;
  stock_serial?: string;
  search?: string;
  ordering?: string;
}

export interface StockLocationListParams {
  structural?: boolean;
  external?: boolean;
  location_type?: string;
  parent?: string;
  search?: string;
  ordering?: string;
}

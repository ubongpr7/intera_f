import type { UserData } from "../users/userTypes";

export const PurchaseOrderStatus = {
  pending: "pending",
  approved: "approved",
  issued: "issued",
  partially_received: "partially_received",
  received: "received",
  completed: "completed",
  cancelled: "cancelled",
} as const;

export const SalesOrderStatus = {
  pending: "pending",
  in_progress: "in_progress",
  shipped: "shipped",
  completed: "completed",
  cancelled: "cancelled",
} as const;

export const ReturnOrderStatus = {
  pending: "pending",
  awaiting_pickup: "awaiting_pickup",
  in_transit: "in_transit",
  completed: "completed",
  cancelled: "cancelled",
} as const;

type EntityId = string | number;

interface Attachment {
  id: EntityId;
  file?: string;
}

interface BaseOrder {
  id: EntityId;
  reference?: string;
  description?: string | null;
  link?: string | null;
  notes?: string | null;
  delivery_date?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: EntityId | null;
  responsible?: EntityId | null;
  responsible_details?: Partial<UserData> | null;
  contact?: EntityId | null;
  address?: EntityId | null;
  profile?: EntityId | null;
  currency?: string | null;
}

interface TotalPriceMixin {
  total_price?: string | number;
  order_currency?: string | null;
}

export interface InventoryItemReference {
  id: EntityId;
  name?: string;
  sku?: string;
  barcode?: string;
  product_template_id?: string | null;
  product_variant_id?: string | null;
  inventory_type?: string | null;
  track_stock?: boolean;
  track_lot?: boolean;
  track_serial?: boolean;
  minimum_stock_level?: string | number;
  reorder_point?: string | number;
  status?: string;
  unit_code?: string;
}

export interface PurchaseOrderLineItem {
  id?: EntityId;
  purchase_order?: EntityId;
  inventory_item?: EntityId | null;
  inventory_item_name?: string;
  inventory_item_details?: InventoryItemReference | null;
  quantity: string | number;
  unit_price: string | number;
  discount_rate?: string | number | null;
  tax_rate?: string | number | null;
  description?: string | null;
  batch_number?: string | null;
  expiry_date?: string | null;
  manufactured_date?: string | null;
  quantity_received?: string | number;
  fully_received?: boolean;
  tax_amount?: string | number;
  discount?: string | number;
  total_price?: string | number;
  quantity_w_unit?: string;
}

export interface PurchaseOrderInterface extends BaseOrder, TotalPriceMixin {
  approved_by?: EntityId | null;
  approved_at?: string | null;
  department?: string | null;
  workflow_state?: string | null;
  supplier?: EntityId | null;
  supplier_name?: string | null;
  supplier_reference?: string | null;
  supplier_details?: {
    id: EntityId;
    name: string;
    email?: string;
    phone?: string;
  } | null;
  received_by?: EntityId | null;
  received_by_details?: Partial<UserData> | null;
  status: string;
  issue_date?: string | null;
  complete_date?: string | null;
  line_items_count?: number;
  attachments?: Attachment[];
  line_items?: PurchaseOrderLineItem[];
  order_analytics?: {
    total_items: number;
    total_quantity: string | number;
    average_unit_price: string | number;
    total_discount: string | number;
    total_tax: string | number;
  };
}

export interface GoodsReceiptLineInterface {
  id: EntityId;
  goods_receipt?: EntityId;
  purchase_order_line?: EntityId | null;
  purchase_order_line_id?: EntityId | null;
  inventory_item?: EntityId | null;
  inventory_item_name?: string;
  stock_location?: EntityId | null;
  location_name?: string | null;
  received_quantity: string | number;
  unit_cost: string | number;
  lot_number?: string | null;
  manufactured_date?: string | null;
  expiry_date?: string | null;
  created_at?: string;
}

export interface GoodsReceiptInterface {
  id: EntityId;
  reference: string;
  purchase_order?: EntityId | null;
  purchase_order_reference?: string | null;
  supplier?: EntityId | null;
  supplier_name?: string | null;
  received_at?: string | null;
  received_by_user_id?: EntityId | null;
  received_by_details?: Partial<UserData> | null;
  line_count?: number;
  total_quantity?: string | number;
  location_count?: number;
  inventory_preview?: string[];
  location_preview?: string[];
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  lines?: GoodsReceiptLineInterface[];
}

export const notEditableFields: (keyof PurchaseOrderInterface)[] = [
  "id",
  "reference",
  "status",
  "approved_at",
  "issue_date",
  "complete_date",
  "created_at",
  "updated_at",
  "created_by",
  "line_items",
  "supplier_details",
  "responsible_details",
  "received_by_details",
  "order_analytics",
];

export interface SalesOrderLineItem {
  id?: EntityId;
  sales_order?: EntityId;
  inventory_item?: EntityId | null;
  inventory_name?: string;
  quantity: string | number;
  reserved_quantity?: string | number;
  shipped_quantity?: string | number;
  remaining_quantity?: string | number;
  reservable_quantity?: string | number;
  unit_price: string | number;
  discount_rate?: string | number | null;
  tax_rate?: string | number | null;
  description?: string | null;
  total_price?: string | number;
  created_at?: string;
  updated_at?: string;
}

export interface SalesOrderShipmentLineInterface {
  id: EntityId;
  sales_order_line: EntityId;
  inventory_name?: string;
  stock_location?: EntityId | null;
  location_name?: string | null;
  stock_lot?: EntityId | null;
  lot_number?: string | null;
  stock_serial?: EntityId | null;
  serial_number?: string | null;
  reservation_id?: string | null;
  quantity_shipped: string | number;
  notes?: string | null;
  created_at?: string;
}

export interface SalesOrderShipmentInterface {
  id: EntityId;
  order: EntityId;
  order_reference?: string | null;
  customer_name?: string | null;
  order_status?: string | null;
  reference: string;
  shipment_date?: string | null;
  delivery_date?: string | null;
  checked_by?: EntityId | null;
  checked_by_user_id?: EntityId | null;
  checked_by_details?: Partial<UserData> | null;
  tracking_number?: string | null;
  invoice_number?: string | null;
  link?: string | null;
  notes?: string | null;
  line_count?: number;
  total_quantity?: string | number;
  location_count?: number;
  inventory_preview?: string[];
  location_preview?: string[];
  lines?: SalesOrderShipmentLineInterface[];
  created_at?: string;
  updated_at?: string;
}

export interface SalesOrderInterface extends BaseOrder, TotalPriceMixin {
  customer?: EntityId | null;
  customer_name?: string | null;
  customer_reference?: string | null;
  shipped_by?: EntityId | null;
  shipped_by_details?: Partial<UserData> | null;
  status: string;
  issue_date?: string | null;
  shipment_date?: string | null;
  complete_date?: string | null;
  line_items_count?: number;
  attachments?: Attachment[];
  line_items?: SalesOrderLineItem[];
  shipments?: SalesOrderShipmentInterface[];
}

export interface ReturnOrderLineItem {
  id: EntityId;
  original_line_item?: EntityId;
  original_line_item_id?: EntityId;
  inventory_item_name?: string;
  quantity_returned: string | number;
  quantity_processed?: string | number;
  remaining_quantity?: string | number;
  return_reason?: string | null;
  unit_price?: string | number | null;
  tax_rate?: string | number | null;
  discount?: string | number | null;
  created_at?: string;
  updated_at?: string;
}

export interface ReturnOrderInterface extends BaseOrder, TotalPriceMixin {
  purchase_order?: EntityId | null;
  purchase_order_reference?: string | null;
  supplier_name?: string | null;
  status: string;
  issue_date?: string | null;
  complete_date?: string | null;
  responsible_details?: Partial<UserData> | null;
  line_items?: ReturnOrderLineItem[];
}

export interface PurchaseOrderWorkflowPayload {
  notes?: string;
  notify_supplier?: boolean;
}

export interface PurchaseOrderReceiveItemsPayload {
  received_items: Array<{
    line_item_id: EntityId;
    quantity_received: string | number;
    location_id: EntityId;
    lot_number?: string;
    expiry_date?: string;
    manufactured_date?: string;
    notes?: string;
  }>;
}

export interface PurchaseOrderReturnPayload {
  return_items: Array<{
    line_item_id: EntityId;
    quantity: string | number;
    reason: string;
  }>;
  return_reason?: string;
}

export interface SalesOrderReservePayload {
  reservation_items: Array<{
    line_item_id: EntityId;
    location_id: EntityId;
    quantity?: string | number;
    stock_lot_id?: EntityId;
    stock_serial_id?: EntityId;
    serial_number?: string;
    notes?: string;
  }>;
  expires_at?: string | null;
  notes?: string;
}

export interface SalesOrderReleasePayload {
  reservation_items: Array<{
    reservation_id: EntityId;
    quantity?: string | number;
    notes?: string;
  }>;
  notes?: string;
}

export interface SalesOrderShipPayload {
  shipment_items: Array<{
    reservation_id?: EntityId;
    line_item_id?: EntityId;
    location_id?: EntityId;
    quantity?: string | number;
    stock_lot_id?: EntityId;
    stock_serial_id?: EntityId;
    serial_number?: string;
    notes?: string;
  }>;
  shipment_date?: string | null;
  delivery_date?: string | null;
  tracking_number?: string;
  invoice_number?: string;
  link?: string;
  notes?: string;
}

export interface ReturnOrderProcessPayload {
  return_items: Array<{
    return_line_item_id: EntityId;
    location_id: EntityId;
    quantity?: string | number;
    stock_lot_id?: EntityId;
    stock_serial_id?: EntityId;
    serial_number?: string;
    notes?: string;
  }>;
  notes?: string;
}

export interface PurchaseOrderAnalyticsResponse {
  total_purchase_orders: number;
  pending_orders: number;
  approved_orders: number;
  issued_orders: number;
  received_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_order_value: string | number;
  average_order_value: string | number;
  monthly_trends: Array<Record<string, unknown>>;
  weekly_trends: Array<Record<string, unknown>>;
  supplier_performance: Array<Record<string, unknown>>;
  top_suppliers_by_value: Array<Record<string, unknown>>;
  status_distribution: Record<string, unknown>;
  average_processing_time: number;
  average_delivery_time: number;
  on_time_delivery_rate: number;
  total_savings: string | number;
  cost_per_order: string | number;
}

export interface PurchaseOrderDashboardSummary {
  [key: string]: unknown;
}

export interface GoodsReceiptListParams {
  purchase_order?: string;
  supplier?: string;
  stock_location?: string;
  inventory_item?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  ordering?: string;
}

export interface SalesOrderShipmentListParams {
  order?: string;
  customer?: string;
  stock_location?: string;
  inventory_item?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  ordering?: string;
}

export interface OrderListParams {
  status?: string;
  status_filter?: string;
  supplier?: string;
  customer?: string;
  issue_date?: string;
  shipment_date?: string;
  delivery_date?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  ordering?: string;
}

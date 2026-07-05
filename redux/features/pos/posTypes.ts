export type DecimalValue = string | number;

export type POSSessionStatus = "open" | "closed" | "suspended";
export type POSOrderStatus = "draft" | "pending" | "completed" | "cancelled" | "refunded";
export type POSPaymentStatus = "unpaid" | "partially_paid" | "paid" | "refunded";
export type POSInventoryStatus =
  | "not_required"
  | "reservation_pending"
  | "partially_reserved"
  | "reserved"
  | "fulfillment_pending"
  | "partially_fulfilled"
  | "fulfilled"
  | "released"
  | "failed";
export type POSPaymentMethod = "cash" | "card" | "mobile" | "qr" | "loyalty" | "gift_card";
export type POSDiscountType = "percentage" | "fixed";
export type POSRemittanceStatus = "pending_handover" | "handed_over" | "received" | "deposited" | "reconciled" | "disputed";
export type POSRemittanceDestinationType = "branch_safe" | "central_vault" | "bank" | "owner" | "other";

export interface POSAuditFields {
  id: string;
  sync_identifier?: string;
  profile?: string;
  profile_id?: number | null;
  created_by?: string | null;
  created_by_user_id?: number | null;
  modified_by?: string | null;
  updated_by_user_id?: number | null;
  created_at: string;
  updated_at: string;
  is_synced?: boolean;
  last_sync_attempt?: string | null;
  sync_version?: number;
}

export interface POSConfiguration extends POSAuditFields {
  name: string;
  currency: string;
  tax_inclusive: boolean;
  default_tax_rate: DecimalValue;
  allow_negative_stock: boolean;
  require_customer: boolean;
  auto_print_receipt: boolean;
  receipt_header: string;
  receipt_footer: string;
  allow_split_payment: boolean;
  max_discount_percent: DecimalValue;
}

export interface POSTerminal extends POSAuditFields {
  name: string;
  location: string;
  location_sync_identifier?: string | null;
  structural_location_sync_identifier?: string | null;
  is_active: boolean;
  configuration: string;
  assigned_device_identifier?: string | null;
  assigned_device_label?: string;
  is_bound_to_current_device?: boolean;
}

export interface POSTerminalDeviceBinding extends POSAuditFields {
  terminal: string;
  terminal_name?: string;
  device_identifier: string;
  device_label?: string;
  is_active: boolean;
  assigned_by_user_id?: number | null;
  detached_by_user_id?: number | null;
  detached_at?: string | null;
  last_seen_at?: string | null;
}

export interface POSCustomer extends POSAuditFields {
  name: string;
  email: string;
  phone: string;
  address: string;
  loyalty_points: number;
}

export interface POSTable extends POSAuditFields {
  number: string;
  name: string;
  capacity: number;
  is_active: boolean;
}

export interface POSSession extends POSAuditFields {
  terminal: string;
  previous_session?: string | null;
  user?: string | null;
  session_user_id?: number | null;
  opened_by_user_id?: number | null;
  closed_by_user_id?: number | null;
  status: POSSessionStatus;
  opening_time: string;
  closing_time?: string | null;
  opening_balance: DecimalValue;
  expected_opening_balance?: DecimalValue;
  opening_variance_amount?: DecimalValue;
  opening_variance_reason?: string;
  opening_verified_at?: string | null;
  opening_verified_by_user_id?: number | null;
  closing_balance?: DecimalValue | null;
  expected_balance: DecimalValue;
  total_sales?: DecimalValue;
  completed_total_sales?: DecimalValue;
  closeout_variance?: DecimalValue | null;
}

export interface POSSessionCloseoutOrder {
  id: string;
  order_number: string;
  status: POSOrderStatus;
  payment_status: POSPaymentStatus;
  inventory_status: POSInventoryStatus;
  total_amount: DecimalValue;
  created_at: string;
}

export interface POSSessionCloseoutPaymentMethodTotal {
  payment_method: POSPaymentMethod;
  total: DecimalValue;
  count: number;
}

export interface POSSessionCloseoutSummary {
  session_id: string;
  session_sync_identifier: string;
  status: POSSessionStatus;
  opening_time: string;
  closing_time?: string | null;
  opening_balance: DecimalValue;
  expected_balance: DecimalValue;
  closing_balance?: DecimalValue | null;
  variance?: DecimalValue | null;
  total_sales: DecimalValue;
  paid_orders_count: number;
  completed_total_sales: DecimalValue;
  cash_payments_total: DecimalValue;
  non_cash_payments_total: DecimalValue;
  change_given_total: DecimalValue;
  completed_orders_count: number;
  unresolved_orders_count: number;
  unresolved_orders: POSSessionCloseoutOrder[];
  payment_method_totals: POSSessionCloseoutPaymentMethodTotal[];
  can_close: boolean;
}

export interface POSSessionOpeningDefaults {
  recommended_opening_balance: DecimalValue;
  expected_opening_balance: DecimalValue;
  expected_opening_balance_source: string;
  carry_forward_balance?: DecimalValue | null;
  last_closed_session_id?: string | null;
  last_closed_session_closed_at?: string | null;
  last_remittance_id?: string | null;
  last_remittance_status?: POSRemittanceStatus | null;
  last_handover_amount?: DecimalValue | null;
  last_counted_amount?: DecimalValue | null;
}

export interface POSOrderItem extends POSAuditFields {
  order: string;
  catalog_variant_id?: string | null;
  inventory_item_id?: string | null;
  product_name: string;
  variant_name: string;
  sku_snapshot: string;
  barcode_snapshot: string;
  stock_status_snapshot: string;
  available_quantity_snapshot: DecimalValue;
  quantity: DecimalValue;
  unit_price: DecimalValue;
  tax_rate: DecimalValue;
  discount_percent: DecimalValue;
  reserved_quantity: DecimalValue;
  fulfilled_quantity: DecimalValue;
  inventory_status: POSInventoryStatus;
  reservation_reference: string;
  shipment_reference: string;
  stock_location_id?: string | null;
  stock_lot_id?: string | null;
  stock_serial_id?: string | null;
  reservation_requested_at?: string | null;
  reserved_at?: string | null;
  fulfilled_at?: string | null;
  released_at?: string | null;
  inventory_failure_reason: string;
  line_subtotal: DecimalValue;
  discount_amount: DecimalValue;
  tax_amount: DecimalValue;
  line_total: DecimalValue;
  customizations: Record<string, unknown>;
  special_instructions: string;
  customization_cost?: number;
  requires_inventory_processing?: boolean;
  remaining_to_reserve?: DecimalValue;
  remaining_to_fulfill?: DecimalValue;
}

export interface POSPayment extends POSAuditFields {
  order: string;
  payment_method: POSPaymentMethod;
  amount: DecimalValue;
  reference_number: string;
  cash_received?: DecimalValue | null;
  change_given: DecimalValue;
  is_processed: boolean;
  processed_at?: string | null;
}

export interface POSOrder extends POSAuditFields {
  session: string;
  customer?: string | null;
  table?: string | null;
  order_number: string;
  status: POSOrderStatus;
  payment_status: POSPaymentStatus;
  inventory_status: POSInventoryStatus;
  subtotal: DecimalValue;
  tax_amount: DecimalValue;
  discount_amount: DecimalValue;
  tip_amount: DecimalValue;
  total_amount: DecimalValue;
  notes: string;
  completed_at?: string | null;
  reservation_requested_at?: string | null;
  reserved_at?: string | null;
  inventory_fulfilled_at?: string | null;
  inventory_released_at?: string | null;
  inventory_failure_reason: string;
  items?: POSOrderItem[];
  payments?: POSPayment[];
  customer_name?: string;
  table_number?: string;
  total_paid?: number;
  remaining_balance?: number;
  requires_inventory_processing?: boolean;
}

export interface POSDiscount extends POSAuditFields {
  name: string;
  discount_type: POSDiscountType;
  value: DecimalValue;
  is_active: boolean;
  requires_approval: boolean;
  min_order_amount?: DecimalValue | null;
  max_discount_amount?: DecimalValue | null;
}

export interface POSRemittance extends POSAuditFields {
  session: string;
  terminal: string;
  terminal_name?: string;
  cashier_user_id?: number | null;
  expected_amount: DecimalValue;
  counted_amount: DecimalValue;
  variance_amount: DecimalValue;
  handover_amount: DecimalValue;
  received_amount: DecimalValue;
  deposited_amount: DecimalValue;
  status: POSRemittanceStatus;
  destination_type: POSRemittanceDestinationType;
  destination_reference: string;
  notes: string;
  dispute_reason: string;
  handed_over_at?: string | null;
  received_at?: string | null;
  deposited_at?: string | null;
  reconciled_at?: string | null;
  disputed_at?: string | null;
  handed_over_by_user_id?: number | null;
  received_by_user_id?: number | null;
  deposited_by_user_id?: number | null;
  reconciled_by_user_id?: number | null;
  disputed_by_user_id?: number | null;
  next_session_id?: string | null;
  next_session_user_id?: number | null;
  next_session_opening_time?: string | null;
  next_session_opening_balance?: DecimalValue | null;
  next_session_expected_opening_balance?: DecimalValue | null;
  next_session_opening_variance_amount?: DecimalValue | null;
  next_session_opening_variance_reason?: string | null;
  next_session_opening_verified_at?: string | null;
  next_session_opening_verified_by_user_id?: number | null;
}

export interface POSRemittanceActionPayload {
  amount?: DecimalValue;
  notes?: string;
  destination_type?: POSRemittanceDestinationType;
  destination_reference?: string;
  reason?: string;
}

export interface POSReceipt extends POSAuditFields {
  order: string;
  receipt_number: string;
  printed_at?: string | null;
  emailed_at?: string | null;
  email_address: string;
}

export interface POSHoldOrder extends POSAuditFields {
  order_data: Record<string, unknown>;
  hold_reason: string;
  held_by?: string | null;
  held_by_user_id?: number | null;
  retrieved_at?: string | null;
  retrieved_by?: string | null;
  retrieved_by_user_id?: number | null;
}

export interface POSOrderInventoryMutationItem {
  item_id: string;
  quantity?: DecimalValue;
  reservation_reference?: string;
  shipment_reference?: string;
  stock_location_id?: string | null;
  stock_lot_id?: string | null;
  stock_serial_id?: string | null;
  failure_reason?: string;
}

export interface POSOrderInventoryMutationPayload {
  items?: POSOrderInventoryMutationItem[];
  notes?: string;
}

export interface POSPaymentInput {
  payment_method: POSPaymentMethod;
  amount: DecimalValue;
  cash_received?: DecimalValue | null;
  reference_number?: string;
}

export interface POSProcessPaymentPayload {
  payments: POSPaymentInput[];
  create_receipt?: boolean;
  print_receipt?: boolean;
  email_receipt?: boolean;
  email_address?: string;
}

export interface POSCreateOrGetDraftPayload {
  session_id: string;
  customer_id?: string | null;
  table_id?: string | null;
}

export interface POSAddOrderItemPayload {
  variant_id: string;
  quantity?: DecimalValue;
  customizations?: Record<string, unknown>;
  special_instructions?: string;
}

export interface POSUpdateOrderItemPayload {
  item_id: string;
  quantity?: DecimalValue;
}

export interface POSRetrieveHeldOrderPayload {
  hold_order_id: string;
  session_id: string;
}

export interface POSOrderInventorySummaryItem {
  item_id: string;
  product_name: string;
  variant_name: string;
  inventory_item_id?: string | null;
  quantity: DecimalValue;
  reserved_quantity: DecimalValue;
  fulfilled_quantity: DecimalValue;
  inventory_status: POSInventoryStatus;
  available_quantity_snapshot: DecimalValue;
  projected_available_quantity: DecimalValue;
  projected_reserved_quantity: DecimalValue;
  projected_stock_status: string;
}

export interface POSOrderInventorySummary {
  order_id: string;
  order_number: string;
  status: POSOrderStatus;
  payment_status: POSPaymentStatus;
  inventory_status: POSInventoryStatus;
  items: POSOrderInventorySummaryItem[];
}

export interface POSDailySalesPaymentMethodBreakdown {
  payments__payment_method: POSPaymentMethod | null;
  count: number;
  total: DecimalValue;
}

export interface POSDailySalesAnalytics {
  total_orders: number;
  total_sales: DecimalValue;
  completed_orders_count?: number;
  completed_total_sales?: DecimalValue;
  average_order_value: DecimalValue;
  total_tax: DecimalValue;
  total_discounts: DecimalValue;
  payment_methods: POSDailySalesPaymentMethodBreakdown[];
}

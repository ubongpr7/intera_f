
export interface TopSellingProduct {
    id: string;
    name: string;
    total_sold: number;
  }
  
  export interface RecentPriceChange {
    id: string;
    product_name: string;
    old_price: number;
    new_price: number;
    changed_at: string;
  }
  
  export interface HeldOrder {
    id: string;
    customer_name: string;
    total_amount: number;
  }
  
  export interface InventoryCategory {
    id: string;
    name: string;
    inventory_count: number;
  }
  
  export interface StockLocation {
    id: string;
    name: string;
    total_stock_value: number;
  }
  
  export interface Supplier {
    id: string;
    name: string;
    total_purchase_order_value: number;
  }
  
  export interface PendingPurchaseOrder {
    id: string;
    order_number: string;
    supplier_name: string;
    total_amount: number;
  }
  
  export interface RecentCustomer {
    id: string;
    name: string;
    last_seen: string;
  }
  
  export interface BulkTask {
    task_id: string;
    status: string;
    created_at: string;
  }
  
  export interface PosSession {
    id: string;
    status: string;
    opened_by: string;
    opened_at: string;
  }
  
// Enum for status (assuming your PurchaseOrderStatus values)
export enum PurchaseOrderStatus {
  PENDING = 0,
  ISSUED = 1,
  RECEIVED = 2,
  COMPLETED = 3,
  CANCELLED = 4
}

interface BaseOrder {
    id: number;
    description?: string;
    link?: string;
    target_date?: string; // ISO date string
    creation_date?: string; // ISO date string
    created_by?: number; // User ID
    responsible?: number; // User ID
    contact?: number; // Contact ID
    address?: number; // CompanyAddress ID
  }
  
  interface TotalPriceMixin {
    total_price?: number;
    order_currency?: string; // 3-letter currency code (e.g., "USD")
  }
  
export  interface PurchaseOrderInterface extends BaseOrder, TotalPriceMixin {
    reference: string;
    status: PurchaseOrderStatus;
    supplier: number; // Company ID
    supplier_reference?: string;
    received_by?: number; // User ID
    issue_date?: string; // ISO date string
    complete_date?: string; // ISO date string
    attachments?: Attachment[];
    line_items?: PurchaseOrderLineItem[];
  }
  
  // Supporting interfaces
  interface Attachment {
    id: number;
    file: string; // URL to attached file
  }
  
  interface PurchaseOrderLineItem {
    id: number;
    stock_item: number; // Product ID
    quantity: number;
    unit_price: number;
    total_price: number;
  }
  
  

export  interface SalesOrderInterface extends BaseOrder, TotalPriceMixin {
    customer_reference?: string;
    shipment_date?: string;      // ISO date string
    shipped_by?: number;         // User ID
    attachments?: Attachment[];
  }
  
export  interface SalesOrderShipmentInterface {
    id: number;
    order: number;               // SalesOrder ID
    shipment_date?: string;      // ISO date string
    delivery_date?: string;      // ISO date string
    checked_by?: number;         // User ID
    reference: string;
    tracking_number?: string;
    invoice_number?: string;
    link?: string;
    creation_date?: string;      // ISO date string
    // Add other InventoryMixin fields if needed
  }
  
export  interface ReturnOrderInterface extends BaseOrder, TotalPriceMixin {
    reference: string;
    customer?: number;           // Company ID
    status: ReturnOrderStatus;
    customer_reference?: string;
    issue_date?: string;         // ISO date string
    complete_date?: string;      // ISO date string
    attachments?: Attachment[];
  }
  
  enum SalesOrderStatus {
    DRAFT = 10,
    PENDING = 20,
    SHIPPED = 30,
    DELIVERED = 40,
    CANCELLED = 50
  }
  
  enum ReturnOrderStatus {
    PENDING = 0,
    RECEIVED = 1,
    COMPLETED = 2,
    CANCELLED = 3
  }
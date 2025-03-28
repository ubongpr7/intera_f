export enum PurchaseOrderStatus {
  PENDING = 10,
  ISSUED = 20,
  RECEIVED = 30,
  COMPLETED = 40,
  CANCELLED = 50
}

interface BaseOrder {
    id: number;
    description?: string;
    link?: string;
    delivery_date?: string;
    created_at?: string; 
    created_by?: number;
    responsible?: number; 
    contact?: number;
    inventory: number;
    currency?: string;
    address?: number;
  }
  
  interface TotalPriceMixin {
    total_price?: number;
    order_currency?: string; 
  }
  
export  interface PurchaseOrderInterface extends BaseOrder, TotalPriceMixin {
    reference: string;
    // status: PurchaseOrderStatus;
    supplier: number; 
    supplier_reference?: string;
    received_by?: number;
    status?: number; 
    issue_date?: string; 
    complete_date?: string; 
    attachments?: Attachment[];
    line_items?: PurchaseOrderLineItem[];
  }
export const notEditableFields: (keyof PurchaseOrderInterface)[] =[
  "id",
  "complete_date",
  "created_at",
  "created_by",
  "issue_date",
  "reference",
  "status",
  "supplier_reference",
  "total_price",
  "address",
  "received_by",
  "line_items",
  "contact",

]
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
export const PurchaseOrderStatus = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  issued: 'issued',
  received: 'received',
  completed: 'completed',
  cancelled: 'cancelled',
  returned: 'returned'
};
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
    received_date?: string;
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
    status?: string; 
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

  export interface PurchaseOrderLineItem {
    id?: number; 
    purchase_order: string; 
    stock_item?: number | null;
    quantity: number;
    unit_price: number;
    tax_rate?: number | null; 
    tax_amount?: number; 
    discount_rate?: number | null;
    discount?: number; 
    total_price?: number; 
    stock_item_name?: string;
    stock_item_code?: string;
    quantity_w_unit:string;
  }
  
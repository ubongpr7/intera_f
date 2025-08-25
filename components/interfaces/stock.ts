export interface StockItem {
    id: string;
    name: string;
    inventory: string;
    IPN:string
    created_at: Date;
    updated_at: Date;
    quantity: number;
    product_variant?:string;
    location: string;
    parent: string;
    serial: string;
    batch: string;
    packaging: string;
    status: string;
    expiry_date: Date;
    purchase_order: string;
    sales_order: string;
    purchase_price: number;
    delete_on_deplete: boolean;
    notes: string;
    link: string;
    customer: string;
    sku: string;
    belongs_to: string;
    reference: string;
    quantity_w_unit:string;
  }

// stock-location.interface.ts
export interface StockLocationType {
  id: number;
  name: string;
  description: string;
  
}

export interface StockLocation {
  id: number;
  created_at: string;
  updated_at: string;
  parent_name:string
  physical_address:string;
  location_type_name:string
  name: string;
  code: string;
  description: string;
  official: number | null;
  structural: boolean;
  parent: number | null;
  external: boolean;
  location_type: number | null;
  lft: number;
  rght: number;
  tree_id: number;
  level: number;
}

export interface StockLocationResponse {
  results: StockLocation[];
  count: number;
  next: string | null;
}
export interface InventoryData {
    // Step 1
    name: string;
    description?: string;
    inventory_type: number;
    profile?: number;
    category?: string;
    unit?: number;
    id?:number;
    // Step 2
    minimum_stock_level: number;
    re_order_point: number;
    re_order_quantity: number;
    safety_stock_level: number;
    automate_reorder: boolean;
    unit_name?:string;
    recall_policy_name?:string;
    // Step 3
    supplier_lead_time: number;
    internal_processing_time: number;
    reorder_strategy: 'FQ' | 'FI' | 'DY';
  
    // Step 4
    expiration_threshold: number;
    batch_tracking_enabled: boolean;
    expiration_policy: '0' | '1';
    recall_policy: '0' | '1' | '3' | '4' | '5';
    near_expiry_policy: 'DISCOUNT' | 'DONATE' | 'DESTROY' | 'RETURN';
    reorder_strategy_name:string;
    forecast_method_name:string;
    expiration_policy_name:string;

    // Step 5
    holding_cost_per_unit: number;
    ordering_cost: number;
    stockout_cost: number;
  
    // Step 6
    forecast_method: 'SA' | 'MA' | 'ES';
    supplier_reliability_score?: number;
    alert_threshold: number;
    external_system_id?: string;
    category_name?: string;
    created_at?:string;
    updated_at?:string;

  }
  
  export interface InventoryType {
    id: number;
    name: string;
  }
  
  export interface CategoryData{
    id:number;
    name:string;
    inventory_count:number;
    description?:string;
    parent?:string;
  }
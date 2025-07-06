import { UserData } from "./User";
export const inventoryTypes =[
        {
          id:'raw_material',
          text:'Raw Material'         
        },
        {
          id:'finished_good',
          text:'Finished Good'         
        },
        
        {
          id:'consumable',
          text:'Consumable'         
        },
        {
          id:'work_in_progress',
          text:'Work In Progress'         
        },
        {
          id:'maintenance_spare_part',
          text:'Maintenance Spare Part'         
        },
        {
          id:'tooling',
          text:'Tooling'         
        },
        {
          id:'packaging',
          text:'Packaging'         
        },

      ]
export interface InventoryData {
    // Step 1
    name: string;
    description?: string;
    current_stock_level:number;
    inventory_type: number;
    profile?: number;
    category?: string;
    id?:number;

    minimum_stock_level: number;
    re_order_point: number;
    re_order_quantity: number;
    safety_stock_level: number;
    recall_policy_name?:string;
    // Step 3
    supplier_lead_time: number;
    internal_processing_time: number;
    reorder_strategy: 'FQ' | 'FI' | 'DY';
  
    // Step 4
    expiration_threshold: number;
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

    // Step 7
    assembly:boolean;
    batch_tracking_enabled:boolean;
    automate_reorder:boolean;
    component:boolean;
    trackable:boolean;
    purchaseable:boolean;
    active:boolean;
    salable:boolean;
    locked:boolean;
    testable:boolean;
    virtual:boolean;

    unit:string
    // not editable
    external_system_id?: string;
    category_name?: string;
    created_at?:string;
    updated_at?:string;
    created_by?:number
    officer_in_charge:string
    modified_by_details:UserData;
    officer_in_charge_details:UserData;
    created_by_details?:UserData
    category_details?:CategoryData
    stock_status?:string
    total_stock_value?:number
    current_stock:number;
    calculated_safety_stock:number;
    default_supplier:string
    stock_analytics?:{
      total_locations:number,
      average_purchase_price:number,
      days_since_last_movement:string
      expiring_soon_count:number
    }
    external_references?:{}
    sync_status?:string
    unit_name:string;
    last_sync_timestamp:string;
    sync_error_message?:string

  }
  
  export interface InventoryType {
    id: number;
    name: string;
  }
  
  export interface CategoryData{
    id:string;
    name:string;
    inventory_count:number;
    description?:string;
    parent?:string;
    parent_name?:string
    default_location?:string
    structural:boolean

  }
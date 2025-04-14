
import { InventoryData } from "../interfaces/inventory";



  export const InventoryKeyInfo = {
    // Step 1
    // name: 'The name of the inventory item. This should be unique and descriptive.',
    description: 'A brief description of the inventory item.',
    inventory_type: 'The type of inventory (e.g., raw material, finished goods).',
    profile: 'The profile associated with this inventory item (if applicable).',
    category: 'The category to which this inventory item belongs.',
    unit: 'The unit of measurement for this inventory item (e.g., pieces, kilograms).',
  
    // Step 2
    minimum_stock_level: 'The minimum stock level is the lowest quantity of this item that should be kept in stock.',
    re_order_point: 'The re-order point is the stock level at which a new order should be placed.',
    re_order_quantity: 'The quantity to re-order when the stock level reaches the re-order point.',
    safety_stock_level: 'The safety stock level is the extra stock kept to prevent stockouts.',
    automate_reorder: 'Enable this to automatically re-order stock when it reaches the re-order point.',
  
    // Step 3
    supplier_lead_time: 'The time it takes for the supplier to deliver the item after placing an order.',
    internal_processing_time: 'The time it takes to process the item internally after receiving it.',
    reorder_strategy: 'The strategy used for re-ordering stock (e.g., Fixed Quantity, Fixed Interval, Demand-Based).',
  
    // Step 4
    expiration_threshold: 'The number of days before the item expires.',
    batch_tracking_enabled: 'Enable this to track items by batch or lot number.',
    expiration_policy: 'The policy for handling expired items (e.g., Dispose of Stock, Return to Manufacturer).',
    recall_policy: 'The policy for handling recalled items (e.g., Remove from Stock, Notify Customers).',
    near_expiry_policy: 'The policy for handling items nearing expiration (e.g., Sell at Discount, Donate to Charity).',
  
    // Step 5
    holding_cost_per_unit: 'The cost of holding one unit of this item in stock.',
    ordering_cost: 'The cost of placing an order for this item.',
    stockout_cost: 'The cost incurred when this item is out of stock.',
  
    // Step 6
    forecast_method: 'The method used to forecast demand for this item (e.g., Simple Average, Moving Average).',
    supplier_reliability_score: 'A score indicating the reliability of the supplier for this item.',
    alert_threshold: 'The stock level at which an alert should be triggered.',
  };


export const InventoryInterfaceKeys: (keyof InventoryData)[]=[
    'name', 'description','category', 'inventory_type','reorder_strategy','re_order_quantity',
     'safety_stock_level', 'minimum_stock_level', 're_order_point','alert_threshold',
      'automate_reorder', 'supplier_lead_time',
    'internal_processing_time', 'expiration_threshold', 'holding_cost_per_unit',
    'ordering_cost', 'stockout_cost',  'batch_tracking_enabled',
    'expiration_policy', 'recall_policy', 'near_expiry_policy',
    'forecast_method', 'supplier_reliability_score',
  
]

export const defaultValues: Partial<InventoryData> = {
    // name: 'New Inventory Item',
    // description: 'A new item in the inventory',
    internal_processing_time:2,
    expiration_threshold:0,
    minimum_stock_level: 25,
    re_order_point: 30,
    re_order_quantity: 10000,
    alert_threshold:35,
    safety_stock_level: 20,
    automate_reorder: true,
    supplier_lead_time:7,
    holding_cost_per_unit:75,
    batch_tracking_enabled:false,
    stockout_cost:75,
    supplier_reliability_score:50,
    ordering_cost:0
  };
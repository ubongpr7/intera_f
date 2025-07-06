import { PurchaseOrderInterface, PurchaseOrderStatus } from "../../interfaces/order";

// Enum for status (assuming your PurchaseOrderStatus values)


export const PurchaseOrderKeyInfo = {
    // BaseOrder fields
    description: 'A brief description of the purchase order (optional).',
    link: 'A link to an external page related to the purchase order (optional).',
    target_date: 'The expected delivery date for the purchase order (optional).',
    creation_date: 'The date the purchase order was created (auto-generated).',
    created_by: 'The user who created the purchase order (auto-captured).',
    responsible: 'The user or group responsible for managing the purchase order (optional).',
    contact: 'The point of contact for this order (optional).',
    address: 'The company address for this order (optional).',
  
    // TotalPriceMixin fields
    total_price: 'The total price for this purchase order (optional).',
    order_currency: 'The currency for this purchase order (e.g., USD, EUR).',
  
    // PurchaseOrder-specific fields
    reference: 'The unique reference number for the purchase order (required).',
    status: 'The current status of the purchase order (e.g., Pending, Issued, Completed).',
    supplier: 'The company supplying the goods in the order (required).',
    supplier_reference: 'The supplier\'s reference code for the order (optional).',
    received_by: 'The user who received the goods (optional).',
    issue_date: 'The date the purchase order was issued (optional).',
    complete_date: 'The date the purchase order was completed (optional).',
  
    // Line items (optional)
    line_items: 'A list of items included in the purchase order (optional).',
  };
  export const defaultValues: Partial<PurchaseOrderInterface> = {
    description: 'New Purchase Order',
    link: '',
    delivery_date: new Date().toISOString().split('T')[0],
    
    total_price: 0,
    // order_currency: 'USD',
    reference: `PO-${new Date().getFullYear()}-001`, 
    status: PurchaseOrderStatus.pending, 
    supplier_reference: '',
    
    // line_items: [], 
  };
  
  export const PurchaseOrderInterfaceKeys: (keyof PurchaseOrderInterface)[] = [
    // 'reference',
    'description',
    'delivery_date',
    'responsible',
    'link',
    'supplier',
    'contact',
    // 'address',
    // TotalPriceMixin fields
    // 'total_price',
    'order_currency',
    // PurchaseOrder-specific fields
    // 'status',
    // 'supplier_reference',
    // 'received_by',
    // 'issue_date',
    // 'complete_date',

  
  ];

export interface ProductData {
    id: number;
    name: string;
    description: string;
    base_price: number;
    is_template: boolean;
    category: number | null;
    attributes: number[];
    pricing_strategy?: number;
    unit?: number;
    created_by?: number;
    created_at: string;
    updated_at: string;
    category_name:string;
    variants: ProductVariant[];
  }
  
  export interface ProductCategoryData {
    id: number;
    name: string;
    parent: number | null;
    description?: string;
    product_count:string
    is_active: boolean;
    profile: number;
    slug: string;
    parent_name:string;
  }
  
  export interface PricingStrategy {
    id: number;
    strategy: 'margin' | 'multiplier' | 'fixed';
    margin_percentage?: number;
    market_multiplier?: number;
    min_price?: number;
    max_price?: number;
  }
  
  export interface ProductAttribute {
    id: number;
    profile: number;
    name: string;
    values: ProductAttributeValue[];
  }
  
  export interface ProductAttributeValue {
    id: number;
    attribute: number;
    value: string;
  }
  
  export interface ProductAttributeLink {
    id: number;
    product: number;
    attribute: number;
    required: boolean;
    order: number;
    default_modifier: number;
  }
  
  export interface ProductVariant {
    id: number;
    product: number;
    sku: string;
    active: boolean;
    variant_number: number;
    selling_price: number;
    total_stock: number;
    attributes: ProductVariantAttribute[];
  }
  
  export interface ProductVariantAttribute {
    id: number;
    variant: number;
    attribute_link: number;
    value: number;
    custom_modifier?: number;
  }
  
  export interface PriceChangeHistory {
    id: number;
    product: number;
    old_price: number;
    new_price: number;
    changed_by?: number;
    change_type: 'auto' | 'manual' | 'override';
    status: 'pending' | 'approved' | 'rejected';
    timestamp: string;
    reason?: string;
  }
  
  export interface PurchasePriceHistory {
    id: number;
    variant: number;
    purchase_price: number;
    effective_start: string;
    effective_end?: string;
    source?: number;
  }
  
  export interface PricingRule {
    id: number;
    rule_type: 'BATCH' | 'CUSTOMER' | 'PROMO' | 'VOLUME';
    variant: number;
    value: number;
    start_date?: string;
    end_date?: string;
    min_quantity?: number;
  }
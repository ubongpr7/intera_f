export interface UUIDBaseModel {
  id: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileMixin extends UUIDBaseModel {
  profile: string;
  created_by?: string;
}

export interface Attachment {
  id: string;
  file?: string;
  file_url?: string;
  file_type: 'IMAGE' | 'DOC' | 'VIDEO' | 'OTHER';
  purpose: 'MAIN_IMAGE' | 'GALLERY' | 'MANUAL' | 'SPEC' | 'BARCODE' | 'QR_CODE';
  uploaded_by?: string;
  uploaded_by_details?: {
    id: string;
    name?: string;
    email?: string;
  };
  uploaded_at: string;
  is_primary: boolean;
  description?: string;
  file_size?: number;
  file_size_formatted?: string;
  mime_type?: string;
}

export interface ProductAttribute extends UUIDBaseModel {
  name: string;
  attribute_type: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'COLOR' | 'SIZE' | 'WEIGHT' | 'DIMENSION';
  is_required: boolean;
  is_variant_attribute: boolean;
  display_order: number;
  unit?: string;
  description?: string;
  category_tags?: string;
  values_count?: number;
  values: ProductAttributeValue[];
  created_by_details?: {
    id: string;
    name?: string;
    email?: string;
  };
}

export interface ProductAttributeValue {
  id: string;
  attribute: string;
  attribute_name?: string;
  attribute_type?: string;
  value: string;
  display_value?: string;
  effective_display_value: string;
  color_code?: string;
  is_active: boolean;
  sort_order: number;
}

export interface PricingStrategy extends UUIDBaseModel {
  name: string;
  strategy: 'margin' | 'multiplier' | 'fixed' | 'dynamic' | 'tiered';
  margin_percentage?: number;
  market_multiplier?: number;
  min_price?: number;
  max_price?: number;
  demand_factor?: number;
  seasonal_factor?: number;
  tier_1_quantity?: number;
  tier_1_discount?: number;
  tier_2_quantity?: number;
  tier_2_discount?: number;
  tier_3_quantity?: number;
  tier_3_discount?: number;
  is_active: boolean;
  calculated_price_example?: number;
  product:string
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  parent?: string;
  parent_name?: string;
  description?: string;
  pos_color?: string;
  pos_icon?: string;
  is_pos_visible: boolean;
  display_order: number;
  meta_title?: string;
  meta_description?: string;
  product_count?: number;
  full_name: string;
  children: ProductCategory[];
  level: number;
  created_at: string;
  updated_at: string;
}

export interface Product extends ProfileMixin {
  inventory?: string;
  name: string;
  description: string;
  short_description?: string;
  base_price: number;
  cost_price?: number;
  barcode?: string;
  sku?: string;
  quick_sale: boolean;
  pos_category?: string;
  tax_rate: number;
  tax_inclusive: boolean;
  allow_discount: boolean;
  max_discount_percent: number;
  is_template: boolean;
  is_active: boolean;
  is_featured: boolean;
  unit?: string;
  weight?: number;
  dimensions?: string;
  category?: string;
  category_details?: ProductCategory;
  pricing_strategy?: string;
  pricing_strategy_details?: PricingStrategy;
  track_stock: boolean;
  allow_backorder: boolean;
  low_stock_threshold: number;
  meta_title?: string;
  meta_description?: string;
  launch_date?: string;
  discontinue_date?: string;
  display_image?: string;
  variant_count?: number;
  total_stock?: number;
  profit_margin?: number;
  pos_ready?: boolean;
  quick_sale_variants?: Array<{
    id: string;
    display_name: string;
    price: number;
    barcode?: string;
    sku: string;
  }>;
  attribute_links: ProductAttributeLink[];
  price_range?: {
    min: number;
    max: number;
  };
  average_cost?: number;
  low_stock_variants?: number;
  out_of_stock_variants?: number;
  created_by_details?: {
    id: string;
    name?: string;
    email?: string;
  };
}
export interface ProductData extends Product{}
export interface ProductCategoryData extends ProductCategory{}
export interface ProductAttributeLink {
  id: string;
  product: string;
  attribute: string;
  attribute_name?: string;
  attribute_type?: string;
  attribute_details?: ProductAttribute;
  required: boolean;
  order: number;
  default_modifier: number;
  is_visible_in_pos: boolean;
}

export interface ProductVariant extends UUIDBaseModel {
  product: string;
  product_details?: {
    id: string;
    name: string;
    category?: string;
    base_price: number;
    tax_rate: number;
    allow_discount: boolean;
    max_discount_percent: number;
  };
  variant_barcode?: string;
  variant_sku?: string;
  pos_name?: string;
  active: boolean;
  is_featured: boolean;
  pos_visible: boolean;
  variant_number: number;
  price_override?: number;
  cost_override?: number;
  weight_override?: number;
  dimensions_override?: string;
  track_stock_override?: boolean;
  low_stock_threshold_override?: number;
  attachments: Attachment[];
  main_image?: string;
  stock_details?: {
    quantity: number;
    reserved: number;
    available: number;
    low_stock: boolean;
  };
  attribute_details: ProductVariantAttribute[];
  selling_price: number;
  pos_price?: number;
  effective_properties?: {
    weight?: number;
    dimensions?: string;
    cost_price?: number;
    track_stock: boolean;
    barcode?: string;
    sku: string;
  };
  created_by_details?: {
    id: string;
    name?: string;
    email?: string;
  };
}

export interface ProductVariantAttribute {
  id: string;
  variant: string;
  product: string;
  attribute_link: string;
  attribute_name?: string;
  attribute_type?: string;
  value: string;
  value_details?: ProductAttributeValue;
  custom_modifier?: number;
  custom_value?: string;
  display_value: string;
  effective_modifier: number;
}

export interface PriceChangeHistory {
  id: string;
  product: string;
  product_name?: string;
  variant?: string;
  variant_name?: string;
  old_price: number;
  new_price: number;
  price_difference: number;
  percentage_change: number;
  price_difference_formatted?: string;
  changed_by?: string;
  changed_by_details?: {
    id: string;
    name?: string;
    email?: string;
  };
  change_type: 'auto' | 'manual' | 'override' | 'bulk' | 'strategy';
  status: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  timestamp: string;
  reason?: string;
  approved_by?: string;
  approved_by_details?: {
    id: string;
    name?: string;
    email?: string;
  };
  approved_at?: string;
}

export interface PurchasePriceHistory {
  id: string;
  variant: string;
  variant_name?: string;
  product_name?: string;
  purchase_price: number;
  effective_start: string;
  effective_end?: string;
  purchase_order_source: string;
  supplier?: string;
  quantity_purchased?: number;
  currency: string;
  exchange_rate: number;
  notes?: string;
  is_current: boolean;
  duration_days?: number;
}

export interface PricingRule {
  id: string;
  name: string;
  rule_type: 'BATCH' | 'CUSTOMER' | 'CUSTOMER_GROUP' | 'PROMO' | 'VOLUME' | 'SEASONAL' | 'CLEARANCE' | 'LOYALTY' | 'BUNDLE';
  product?: string;
  product_details?: {
    id: string;
    name: string;
    base_price: number;
  };
  variant?: string;
  variant_details?: ProductVariant;
  category?: string;
  category_details?: ProductCategory;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FIXED_PRICE';
  value: number;
  start_date?: string;
  end_date?: string;
  min_quantity?: number;
  max_quantity?: number;
  min_amount?: number;
  customer_groups?: string;
  specific_customers?: string;
  usage_limit?: number;
  usage_count: number;
  usage_limit_per_customer?: number;
  is_active: boolean;
  priority: number;
  description?: string;
  created_by?: string;
  created_by_details?: {
    id: string;
    name?: string;
    email?: string;
  };
  created_at: string;
  updated_at: string;
  is_active_now?: boolean;
  usage_percentage?: number;
}

export interface POSConfiguration extends ProfileMixin {
  default_tax_rate: number;
  tax_inclusive_pricing: boolean;
  allow_negative_stock: boolean;
  show_stock_levels: boolean;
  low_stock_warning: boolean;
  require_barcode: boolean;
  auto_generate_barcode: boolean;
  barcode_prefix?: string;
  auto_print_receipt: boolean;
  receipt_header?: string;
  receipt_footer?: string;
  allow_item_discount: boolean;
  allow_transaction_discount: boolean;
  max_discount_without_approval: number;
  products_per_page: number;
  show_product_images: boolean;
  default_view: 'grid' | 'list';
  enable_quick_sale: boolean;
  quick_sale_categories?: string;
  cash_rounding: number;
  enable_loyalty: boolean;
  loyalty_points_rate: number;
  next_barcode?: string;
  created_by_details?: {
    id: string;
    name?: string;
    email?: string;
  };
}
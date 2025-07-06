
import { ProductData } from "../interfaces/product";
import { InventoryData } from "../interfaces/inventory";




export const InventoryInterfaceKeys: (keyof ProductData)[]=[
    'inventory','name', 'description','category','base_price','cost_price',
    'unit','max_discount_percent','dimensions','weight','allow_discount','tax_inclusive','quick_sale','is_active','pos_ready',
    'short_description',
    

]
export const defaultValues: Partial<ProductData> = {
  base_price:0,
  allow_discount:false,
  tax_inclusive:false,
  quick_sale:false,
  pos_ready:false,
  max_discount_percent:0,
  is_active:true,
  };

import { ProductData } from "../interfaces/product";
import { InventoryData } from "../interfaces/inventory";




export const InventoryInterfaceKeys: (keyof ProductData)[]=[
    'name', 'description','category','base_price'

]

export const defaultValues: Partial<ProductData> = {
  base_price:0
  };
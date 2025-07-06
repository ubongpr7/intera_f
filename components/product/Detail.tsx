'use client'
import DetailCard from '../common/Detail';
import { useGetProductCategoriesQuery, useGetProductQuery } from '../../redux/features/product/productAPISlice'
import { ProductData } from '../interfaces/product';
import { useUpdateProductMutation } from '../../redux/features/product/productAPISlice';
import { useGetTypesByModelQuery, useGetUnitsQuery } from '../../redux/features/common/typeOF';
import LoadingAnimation from '../common/LoadingAnimation';
import { InventoryInterfaceKeys } from './selectOptions';
import { useGetInventoryDataQuery } from '@/redux/features/inventory/inventoryAPiSlice';


export default function ProductDetail({ id, }: { id: string }) {
  const { data: inventory, isLoading,refetch  } = useGetProductQuery(id);
  const ProductData = inventory as ProductData;
  const [updateInventory,{isLoading:updateIsLoading}] = useUpdateProductMutation();

  
  const handleUpdate = async (updatedData: Partial<ProductData>) => {
    await updateInventory({ id: ProductData.id, data: updatedData }).unwrap();
    await refetch();

  };


//////////////////////////////
const { data: categories = [], isLoading: isCatLoading, error: catError } = useGetProductCategoriesQuery(1);
const { data: units=[] } = useGetUnitsQuery();
    const { data:inventoryData=[] } = useGetInventoryDataQuery();
  
const inventoryOptions = inventoryData.map((inventory: any) => ({
        value: inventory.id,
        text: inventory.name,
      }));
      
const unitOptions = units.map((unit: any) => ({
    value: `${unit.name} (${unit.dimension_type})`,
    text: `${unit.name} (${unit.dimension_type})`,
  }));

const categoryOptions = categories.map((cat: any) => ({
  value: cat.id,
  text: cat.name,
}));

const  selectOptions = {
      inventory:inventoryOptions,
      category:categoryOptions,
      unit:unitOptions,
      
}

//////////////////////////////




  if (isLoading) return <div>
  <div className="text-center flex items-center justify-center py-8 text-gray-500 ">
  <LoadingAnimation text="Loading..." ringColor="#3b82f6" />
  </div>
  </div>;
  if (!inventory) return <div>Inventory not found</div>;

  
  return (
    <DetailCard 
      interfaceKeys={InventoryInterfaceKeys}
    
      data={ProductData}
      notEditableFields={['id', 'created_at','updated_at', ]}
      updateMutation={handleUpdate}
      excludeFields={['id','inventory', 'category', 'category_details', 'display_image','price_range', 'attribute_links']}
      selectOptions={selectOptions}
      isLoading={updateIsLoading}
      policyFields={['description']}
      keyInfo={{}}
      optionalFields={['description','cost_price', 'dimensions','weight','max_discount_percent','allow_discount','tax_inclusive','quick_sale','pos_ready',]}


    />
  );
}

'use client'
import DetailCard from '../common/Detail';
import { useGetInventoryCategoriesQuery, useGetInventoryQuery } from '@/redux/features/inventory/inventoryAPiSlice';
import { InventoryData, inventoryTypes } from "@/redux/features/inventory/inventoryTypes";
import { useUpdateInventoryMutation } from '../../redux/features/inventory/inventoryAPiSlice';
import LoadingAnimation from '../common/LoadingAnimation';
import { InventoryInterfaceKeys, InventoryKeyInfo } from './selectOptions';
import { useGetUnitsQuery } from '@/redux/features/common/typeOF';



export default function InventoryDetail({ id }: { id: string }) {
  const { data: inventory, isLoading,refetch  } = useGetInventoryQuery(id);
  const inventoryData = inventory as InventoryData;
  const [updateInventory,{isLoading:updateIsLoading}] = useUpdateInventoryMutation();
  const { data: units=[] } = useGetUnitsQuery();

  
  const handleUpdate = async (updatedData: Partial<InventoryData>) => {
    await updateInventory({ id: inventoryData.id, data: updatedData }).unwrap();
    await refetch();

  };


const { data: categories = [] } = useGetInventoryCategoriesQuery();
const categoryOptions = categories.map((cat: any) => ({
  value: cat.id,
  text: cat.name,
}));
const unitOptions = units.map((unit: any) => ({
   value: unit.code,
  text: `${unit.name}${unit.abbreviated_name ? ` (${unit.abbreviated_name})` : ""}`,
}));
const typeOptions = inventoryTypes ? inventoryTypes.map((inventory_type: any) => ({
        value: inventory_type.id,
        text: inventory_type.text,
      })) : [];
const  selectOptions = {
    
      inventory_category:categoryOptions,
      inventory_type:typeOptions,
      default_uom_code:unitOptions,
      stock_uom_code:unitOptions,
      status: [
        { value: 'draft', text: 'Draft' },
        { value: 'active', text: 'Active' },
        { value: 'archived', text: 'Archived' },
        { value: 'discontinued', text: 'Discontinued' }
      ],
}

//////////////////////////////




  if (isLoading) return <div>
  <div className="text-center flex items-center justify-center py-8 text-gray-500 ">
  <LoadingAnimation text="Loading..." ringColor="#3b82f6" />
  </div>
  </div>;
  if (!inventory) return <div>Inventory item not found</div>;

  
  return (
    <DetailCard 
      data={inventoryData}
      interfaceKeys={InventoryInterfaceKeys}
      updateMutation={handleUpdate}
      excludeFields={[
        'id',
        'name_snapshot',
        'inventory_category',
        'created_by',
        'modified_by',
        'created_by_details',
        'modified_by_details',
        'updated_by_details',
        'category_details',
        'metadata',
        'default_supplier',
        'product_template_id',
        'product_variant_id',
        'product_variant_image_url',
      ]}
      selectOptions={selectOptions}
      isLoading={updateIsLoading}
      policyFields={['description','stock_analytics']}
      keyInfo={InventoryKeyInfo}
      optionalFields={['description','inventory_category','stock_uom_code']}

    />
  );
}

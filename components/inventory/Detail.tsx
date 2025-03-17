'use client'
import DetailCard from '@/components/common/Detail';
import { useGetInventoryCategoriesQuery, useGetInventoryQuery } from '@/redux/features/inventory/inventoryAPiSlice';
import { InventoryData } from '../interfaces/inventory';
import { useUpdateInventoryMutation } from '@/redux/features/inventory/inventoryAPiSlice';
import { useGetTypesByModelQuery, useGetUnitsQuery } from '@/redux/features/common/typeOF';
import LoadingAnimation from '../common/LoadingAnimation';
import { InventoryKeyInfo } from './selectOptions';
import { selectOptions } from './selectOptions';


export default function InventoryDetail({ id }: { id: string }) {
  const { data: inventory, isLoading,refetch  } = useGetInventoryQuery(id);
  const inventoryData = inventory as InventoryData;
  const [updateInventory,{isLoading:updateIsLoading}] = useUpdateInventoryMutation();

  const handleRefresh = async () => {
    await refetch();
  }
  
  const handleUpdate = async (updatedData: Partial<InventoryData>) => {
    await updateInventory({ id: inventoryData.id, data: updatedData }).unwrap();
  };
  const options=selectOptions()


  if (isLoading) return <div>
  <div className="text-center flex items-center justify-center py-8 text-gray-500 ">
  <LoadingAnimation text="Loading..." ringColor="#3b82f6" />
  </div>
  </div>;
  if (!inventory) return <div>Inventory not found</div>;

  
  return (
    <DetailCard 
      data={inventoryData}
      notEditableFields={['id', 'created_at','updated_at','forecast_method_name','expiration_policy_name' ,'reorder_strategy_name','recall_policy_name','unit_name','category_name','external_system_id', ]}
      updateMutation={handleUpdate}
      excludeFields={['id','inventory_type','category','forecast_method','expiration_policy','recall_policy','reorder_strategy','unit','profile','automate_reorder','batch_tracking_enabled',]}
      handleRefresh={handleRefresh}
      selectOptions={options}
      isLoading={updateIsLoading}
      policyFields={['description']}
      keyInfo={InventoryKeyInfo}

    />
  );
}

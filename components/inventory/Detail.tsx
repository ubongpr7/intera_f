'use client'
import DetailCard from '../common/Detail';
import { useGetInventoryCategoriesQuery, useGetInventoryQuery } from '../../redux/features/inventory/inventoryAPiSlice';
import { InventoryData } from '../interfaces/inventory';
import { useUpdateInventoryMutation } from '../../redux/features/inventory/inventoryAPiSlice';
import { useGetTypesByModelQuery, useGetUnitsQuery } from '../../redux/features/common/typeOF';
import LoadingAnimation from '../common/LoadingAnimation';
import { InventoryKeyInfo } from './selectOptions';


export default function InventoryDetail({ id }: { id: string }) {
  const { data: inventory, isLoading,refetch  } = useGetInventoryQuery(id);
  const inventoryData = inventory as InventoryData;
  const [updateInventory,{isLoading:updateIsLoading}] = useUpdateInventoryMutation();

  
  const handleUpdate = async (updatedData: Partial<InventoryData>) => {
    await updateInventory({ id: inventoryData.id, data: updatedData }).unwrap();
    await refetch();

  };


//////////////////////////////
const { data: categories = [], isLoading: isCatLoading, error: catError } = useGetInventoryCategoriesQuery(1);
const { data: types } = useGetTypesByModelQuery('inventory');
const { data: units } = useGetUnitsQuery();

const unitOptions = units ? units.map((unit: any) => ({
  value: unit.id,
  text: unit.name,
})) : [];

const typeOptions = types ? types.map((inventory_type: any) => ({
  value: inventory_type.id,
  text: inventory_type.name,
})) : [];

const categoryOptions = categories.map((cat: any) => ({
  value: cat.id,
  text: cat.name,
}));

const  selectOptions = {
    
      category:categoryOptions,
      unit:unitOptions,
      inventory_type:typeOptions,
      reorder_strategy: [
        { value: 'FQ', text: 'Fixed Quantity' },
        { value: 'FI', text: 'Fixed Interval' },
        { value: 'DY', text: 'Demand-Based' }
      ],
      expiration_policy: [
        { value: '0', text: 'Dispose of Stock' },
        { value: '1', text: 'Return to Manufacturer' }
      ],
      recall_policy: [
        { value: '0', text: 'Remove from Stock' },
        { value: '1', text: 'Notify Customers' },
        { value: '3', text: 'Replace Item' },
        { value: '4', text: 'Destroy Item' },
        { value: '5', text: 'Repair Item' }
      ],
      near_expiry_policy: [
        { value: 'DISCOUNT', text: 'Sell at Discount' },
        { value: 'DONATE', text: 'Donate to Charity' },
        { value: 'DESTROY', text: 'Destroy Immediately' },
        { value: 'RETURN', text: 'Return to Supplier' }
      ],
      forecast_method: [
        { value: 'SA', text: 'Simple Average' },
        { value: 'MA', text: 'Moving Average' },
        { value: 'ES', text: 'Exponential Smoothing' }
      ],
    
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
      data={inventoryData}
      notEditableFields={['id', 'created_at','updated_at','forecast_method_name','expiration_policy_name' ,'reorder_strategy_name','recall_policy_name','unit_name','category_name','external_system_id', ]}
      updateMutation={handleUpdate}
      excludeFields={['id','inventory_type','category','forecast_method','expiration_policy','recall_policy','reorder_strategy','unit','profile','automate_reorder','batch_tracking_enabled',]}
      selectOptions={selectOptions}
      isLoading={updateIsLoading}
      policyFields={['description']}
      keyInfo={InventoryKeyInfo}
      optionalFields={['description','batch_tracking_enabled','automate_reorder']}

    />
  );
}

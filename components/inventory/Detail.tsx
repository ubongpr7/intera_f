'use client'
import DetailCard from '../common/Detail';
import { useGetInventoryCategoriesQuery, useGetInventoryQuery } from '@/redux/features/inventory/inventoryAPiSlice';
import { InventoryData, inventoryTypes } from '../interfaces/inventory';
import { useUpdateInventoryMutation } from '../../redux/features/inventory/inventoryAPiSlice';
import LoadingAnimation from '../common/LoadingAnimation';
import { InventoryKeyInfo } from './selectOptions';
import { useGetCompanyUsersQuery } from '@/redux/features/users/userApiSlice';
import { useGetUnitsQuery } from '@/redux/features/common/typeOF';



export default function InventoryDetail({ id }: { id: string }) {
  const { data: inventory, isLoading,refetch  } = useGetInventoryQuery(id);
  const inventoryData = inventory as InventoryData;
  const [updateInventory,{isLoading:updateIsLoading}] = useUpdateInventoryMutation();
  const { data: userData, isLoading: userLoading,  } = useGetCompanyUsersQuery();
  const { data: units=[], isLoading: unitIsloading,  } = useGetUnitsQuery();

  
  const handleUpdate = async (updatedData: Partial<InventoryData>) => {
    await updateInventory({ id: inventoryData.id, data: updatedData }).unwrap();
    await refetch();

  };


const { data: categories = [], isLoading: isCatLoading, error: catError } = useGetInventoryCategoriesQuery(1);
const categoryOptions = categories.map((cat: any) => ({
  value: cat.id,
  text: cat.name,
}));
const unitOptions = units.map((unit: any) => ({
   value: unit.id,
  text: `${unit.name} (${unit.dimension_type})`,
}));
const typeOptions = inventoryTypes ? inventoryTypes.map((inventory_type: any) => ({
        value: inventory_type.id,
        text: inventory_type.text,
      })) : [];
      
    const userOptions = userData?.map((user:{first_name:string,email:string,id:number}) => ({
        text: `${user.first_name} ${user.email}`,
        value: user.id.toString(),
      })) || [];    
const  selectOptions = {
    
      category:categoryOptions,
      inventory_type:typeOptions,
      officer_in_charge:userOptions,
      unit:unitOptions,


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
      notEditableFields={['id','created_by_details','unit_name','profile','created_by','default_supplier','total_stock_value','current_stock','calculated_safety_stock','stock_status','sync_error_message','last_sync_timestamp','officer_in_charge_details','modified_by_details','sync_status','external_references','stock_analytics','category_details', 'created_at','updated_at','forecast_method_name','expiration_policy_name' ,'reorder_strategy_name','recall_policy_name','category_name','external_system_id', ]}
      updateMutation={handleUpdate}
      excludeFields={['id','external_references','unit','officer_in_charge','last_sync_timestamp','sync_error_message','sync_status','officer_in_charge_details','modified_by_details','created_by', 'created_by_details','stock_analytics','category_details','category','forecast_method','expiration_policy','recall_policy','reorder_strategy','profile','batch_tracking_enabled',]}
      selectOptions={selectOptions}
      isLoading={updateIsLoading}
      policyFields={['description']}
      keyInfo={InventoryKeyInfo}
      optionalFields={['description','assembly','batch_tracking_enabled','automate_reorder','component','trackable','purchaseable','active','salable','locked','testable','virtual']}

    />
  );
}

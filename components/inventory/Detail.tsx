'use client'
import DetailCard from '../common/Detail';
import { useGetInventoryQuery } from '@/redux/features/inventory/inventoryAPiSlice';
import { InventoryData, inventoryTypes } from "@/redux/features/inventory/inventoryTypes";
import { useUpdateInventoryMutation } from '../../redux/features/inventory/inventoryAPiSlice';
import LoadingAnimation from '../common/LoadingAnimation';
import { InventoryInterfaceKeys, InventoryKeyInfo } from './selectOptions';
import { useGetUnitsQuery } from '@/redux/features/common/typeOF';
import { useGetSupplersQuery } from '@/redux/features/company/companyAPISlice';
import { RecordNotFoundCard } from '../common/RecordNotFoundCard';



export default function InventoryDetail({ id }: { id: string }) {
  const { data: inventory, isLoading,refetch  } = useGetInventoryQuery(id);
  const inventoryData = inventory as InventoryData;
  const [updateInventory,{isLoading:updateIsLoading}] = useUpdateInventoryMutation();
  const { data: units=[] } = useGetUnitsQuery();
  const { data: suppliers=[] } = useGetSupplersQuery();

  
  const handleUpdate = async (updatedData: Partial<InventoryData>) => {
    await updateInventory({ id: inventoryData.id, data: updatedData }).unwrap();
    await refetch();

  };


const unitOptions = units.map((unit: any) => ({
   value: unit.code,
  text: `${unit.name}${unit.abbreviated_name ? ` (${unit.abbreviated_name})` : ""}`,
}));
const supplierOptions = suppliers.map((supplier) => ({
  value: String(supplier.id),
  text: supplier.name,
}));
const typeOptions = inventoryTypes ? inventoryTypes.map((inventory_type: any) => ({
        value: inventory_type.id,
        text: inventory_type.text,
      })) : [];
const  selectOptions = {
    
      inventory_type:typeOptions,
      default_uom_code:unitOptions,
      stock_uom_code:unitOptions,
      default_supplier:supplierOptions,
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
  if (!inventory) return <RecordNotFoundCard title="Inventory item not found" description="This inventory item may have been deleted, archived, or filtered out of the current workspace context." />;

  
  return (
    <DetailCard 
      data={inventoryData}
      interfaceKeys={InventoryInterfaceKeys}
      displayFields={[
        'display_image',
        'description',
        'sku_snapshot',
        'barcode_snapshot',
        'inventory_type',
        'default_supplier_name',
        'default_uom_code',
        'stock_uom_code',
        'status',
        'stock_status',
        'quantity',
        'quantity_reserved',
        'quantity_available',
        'location_name',
        'location_count',
        'purchase_price',
        'total_stock_value',
        'lot_count',
        'serial_count',
        'minimum_stock_level',
        'reorder_point',
        'reorder_quantity',
        'safety_stock_level',
        'track_stock',
        'track_lot',
        'track_serial',
        'track_expiry',
        'allow_negative_stock',
        'created_at',
        'updated_at',
      ]}
      updateMutation={handleUpdate}
      excludeFields={[
        'id',
        'name_snapshot',
        'created_by',
        'created_by_user_id',
        'updated_by_user_id',
        'modified_by',
        'created_by_details',
        'modified_by_details',
        'updated_by_details',
        'metadata',
        'default_supplier',
        'product_template_id',
        'product_variant_id',
        'product_variant_image_url',
      ]}
      selectOptions={selectOptions}
      isLoading={updateIsLoading}
      policyFields={['description']}
      keyInfo={InventoryKeyInfo}
      optionalFields={['description','default_supplier','stock_uom_code']}

    />
  );
}

'use client'
import { useEffect, useState } from 'react';
import { PageHeader } from "../inventory/PageHeader";
import { useRouter } from 'nextjs-toploader/app';
import { Column, DataTable } from "../common/DataTable/DataTable";
import { InventoryData } from "../interfaces/inventory";
import { useGetInventoryDataQuery, useCreateInventoryMutation } from "../../redux/features/inventory/inventoryAPiSlice";
import CustomCreateCard from '../common/createCard';
import { InventoryInterfaceKeys,defaultValues } from './selectOptions';
import { InventoryKeyInfo } from './selectOptions';
import { useGetUnitsQuery,useGetTypesByModelQuery } from "../../redux/features/common/typeOF";
import { useGetInventoryCategoriesQuery } from "../../redux/features/inventory/inventoryAPiSlice";


const strategies = {
  FQ: 'Fixed Quantity',
  FI: 'Fixed Interval',
  DY: 'Dynamic',
};

const inventoryColumns: Column<InventoryData>[] = [
  {
    header: 'Name',
    accessor: 'name',
    className: 'font-medium',
  },
  {
    header: 'ID',
    accessor: 'external_system_id',
    render: (value) => value || 'N/A',
    className: 'font-medium',
  },
  {
    header: 'Category',
    accessor: 'category_name',
    render: (value) => value || 'N/A',
    info: 'Category to which the inventory belong',
  },
  {
    header: 'Reorder Strategy',
    accessor: 'reorder_strategy_name',
    render: (value: keyof typeof strategies) => {
      return strategies[value] || value;
    },
  },
  {
    header: 'Expiration Policy',
    accessor: 'expiration_policy',
    render: (value) => (value === '0' ? 'Dispose of Stock' : 'Return to Manufacturer'),
  },
];


function InventoryView() {
  const { data, isLoading, refetch, error } = useGetInventoryDataQuery('');
  const [createInventory, { isLoading: inventoryCreateLoading }] = useCreateInventoryMutation();
  const [isCreateOpen, setIsCreateOpen] = useState(false); // Renamed for clarity
  const router = useRouter();

  const handleCreate = async (createdData: Partial<InventoryData>) => {
    await createInventory(createdData).unwrap();
    setIsCreateOpen(false); // Close the modal after creation
    await refetch(); // Refresh the data
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

  const handleRefresh = async () => {
    await refetch();
  };

  const handleRowClick = (row: InventoryData) => {
    router.push(`/inventory/${row.external_system_id}`);
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading inventory data: {(error as any).message || 'Unknown error'}
      </div>
    );
  }

  const notEditableFields: (keyof InventoryData)[] = [
    'id',
    'created_at',
    'updated_at',
    'forecast_method_name',
    'expiration_policy_name',
    'reorder_strategy_name',
    'recall_policy_name',
    'unit_name',
    'category_name',
    'external_system_id',
  ];

  

  return (
    <div>
      <PageHeader
        title="Inventory"
        onClose={() => setIsCreateOpen(true)} // Renamed to onCreate for clarity
      />
      <DataTable<InventoryData>
        columns={inventoryColumns}
        data={data || []}
        isLoading={isLoading}
        onRowClick={handleRowClick}
      />

      {/* Always render CustomCreateCard but control visibility */}
      <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${isCreateOpen ? 'block' : 'hidden'}`}>
        <CustomCreateCard
          defaultValues={defaultValues}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreate}
          isLoading={inventoryCreateLoading}
          selectOptions={selectOptions}
          keyInfo={InventoryKeyInfo}
          notEditableFields={notEditableFields}
          interfaceKeys={InventoryInterfaceKeys}
        />
      </div>
    </div>
  );
}

export default InventoryView;
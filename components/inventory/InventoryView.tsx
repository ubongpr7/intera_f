'use client'
import { useEffect, useState } from 'react';

import { useRouter } from 'nextjs-toploader/app';
import { ActionButton, Column, DataTable } from "../common/DataTable/DataTable";
import { InventoryData, inventoryTypes } from "@/redux/features/inventory/inventoryTypes";
import { useGetInventoryDataQuery, useCreateInventoryMutation, useDeleteInventoryMutation } from "../../redux/features/inventory/inventoryAPiSlice";
import CustomCreateCard from '../common/createCard';
import { InventoryInterfaceKeys,defaultValues } from './selectOptions';
import { InventoryKeyInfo } from './selectOptions';
import { useGetUnitsQuery } from "../../redux/features/common/typeOF";
import { useGetInventoryCategoriesQuery } from "../../redux/features/inventory/inventoryAPiSlice";
import { RefetchDataProp } from "@/redux/features/common/commonTypes";
import { formatCurrencyCompact } from '@/lib/currency-utils';
import { Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

const inventoryColumns: Column<InventoryData>[] = [
  {
    header: 'Name',
    accessor: 'name',
    className: 'font-medium',
  },
  {
    header: 'SKU',
    accessor: 'sku_snapshot',
    render: (value) => value || 'N/A',
    className: 'font-medium',
  },
  {
    header: 'On Hand',
    accessor: 'current_stock_level',
    className: 'font-medium',
  },
  {
    header: 'Available',
    accessor: 'quantity_available',
    className: 'font-medium',
  },
  {
    header: 'Stock Value',
    accessor: 'total_stock_value',
    render:(value)=>formatCurrencyCompact('NGN',value),
    className: 'font-medium',
  },
  {
    header: 'Inventory Type',
    accessor: 'inventory_type',
    render: (value) => value || 'N/A',
    className: 'font-medium',
  },
  {
    header: 'Category',
    accessor: 'category_name',
    render: (value) => value || 'N/A',
    info: 'Operational category assigned to the inventory item',
  },
  {
    header: 'Reorder Point',
    accessor: 'reorder_point',
    render: (value) => value || '0',
  },
];


function InventoryView({refetchData, setRefetchData}:RefetchDataProp) {
  const { data, isLoading, refetch, error } = useGetInventoryDataQuery();
  const [createInventory, { isLoading: inventoryCreateLoading }] = useCreateInventoryMutation();
  const [deleteInventory] = useDeleteInventoryMutation();
  const [isCreateOpen, setIsCreateOpen] = useState(false); // Renamed for clarity
  const router = useRouter();

  const handleCreate = async (createdData: Partial<InventoryData>) => {
    await createInventory(createdData).unwrap();
    setIsCreateOpen(false); 
    await refetch(); 
  };

    //////////////////////////////
    const { data: categories = [], refetch:refetchCategory } = useGetInventoryCategoriesQuery();
      const { data: units=[] } = useGetUnitsQuery();
      

      
  useEffect(()=>{
    if (categories){
      refetchCategory()
      setRefetchData(false)
    }
  },[refetchData])

     const unitOptions = units.map((unit: any) => ({
   value: unit.code,
  text: `${unit.name}${unit.abbreviated_name ? ` (${unit.abbreviated_name})` : ""}`,
})); 
      const typeOptions = inventoryTypes ? inventoryTypes.map((inventory_type: any) => ({
        value: inventory_type.id,
        text: inventory_type.text,
      })) : [];
    
      const categoryOptions = categories.map((cat: any) => ({
        value: cat.id,
        text: cat.name,
      }));
  

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

  const handleRowClick = (row: InventoryData) => {
    router.push(`/inventory/${row.id}`);
  };

  const handleDelete = async (row: InventoryData) => {
    if (!window.confirm(`Delete inventory "${row.name}"?`)) {
      return;
    }

    try {
      await deleteInventory(row.id).unwrap();
      toast.success("Inventory item deleted successfully.");
      await refetch();
    } catch (error) {
      toast.error("Failed to delete inventory item.");
    }
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
    'category_name',
    'name',
    'current_stock_level',
    'current_stock',
    'quantity_available',
    'quantity_reserved',
    'stock_status',
    'total_stock_value',
    'created_by_details',
    'modified_by_details',
    'updated_by_details',
    'stock_analytics',
    'category_details'
  ];

  const actionButtons: ActionButton<InventoryData>[] = [
    {
      label: "Delete",
      icon: Trash2,
      onClick: (row) => {
        void handleDelete(row);
      },
      variant: "danger",
    },
  ];

  

  return (
    <div>
      
      <DataTable<InventoryData>
        columns={inventoryColumns}
        data={data || []}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        actionButtons={actionButtons}
        searchableFields={['name', 'sku_snapshot', 'barcode_snapshot']}
        filterableFields={['category_name']}
        sortableFields={['name', 'sku_snapshot', 'inventory_type']}
         title="Inventory Items"
        onClose={() =>setIsCreateOpen(true)} 
      />

      {isCreateOpen ? (
        <CustomCreateCard
          defaultValues={defaultValues}
          onClose={() => {
            setIsCreateOpen(false)
          }}
          onSubmit={handleCreate}
          isLoading={inventoryCreateLoading}
          selectOptions={selectOptions}
          keyInfo={InventoryKeyInfo}
          notEditableFields={notEditableFields}
          interfaceKeys={InventoryInterfaceKeys}
          optionalFields={['description','inventory_category','stock_uom_code']}
          itemTitle={'Create Inventory Item'}
        />
      ) : null}
    </div>
  );
}

export default InventoryView;

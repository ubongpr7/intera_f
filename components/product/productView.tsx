'use client'
import { useEffect, useState } from 'react';
import { PageHeader } from "../inventory/PageHeader";
import { useRouter } from 'nextjs-toploader/app';
import { Column, DataTable } from "../common/DataTable/DataTable";
import { ProductData } from "../interfaces/product";
import { useGetProductDataQuery, useCreateProductMutation } from "../../redux/features/product/productAPISlice";
import CustomCreateCard from '../common/createCard';
import { InventoryInterfaceKeys,defaultValues } from './selectOptions';
import { useGetUnitsQuery,useGetTypesByModelQuery } from "../../redux/features/common/typeOF";
import { useGetProductCategoriesQuery } from "../../redux/features/product/productAPISlice";
import { useGetInventoryDataQuery } from '@/redux/features/inventory/inventoryAPiSlice';
import {AIBulkCreateModal} from './AIBulkCreateModal';


const inventoryColumns: Column<ProductData>[] = [
  {
    header: 'Name',
    accessor: 'name',
    className: 'font-medium',
  },
  // {
  //   header: 'ID',
  //   accessor: 'barcode',
  //   render: (value) => value || 'N/A',
  //   className: 'font-medium',
  // },
  {
    header: 'Category',
    accessor: 'category_details',
    render: (value) => value?.name || 'N/A',
    info: 'Category to which the inventory belong',
  },
  {
    header: 'Base Cost Price',
    accessor: 'cost_price',
    render: (value) => value || '0',
    info: 'Category to which the inventory belong',
  },
  {
    header: 'Base Price',
    accessor: 'base_price',
    render: (value) => value || '0',
    info: 'Category to which the inventory belong',
  },
 
];


function ProductView() {
  const { data, isLoading, refetch, error } = useGetProductDataQuery();
  const [createInventory, { isLoading: inventoryCreateLoading }] = useCreateProductMutation();
  const [isCreateOpen, setIsCreateOpen] = useState(false); // Renamed for clarity
  const router = useRouter();
  const { data:inventoryData=[] } = useGetInventoryDataQuery();
  const [isAIBulkCreateOpen, setIsAIBulkCreateOpen] = useState(false);
  const handleCreate = async (createdData: Partial<ProductData>) => {
    await createInventory(createdData).unwrap();
    setIsCreateOpen(false); 
    await refetch(); 
  };

    const { data: categories = [], isLoading: isCatLoading, error: catError } = useGetProductCategoriesQuery(1);
      const { data: units=[] } = useGetUnitsQuery();
      const unitOptions = units.map((unit: any) => ({
        value: `${unit.name} (${unit.dimension_type})`,
        text: `${unit.name} (${unit.dimension_type})`,
      }));
    
      const categoryOptions = categories.map((cat: any) => ({
        value: cat.id,
        text: cat.name,
      }));
    
      const inventoryOptions = inventoryData.map((inventory: any) => ({
        value: inventory.id,
        text: inventory.name,
      }));
      
    const  selectOptions = {
          
            category:categoryOptions,
            unit:unitOptions,
            inventory:inventoryOptions,
           
      }
  

  const handleRefresh = async () => {
    await refetch();
  };

  const handleRowClick = (row: ProductData) => {
    router.push(`/product/${row.id}`);
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading Product data: {(error as any).message || 'Unknown error'}
      </div>
    );
  }

  const notEditableFields: (keyof ProductData)[] = [
    'id',
    'created_at',
    'updated_at',
  ];

  

  return (
    <div>
      <PageHeader
        title="Product"
        onClose={() =>setIsCreateOpen(true)}      />
      <DataTable<ProductData>
        columns={inventoryColumns}
        data={data || []}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        actionButtons={[]}
        secondaryButton={
          {
            label: 'Create Bulk Product',
            onClick: () => setIsAIBulkCreateOpen(true),
          }
        }
      />

      {/* Always render CustomCreateCard but control visibility */}
      {isAIBulkCreateOpen && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${isAIBulkCreateOpen ? 'block' : 'hidden'}`}>
        <AIBulkCreateModal
          isOpen={isAIBulkCreateOpen}
          onClose={() => setIsAIBulkCreateOpen(false)}
          />
        </div>
      )}
      <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${isCreateOpen ? 'block' : 'hidden'}`}>
        <CustomCreateCard
          defaultValues={defaultValues}
          onClose={() => {setIsCreateOpen(false)
          
          }}
          onSubmit={handleCreate}
          isLoading={inventoryCreateLoading}
          selectOptions={selectOptions}
          keyInfo={{}}
          notEditableFields={notEditableFields}
          interfaceKeys={InventoryInterfaceKeys}
          optionalFields={['description','cost_price', 'dimensions','weight','max_discount_percent','allow_discount','tax_inclusive','quick_sale','pos_ready',]}
          itemTitle={'New Product'}
        />
       
        
      </div>
    </div>
  );
}

export default ProductView;
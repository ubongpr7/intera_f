'use client'
import { act, useEffect, useState } from 'react';
import { PageHeader } from "../inventory/PageHeader";
import { useRouter } from 'nextjs-toploader/app';
import { Column, DataTable,ActionButton} from "../common/DataTable/DataTable";
import { ProductData } from "../interfaces/product";
import { useGetProductDataQuery, useCreateProductMutation,useDeleteProductMutation,useRemoveTemplateModeMutation } from "@/redux/features/product/productAPISlice";
import CustomCreateCard from '../common/createCard';
import { InventoryInterfaceKeys,defaultValues } from './selectOptions';
import { useGetUnitsQuery,useGetTypesByModelQuery } from "@/redux/features/common/typeOF";
import { useGetProductCategoriesQuery } from "@/redux/features/product/productAPISlice";
import { useGetInventoryDataQuery } from '@/redux/features/inventory/inventoryAPiSlice';
import {AIBulkCreateModal} from './AIBulkCreateModal';
import { TableImageHover } from '../common/table-image-render';
import { Edit, Trash2, Eye, Copy, BarChart3, Package, ShoppingCart, ToggleLeftIcon } from "lucide-react"
import { toast } from 'react-toastify';

  

const inventoryColumns: Column<ProductData>[] = [
  {
    header: 'Name',
    accessor: 'name',
    className: 'font-medium',
  },
  {
    header: 'Category',
    accessor: 'pos_category',
    render: (value) => value || 'N/A',
    info: 'Category to which the inventory belong',
  },
  {
    header: 'Barcode',
    accessor: 'barcode',
    render: (value) => value || 'N/A',
    className: 'font-medium',
  },
 {
    header: "Image",
    accessor: "display_image",
    render: (value: string) => (
      <TableImageHover
        src={value}
        alt="Product Image"
        className="hover:ring-2 hover:ring-blue-500 hover:ring-opacity-50"
      />
    ),
  },
  {
    header: 'Variants',
    accessor: 'variant_count',
    render: (value) => value || 'N/A',
    className: 'font-medium',
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
  // actions
  const [deleteProduct, { isLoading: deleteLoading }] = useDeleteProductMutation();
  const [removeTemplateMode] = useRemoveTemplateModeMutation();


  // const handleDelete = async (row: ProductData) => {
  //   if (window.confirm(`Are you sure you want to delete ${row.name}?`)) {
  //     try {
  //       await deleteProduct(row.id).unwrap();
  //       await refetch(); // Refresh the data after deletion
  //     } catch (error) {
  //       console.error('Failed to delete product:', error);
  //     }
  //   }
  const handleDelete = async (row: ProductData) => {
    if (window.confirm(`Are you sure you want to delete ${row.name}?`)) {
      try {
        await deleteProduct(row.id).unwrap();
        await refetch(); // Refresh the data after deletion
        toast.success("Product deleted successfully!");
      } catch (error) {
        console.error('Failed to delete product:', error);
        toast.error("Failed to delete product");
      }
    } 
  }

    const handleRemoveTemplateMode = async (row: ProductData) => {
      try {
        await removeTemplateMode({ id: row.id }).unwrap();
        await refetch(); // Refresh the data after removing template mode
      } catch (error) {
        console.error('Failed to remove template mode:', error);
      }
    }
      
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

  const handleDuplicate = async (product: ProductData) => {
    const duplicateData = {
      ...product,
      name: `${product.name} (Copy)`,
      barcode: "", // Clear barcode for duplicate
      id: undefined, // Remove ID so it creates new
      created_at: undefined,
      updated_at: undefined,
    }

    try {
      await createInventory(duplicateData).unwrap()
      await refetch()
      toast.success("Product duplicated successfully!")
    } catch (error) {
      toast.error("Failed to duplicate product")
    }
  };

  
const actionButtons: ActionButton<ProductData>[] = [
  {
      label: "",
      icon:Trash2,
      onClick:async (row) =>await handleDelete(row),
      className: "text-red-600 hover:text-red-800",
      variant: "secondary",
      tooltip: "Delete Product",
      disabled: (row) => deleteLoading,
    },
      
    {
      label: "",
      icon: Copy,
      onClick: (row) => handleDuplicate(row),
      className: "text-purple-600 hover:text-purple-800",
      variant: "secondary",
      tooltip: "Duplicate Product",
    }
      

    {
      label: "",
      icon:ToggleLeftIcon,
      onClick: (row) => handleRemoveTemplateMode(row),
      className: "text-orange-600 hover:text-orange-800",
      variant: "secondary",
      tooltip: "Remove Template Mode",
    }
  
  ];








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
        actionButtons={actionButtons}
        secondaryButton={
          {
            label: 'Create Bulk Product',
            onClick: () => setIsAIBulkCreateOpen(true),
            icon: <BarChart3 size={16} />,

          }
        }
      />

      {/* Always render CustomCreateCard but control visibility */}
      {isAIBulkCreateOpen && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${isAIBulkCreateOpen ? 'block' : 'hidden'}`}>
        <AIBulkCreateModal
          isOpen={isAIBulkCreateOpen}
          onClose={() => {
            refetch()
            setIsAIBulkCreateOpen(false)
          }
          }
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
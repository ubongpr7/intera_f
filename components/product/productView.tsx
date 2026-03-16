'use client'
import { useState } from 'react';

import { useRouter } from 'nextjs-toploader/app';
import { Column, DataTable,ActionButton} from "../common/DataTable/DataTable";
import type { ProductData } from "@/redux/features/product/productTypes";
import { useGetProductDataQuery, useCreateProductMutation,useDeleteProductMutation,useRemoveTemplateModeMutation } from "@/redux/features/product/productAPISlice";
import CustomCreateCard from '../common/createCard';
import { ProductFormKeys, defaultValues } from './selectOptions';
import { useGetUnitsQuery } from "@/redux/features/common/typeOF";
import { useGetProductCategoriesQuery } from "@/redux/features/product/productAPISlice";
import {AIBulkCreateModal} from './AIBulkCreateModal';
import { TableImageHover } from '../common/table-image-render';
import { Trash2, Copy, ToggleLeftIcon } from "lucide-react"
import { toast } from 'react-toastify';
import { getCurrencySymbolForProfile } from '@/lib/currency-utils';

  

const inventoryColumns: Column<ProductData>[] = [
  {
    header: 'Name',
    accessor: 'name',
    className: 'font-medium',
  },
  {
    header: 'Category',
    accessor: 'category',
    render: (value) => value || 'N/A',
    info: 'Catalog category assigned to the product',
  },
  {
    header: 'Barcode',
    accessor: 'barcode',
    render: (value) => value || 'N/A',
    className: 'font-medium',
  },
  {
    header: 'SKU',
    accessor: 'sku',
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
    header: `Base Cost Price (${getCurrencySymbolForProfile()})`,
    accessor: 'cost_price',
    render: (value) => value || '0',
    info: 'Configured baseline cost for margin calculations',
  },
  {
    header: `Base Price (${getCurrencySymbolForProfile()})`,
    accessor: 'base_price',
    render: (value) => value || '0',
    info: 'Configured baseline selling price before variant or rule overrides',
  },
 
];


function ProductView() {
  const { data, isLoading, refetch, error } = useGetProductDataQuery();
  const [createProduct, { isLoading: productCreateLoading }] = useCreateProductMutation();
  const [isCreateOpen, setIsCreateOpen] = useState(false); // Renamed for clarity
  const router = useRouter();
  const [isAIBulkCreateOpen, setIsAIBulkCreateOpen] = useState(false);

  const handleCreate = async (createdData: Partial<ProductData>) => {
    await createProduct(createdData).unwrap();
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
      
      const { data: categories = [] } = useGetProductCategoriesQuery();
      const { data: units=[] } = useGetUnitsQuery();
      const unitOptions = units.map((unit: any) => ({
        value: `${unit.name} (${unit.dimension_type})`,
        text: `${unit.name} (${unit.dimension_type})`,
      }));
    
      const categoryOptions = categories.map((cat: any) => ({
        value: cat.name,
        text: cat.name,
      }));
      
    const  selectOptions = {
      category: categoryOptions,
      unit: unitOptions,
    }

  const handleRowClick = (row: ProductData) => {
    router.push(`/product/${row.id}`);
  };

  const handleDuplicate = async (product: ProductData) => {
    const duplicateData: Partial<ProductData> = {}
    ProductFormKeys.forEach((key) => {
      const value = product[key]
      if (value !== undefined) {
        ;(duplicateData as Record<string, unknown>)[String(key)] = value as unknown
      }
    })

    duplicateData.name = `${product.name} (Copy)`
    duplicateData.barcode = ""
    duplicateData.sku = ""

    try {
      await createProduct(duplicateData).unwrap()
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
    },
      

    {
      label: "",
      icon:ToggleLeftIcon,
      onClick: (row) => handleRemoveTemplateMode(row),
      className: "text-orange-600 hover:text-orange-800",
      variant: "secondary",
      tooltip: "Remove Template Mode",
      disabled: (row) => row.is_template !== true, 
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
      <DataTable<ProductData>
        columns={inventoryColumns}
        data={data || []}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        actionButtons={actionButtons}
        secondaryButton={{
          label: 'Create Bulk Product',
          onClick: () => setIsAIBulkCreateOpen(true),

        }}
        searchableFields={['name', 'barcode', 'sku']}
        filterableFields={['category', 'pos_category']}
        sortableFields={['name', 'barcode', 'base_price']}
        rangeFilterFields={['cost_price', 'base_price']}
        title="Products"
        onClose={() =>setIsCreateOpen(true)}
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
          isLoading={productCreateLoading}
          selectOptions={selectOptions}
          keyInfo={{}}
          notEditableFields={notEditableFields}
          interfaceKeys={ProductFormKeys}
          optionalFields={['description', 'short_description', 'cost_price', 'barcode', 'sku', 'pos_category', 'unit', 'dimensions', 'weight', 'meta_title', 'meta_description']}
          itemTitle={'New Product'}
        />
       
        
      </div>
    </div>
  );
}

export default ProductView;

'use client'
import { useEffect, useState } from 'react';
import { PageHeader } from "../inventory/PageHeader";
import { useRouter } from 'nextjs-toploader/app';
import { DataTable, Column, ActionButton } from "../common/DataTable/DataTable";
import { useCreateCategoryMutation, useGetInventoryCategoriesQuery, useUpdateCategoryMutation, useDeleteCategoryMutation } from "../../redux/features/inventory/inventoryAPiSlice";
import { CategoryData } from '../interfaces/inventory';
import CustomCreateCard from '../common/createCard';
import { toast } from 'react-toastify';
import { useGetStockItemDataLocationQuery } from '@/redux/features/stock/stockAPISlice';
import { RefetchDataProp } from '../interfaces/common';
import { Edit, Trash2 } from 'lucide-react';

const inventoryColumns: Column<CategoryData>[] = [
  {
    header: 'Name',
    accessor: 'name',
    className: 'font-medium',
  },
  {
    header: 'Inventories',
    accessor: 'inventory_count',
    render: (value) => value || 'N/A',
    className: 'font-medium',
  },
  {
    header: 'Parent Category',
    accessor: 'parent_name',
    render: (value) => value || 'N/A',
    info: 'Category to which the category belong',
  },
];

function InventoryCategoryView({ refetchData, setRefetchData }: RefetchDataProp) {
  const { data, isLoading, error, refetch } = useGetInventoryCategoriesQuery('');
  const router = useRouter();
  const [createCategory, { isLoading: creatingCategory, error: catError }] = useCreateCategoryMutation();
  const { data: stockLocationData, isLoading: stockLocationsLoading, refetch: refetchLocation } = useGetStockItemDataLocationQuery();
  const [categoryDetail, setCategoryDetail] = useState<CategoryData | null>(null); // Changed to null for initial state
  const [updateCategory, { isLoading: isUpdatingCategory }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeletingCategory }] = useDeleteCategoryMutation();
  const [itemId, setItemId] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (refetchData) {
      refetch();
      refetchLocation();
      setRefetchData(false);
    }
  }, [refetchData, refetch, refetchLocation, setRefetchData]);

  const categoryOptions = data?.map((cat: CategoryData) => ({
    value: cat.id,
    text: cat.name,
  })) || [];

  const locationOptions = stockLocationData?.map((stockLocationItem) => ({
    text: `${stockLocationItem.name} (${stockLocationItem.code})`,
    value: stockLocationItem.id.toString(),
  })) || [];

  const CategoryInterfaceKeys: (keyof CategoryData)[] = [
    'name', 'description', 'parent', 'structural', 'default_location',
  ];

  const notEditableFields: (keyof CategoryData)[] = [
    'id', 'inventory_count',
  ];

  const selectOptions: Partial<Record<keyof CategoryData, { value: string; text: string; }[]>> = {
    parent: categoryOptions,
    default_location: locationOptions,
  };

  const handleCreate = async (createdData: Partial<CategoryData>) => {
    await createCategory(createdData).unwrap();
    await refetch();
    setIsCreateOpen(false);
    setRefetchData(true);
    toast.success("Category created successfully!");
  };

  const handleUpdate = async (updatedData: Partial<CategoryData>) => {
    if (!categoryDetail) return;
    await updateCategory({ data: updatedData, id: categoryDetail.id }).unwrap();
    await refetch();
    setIsCreateOpen(false);
    setCategoryDetail(null); // Clear editing state
    toast.success("Category updated successfully!");
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteCategory(id).unwrap();
        await refetch();
        toast.success("Category deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete category.");
      }
    }
  };

  const actionButtons: ActionButton<CategoryData>[] = [
    {
      label: "Edit",
      icon: Edit,
      onClick: (row) => {
        setCategoryDetail(row);
        setIsCreateOpen(true);
      },
    },
    {
      label: "Delete",
      icon: Trash2,
      onClick: (row) => handleDelete(row.id),
      className: "text-red-600 hover:text-red-800",
    },
  ];

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading inventory data: {(error as any).message || 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="p-4">
      <PageHeader title="Category" onClose={() => setIsCreateOpen(true)} />
      <DataTable<CategoryData>
        columns={inventoryColumns}
        data={data || []}
        isLoading={isLoading}
        actionButtons={actionButtons}
      />
      {isCreateOpen && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${isCreateOpen ? 'block' : 'hidden'}`}>
          <CustomCreateCard
            defaultValues={categoryDetail || { structural: false }}
            onClose={() => {
              setIsCreateOpen(false);
              setCategoryDetail(null); // Clear editing state on close
            }}
            onSubmit={categoryDetail ? handleUpdate : handleCreate}
            isLoading={categoryDetail ? isUpdatingCategory : creatingCategory}
            selectOptions={selectOptions}
            keyInfo={{ default_location: 'Optional, defaults to parent\'s location' }}
            notEditableFields={notEditableFields}
            interfaceKeys={CategoryInterfaceKeys}
            optionalFields={['description', 'parent', 'structural', 'default_location']}
            itemTitle={`${categoryDetail ? 'Update' : 'Create'} Category`}
          />
        </div>
      )}
    </div>
  );
}

export default InventoryCategoryView;

'use client'
import { useEffect, useState } from 'react';
import { DataTable, Column, ActionButton } from "../common/DataTable/DataTable";
import { useCreateCategoryMutation, useGetInventoryCategoriesQuery, useUpdateCategoryMutation, useDeleteCategoryMutation } from "../../redux/features/inventory/inventoryAPiSlice";
import { CategoryData } from "@/redux/features/inventory/inventoryTypes";
import CustomCreateCard from '../common/createCard';
import { toast } from 'react-toastify';
import { useListStockLocationsQuery } from '@/redux/features/stock/stockAPISlice';
import { RefetchDataProp } from "@/redux/features/common/commonTypes";
import { Edit, Trash2 } from 'lucide-react';
import { extractErrorMessage } from '@/lib/utils';
import { confirmAction } from '../common/confirmAction';

const inventoryColumns: Column<CategoryData>[] = [
  {
    header: 'Name',
    accessor: 'name',
    className: 'font-medium',
  },
  {
    header: 'Inventory Items',
    accessor: 'inventory_count',
    render: (value) => value || 'N/A',
    className: 'font-medium',
  },
  {
    header: 'Parent Category',
    accessor: 'parent_name',
    render: (value) => value || 'N/A',
    info: 'Parent category for this operational grouping',
  },
];

function InventoryCategoryView({ refetchData, setRefetchData }: RefetchDataProp) {
  const { data, isLoading, error, refetch } = useGetInventoryCategoriesQuery();
  const [createCategory, { isLoading: creatingCategory }] = useCreateCategoryMutation();
  const { data: stockLocationData, refetch: refetchLocation } = useListStockLocationsQuery();
  const [categoryDetail, setCategoryDetail] = useState<CategoryData | null>(null);
  const [updateCategory, { isLoading: isUpdatingCategory }] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
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
    const confirmed = await confirmAction({
      title: "Delete inventory category?",
      description: "This removes the category from the inventory setup. Items assigned to it may need review.",
      confirmText: "Delete category",
      destructive: true,
    })
    if (!confirmed) return

    try {
      await deleteCategory(id).unwrap();
      await refetch();
      toast.success("Category deleted successfully!");
    } catch (error) {
      toast.error(extractErrorMessage(error, ["detail"]) || "Failed to delete category.");
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
        Unable to load inventory categories: {extractErrorMessage(error, ["detail", "error"])}
      </div>
    );
  }

  return (
    <div className="p-4">
      <DataTable<CategoryData>
        columns={inventoryColumns}
        data={data || []}
        isLoading={isLoading}
        actionButtons={actionButtons}
        searchableFields={['name', 'parent_name', 'description']}
        filterableFields={['parent_name', 'is_active', 'structural']}
        sortableFields={['name', 'parent_name', 'inventory_count']}
        rangeFilterFields={['inventory_count']}
        title="Inventory Categories" onClose={() => setIsCreateOpen(true)} 
      />
      {isCreateOpen ? (
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
          itemTitle={`${categoryDetail ? 'Update' : 'Create'} Inventory Category`}
        />
      ) : null}
    </div>
  );
}

export default InventoryCategoryView;

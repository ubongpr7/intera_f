
"use client"
import React, { useState } from 'react';
import { DataTable, Column, ActionButton } from '@/components/common/DataTable/DataTable';
import { useGetDiscountsQuery, useCreateDiscountMutation, useUpdateDiscountMutation, useDeleteDiscountMutation } from '@/redux/features/pos/posAPISlice';
import CustomCreateCard from '@/components/common/createCard';
import { toast } from 'react-toastify';
import { extractErrorMessage } from '@/lib/utils';

interface POSDiscount {
  id: string;
  name: string;
  discount_type: 'percentage' | 'fixed';
  value: string;
  is_active: boolean;
  requires_approval: boolean;
  min_order_amount: string;
  max_discount_amount: string;
}

const Discounts = () => {
  const [isCreateCardOpen, setCreateCardOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<POSDiscount | null>(null);

  const { data: discounts, isLoading, refetch } = useGetDiscountsQuery("");
  const [createDiscount, { isLoading: isCreating }] = useCreateDiscountMutation();
  const [updateDiscount, { isLoading: isUpdating }] = useUpdateDiscountMutation();
  const [deleteDiscount, { isLoading: isDeleting }] = useDeleteDiscountMutation();

  const handleCreate = async (data: Partial<POSDiscount>) => {
    try {
      await createDiscount(data).unwrap();
      toast.success("Discount created successfully");
      setCreateCardOpen(false);
      refetch();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const handleUpdate = async (data: Partial<POSDiscount>) => {
    if (!editingDiscount) return;
    try {
      await updateDiscount({ id: editingDiscount.id, ...data }).unwrap();
      toast.success("Discount updated successfully");
      setEditingDiscount(null);
      refetch();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDiscount(id).unwrap();
      toast.success("Discount deleted successfully");
      refetch();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const columns: Column<POSDiscount>[] = [
    { header: 'Name', accessor: 'name' },
    { header: 'Type', accessor: 'discount_type' },
    { header: 'Value', accessor: 'value' },
    { header: 'Active', accessor: 'is_active', render: (value) => (value ? 'Yes' : 'No') },
  ];

  const actionButtons: ActionButton<POSDiscount>[] = [
    { label: 'Edit', onClick: (row) => setEditingDiscount(row) },
    { label: 'Delete', onClick: (row) => handleDelete(row.id), variant: 'danger' },
  ];

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setCreateCardOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Create Discount
        </button>
      </div>
      <DataTable
        columns={columns}
        data={discounts || []}
        isLoading={isLoading}
        actionButtons={actionButtons}
        showActionsColumn
      />
      {isCreateCardOpen && (
        <CustomCreateCard<POSDiscount>
          onClose={() => setCreateCardOpen(false)}
          onSubmit={handleCreate}
          isLoading={isCreating}
          interfaceKeys={['name', 'discount_type', 'value', 'is_active', 'requires_approval', 'min_order_amount', 'max_discount_amount']}
          itemTitle="Create Discount"
        />
      )}
      {editingDiscount && (
        <CustomCreateCard<POSDiscount>
          defaultValues={editingDiscount}
          onClose={() => setEditingDiscount(null)}
          onSubmit={handleUpdate}
          isLoading={isUpdating}
          interfaceKeys={['name', 'discount_type', 'value', 'is_active', 'requires_approval', 'min_order_amount', 'max_discount_amount']}
          itemTitle="Update Discount"
        />
      )}
    </div>
  );
};

export default Discounts;

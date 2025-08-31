
"use client"
import React, { useState } from 'react';
import { DataTable, Column, ActionButton } from '@/components/common/DataTable/DataTable';
import { useGetCustomersQuery, useCreateCustomerMutation, useUpdateCustomerMutation, useDeleteCustomerMutation } from '@/redux/features/pos/posAPISlice';
import CustomCreateCard from '@/components/common/createCard';
import { toast } from 'react-toastify';
import { extractErrorMessage } from '@/lib/utils';

interface POSCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  loyalty_points: number;
}

const Customers = () => {
  const [isCreateCardOpen, setCreateCardOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<POSCustomer | null>(null);

  const { data: customers, isLoading, refetch } = useGetCustomersQuery("");
  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation();
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();
  const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation();

  const handleCreate = async (data: Partial<POSCustomer>) => {
    try {
      await createCustomer(data).unwrap();
      toast.success("Customer created successfully");
      setCreateCardOpen(false);
      refetch();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const handleUpdate = async (data: Partial<POSCustomer>) => {
    if (!editingCustomer) return;
    try {
      await updateCustomer({ id: editingCustomer.id, ...data }).unwrap();
      toast.success("Customer updated successfully");
      setEditingCustomer(null);
      refetch();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomer(id).unwrap();
      toast.success("Customer deleted successfully");
      refetch();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const columns: Column<POSCustomer>[] = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Address', accessor: 'address' },
    { header: 'Loyalty Points', accessor: 'loyalty_points' },
  ];

  const actionButtons: ActionButton<POSCustomer>[] = [
    { label: 'Edit', onClick: (row) => setEditingCustomer(row) },
    { label: 'Delete', onClick: (row) => handleDelete(row.id), variant: 'danger' },
  ];

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setCreateCardOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Create Customer
        </button>
      </div>
      <DataTable
        columns={columns}
        data={customers || []}
        isLoading={isLoading}
        actionButtons={actionButtons}
        showActionsColumn
      />
      {isCreateCardOpen && (
        <CustomCreateCard<POSCustomer>
          onClose={() => setCreateCardOpen(false)}
          onSubmit={handleCreate}
          isLoading={isCreating}
          interfaceKeys={['name', 'email', 'phone', 'address', 'loyalty_points']}
          itemTitle="Create Customer"
        />
      )}
      {editingCustomer && (
        <CustomCreateCard<POSCustomer>
          defaultValues={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSubmit={handleUpdate}
          isLoading={isUpdating}
          interfaceKeys={['name', 'email', 'phone', 'address', 'loyalty_points']}
          itemTitle="Update Customer"
        />
      )}
    </div>
  );
};

export default Customers;

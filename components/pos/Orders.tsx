
"use client"
import React, { useState } from 'react';
import { DataTable, Column, ActionButton } from '@/components/common/DataTable/DataTable';
import { useGetOrdersQuery, useCreateOrderMutation, useUpdateOrderMutation, useDeleteOrderMutation } from '@/redux/features/pos/posAPISlice';
import CustomCreateCard from '@/components/common/createCard';
import { toast } from 'react-toastify';
import { extractErrorMessage } from '@/lib/utils';

interface POSOrder {
  id: string;
  order_date: string;
  status: string;
  total_amount: string;
  customer_name: string;
}

const Orders = () => {
  const [isCreateCardOpen, setCreateCardOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<POSOrder | null>(null);

  const { data: orders, isLoading, refetch } = useGetOrdersQuery("");
  const [createOrder, { isLoading: isCreating }] = useCreateOrderMutation();
  const [updateOrder, { isLoading: isUpdating }] = useUpdateOrderMutation();
  const [deleteOrder, { isLoading: isDeleting }] = useDeleteOrderMutation();

  const handleCreate = async (data: Partial<POSOrder>) => {
    try {
      await createOrder(data).unwrap();
      toast.success("Order created successfully");
      setCreateCardOpen(false);
      refetch();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const handleUpdate = async (data: Partial<POSOrder>) => {
    if (!editingOrder) return;
    try {
      await updateOrder({ id: editingOrder.id, ...data }).unwrap();
      toast.success("Order updated successfully");
      setEditingOrder(null);
      refetch();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOrder(id).unwrap();
      toast.success("Order deleted successfully");
      refetch();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const columns: Column<POSOrder>[] = [
    { header: 'Order Date', accessor: 'order_date' },
    { header: 'Status', accessor: 'status' },
    { header: 'Total Amount', accessor: 'total_amount' },
    { header: 'Customer', accessor: 'customer_name' },
  ];

  const actionButtons: ActionButton<POSOrder>[] = [
    { label: 'Edit', onClick: (row) => setEditingOrder(row) },
    { label: 'Delete', onClick: (row) => handleDelete(row.id), variant: 'danger' },
  ];

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setCreateCardOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Create Order
        </button>
      </div>
      <DataTable
        columns={columns}
        data={orders || []}
        isLoading={isLoading}
        actionButtons={actionButtons}
        showActionsColumn
      />
      {isCreateCardOpen && (
        <CustomCreateCard<POSOrder>
          onClose={() => setCreateCardOpen(false)}
          onSubmit={handleCreate}
          isLoading={isCreating}
          interfaceKeys={['order_date', 'status', 'total_amount', 'customer_name']}
          itemTitle="Create Order"
        />
      )}
      {editingOrder && (
        <CustomCreateCard<POSOrder>
          defaultValues={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSubmit={handleUpdate}
          isLoading={isUpdating}
          interfaceKeys={['order_date', 'status', 'total_amount', 'customer_name']}
          itemTitle="Update Order"
        />
      )}
    </div>
  );
};

export default Orders;

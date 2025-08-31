
"use client"
import React, { useState } from 'react';
import { DataTable, Column, ActionButton } from '@/components/common/DataTable/DataTable';
import { useGetTablesQuery, useCreateTableMutation, useUpdateTableMutation, useDeleteTableMutation } from '@/redux/features/pos/posAPISlice';
import CustomCreateCard from '@/components/common/createCard';
import { toast } from 'react-toastify';
import { extractErrorMessage } from '@/lib/utils';

interface POSTable {
  id: string;
  name: string;
  capacity: number;
  is_available: boolean;
}

const Tables = () => {
  const [isCreateCardOpen, setCreateCardOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<POSTable | null>(null);

  const { data: tables, isLoading, refetch } = useGetTablesQuery("");
  const [createTable, { isLoading: isCreating }] = useCreateTableMutation();
  const [updateTable, { isLoading: isUpdating }] = useUpdateTableMutation();
  const [deleteTable, { isLoading: isDeleting }] = useDeleteTableMutation();

  const handleCreate = async (data: Partial<POSTable>) => {
    try {
      await createTable(data).unwrap();
      toast.success("Table created successfully");
      setCreateCardOpen(false);
      refetch();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const handleUpdate = async (data: Partial<POSTable>) => {
    if (!editingTable) return;
    try {
      await updateTable({ id: editingTable.id, ...data }).unwrap();
      toast.success("Table updated successfully");
      setEditingTable(null);
      setCreateCardOpen(false);
      refetch();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this table?")) {
      try {
        await deleteTable(id).unwrap();
        toast.success("Table deleted successfully");
        refetch();
      } catch (error) {
        toast.error(extractErrorMessage(error));
      }
    }
  };

  const columns: Column<POSTable>[] = [
    { header: 'Name', accessor: 'name' },
    { header: 'Capacity', accessor: 'capacity' },
    { header: 'Available', accessor: 'is_available', render: (value) => (value ? 'Yes' : 'No') },
  ];

  const actionButtons: ActionButton<POSTable>[] = [
    { label: 'Edit', onClick: (row) => { setEditingTable(row); setCreateCardOpen(true); } },
    { label: 'Delete', onClick: (row) => handleDelete(row.id), variant: 'danger' },
  ];

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => { setEditingTable(null); setCreateCardOpen(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Create Table
        </button>
      </div>
      <DataTable
        columns={columns}
        data={tables || []}
        isLoading={isLoading}
        actionButtons={actionButtons}
        showActionsColumn
      />
      {isCreateCardOpen && (
        <CustomCreateCard<POSTable>
          defaultValues={editingTable || {}}
          onClose={() => setCreateCardOpen(false)}
          onSubmit={editingTable ? handleUpdate : handleCreate}
          isLoading={isCreating || isUpdating}
          interfaceKeys={['name', 'capacity', 'is_available']}
          itemTitle={editingTable ? "Update Table" : "Create Table"}
        />
      )}
    </div>
  );
};

export default Tables;

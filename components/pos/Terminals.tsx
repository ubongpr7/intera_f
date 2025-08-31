
"use client"
import React, { useState } from 'react';
import { DataTable, Column, ActionButton } from '@/components/common/DataTable/DataTable';
import { useGetTerminalsQuery, useCreateTerminalMutation, useUpdateTerminalMutation, useDeleteTerminalMutation } from '@/redux/features/pos/posAPISlice';
import CustomCreateCard from '@/components/common/createCard';
import { toast } from 'react-toastify';
import { extractErrorMessage } from '@/lib/utils';

interface POSTerminal {
  id: string;
  name: string;
  terminal_id: string;
  location: string;
  is_active: boolean;
}

const Terminals = () => {
  const [isCreateCardOpen, setCreateCardOpen] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState<POSTerminal | null>(null);

  const { data: terminals, isLoading, refetch } = useGetTerminalsQuery("");
  const [createTerminal, { isLoading: isCreating }] = useCreateTerminalMutation();
  const [updateTerminal, { isLoading: isUpdating }] = useUpdateTerminalMutation();
  const [deleteTerminal, { isLoading: isDeleting }] = useDeleteTerminalMutation();

  const handleCreate = async (data: Partial<POSTerminal>) => {
    try {
      await createTerminal(data).unwrap();
      toast.success("Terminal created successfully");
      setCreateCardOpen(false);
      refetch();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const handleUpdate = async (data: Partial<POSTerminal>) => {
    if (!editingTerminal) return;
    try {
      await updateTerminal({ id: editingTerminal.id, ...data }).unwrap();
      toast.success("Terminal updated successfully");
      setEditingTerminal(null);
      setCreateCardOpen(false);
      refetch();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this terminal?")) {
      try {
        await deleteTerminal(id).unwrap();
        toast.success("Terminal deleted successfully");
        refetch();
      } catch (error) {
        toast.error(extractErrorMessage(error));
      }
    }
  };

  const columns: Column<POSTerminal>[] = [
    { header: 'Name', accessor: 'name' },
    { header: 'Terminal ID', accessor: 'terminal_id' },
    { header: 'Location', accessor: 'location' },
    { header: 'Active', accessor: 'is_active', render: (value) => (value ? 'Yes' : 'No') },
  ];

  const actionButtons: ActionButton<POSTerminal>[] = [
    { label: 'Edit', onClick: (row) => { setEditingTerminal(row); setCreateCardOpen(true); } },
    { label: 'Delete', onClick: (row) => handleDelete(row.id), variant: 'danger' },
  ];

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => { setEditingTerminal(null); setCreateCardOpen(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Create Terminal
        </button>
      </div>
      <DataTable
        columns={columns}
        data={terminals || []}
        isLoading={isLoading}
        actionButtons={actionButtons}
        showActionsColumn
      />
      {isCreateCardOpen && (
        <CustomCreateCard<POSTerminal>
          defaultValues={editingTerminal || {}}
          onClose={() => setCreateCardOpen(false)}
          onSubmit={editingTerminal ? handleUpdate : handleCreate}
          isLoading={isCreating || isUpdating}
          interfaceKeys={['name', 'terminal_id', 'location', 'is_active']}
          itemTitle={editingTerminal ? "Update Terminal" : "Create Terminal"}
        />
      )}
    </div>
  );
};

export default Terminals;

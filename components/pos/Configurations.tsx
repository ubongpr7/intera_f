
"use client"
import React, { useState } from 'react';
import { DataTable, Column, ActionButton } from '@/components/common/DataTable/DataTable';
import { useGetConfigurationsQuery, useCreateConfigurationMutation, useUpdateConfigurationMutation, useDeleteConfigurationMutation } from '@/redux/features/pos/posAPISlice';
import CustomCreateCard from '@/components/common/createCard';
import { toast } from 'react-toastify';
import { extractErrorMessage } from '@/lib/utils';

interface POSConfiguration {
  id: string;
  name: string;
  currency: string;
  tax_inclusive: boolean;
  default_tax_rate: string;
  allow_negative_stock: boolean;
  require_customer: boolean;
  auto_print_receipt: boolean;
  receipt_header: string;
  receipt_footer: string;
  allow_split_payment: boolean;
  max_discount_percent: string;
}

const Configurations = () => {
  const [isCreateCardOpen, setCreateCardOpen] = useState(false);
  const [editingConfiguration, setEditingConfiguration] = useState<POSConfiguration | null>(null);

  const { data: configurations, isLoading, refetch } = useGetConfigurationsQuery("");
  const [createConfiguration, { isLoading: isCreating }] = useCreateConfigurationMutation();
  const [updateConfiguration, { isLoading: isUpdating }] = useUpdateConfigurationMutation();
  const [deleteConfiguration, { isLoading: isDeleting }] = useDeleteConfigurationMutation();

  const handleCreate = async (data: Partial<POSConfiguration>) => {
    try {
      await createConfiguration(data).unwrap();
      toast.success("Configuration created successfully");
      setCreateCardOpen(false);
      refetch();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const handleUpdate = async (data: Partial<POSConfiguration>) => {
    if (!editingConfiguration) return;
    try {
      await updateConfiguration({ id: editingConfiguration.id, ...data }).unwrap();
      toast.success("Configuration updated successfully");
      setEditingConfiguration(null);
      setCreateCardOpen(false);
      refetch();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this configuration?")) {
      try {
        await deleteConfiguration(id).unwrap();
        toast.success("Configuration deleted successfully");
        refetch();
      } catch (error) {
        toast.error(extractErrorMessage(error));
      }
    }
  };

  const columns: Column<POSConfiguration>[] = [
    { header: 'Name', accessor: 'name' },
    { header: 'Currency', accessor: 'currency' },
    { header: 'Tax Inclusive', accessor: 'tax_inclusive', render: (value) => (value ? 'Yes' : 'No') },
    { header: 'Default Tax Rate', accessor: 'default_tax_rate' },
  ];

  const actionButtons: ActionButton<POSConfiguration>[] = [
    { label: 'Edit', onClick: (row) => { setEditingConfiguration(row); setCreateCardOpen(true); } },
    { label: 'Delete', onClick: (row) => handleDelete(row.id), variant: 'danger' },
  ];

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => { setEditingConfiguration(null); setCreateCardOpen(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Create Configuration
        </button>
      </div>
      <DataTable
        columns={columns}
        data={configurations || []}
        isLoading={isLoading}
        actionButtons={actionButtons}
        showActionsColumn
      />
      {isCreateCardOpen && (
        <CustomCreateCard<POSConfiguration>
          defaultValues={editingConfiguration || {}}
          onClose={() => setCreateCardOpen(false)}
          onSubmit={editingConfiguration ? handleUpdate : handleCreate}
          isLoading={isCreating || isUpdating}
          interfaceKeys={['name', 'currency', 'tax_inclusive', 'default_tax_rate', 'allow_negative_stock', 'require_customer', 'auto_print_receipt', 'receipt_header', 'receipt_footer', 'allow_split_payment', 'max_discount_percent']}
          itemTitle={editingConfiguration ? "Update Configuration" : "Create Configuration"}
          optionalFields={['receipt_header', 'receipt_footer','tax_inclusive','allow_negative_stock','require_customer', 'auto_print_receipt']}
        />
      )}
    </div>
  );
};

export default Configurations;

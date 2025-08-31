
"use client"
import React, { useState } from 'react';
import { DataTable, Column, ActionButton } from '@/components/common/DataTable/DataTable';
import { useGetConfigurationsQuery, useCreateConfigurationMutation, useUpdateConfigurationMutation, useDeleteConfigurationMutation } from '@/redux/features/pos/posAPISlice';
import CustomCreateCard from '@/components/common/createCard';
import { toast } from 'react-toastify';
import { extractErrorMessage } from '@/lib/utils';
import { CURRENCY_CODES } from '@/lib/currencyCode';
import { getCurrencySymbol } from '@/lib/currency-utils';

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
  const currencies = CURRENCY_CODES
     
       const currencyOptions = currencies.map(currency => ({
       value: currency,
       text: `${getCurrencySymbol(currency)} ${currency} `
     }));

     const selectOptions = {
     currency:currencyOptions,
  };
  
  const handleCreate = async (data: Partial<POSConfiguration>) => {
      await createConfiguration(data).unwrap();
      toast.success("Configuration created successfully");
      setCreateCardOpen(false);
      refetch();
    
  };

  const handleUpdate = async (data: Partial<POSConfiguration>) => {
    if (!editingConfiguration) return;
    
      await updateConfiguration({ id: editingConfiguration.id, ...data }).unwrap();
      toast.success("Configuration updated successfully");
      setEditingConfiguration(null);
      refetch();
    
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteConfiguration(id).unwrap();
      toast.success("Configuration deleted successfully");
      refetch();
    } catch (error) {
      toast.error('Configuration Could not be deleted');
    }
  };

  const columns: Column<POSConfiguration>[] = [
    { header: 'Name', accessor: 'name' },
    { header: 'Currency', accessor: 'currency' },
    { header: 'Tax Inclusive', accessor: 'tax_inclusive', render: (value) => (value ? 'Yes' : 'No') },
    { header: 'Default Tax Rate', accessor: 'default_tax_rate' },
  ];

  const actionButtons: ActionButton<POSConfiguration>[] = [
    { label: 'Edit', onClick: (row) => setEditingConfiguration(row) },
    { label: 'Delete', onClick: (row) => handleDelete(row.id), variant: 'danger' },
  ];

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setCreateCardOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
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
          onClose={() => setCreateCardOpen(false)}
          onSubmit={handleCreate}
          isLoading={isCreating}
          interfaceKeys={['name', 'currency', 'tax_inclusive', 'default_tax_rate', 'allow_negative_stock', 'require_customer', 'auto_print_receipt', 'receipt_header', 'receipt_footer', 'allow_split_payment', 'max_discount_percent']}
          itemTitle="Create Configuration"
          selectOptions={selectOptions}
        />
      )}
      {editingConfiguration && (
        <CustomCreateCard<POSConfiguration>
          defaultValues={editingConfiguration}
          onClose={() => setEditingConfiguration(null)}
          onSubmit={handleUpdate}
          isLoading={isUpdating}
          interfaceKeys={['name', 'currency', 'tax_inclusive', 'default_tax_rate', 'allow_negative_stock', 'require_customer', 'auto_print_receipt', 'receipt_header', 'receipt_footer', 'allow_split_payment', 'max_discount_percent']}
          itemTitle="Update Configuration"
          selectOptions={selectOptions}
        />
      )}
    </div>
  );
};

export default Configurations;

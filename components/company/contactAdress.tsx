'use client'
import { use, useEffect, useState } from 'react';
import { PageHeader } from "../inventory/PageHeader";
import { useRouter } from 'nextjs-toploader/app';
import { Column, DataTable, ActionButton } from "../common/DataTable/DataTable";
import { CompanyAddressDataInterface } from "../interfaces/company";
import { useGetCompanyAddressesQuery, useCreateCompanyAddressMutation, useUpdateCompanyAddressMutation, useDeleteCompanyAddressMutation } from '../../redux/features/company/companyAPISlice';
import CustomCreateCard from '../common/createCard';
import { CompanyAddressInterfaceKeys } from './selectOptions';
import { CompanyAddressKeyInfo } from './selectOptions';
import { useGetCurrencyQuery } from '../../redux/features/common/typeOF';
import { toast } from 'react-toastify';
import { Edit, Trash2 } from 'lucide-react';

const inventoryColumns: Column<CompanyAddressDataInterface>[] = [
  {
    header: 'Title',
    accessor: 'title',
    className: 'font-medium',
  },
  {
    header: 'Postal Code',
    accessor: 'postal_code',
    render: (value) => value || 'N/A',
    className: 'font-medium',
  },
  {
    header: 'Address',
    accessor: 'full_address',
    render: (value) => value || 'N/A',
    info: 'Category to which the inventory belong',
  },
];

interface CompanyProps{
    company_id:string;
}

function CompanyAddressView({company_id}:CompanyProps) {
  const { data, isLoading, refetch, error } = useGetCompanyAddressesQuery(company_id);
  const [createAddress, { isLoading: createLoading }] = useCreateCompanyAddressMutation();
  const [updateAddress, { isLoading: updateLoading }] = useUpdateCompanyAddressMutation();
  const [deleteAddress, { isLoading: deleteLoading }] = useDeleteCompanyAddressMutation();
  const [isCreateOpen, setIsCreateOpen] = useState(false); 
  const [editingAddress, setEditingAddress] = useState<CompanyAddressDataInterface | null>(null);
  const router = useRouter();
  
  const handleCreate = async (createdData: Partial<CompanyAddressDataInterface>) => {
    await createAddress(createdData).unwrap();
    setIsCreateOpen(false); 
    await refetch();
    toast.success("Address created successfully!");
  };

  const handleUpdate = async (updatedData: Partial<CompanyAddressDataInterface>) => {
    if (!editingAddress) return;
    await updateAddress({ id: editingAddress.id, data: updatedData }).unwrap();
    setEditingAddress(null);
    await refetch();
    toast.success("Address updated successfully!");
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      try {
        await deleteAddress(id).unwrap();
        await refetch();
        toast.success("Address deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete address.");
      }
    }
  };

  const actionButtons: ActionButton<CompanyAddressDataInterface>[] = [
    {
      label: "Edit",
      icon: Edit,
      onClick: (row) => setEditingAddress(row),
    },
    {
      label: "Delete",
      icon: Trash2,
      onClick: (row) => handleDelete(row.id),
      className: "text-red-600 hover:text-red-800",
    },
  ];

  const AdrssDefaultValues: Partial<CompanyAddressDataInterface> = {
    primary: false,
    country: 165,
    street_number:1,
    apt_number:1
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading address data: {(error as any).message || 'Unknown error'}
      </div>
    );
  }
   const notEditableCompanyFields: (keyof CompanyAddressDataInterface)[] = [
    'id',
  ];
  const selectOptions = {
    
  }

  return (
    <div>
      <PageHeader
        title="Company Adress"
        onClose={() => setIsCreateOpen(true)}
      />
      <DataTable<CompanyAddressDataInterface>
        columns={inventoryColumns}
        data={data || []}
        isLoading={isLoading}
        actionButtons={actionButtons}
        searchableFields={['title', 'postal_code', 'full_address']}
        filterableFields={['title', 'postal_code']}
        sortableFields={['title', 'postal_code', 'full_address']}
      />

      {(isCreateOpen || editingAddress) && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50`}>
          <CustomCreateCard
            defaultValues={editingAddress || AdrssDefaultValues}
            onClose={() => {
              setIsCreateOpen(false);
              setEditingAddress(null);
            }}
            onSubmit={editingAddress ? handleUpdate : handleCreate}
            isLoading={createLoading || updateLoading}
            selectOptions={selectOptions}
            keyInfo={CompanyAddressKeyInfo}
            notEditableFields={notEditableCompanyFields}
            interfaceKeys={CompanyAddressInterfaceKeys}
            optionalFields={['primary','city','link', 'subregion','shipping_notes']}
            hiddenFields={{
            company:company_id
            }}
            itemTitle={editingAddress ? 'Update Address' : 'Create Address'}
          />
        </div>
      )}
    </div>
  );
}

export default  CompanyAddressView;
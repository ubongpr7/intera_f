'use client'
import { use, useEffect, useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { Column, DataTable, ActionButton } from "../common/DataTable/DataTable";
import { CompanyAddressDataInterface } from "@/redux/features/company/companyTypes";
import { useGetCompanyAddressesQuery, useCreateCompanyAddressMutation, useUpdateCompanyAddressMutation, useDeleteCompanyAddressMutation } from '../../redux/features/company/companyAPISlice';
import CustomCreateCard from '../common/createCard';
import { CompanyAddressInterfaceKeys } from './selectOptions';
import { CompanyAddressKeyInfo } from './selectOptions';
import { toast } from 'react-toastify';
import { Edit, Trash2 } from 'lucide-react';
import { extractErrorMessage } from '@/lib/utils';
import { confirmAction } from '../common/confirmAction';
import { useCreateSharedAddressMutation, useRetireSharedAddressMutation, useUpdateSharedAddressMutation } from '@/redux/features/locations/locationsApiSlice';

const inventoryColumns: Column<CompanyAddressDataInterface>[] = [
  {
    header: 'Title',
    accessor: 'title',
    className: 'font-medium',
  },
  {
    header: 'Address',
    accessor: 'address',
    render: (value) => value || 'N/A',
    info: 'Company delivery or operating address',
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
  const [createSharedAddress] = useCreateSharedAddressMutation();
  const [updateSharedAddress] = useUpdateSharedAddressMutation();
  const [retireSharedAddress] = useRetireSharedAddressMutation();
  const [isCreateOpen, setIsCreateOpen] = useState(false); 
  const [editingAddress, setEditingAddress] = useState<CompanyAddressDataInterface | null>(null);
  const router = useRouter();
  
  const handleCreate = async (createdData: Partial<CompanyAddressDataInterface>) => {
    try {
      const localAddress = await createAddress(createdData).unwrap();
      const sharedAddress = await createSharedAddress({
        label: createdData.title || "company",
        address_line_1: createdData.address || "",
        is_primary: Boolean(createdData.primary),
        external_reference: `inventory:company:${company_id}:address:${localAddress.id}`,
      }).unwrap();
      await updateAddress({ id: localAddress.id, data: { address_id: sharedAddress.id } }).unwrap();
      setIsCreateOpen(false);
      await refetch();
      toast.success("Address created successfully!");
    } catch (error) {
      toast.error(extractErrorMessage(error, ["detail", "address"]) || "Failed to create address.");
    }
  };

  const handleUpdate = async (updatedData: Partial<CompanyAddressDataInterface>) => {
    if (!editingAddress) return;
    try {
      const sharedData = {
        label: updatedData.title || editingAddress.title || "company",
        address_line_1: updatedData.address || editingAddress.address,
        is_primary: Boolean(updatedData.primary ?? editingAddress.primary),
      };
      const sharedAddress = editingAddress.address_id
        ? await updateSharedAddress({ id: editingAddress.address_id, data: sharedData }).unwrap()
        : await createSharedAddress({
            ...sharedData,
            external_reference: `inventory:company:${company_id}:address:${editingAddress.id}`,
          }).unwrap();
      await updateAddress({ id: editingAddress.id, data: { ...updatedData, address_id: sharedAddress.id } }).unwrap();
      setEditingAddress(null);
      await refetch();
      toast.success("Address updated successfully!");
    } catch (error) {
      toast.error(extractErrorMessage(error, ["detail", "address"]) || "Failed to update address.");
    }
  };

  const handleDelete = async (id: string | number) => {
    const confirmed = await confirmAction({
      title: "Delete address?",
      description: "This removes the address from the company record.",
      confirmText: "Delete address",
      destructive: true,
    });
    if (!confirmed) return;

    try {
      const address = data?.find((item) => item.id === id);
      if (address?.address_id) {
        await retireSharedAddress(address.address_id).unwrap();
      }
      await deleteAddress(id).unwrap();
      await refetch();
      toast.success("Address deleted successfully!");
    } catch (error) {
      toast.error(extractErrorMessage(error, ["detail"]) || "Failed to delete address.");
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
    address: '',
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Unable to load address records: {extractErrorMessage(error, ["detail", "error"])}
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
      
      <DataTable<CompanyAddressDataInterface>
        columns={inventoryColumns}
        data={data || []}
        isLoading={isLoading}
        actionButtons={actionButtons}
        searchableFields={['title', 'address']}
        filterableFields={['title']}
        sortableFields={['title', 'address']}
        title="Company Address"
        onClose={() => setIsCreateOpen(true)}
      />

      {(isCreateOpen || editingAddress) ? (
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
          optionalFields={['primary', 'link', 'shipping_notes', 'internal_shipping_notes']}
          hiddenFields={{
          company:company_id
          }}
          itemTitle={editingAddress ? 'Update Address' : 'Create Address'}
        />
      ) : null}
    </div>
  );
}

export default  CompanyAddressView;

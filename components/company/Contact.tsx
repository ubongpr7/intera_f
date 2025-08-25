'use client'
import { use, useEffect, useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { Column, DataTable, ActionButton } from "../common/DataTable/DataTable";
import { ContactPersonInterface } from "../interfaces/company";
import { useGetContactPersonQuery, useCreateContactPersonMutation, useUpdateContactPersonMutation, useDeleteContactPersonMutation } from '../../redux/features/company/companyAPISlice';
import CustomCreateCard from '../common/createCard';
import { contactPersonInterfaceKeys } from './selectOptions';
import { CompanyAddressKeyInfo } from './selectOptions';
import { toast } from 'react-toastify';
import { Edit, Trash2 } from 'lucide-react';

const inventoryColumns: Column<ContactPersonInterface>[] = [
  {
    header: 'Name',
    accessor: 'name',
    className: 'font-medium',
  },
  {
    header: 'Role',
    accessor: 'role',
    className: 'font-medium',
  },
  {
    header: 'Email',
    accessor: 'email',
    render: (value) => value || 'N/A',
    className: 'font-medium',
  },
  {
    header: 'Phone',
    accessor: 'phone',
    render: (value) => value || 'N/A',
    info: 'Category to which the inventory belong',
  },
];

interface CompanyProps{
    company_id:string;
}

function ContactPersonView({company_id}:CompanyProps) {
  const { data, isLoading, refetch, error } = useGetContactPersonQuery(company_id);
  const [createContact, { isLoading: createLoading }] = useCreateContactPersonMutation();
  const [updateContact, { isLoading: updateLoading }] = useUpdateContactPersonMutation();
  const [deleteContact, { isLoading: deleteLoading }] = useDeleteContactPersonMutation();
  const [isCreateOpen, setIsCreateOpen] = useState(false); 
  const [editingContact, setEditingContact] = useState<ContactPersonInterface | null>(null);
  const router = useRouter();
  
  const handleCreate = async (createdData: Partial<ContactPersonInterface>) => {
    await createContact(createdData).unwrap();
    setIsCreateOpen(false); 
    await refetch();
    toast.success("Contact created successfully!");
  };

  const handleUpdate = async (updatedData: Partial<ContactPersonInterface>) => {
    if (!editingContact) return;
    await updateContact({ id: editingContact.id, data: updatedData }).unwrap();
    setEditingContact(null);
    await refetch();
    toast.success("Contact updated successfully!");
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      try {
        await deleteContact(id).unwrap();
        await refetch();
        toast.success("Contact deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete contact.");
      }
    }
  };

  const actionButtons: ActionButton<ContactPersonInterface>[] = [
    {
      label: "Edit",
      icon: Edit,
      onClick: (row) => setEditingContact(row),
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
        Error loading contact data: {(error as any).message || 'Unknown error'}
      </div>
    );
  }
   const notEditableCompanyFields: (keyof ContactPersonInterface)[] = [
    'id',
  ];

  return (
    <div>
      
      <DataTable<ContactPersonInterface>
        columns={inventoryColumns}
        data={data || []}
        isLoading={isLoading}
        actionButtons={actionButtons}
        searchableFields={['name', 'role', 'email', 'phone']}
        filterableFields={['role']}
        sortableFields={['name', 'role', 'email', 'phone']}
        title="Contact"
        onClose={() => setIsCreateOpen(true)}
      />

      {(isCreateOpen || editingContact) && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50`}>
          <CustomCreateCard
            defaultValues={editingContact || {}}
            onClose={() => {
              setIsCreateOpen(false);
              setEditingContact(null);
            }}
            onSubmit={editingContact ? handleUpdate : handleCreate}
            isLoading={createLoading || updateLoading}
            selectOptions={{}}
            keyInfo={{}}
            notEditableFields={notEditableCompanyFields}
            interfaceKeys={contactPersonInterfaceKeys}
            optionalFields={[]}
            hiddenFields={{
            company:company_id
            }}
            itemTitle={editingContact ? 'Update Contact' : 'Create Contact'}
          />
        </div>
      )}
    </div>
  );
}

export default  ContactPersonView;
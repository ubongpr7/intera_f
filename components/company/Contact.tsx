'use client'
import { use, useEffect, useState } from 'react';
import { PageHeader } from "../inventory/PageHeader";
import { useRouter } from 'nextjs-toploader/app';
import { Column, DataTable } from "../common/DataTable/DataTable";
import { ContactPersonInterface } from "../interfaces/company";
import { useGetContactPersonQuery, useCreateContactPersonMutation } from '../../redux/features/company/companyAPISlice';
import CustomCreateCard from '../common/createCard';
import { contactPersonInterfaceKeys } from './selectOptions';
import { CompanyAddressKeyInfo } from './selectOptions';

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
  const [isCreateOpen, setIsCreateOpen] = useState(false); 
  const router = useRouter();
  
  const handleCreate = async (createdData: Partial<ContactPersonInterface>) => {
    await createContact(createdData).unwrap();
    setIsCreateOpen(false); 
    await refetch();
  };


  
  const handleRowClick = (row: ContactPersonInterface) => {

};

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading inventory data: {(error as any).message || 'Unknown error'}
      </div>
    );
  }
   const notEditableCompanyFields: (keyof ContactPersonInterface)[] = [
    'id',
  ];

  

  return (
    <div>
      <PageHeader
        title="Contact"
        onClose={() => setIsCreateOpen(true)}
      />
      <DataTable<ContactPersonInterface>
        columns={inventoryColumns}
        data={data || []}
        isLoading={isLoading}
        onRowClick={handleRowClick}
      />

      {/* Always render CustomCreateCard but control visibility */}
      <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${isCreateOpen ? 'block' : 'hidden'}`}>
        <CustomCreateCard
          defaultValues={{}}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreate}
          isLoading={createLoading}
          selectOptions={{}}
          keyInfo={{}}
          notEditableFields={notEditableCompanyFields}
          interfaceKeys={contactPersonInterfaceKeys}
          optionalFields={[]}
          hiddenFields={{
          company:company_id
          }}
        />
      </div>
    </div>
  );
}

export default  ContactPersonView;
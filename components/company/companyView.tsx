'use client'
import { use, useEffect, useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { Column, DataTable } from "../common/DataTable/DataTable";
import { CompanyDataInterface } from "../interfaces/company";
import { useGetCompanyDataQuery, useCreateCompanyMutation,useGetSupplersQuery } from '../../redux/features/company/companyAPISlice';
import CustomCreateCard from '../common/createCard';
import { CompanyInterfaceKeys,defaultValues } from './selectOptions';
import { CompanyKeyInfo } from './selectOptions';
import { getCurrencySymbol } from '@/lib/currency-utils';
import { CURRENCY_CODES } from '@/lib/currencyCode';

const inventoryColumns: Column<CompanyDataInterface>[] = [
  {
    header: 'Name',
    accessor: 'name',
    className: 'font-medium',
  },
  {
    header: 'Affiliation',
    accessor: 'company_type',
    render: (value) => value || 'N/A',
    className: 'font-medium',
  },
  {
    header: 'Email',
    accessor: 'email',
    render: (value) => value || 'N/A',
    info: 'Category to which the inventory belong',
  },
  
  {
    header: 'Phone',
    accessor: 'phone',
    render: (value) => value || 'N/A',
    info: 'Category to which the inventory belong',
  },
  {
    header: 'Address',
    accessor: 'short_address',
    render: (value) => value || 'N/A',
    info: 'Category to which the inventory belong',
  },
  {
    header: 'Currency',
    accessor: 'currency',
    render: (value) => `${getCurrencySymbol(value)} ${value}` || 'N/A',
    info: 'Category to which the inventory belong',
  },
  
];

function CompanyView() {
  const { data, isLoading, refetch, error } = useGetCompanyDataQuery('');
  const [createInventory, { isLoading: companyCreateLoading }] = useCreateCompanyMutation();
  const [isCreateOpen, setIsCreateOpen] = useState(false); 
  const router = useRouter();
  

  const currencyOptions = CURRENCY_CODES.map(currency => ({
  value: currency,
  text: `${getCurrencySymbol(currency)} ${currency} `
}));
  const  selectOptions = {
          
    currency:currencyOptions,
  }
  
  const handleCreate = async (createdData: Partial<CompanyDataInterface>) => {
    await createInventory(createdData).unwrap();
    setIsCreateOpen(false); 
    await refetch(); 
  };


  const handleRefresh = async () => {
    await refetch();
  };

  const handleRowClick = (row: CompanyDataInterface) => {
    router.push(`/companies/${row.id}`);
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading inventory data: {(error as any).message || 'Unknown error'}
      </div>
    );
  }
   const notEditableCompanyFields: (keyof CompanyDataInterface)[] = [
    'id',
    'created_by',
    'attachments',
    'currency_name',  // If you have a resolved currency display name
    'created_at',     // If available in API
    'updated_at',     // If available in API
    'company_type',     // If available in API
  ];

  

  return (
    <div>
      
      <DataTable<CompanyDataInterface>
        columns={inventoryColumns}
        data={data || []}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        searchableFields={['name', 'email', 'phone']}
        filterableFields={['company_type']}
        sortableFields={['name', 'email', 'phone']}
         title="Company"
        onClose={() => setIsCreateOpen(true)}
      />

      {/* Always render CustomCreateCard but control visibility */}
      <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${isCreateOpen ? 'block' : 'hidden'}`}>
        <CustomCreateCard
          defaultValues={defaultValues}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreate}
          isLoading={companyCreateLoading}
          selectOptions={selectOptions}
          keyInfo={CompanyKeyInfo}
          notEditableFields={notEditableCompanyFields}
          interfaceKeys={CompanyInterfaceKeys}
          optionalFields={['is_supplier', 'is_customer','is_manufacturer']}
        />
      </div>
    </div>
  );
}

export default CompanyView;
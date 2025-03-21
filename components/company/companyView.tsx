'use client'
import { use, useEffect, useState } from 'react';
import { PageHeader } from "../inventory/PageHeader";
import { useRouter } from 'nextjs-toploader/app';
import { Column, DataTable } from "../common/DataTable/DataTable";
import { CompanyDataInterface } from "../interfaces/company";
import { useGetCompanyDataQuery, useCreateCompanyMutation } from '../../redux/features/company/companyAPISlice';
import CustomCreateCard from '../common/createCard';
import { CompanyInterfaceKeys,defaultValues } from './selectOptions';
import { CompanyKeyInfo } from './selectOptions';
import { useGetCurrencyQuery } from '../../redux/features/common/typeOF';

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
    header: 'Base Currency',
    accessor: 'base_currency',
    render: (value) => value || 'N/A',
    info: 'Category to which the inventory belong',
  },
  
];

function CompanyView() {
  const { data, isLoading, refetch, error } = useGetCompanyDataQuery('');
  const [createInventory, { isLoading: companyCreateLoading }] = useCreateCompanyMutation();
  const [isCreateOpen, setIsCreateOpen] = useState(false); 
  const router = useRouter();
  const { data: response,isLoading:currencyLoading,error:currencyError } = useGetCurrencyQuery();
  const currencies = response||[]

  console.log(typeof currencies);
  const currencyOptions = currencies.map(currency => ({
  value: currency.id,
  text: `${currency.code} `
}));
  const  selectOptions = {
          
    currency:currencyOptions,
  }
  
  const handleCreate = async (createdData: Partial<CompanyDataInterface>) => {
    await createInventory(createdData).unwrap();
    setIsCreateOpen(false); // Close the modal after creation
    await refetch(); // Refresh the data
  };

    //////////////////////////////
    //////////////////////////////

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
      <PageHeader
        title="Company"
        onClose={() => setIsCreateOpen(true)}
      />
      <DataTable<CompanyDataInterface>
        columns={inventoryColumns}
        data={data || []}
        isLoading={isLoading}
        onRowClick={handleRowClick}
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
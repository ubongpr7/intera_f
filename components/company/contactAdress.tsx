'use client'
import { use, useEffect, useState } from 'react';
import { PageHeader } from "../inventory/PageHeader";
import { useRouter } from 'nextjs-toploader/app';
import { Column, DataTable } from "../common/DataTable/DataTable";
import { CompanyAddressDataInterface } from "../interfaces/company";
import { useGetCompanyAddressesQuery, useCreateCompanyAddressMutation } from '../../redux/features/company/companyAPISlice';
import CustomCreateCard from '../common/createCard';
import { CompanyAddressInterfaceKeys } from './selectOptions';
import { CompanyAddressKeyInfo } from './selectOptions';
import { useGetCurrencyQuery } from '../../redux/features/common/typeOF';

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
  // {
  //   header: 'Company',
  //   accessor: 'company',
  //   render: (value) => value || 'N/A',
  //   info: 'Category to which the inventory belong',
  // },
  
  
  
];

interface CompanyProps{
    company_id:string;
}


function CompanyAddressView({company_id}:CompanyProps) {
  const { data, isLoading, refetch, error } = useGetCompanyAddressesQuery(company_id);
  const [createAddress, { isLoading: createLoading }] = useCreateCompanyAddressMutation();
  const [isCreateOpen, setIsCreateOpen] = useState(false); 
  const router = useRouter();
  
  const handleCreate = async (createdData: Partial<CompanyAddressDataInterface>) => {
    await createAddress(createdData).unwrap();
    setIsCreateOpen(false); 
    await refetch();
  };


  
  const AdrssDefaultValues: Partial<CompanyAddressDataInterface> = {
    primary: false,
    country: 165,
    street_number:1,
    apt_number:1
  };
  const handleRowClick = (row: CompanyAddressDataInterface) => {

};

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading inventory data: {(error as any).message || 'Unknown error'}
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
        onRowClick={handleRowClick}
      />

      {/* Always render CustomCreateCard but control visibility */}
      <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${isCreateOpen ? 'block' : 'hidden'}`}>
        <CustomCreateCard
          defaultValues={AdrssDefaultValues}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreate}
          isLoading={createLoading}
          selectOptions={selectOptions}
          keyInfo={CompanyAddressKeyInfo}
          notEditableFields={notEditableCompanyFields}
          interfaceKeys={CompanyAddressInterfaceKeys}
          optionalFields={['primary','city', 'subregion','shipping_notes']}
          hiddenFields={{
          company:company_id
          }}
        />
      </div>
    </div>
  );
}

export default  CompanyAddressView;
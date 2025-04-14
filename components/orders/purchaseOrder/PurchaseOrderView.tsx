'use client'
import { useEffect, useState } from 'react';
import { PageHeader } from "../../inventory/PageHeader";
import { useRouter } from 'nextjs-toploader/app';
import { Column, DataTable } from "../../common/DataTable/DataTable";
import { PurchaseOrderInterface, PurchaseOrderStatus } from '../../interfaces/order';
import { useCreatePurchaseOderMutation, useGetPurchaseOderDataQuery } from '../../../redux/features/orders/orderAPISlice';
import CustomCreateCard from '../../common/createCard';
import { PurchaseOrderKeyInfo,PurchaseOrderInterfaceKeys,defaultValues } from './selectOptions';
import { useGetCurrencyQuery } from '../../../redux/features/common/typeOF';
import { useGetSupplersQuery } from '../../../redux/features/company/companyAPISlice';
import { useGetCompanyUsersQuery } from '../../../redux/features/users/userApiSlice';
import { UserData } from '../../interfaces/User';
import { useGetInventoryDataQuery } from '../../../redux/features/inventory/inventoryAPiSlice';


function getStatusName(status: string): string {
  return PurchaseOrderStatus[status as keyof typeof PurchaseOrderStatus] || 'UNKNOWN';
}

const inventoryColumns: Column<PurchaseOrderInterface>[] = [
  {
    header: 'Reference',
    accessor: 'reference',
    className: 'font-medium',
  },
  {
    header: 'Status',
    accessor: 'status',
    render: (value) => getStatusName(value) || 'N/A',
    className: 'font-medium',
  },
  {
    header: 'Received By',
    accessor: 'received_by',
    render: (value) => value || 'N/A',
    info: 'Category to which the inventory belong',
  },
  {
    header: 'Delivery Date ',
    accessor: 'delivery_date',
    render: (value) => value || 'N/A',
    info: 'Category to which the inventory belong',
  },

];

function PurchaseOrderView() {
  const { data, isLoading, refetch, error } = useGetPurchaseOderDataQuery('');
  const [createPurchaseOrder, { isLoading: inventoryCreateLoading }] = useCreatePurchaseOderMutation();
  const [isCreateOpen, setIsCreateOpen] = useState(false); // Renamed for clarity
  const router = useRouter();

  const handleCreate = async (createdData: Partial<PurchaseOrderInterface>) => {
    await createPurchaseOrder(createdData).unwrap();
    setIsCreateOpen(false); 
    await refetch(); 
  };
  const { data: staff } = useGetCompanyUsersQuery()
  const { data: supplierResponse,isLoading:supplierLoading,error:supplierError } = useGetSupplersQuery();
  const { data: response,isLoading:currencyLoading,error:currencyError } = useGetCurrencyQuery();
  const { 
    data: inventoryData,
     isLoading: inventoryLoading, 
     refetch: inventoryRefetch, error: inventoryError 
    } = useGetInventoryDataQuery();

  const supplierResponseOptions = supplierResponse ? supplierResponse.map(supplier => ({
    value: supplier.id.toString(),
    text: `${supplier.name} `
  })) : [];
    const currencies = response||[]
    const currencyOptions = currencies.map(currency => ({
    value: currency.id,
    text: `${currency.code} `
  }));

  const staffUsers = staff||[]
  
  const staffOptions = staffUsers.map(staff => ({
    value: staff.id.toString(),
    text: `${staff.first_name} ${staff.email} `
  }));
    

  const inventoryDataOptions = inventoryData ? inventoryData.map(inventory => ({
    value: inventory.id?.toString() || '',
    text: `${inventory.name} `
  })) : [];

    
    const selectOptions = {
     order_currency:currencyOptions,
    supplier:supplierResponseOptions,
    // received_by:staffOptions,
    inventory:inventoryDataOptions,
    responsible:staffOptions,
    
  };


  const handleRefresh = async () => {
    await refetch();
  };

  const handleRowClick = (row: PurchaseOrderInterface) => {
    router.push(`/order/purchase/${row.reference}`);
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading Purchase Order data: {(error as any).message || 'Unknown error'}
      </div>
    );
  }

  const notEditableFields: (keyof PurchaseOrderInterface)[] = [
    'id',
  ];

  

  return (
    <div>
      <PageHeader
        title="Purchase Order"
        onClose={() => setIsCreateOpen(true)} // Renamed to onCreate for clarity
      />
      <DataTable<PurchaseOrderInterface>
        columns={inventoryColumns}
        data={data || []}
        isLoading={isLoading}
        onRowClick={handleRowClick}
      />

      <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${isCreateOpen ? 'block' : 'hidden'}`}>
        <CustomCreateCard
          defaultValues={defaultValues}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreate}
          isLoading={inventoryCreateLoading}
          selectOptions={selectOptions}
          keyInfo={PurchaseOrderKeyInfo}
          notEditableFields={notEditableFields}
          interfaceKeys={PurchaseOrderInterfaceKeys}
          dateFields={['delivery_date']}
          optionalFields={['link']}
        />
      </div>
    </div>
  );
}

export default PurchaseOrderView;

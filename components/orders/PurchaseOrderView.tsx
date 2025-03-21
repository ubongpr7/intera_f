'use client'
import { useEffect, useState } from 'react';
import { PageHeader } from "../inventory/PageHeader";
import { useRouter } from 'nextjs-toploader/app';
import { Column, DataTable } from "../common/DataTable/DataTable";
import { PurchaseOrderInterface, PurchaseOrderStatus } from '../interfaces/order';
import { useCreatePurchaseOderMutation, useGetPurchaseOderDataQuery } from '../../redux/features/orders/orderAPISlice';
import CustomCreateCard from '../common/createCard';
import { PurchaseOrderKeyInfo,PurchaseOrderInterfaceKeys,defaultValues } from './selectOptions';

const inventoryColumns: Column<PurchaseOrderInterface>[] = [
  {
    header: 'Reference',
    accessor: 'reference',
    className: 'font-medium',
  },
  {
    header: 'Status',
    accessor: 'status',
    render: (value) => value || 'N/A',
    className: 'font-medium',
  },
  {
    header: 'Received By',
    accessor: 'received_by',
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
    setIsCreateOpen(false); // Close the modal after creation
    await refetch(); // Refresh the data
  };
   const selectOptions = {
    
    status: [
      { value: PurchaseOrderStatus.PENDING, text: 'Pending' },
      { value: PurchaseOrderStatus.ISSUED, text: 'Issued' },
      { value: PurchaseOrderStatus.RECEIVED, text: 'Received' },
      { value: PurchaseOrderStatus.COMPLETED, text: 'Completed' },
      { value: PurchaseOrderStatus.CANCELLED, text: 'Cancelled' },
    ],
  
  
  
  };

  const handleRefresh = async () => {
    await refetch();
  };

  const handleRowClick = (row: PurchaseOrderInterface) => {
    router.push(`/orders/${row.id}`);
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
        />
      </div>
    </div>
  );
}

export default PurchaseOrderView;

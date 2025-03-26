'use client'
import DetailCard from '../../common/Detail';
import { PurchaseOrderInterface, PurchaseOrderStatus,notEditableFields } from '../../interfaces/order';
import { PurchaseOrderKeyInfo } from './selectOptions';
import { useGetPurchaseOderQuery,useUpdatePurchaseOderMutation } from '../../../redux/features/orders/orderAPISlice';
import { useGetCurrencyQuery } from '../../../redux/features/common/typeOF';
import { useGetSupplersQuery } from '../../../redux/features/company/companyAPISlice';
import { useGetCompanyUsersQuery } from '../../../redux/features/users/userApiSlice';
import { UserData } from '../../interfaces/User';
import { useGetInventoryDataQuery } from '../../../redux/features/inventory/inventoryAPiSlice';
import LoadingAnimation from '../../common/LoadingAnimation';
import ActionHeader from '../../common/actions';
import {
  FilePlus,
  Download,
  Printer,
  Share2,
  Edit,
  Trash2,
  Package,
  Mail,
  Copy,
  FileDown
} from 'lucide-react';

import { ActionItem } from '../../interfaces/common';


export default function PurchseOderDataDetail({ id }: { id: string }) {
  const { data: purchseOderData, isLoading,refetch  } = useGetPurchaseOderQuery(id);
  const PurchaseOrderInterface = purchseOderData as PurchaseOrderInterface;
  const [updatepurchseOderData,{isLoading:updateIsLoading}] = useUpdatePurchaseOderMutation();

  
  const handleUpdate = async (updatedData: Partial<PurchaseOrderInterface>) => {
    await updatepurchseOderData({ id: PurchaseOrderInterface.id, data: updatedData }).unwrap();
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
    status: [
      { value: PurchaseOrderStatus.PENDING.toString(), text: 'Pending' },
      { value: PurchaseOrderStatus.ISSUED.toString(), text: 'Issued' },
      { value: PurchaseOrderStatus.RECEIVED.toString(), text: 'Received' },
      { value: PurchaseOrderStatus.COMPLETED.toString(), text: 'Completed' },
      { value: PurchaseOrderStatus.CANCELLED.toString(), text: 'Cancelled' },
    ],
  };

  const purchaseOrderActions: ActionItem[] = [
    {
      icon: FilePlus,
      text: 'Issue Order',
      action: () => console.log('Issue Order clicked'),
      helpText: 'Issue order to Supplier',
      disabled: false
    },
    {
      icon: Download,
      text: 'Download Bill',
      action: () => console.log('Download Bill clicked'),
      helpText: 'Export Purchase Order Bill as PDF',
      disabled: true
    },
    {
      icon: Printer,
      text: 'Print Order',
      action: () => console.log('Print Order clicked'),
      helpText: 'Generate printable version'
    },
    {
      icon: Share2,
      text: 'Share',
      action: () => console.log('Share clicked'),
      helpText: 'Share purchase order details'
    },
    {
      icon: Edit,
      text: 'Edit',
      action: () => console.log('Edit clicked'),
      helpText: 'Modify order details',
      disabled: false
    },
    {
      icon: Trash2,
      text: 'Delete',
      action: () => console.log('Delete clicked'),
      helpText: 'Remove purchase order',
      disabled: true
    },
    {
      icon: Package,
      text: 'Track',
      action: () => console.log('Track clicked'),
      helpText: 'View shipment tracking'
    },
    {
      icon: Mail,
      text: 'Email',
      action: () => console.log('Email clicked'),
      helpText: 'Send via email to supplier'
    },
    {
      icon: Copy,
      text: 'Duplicate',
      action: () => console.log('Duplicate clicked'),
      helpText: 'Create copy of this order'
    },
    {
      icon: FileDown,
      text: 'Export CSV',
      action: () => console.log('Export CSV clicked'),
      helpText: 'Download data as spreadsheet'
    }
  ];
  

  if (isLoading) return <div>
  <div className="text-center flex items-center justify-center py-8 text-gray-500 ">
  <LoadingAnimation text="Loading..." ringColor="#3b82f6" />
  </div>
  </div>;
  if (!purchseOderData) return <div>Purchse Oder Data not found</div>;
  
  return (
    <div> 
    <DetailCard 

    titleField={'reference'}
      data={PurchaseOrderInterface}
      notEditableFields={notEditableFields}
      updateMutation={handleUpdate}
      excludeFields={['id']}
      selectOptions={selectOptions}
      isLoading={updateIsLoading}
      policyFields={['description']}
      keyInfo={PurchaseOrderKeyInfo}
      dateFields={["delivery_date"]}
      actions={purchaseOrderActions}
    />
    </div>
  );
}

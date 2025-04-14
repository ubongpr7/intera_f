'use client'
import DetailCard from '../../common/Detail';
import { PurchaseOrderInterface, PurchaseOrderStatus,notEditableFields } from '../../interfaces/order';
import { PurchaseOrderKeyInfo } from './selectOptions';
import { 
  useGetPurchaseOderQuery,
  useUpdatePurchaseOderMutation,
  useApprovePurchaseOderMutation,
  useIssuePurchaseOderMutation,
  useReceivePurchaseOderMutation,
  useCompletePurchaseOderMutation,

 } from '../../../redux/features/orders/orderAPISlice';
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
  FileDown,
  LucideIcon,
  CheckCircle,
  PackageCheck,
  RotateCw,
  ClipboardCheck,
  XCircle,
  Ban
} from 'lucide-react';

import { ActionItem as CommonActionItem } from '../../interfaces/common';
import { toast } from 'react-toastify';

interface ActionItem extends CommonActionItem {
  icon: LucideIcon;
}


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
    text: `${currency.code}`
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
  
  interface ActionItem {
    icon: LucideIcon;
    text: string;
    action: () => Promise<void>;
    helpText: string;
    disabled?: boolean;
  }
  const [approveOrder, { isLoading: approveIsLoading }] = useApprovePurchaseOderMutation();
  
  const [issueOrder, { isLoading: issueIsLoading }] = useIssuePurchaseOderMutation();
  
  const handleApproveOrder=async () => {
     try {await approveOrder(purchseOderData?.id).unwrap();
     await refetch();
     }
     catch (error) {
      toast.error(error as string)
     }
    };
  
  // const [returnOrder, { isLoading: returnIsLoading }] = useApprovePurchaseOderMutation();
  const [completeOrder, { isLoading: completeIsLoading }] = useCompletePurchaseOderMutation();
  
  const [receiveOrder, { isLoading: receiveIsLoading }] = useReceivePurchaseOderMutation();
  
  const handleDownloadBill=async () => {
  }
  const handleCompleteOrder=async () => {
    try {
      await completeOrder(purchseOderData?.id).unwrap();
      await refetch();
    }
    catch (error) {
      toast.error(error as string)
    }
  }
  
  const handlePrintOrder=async () => {
  }
  const handleMarkReceived=async () => {
    try {
      await receiveOrder(purchseOderData?.id).unwrap();
      await refetch();
    }
    catch (error) {
      toast.error(error as string)
    }
  }
  
  const handleReturnOrder=async () => {
  }
  
  const handleDeleteOrder=async () => {
  }
  
  const handleCancelOrder=async () => {
  }
  const handleRejectOrder=async () => {
  }
  const handleShareOrder=async () => {
  }
  const handleDuplicateOrder=async () => {
  }

  const handleIssueOrder=async () => {
     try {await issueOrder(purchseOderData?.id).unwrap();
     await refetch();
     }
     catch (error) {
      toast.error(error as string)
     }
    };
  
    const purchaseOrderActions: ActionItem[] = [
      // Approval Flow
      {
        icon: CheckCircle,
        text: 'Approve Order',
        action: async () => handleApproveOrder(),
        helpText: 'Approve Order for Supplier Issuance',
        disabled: purchseOderData?.status !== PurchaseOrderStatus.pending
      },
      {
        icon: XCircle,
        text: 'Reject Order',
        action: async () => handleRejectOrder(),
        helpText: 'Reject this purchase order',
        disabled: purchseOderData?.status !== PurchaseOrderStatus.pending
      },
    
      // Issuance Flow  
      {
        icon: FilePlus,
        text: 'Issue Order',
        action: async () => handleIssueOrder(),
        helpText: 'Issue order to Supplier',
        disabled: purchseOderData?.status !== PurchaseOrderStatus.approved
      },
    
      // Receiving Flow
      {
        icon: PackageCheck,
        text: 'Mark as Received',
        action: async () => handleMarkReceived(),
        helpText: 'Confirm physical receipt of goods',
        disabled: purchseOderData?.status !== PurchaseOrderStatus.issued
      },
    
      // Completion Flow
      {
        icon: ClipboardCheck,
        text: 'Mark Complete',
        action: async () => handleCompleteOrder(),
        helpText: 'Finalize order processing',
        disabled: purchseOderData?.status !== PurchaseOrderStatus.received
      },
    
      // Return Flow
      {
        icon: RotateCw,
        text: 'Return Order',
        action: async () => handleReturnOrder(),
        helpText: 'Initiate return process',
        disabled: ![
          PurchaseOrderStatus.received, 
          PurchaseOrderStatus.completed
        ].includes(purchseOderData?.status)
      },
    
      // Cancellation Flow
      {
        icon: Ban,
        text: 'Cancel Order',
        action: async () => handleCancelOrder(),
        helpText: 'Cancel this purchase order',
        disabled: ![
          PurchaseOrderStatus.pending,
          PurchaseOrderStatus.approved,
          PurchaseOrderStatus.issued
        ].includes(purchseOderData?.status)
      },
    
      // Document Actions
      {
        icon: Download,
        text: 'Download Bill',
        action: async () => handleDownloadBill(),
        helpText: 'Export Purchase Order Bill as PDF',
        disabled: purchseOderData?.status === PurchaseOrderStatus.pending
      },
      {
        icon: Printer,
        text: 'Print Order',
        action: async () => handlePrintOrder(),
        helpText: 'Generate printable version',
        disabled: purchseOderData?.status === PurchaseOrderStatus.pending
      },
    
      // Supplementary Actions
      {
        icon: Copy,
        text: 'Duplicate',
        action: async () => handleDuplicateOrder(),
        helpText: 'Create copy of this order'
      },
      {
        icon: Share2,
        text: 'Share',
        action: async () => handleShareOrder(),
        helpText: 'Share purchase order details'
      },
      {
        icon: Trash2,
        text: 'Delete',
        action: async () => handleDeleteOrder(),
        helpText: 'Remove purchase order',
        disabled: ![
          PurchaseOrderStatus.pending,
          PurchaseOrderStatus.rejected,
          PurchaseOrderStatus.cancelled
        ].includes(purchseOderData?.status)
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

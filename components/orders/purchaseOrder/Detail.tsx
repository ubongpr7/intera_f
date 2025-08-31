'use client'
import DetailCard from '../../common/Detail';
import { PurchaseOrderInterface, PurchaseOrderStatus,notEditableFields } from '../../interfaces/order';
import { PurchaseOrderInterfaceKeys, PurchaseOrderKeyInfo } from './selectOptions';
import { 
  useGetPurchaseOderQuery,
  useUpdatePurchaseOderMutation,
  useApprovePurchaseOderMutation,
  useIssuePurchaseOderMutation,
  useReceivePurchaseOderMutation,
  useCompletePurchaseOderMutation,

 } from '@/redux/features/orders/orderAPISlice';
import { useGetSupplersQuery } from '@/redux/features/company/companyAPISlice';
import { useGetCompanyUsersQuery } from '@/redux/features/users/userApiSlice';
import { UserData } from '../../interfaces/User';
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
import { getCurrencySymbol } from '@/lib/currency-utils';
import { useEffect } from 'react';
import { CURRENCY_CODES } from '@/lib/currencyCode';

interface ActionItem extends CommonActionItem {
  icon: LucideIcon;
}

interface Props {
  purchaseOrderData: PurchaseOrderInterface ;
  isLoading: boolean;
  refetch: () => void;
}


export default function purchaseOrderDataDetail({ purchaseOrderData, isLoading,refetch}: Props) {
  const [updatepurchaseOrderData,{isLoading:updateIsLoading}] = useUpdatePurchaseOderMutation();

  
  const handleUpdate = async (updatedData: Partial<PurchaseOrderInterface>) => {
    await updatepurchaseOrderData({ id: purchaseOrderData.id, data: updatedData }).unwrap();
    await refetch();

  };
const { data: staff } = useGetCompanyUsersQuery()
  const { data: supplierResponse,isLoading:supplierLoading,error:supplierError } = useGetSupplersQuery();

  const supplierResponseOptions = supplierResponse ? supplierResponse.map(supplier => ({
    value: supplier.id.toString(),
    text: `${supplier.name} `
  })) : [];
    const currencies = CURRENCY_CODES
    
      const currencyOptions = currencies.map(currency => ({
      value: currency,
      text: `${getCurrencySymbol(currency)} ${currency} `
    }));

  const staffUsers = staff||[]
  
  const staffOptions = staffUsers.map(staff => ({
    value: staff.id.toString(),
    text: `${staff.first_name} ${staff.email} `
  }));
    


    
    const selectOptions = {
     order_currency:currencyOptions,
    supplier:supplierResponseOptions,
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
     try {await approveOrder(purchaseOrderData?.id).unwrap();
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
      await completeOrder(purchaseOrderData?.id).unwrap();
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
      await receiveOrder(purchaseOrderData?.id).unwrap();
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
     try {await issueOrder(purchaseOrderData?.id).unwrap();
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
        disabled: purchaseOrderData?.status !== PurchaseOrderStatus.pending
      },
      {
        icon: XCircle,
        text: 'Reject Order',
        action: async () => handleRejectOrder(),
        helpText: 'Reject this purchase order',
        disabled: purchaseOrderData?.status !== PurchaseOrderStatus.pending
      },
    
      // Issuance Flow  
      {
        icon: FilePlus,
        text: 'Issue Order',
        action: async () => handleIssueOrder(),
        helpText: 'Issue order to Supplier',
        disabled: purchaseOrderData?.status !== PurchaseOrderStatus.approved
      },
    
      // Receiving Flow
      {
        icon: PackageCheck,
        text: 'Mark as Received',
        action: async () => handleMarkReceived(),
        helpText: 'Confirm physical receipt of goods',
        disabled: purchaseOrderData?.status !== PurchaseOrderStatus.issued
      },
    
      // Completion Flow
      {
        icon: ClipboardCheck,
        text: 'Mark Complete',
        action: async () => handleCompleteOrder(),
        helpText: 'Finalize order processing',
        disabled: purchaseOrderData?.status !== PurchaseOrderStatus.received
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
        ].includes(purchaseOrderData?.status)
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
        ].includes(purchaseOrderData?.status)
      },
    
      // Document Actions
      {
        icon: Download,
        text: 'Download Bill',
        action: async () => handleDownloadBill(),
        helpText: 'Export Purchase Order Bill as PDF',
        disabled: purchaseOrderData?.status === PurchaseOrderStatus.pending
      },
      {
        icon: Printer,
        text: 'Print Order',
        action: async () => handlePrintOrder(),
        helpText: 'Generate printable version',
        disabled: purchaseOrderData?.status === PurchaseOrderStatus.pending
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
        ].includes(purchaseOrderData?.status)
      }
    ];
  

  if (isLoading) return <div>
  <div className="text-center flex items-center justify-center py-8 text-gray-500 ">
  <LoadingAnimation text="Loading..." ringColor="#3b82f6" />
  </div>
  </div>;
  if (!purchaseOrderData) return <div>Purchse Oder Data not found</div>;
  
  return (
    <div> 
    <DetailCard 
      interfaceKeys={PurchaseOrderInterfaceKeys}
    titleField={'reference'}
      data={purchaseOrderData}
      notEditableFields={notEditableFields}
      updateMutation={handleUpdate}
      excludeFields={[
        'id',
        'supplier_details',
        'received_by_details',
        'responsible_details',
        'order_analytics',
        'created_by',
        'line_items',
        'profile',
        'responsible',
        'budget_code',
        'contact',
        'supplier',
        'approved_by',
        'department',
        'workflow_state'

      ]}
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

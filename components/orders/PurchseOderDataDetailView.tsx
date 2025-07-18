'use client'
import { useState } from 'react'
import PurchseOderDataDetail from "@/components/orders/purchaseOrder/Detail";
import Tabs from '@/components/common/Tabs';
import PurchaseOrderLineItems from "@/components/orders/purchaseOrder/lineItems";
import { useGetPurchaseOderQuery } from '@/redux/features/orders/orderAPISlice';
import { PurchaseOrderInterface } from '../interfaces/order';

export default  function PurchseOderDataDetailView({
reference}: {reference:string}) {
    const {data,isLoading,refetch,error}=useGetPurchaseOderQuery(reference)
    const purchaseOrderData = data as PurchaseOrderInterface;
  const tabs = [
      {
        id: 'details',
        label: 'Order Details',
        content:<PurchseOderDataDetail purchaseOrderData={purchaseOrderData} isLoading={isLoading} refetch={refetch} />

      },
     
      {
        id: 'items',
        label: 'Order Items',
        content:<PurchaseOrderLineItems  reference={reference} currency={purchaseOrderData.order_currency||'USD'} lineItemsLoading={isLoading} lineItems={purchaseOrderData?.line_items||[]} refetch={refetch} />

      },
     
     
      
      
    ];
  return (
    <div>
      <Tabs items={tabs} />
    </div>
  );
}

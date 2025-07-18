'use client'
import { useState } from 'react'
import PurchseOderDataDetail from "@/components/orders/purchaseOrder/Detail";
import Tabs from '@/components/common/Tabs';
import PurchaseOrderLineItems from "@/components/orders/purchaseOrder/lineItems";

export default  function PurchseOderDataDetailView({
reference}: {reference:string}) {
    
  const [currency,setCurrency] = useState('USD');
  const tabs = [
      {
        id: 'details',
        label: 'Order Details',
        content:<PurchseOderDataDetail id={reference} setCurrency={setCurrency} />

      },
     
      {
        id: 'items',
        label: 'Order Items',
        content:<PurchaseOrderLineItems reference={reference} currency={currency} />

      },
     
     
      
      
    ];
  return (
    <div>
      <Tabs items={tabs} />
    </div>
  );
}

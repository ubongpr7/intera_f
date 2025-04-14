
import PurchseOderDataDetail from "../../../../components/orders/purchaseOrder/Detail";
import Tabs from '../../../../components/common/Tabs';
import PurchaseOrderLineItems from "../../../../components/orders/purchaseOrder/lineItems";

export default async function PurchseOderDataDetailPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const reference = (await params).reference;
  const tabs = [
      {
        id: 'details',
        label: 'Order Details',
        content:<PurchseOderDataDetail id={reference} />

      },
     
      {
        id: 'items',
        label: 'Order Items',
        content:<PurchaseOrderLineItems reference={reference} />

      },
     
      {
        id: 'settings',
        label: 'Settings',
        content:<PurchseOderDataDetail id={reference} />

      },
     
      
      
    ];
  return (
    <div>
      <Tabs items={tabs} />
    </div>
  );
}

// app/inventory/page.tsx
import Tabs from '../../../components/common/Tabs';
import PurchaseOrderView from '../../../components/orders/purchaseOrder/PurchaseOrderView';

const InventoryPage = () => {
  const tabs = [
    {
      id: 'all',
      label: 'All Purchase Orders',
      content: <PurchaseOrderView />,
    },
    
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Purchase Order Management</h1>
      <Tabs 
        items={tabs} 
        className="bg-white  rounded-lg shadow-sm p-4"
      />
    </div>
  );
};

export default InventoryPage;
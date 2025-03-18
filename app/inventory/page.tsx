// app/inventory/page.tsx
import Tabs from '@components/common/Tabs';
import InventoryCategoryView from '@components/inventory/InventoryCategory';
import InventoryView from '@components/inventory/InventoryView';

const InventoryPage = () => {
  const tabs = [
    {
      id: 'all',
      label: 'All Inventory',
      content: <InventoryView />,
    },
    {
      id: 'categories',
      label: 'By Category',
      content: <InventoryCategoryView />,
    },
    // {
    //   id: 'types',
    //   label: 'By Type',
    //   content: <TypeView />,
    // },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Inventory Management</h1>
      <Tabs 
        items={tabs} 
        className="bg-white  rounded-lg shadow-sm p-4"
      />
    </div>
  );
};

export default InventoryPage;
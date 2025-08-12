'use client'
import { Folder, MapPin, Warehouse } from 'lucide-react';
import Tabs from '@/components/common/Tabs';
import InventoryCategoryView from '@/components/inventory/InventoryCategory';
import InventoryView from '@/components/inventory/InventoryView';
import StockLocations from '@/components/stock/stockLoation';
import { useState } from 'react';
const InventoryPage = () => {
  const  [refetchData, setRefetchData] = useState(false)
  const tabs = [
    {
      id: 'stock_locations',
      label: 'Stock Locations',
      content: <StockLocations refetchData={refetchData} setRefetchData={setRefetchData} />,
      icon:MapPin
    },
    {
      id: 'categories',
      label: 'Inventory Category',
      content: <InventoryCategoryView refetchData={refetchData} setRefetchData={setRefetchData}  />,
      icon:Folder
    },
    {
      id: 'all',
      label: 'All Inventory',
      content: <InventoryView refetchData={refetchData} setRefetchData={setRefetchData} />,
      icon:Warehouse
    },
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
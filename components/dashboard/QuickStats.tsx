// components/dashboard/QuickStats.tsx
import { Box, AlertTriangle, ClipboardList, Truck } from 'lucide-react';
import { useGetDashboardStatsQuery, useGetLowStockItemsQuery } from '@/redux/features/dashboard/dashboardApiSlice'; // Assuming this path
import { useMemo } from 'react';

export default function QuickStats() {
  const { data: lowStockData, error: lowStockError, isLoading: lowStockLoading } = useGetLowStockItemsQuery({ stock_status: "low_stock" });

  const lowStockCount = useMemo(() => {
    return lowStockData?.length || 0;
  }, [lowStockData]);

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold mb-6">Quick Stats</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-indigo-50 rounded-lg flex items-center">
          <Box className="w-8 h-8 text-indigo-600 mr-3" />
          <div>
            <p className="text-sm text-gray-500">Total Products</p>
            <p className="text-xl font-bold">2,345</p>
          </div>
        </div>

        <div className="p-4 bg-red-50 rounded-lg flex items-center">
          <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
          <div>
            <p className="text-sm text-gray-500">Low Stock Items</p>
            <p className="text-xl font-bold">{lowStockCount}</p>
          </div>
        </div>

        <div className="p-4 bg-cyan-50 rounded-lg flex items-center">
          <ClipboardList className="w-8 h-8 text-cyan-600 mr-3" />
          <div>
            <p className="text-sm text-gray-500">POs This Month</p>
            <p className="text-xl font-bold">89</p>
          </div>
        </div>

        <div className="p-4 bg-orange-50 rounded-lg flex items-center">
          <Truck className="w-8 h-8 text-orange-600 mr-3" />
          <div>
            <p className="text-sm text-gray-500">Pending Shipments</p>
            <p className="text-xl font-bold">15</p>
          </div>
        </div>
      </div>

      {lowStockLoading && <p>Loading low stock items...</p>}
      {lowStockError && <p>Error loading low stock items.</p>}
      {lowStockData && lowStockData.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Low Stock Details</h3>
          <ul>
            {lowStockData.map((item: any) => (
              <li key={item.id} className="mb-2">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-600">SKU: {item.sku} | Quantity: {item.quantity} | Min Stock: {item.minimum_stock_level}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
'use client';
import { useGetDashboardStatsQuery, useGetLowStockItemsQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { Box, AlertTriangle, ClipboardList, Truck } from 'lucide-react';
import LoadingAnimation from '../common/LoadingAnimation';
import { useMemo } from 'react'; // Import useMemo

const QuickStats = () => {
  const { data, error, isLoading } = useGetDashboardStatsQuery('');
  const {data:lowStockData,error:lowStockError,isLoading:lowStockLoading}=useGetLowStockItemsQuery({stock_status:"low_stock"});
  // console.log(lowStockData); // Remove console.log as per best practices

  const lowStockCount = useMemo(() => {
    return lowStockData?.length || 0;
  }, [lowStockData]);

  if (isLoading) return <div className="h-full flex justify-center items-center"><LoadingAnimation /></div>;
  if (error) return <div>Error loading stats</div>;

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold mb-6">Quick Stats</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-indigo-50 rounded-lg flex items-center">
          <Box className="w-8 h-8 text-indigo-600 mr-3" />
          <div>
            <p className="text-sm text-gray-500">Total Products</p>
            <p className="text-xl font-bold">{data?.total_products || 0}</p>
          </div>
        </div>

        <div className="p-4 bg-red-50 rounded-lg flex items-center">
          <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
          <div>
            <p className="text-sm text-gray-500">Low Stock Items</p>
            <p className="text-xl font-bold">{lowStockCount}</p> {/* Use lowStockCount here */}
          </div>
        </div>

        <div className="p-4 bg-cyan-50 rounded-lg flex items-center">
          <ClipboardList className="w-8 h-8 text-cyan-600 mr-3" />
          <div>
            <p className="text-sm text-gray-500">POs This Month</p>
            <p className="text-xl font-bold">{data?.purchase_orders_this_month || 0}</p>
          </div>
        </div>

        <div className="p-4 bg-orange-50 rounded-lg flex items-center">
          <Truck className="w-8 h-8 text-orange-600 mr-3" />
          <div>
            <p className="text-sm text-gray-500">Pending Shipments</p>
            <p className="text-xl font-bold">{data?.pending_shipments || 0}</p>
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
              <li key={item.id} className="mb-2 flex items-center">
                {item.display_image && (
                  <img src={item.display_image} alt={item.name} className="w-10 h-10 rounded-md mr-3 object-cover" />
                )}
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">SKU: {item.sku} | Quantity: {parseFloat(item.quantity).toFixed(0)} | Min Stock: {item.minimum_stock_level}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default QuickStats;
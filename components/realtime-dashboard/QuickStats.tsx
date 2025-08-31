'use client';
import { useGetDashboardStatsQuery, useGetLowStockItemsQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { Box, AlertTriangle, ClipboardList, Truck } from 'lucide-react';
import LoadingAnimation from '../common/LoadingAnimation';
import { useMemo } from 'react';

const QuickStats = () => {
  const { data, error, isLoading } = useGetDashboardStatsQuery('');
  const {data:lowStockData,error:lowStockError,isLoading:lowStockLoading}=useGetLowStockItemsQuery({stock_status:"low_stock"});

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
            <p className="text-xl font-bold">{lowStockCount}</p>
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

      {lowStockLoading && <p className="mt-6">Loading low stock items...</p>}
      {lowStockError && <p className="mt-6 text-red-500">Error loading low stock items.</p>}
      {lowStockData && lowStockData.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Low Stock Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockData.map((item: any) => (
              <div key={item.id} className="bg-gray-50 p-4 rounded-lg shadow-sm flex flex-col items-center text-center">
                {item.display_image && (
                  <img src={item.display_image} alt={item.name} className="w-24 h-24 rounded-md mb-3 object-cover border border-gray-200" />
                )}
                <p className="font-medium text-gray-800 mb-1">{item.name}</p>
                <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                <p className="text-sm text-gray-600">Quantity: {parseFloat(item.quantity).toFixed(0)}</p>
                <p className="text-sm text-red-500 font-semibold">Min Stock: {item.minimum_stock_level}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickStats;
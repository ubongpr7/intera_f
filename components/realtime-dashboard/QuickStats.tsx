'use client';
import { useGetDashboardStatsQuery, useGetLowStockItemsQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { Box, AlertTriangle, ClipboardList, Truck } from 'lucide-react';
import LoadingAnimation from '../common/LoadingAnimation';

const QuickStats = () => {
  const { data, error, isLoading } = useGetDashboardStatsQuery('');
  const {data:lowStockData,error:lowStockError,isLoading:lowStockLoading}=useGetLowStockItemsQuery({stock_status:"low_stock"});
  console.log(lowStockData);

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
            <p className="text-xl font-bold">{data?.low_stock_items || 0}</p>
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
    </div>
  );
};

export default QuickStats;
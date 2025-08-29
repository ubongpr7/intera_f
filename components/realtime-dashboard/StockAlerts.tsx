'use client';
import { useGetDashboardStockAlertsQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { AlertTriangle, Package } from 'lucide-react';
import LoadingAnimation from '../common/LoadingAnimation';

const StockAlerts = () => {
  const { data, error, isLoading } = useGetDashboardStockAlertsQuery('');

  if (isLoading) return <div className="h-full flex justify-center items-center"><LoadingAnimation /></div>;
  if (error) return <div>Error loading stock alerts</div>;

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Stock Alerts</h2>
        <AlertTriangle className="w-6 h-6 text-red-600" />
      </div>

      <div className="space-y-4">
        {data && data.length > 0 ? (
          data.map((alert: any) => (
            <div key={alert.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="font-medium mb-1">{alert.product_name}</p>
                <p className="text-sm text-gray-500">{alert.sku}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-red-600" />
                <span className="text-red-600 font-bold">{alert.stock}</span>
              </div>
            </div>
          ))
        ) : (
          <p>No stock alerts</p>
        )}
      </div>
    </div>
  );
};

export default StockAlerts;
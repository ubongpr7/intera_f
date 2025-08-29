
'use client';
import { useGetDashboardRecentSalesQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { ShoppingCart, Clock, CheckCircle } from 'lucide-react';
import LoadingAnimation from '../common/LoadingAnimation';

const RecentSales = () => {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error, isLoading } = useGetDashboardRecentSalesQuery(today);

  if (isLoading) return <div className="h-full flex justify-center items-center"><LoadingAnimation /></div>;
  if (error) return <div>Error loading recent sales</div>;

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Recent Sales</h2>
        <ShoppingCart className="w-6 h-6 text-green-600" />
      </div>

      <div className="space-y-4">
        {data && data.sales_data && data.sales_data.length > 0 ? (
          data.sales_data.slice(0, 3).map((sale: any) => (
            <div key={sale.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium mb-1">Order #{sale.order_id}</p>
                <p className="text-sm text-gray-500">{sale.items_sold} items</p>
              </div>
              <div className="text-right">
                <p className="font-medium mb-1">${sale.total_price}</p>
                <div className="flex items-center space-x-1 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Completed</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No recent sales</p>
        )}
      </div>
    </div>
  );
};

export default RecentSales;

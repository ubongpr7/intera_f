'use client';
import { useGetDashboardRecentOrdersQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { ShoppingCart, Clock, CheckCircle } from 'lucide-react';
import LoadingAnimation from '../common/LoadingAnimation';

const RecentOrders = () => {
  const { data, error, isLoading } = useGetDashboardRecentOrdersQuery('');

  if (isLoading) return <div className="h-full flex justify-center items-center"><LoadingAnimation /></div>;
  if (error) return <div>Error loading recent orders</div>;

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Recent Purchase Orders</h2>
        <ShoppingCart className="w-6 h-6 text-purple-600" />
      </div>

      <div className="space-y-4">
        {data && data.length > 0 ? (
          data.slice(0, 3).map((order: any) => (
            <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium mb-1">#{order.order_number}</p>
                <p className="text-sm text-gray-500">{order.items_count} items</p>
              </div>
              <div className="text-right">
                <p className="font-medium mb-1">${order.total_amount}</p>
                <div className="flex items-center space-x-1 text-sm">
                  {order.status === 'pending' && <Clock className="w-4 h-4 text-yellow-600" />}
                  {order.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                  <span>{order.status}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No recent orders</p>
        )}
      </div>
    </div>
  );
};

export default RecentOrders;
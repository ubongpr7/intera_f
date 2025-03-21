// components/dashboard/RecentOrders.tsx
import { ShoppingCart, Clock, CheckCircle } from 'lucide-react';

export default function RecentOrders() {
  const orders = [
    { id: '#1234', status: 'Pending', items: 5, total: '$234' },
    { id: '#1235', status: 'Processing', items: 2, total: '$89' },
    { id: '#1236', status: 'Completed', items: 8, total: '$445' },
  ];

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Recent Orders</h2>
        <ShoppingCart className="w-6 h-6 text-purple-600" />
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium mb-1">{order.id}</p>
              <p className="text-sm text-gray-500">{order.items} items</p>
            </div>
            <div className="text-right">
              <p className="font-medium mb-1">{order.total}</p>
              <div className="flex items-center space-x-1 text-sm">
                {order.status === 'Pending' && <Clock className="w-4 h-4 text-yellow-600" />}
                {order.status === 'Completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                <span>{order.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
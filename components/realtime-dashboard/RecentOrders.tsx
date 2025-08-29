
'use client';
import { useGetPurchaseOderDataQuery } from '@/redux/features/orders/orderAPISlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';

const RecentOrders = () => {
  const { data, error, isLoading } = useGetPurchaseOderDataQuery();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading recent orders</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {data.slice(0, 5).map((order: any) => (
              <li key={order.id} className="py-3">
                <p className="text-sm font-medium">Order #{order.order_number}</p>
                <p className="text-sm text-gray-500">{order.status}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No recent orders</p>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentOrders;

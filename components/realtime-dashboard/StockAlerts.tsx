
'use client';
import { useGetStockAlertsQuery } from '@/redux/features/product/productAPISlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

const StockAlerts = () => {
  const { data, error, isLoading } = useGetStockAlertsQuery();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading stock alerts</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {data.map((alert: any) => (
              <li key={alert.id} className="py-3">
                <p className="text-sm font-medium">{alert.product_name}</p>
                <p className="text-sm text-red-500">{alert.message}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No stock alerts</p>
        )}
      </CardContent>
    </Card>
  );
};

export default StockAlerts;

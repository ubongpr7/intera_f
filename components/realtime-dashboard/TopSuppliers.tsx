
'use client';
import { useGetDashboardTopSuppliersQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck } from 'lucide-react';
import LoadingAnimation from '../common/LoadingAnimation';
import { Supplier } from '../interfaces/dashboard';

const TopSuppliers = () => {
  const { data, error, isLoading } = useGetDashboardTopSuppliersQuery('');

  if (isLoading) return <div className="h-full flex justify-center items-center"><LoadingAnimation /></div>;
  if (error) return <div>Error loading top suppliers</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Top Suppliers</CardTitle>
        <Truck className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {data.map((supplier: Supplier) => (
              <li key={supplier.id} className="py-3">
                <p className="text-sm font-medium">{supplier.name}</p>
                <p className="text-sm text-gray-500">Value: ${supplier.total_purchase_order_value}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No top suppliers</p>
        )}
      </CardContent>
    </Card>
  );
};

export default TopSuppliers;

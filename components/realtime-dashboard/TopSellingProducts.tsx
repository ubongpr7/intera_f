
'use client';
import { useGetDashboardTopSellingProductsQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import LoadingAnimation from '../common/LoadingAnimation';
import { TopSellingProduct } from '../interfaces/dashboard';

const TopSellingProducts = () => {
  const { data, error, isLoading } = useGetDashboardTopSellingProductsQuery('');

  if (isLoading) return <div className="h-full flex justify-center items-center"><LoadingAnimation /></div>;
  if (error) return <div>Error loading top selling products</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Top Selling Products</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {data.map((product: TopSellingProduct) => (
              <li key={product.id} className="py-3">
                <p className="text-sm font-medium">{product.name}</p>
                <p className="text-sm text-gray-500">Sold: {product.total_sold}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No top selling products</p>
        )}
      </CardContent>
    </Card>
  );
};

export default TopSellingProducts;

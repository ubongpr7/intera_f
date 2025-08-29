
'use client';
import { useGetProductDataQuery } from '@/redux/features/product/productAPISlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';

const RecentProducts = () => {
  const { data, error, isLoading } = useGetProductDataQuery();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading recent products</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Recent Products</CardTitle>
        <Package className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {data.slice(0, 5).map((product: any) => (
              <li key={product.id} className="py-3">
                <p className="text-sm font-medium">{product.name}</p>
                <p className="text-sm text-gray-500">{product.category_name}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No recent products</p>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentProducts;


'use client';
import { useGetProductDataQuery } from '@/redux/features/product/productAPISlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';
import { QueryStateBoundary } from '../common/QueryStateBoundary';

const RecentProducts = () => {
  const { data, error, isLoading, isFetching, refetch } = useGetProductDataQuery();

  return (
    <QueryStateBoundary
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      isEmpty={!data?.length}
      onRetry={refetch}
      loadingText="Loading recent products..."
      emptyTitle="No recent products"
      emptyDescription="Recently created products will appear here after catalog activity starts."
      errorTitle="Unable to load recent products"
    >
    <Card className="border-border bg-card text-card-foreground">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Recent Products</CardTitle>
        <Package className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {data?.slice(0, 5).map((product: any) => (
            <li key={product.id} className="py-3">
              <p className="text-sm font-medium text-foreground">{product.name}</p>
              <p className="text-sm text-muted-foreground">{product.category_name || "No category"}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
    </QueryStateBoundary>
  );
};

export default RecentProducts;

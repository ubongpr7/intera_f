
'use client';
import { useGetInventorySummaryQuery } from '@/redux/features/product/productAPISlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';

const InventorySummary = () => {
  const { data, error, isLoading } = useGetInventorySummaryQuery();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading inventory summary</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Inventory Summary</CardTitle>
        <Package className="h-4 w-4 text-gray-500" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div>
            <p className="text-sm font-medium">Total Items</p>
            <p className="text-2xl font-bold">{data?.product_stats.total_products || 0}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Total Value</p>
            <p className="text-2xl font-bold">${data?.price_analysis.avg_price?.toLocaleString() || 0}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Out of Stock</p>
            <p className="text-2xl font-bold text-red-500">
              {(data?.variant_stats.total_variants || 0) - (data?.variant_stats.pos_visible_variants || 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InventorySummary;

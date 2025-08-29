
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
        <Package className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div>
            <p className="text-sm font-medium">Total Items</p>
            <p className="text-2xl font-bold">{data?.total_items || 0}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Total Value</p>
            <p className="text-2xl font-bold">${data?.total_value?.toLocaleString() || 0}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Out of Stock</p>
            <p className="text-2xl font-bold text-red-500">{data?.out_of_stock_items || 0}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InventorySummary;

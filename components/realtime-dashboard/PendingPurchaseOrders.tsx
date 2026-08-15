
'use client';
import { useGetDashboardPendingPurchaseOrdersQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { QueryStateBoundary } from '../common/QueryStateBoundary';

const PendingPurchaseOrders = () => {
  const { data, error, isLoading, isFetching, refetch } = useGetDashboardPendingPurchaseOrdersQuery('');

  return (
    <QueryStateBoundary isLoading={isLoading} isFetching={isFetching} error={error} onRetry={refetch} loadingText="Loading pending purchase orders..." errorTitle="Unable to load pending purchase orders">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Pending Purchase Orders</CardTitle>
        <Clock className="h-4 w-4 text-gray-500" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{data?.length || 0}</p>
      </CardContent>
    </Card>
    </QueryStateBoundary>
  );
};

export default PendingPurchaseOrders;

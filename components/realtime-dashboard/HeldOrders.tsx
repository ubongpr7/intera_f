
'use client';
import { useGetDashboardHeldOrdersQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PauseCircle } from 'lucide-react';
import { QueryStateBoundary } from '../common/QueryStateBoundary';

const HeldOrders = () => {
  const { data, error, isLoading, isFetching, refetch } = useGetDashboardHeldOrdersQuery(undefined);

  return (
    <QueryStateBoundary isLoading={isLoading} isFetching={isFetching} error={error} onRetry={refetch} loadingText="Loading held orders..." errorTitle="Unable to load held orders">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Held Orders</CardTitle>
        <PauseCircle className="h-4 w-4 text-gray-500" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{data?.length || 0}</p>
      </CardContent>
    </Card>
    </QueryStateBoundary>
  );
};

export default HeldOrders;

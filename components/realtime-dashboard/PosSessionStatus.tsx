
'use client';
import { useGetDashboardPosSessionStatusQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi } from 'lucide-react';
import { QueryStateBoundary } from '../common/QueryStateBoundary';
import { formatMachineLabel } from '@/lib/displayLabels';

const PosSessionStatus = () => {
  const { data, error, isLoading, isFetching, refetch } = useGetDashboardPosSessionStatusQuery('');

  return (
    <QueryStateBoundary
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      onRetry={refetch}
      loadingText="Loading POS session status..."
      errorTitle="Unable to load POS session status"
    >
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">POS Session Status</CardTitle>
        <Wifi className="h-4 w-4 text-gray-500" />
      </CardHeader>
      <CardContent>
        {data ? (
          <div>
            <p className="text-sm font-medium">Status: {formatMachineLabel(data.status)}</p>
            <p className="text-sm text-gray-500">Opened by: {data.opened_by}</p>
          </div>
        ) : (
          <p>No active POS session</p>
        )}
      </CardContent>
    </Card>
    </QueryStateBoundary>
  );
};

export default PosSessionStatus;

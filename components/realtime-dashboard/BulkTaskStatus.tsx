
'use client';
import { useGetDashboardBulkTaskStatusQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare } from 'lucide-react';
import { BulkTask } from '../interfaces/dashboard';
import { QueryStateBoundary } from '../common/QueryStateBoundary';
import { formatMachineLabel } from '@/lib/displayLabels';

const BulkTaskStatus = () => {
  const { data, error, isLoading, isFetching, refetch } = useGetDashboardBulkTaskStatusQuery('');

  return (
    <QueryStateBoundary
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      onRetry={refetch}
      loadingText="Loading bulk task status..."
      errorTitle="Unable to load bulk task status"
    >
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Bulk Task Status</CardTitle>
        <CheckSquare className="h-4 w-4 text-gray-500" />
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {data.map((task: BulkTask) => (
              <li key={task.task_id} className="py-3">
                <p className="text-sm font-medium">{task.task_id}</p>
                <p className="text-sm text-gray-500">Status: {formatMachineLabel(task.status)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No recent bulk tasks</p>
        )}
      </CardContent>
    </Card>
    </QueryStateBoundary>
  );
};

export default BulkTaskStatus;

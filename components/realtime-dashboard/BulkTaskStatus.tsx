
'use client';
import { useGetDashboardBulkTaskStatusQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare } from 'lucide-react';
import LoadingAnimation from '../common/LoadingAnimation';
import { BulkTask } from '../interfaces/dashboard';

const BulkTaskStatus = () => {
  const { data, error, isLoading } = useGetDashboardBulkTaskStatusQuery('');

  if (isLoading) return <div className="h-full flex justify-center items-center"><LoadingAnimation /></div>;
  if (error) return <div>Error loading bulk task status</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Bulk Task Status</CardTitle>
        <CheckSquare className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {data.map((task: BulkTask) => (
              <li key={task.task_id} className="py-3">
                <p className="text-sm font-medium">{task.task_id}</p>
                <p className="text-sm text-gray-500">Status: {task.status}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No recent bulk tasks</p>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkTaskStatus;

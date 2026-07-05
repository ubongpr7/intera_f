
'use client';
import { useGetDashboardRecentPriceChangesQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag } from 'lucide-react';
import { RecentPriceChange } from '../interfaces/dashboard';
import { QueryStateBoundary } from '../common/QueryStateBoundary';

const RecentPriceChanges = () => {
  const { data, error, isLoading, isFetching, refetch } = useGetDashboardRecentPriceChangesQuery('');

  return (
    <QueryStateBoundary isLoading={isLoading} isFetching={isFetching} error={error} onRetry={refetch} loadingText="Loading recent price changes..." errorTitle="Unable to load recent price changes">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Recent Price Changes</CardTitle>
        <Tag className="h-4 w-4 text-gray-500" />
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {data.map((change: RecentPriceChange) => (
              <li key={change.id} className="py-3">
                <p className="text-sm font-medium">{change.product_name}</p>
                <p className="text-sm text-gray-500">
                  <span className="line-through">${change.old_price}</span> {"->"} ${change.new_price}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No recent price changes</p>
        )}
      </CardContent>
    </Card>
    </QueryStateBoundary>
  );
};

export default RecentPriceChanges;

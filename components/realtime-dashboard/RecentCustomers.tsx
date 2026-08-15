
'use client';
import { useGetDashboardRecentCustomersQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { RecentCustomer } from '../interfaces/dashboard';
import { QueryStateBoundary } from '../common/QueryStateBoundary';

const RecentCustomers = () => {
  const { data, error, isLoading, isFetching, refetch } = useGetDashboardRecentCustomersQuery('');

  return (
    <QueryStateBoundary isLoading={isLoading} isFetching={isFetching} error={error} onRetry={refetch} loadingText="Loading recent customers..." errorTitle="Unable to load recent customers">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Recent Customers</CardTitle>
        <Users className="h-4 w-4 text-gray-500" />
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {data.map((customer: RecentCustomer) => (
              <li key={customer.id} className="py-3">
                <p className="text-sm font-medium">{customer.name}</p>
                <p className="text-sm text-gray-500">Last seen: {new Date(customer.last_seen).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No recent customers</p>
        )}
      </CardContent>
    </Card>
    </QueryStateBoundary>
  );
};

export default RecentCustomers;


'use client';
import { useGetDashboardRecentCustomersQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import LoadingAnimation from '../common/LoadingAnimation';
import { RecentCustomer } from '../interfaces/dashboard';

const RecentCustomers = () => {
  const { data, error, isLoading } = useGetDashboardRecentCustomersQuery('');

  if (isLoading) return <div className="h-full flex justify-center items-center"><LoadingAnimation /></div>;
  if (error) return <div>Error loading recent customers</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Recent Customers</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
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
  );
};

export default RecentCustomers;

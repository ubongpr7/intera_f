
'use client';
import { useGetDashboardHeldOrdersQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PauseCircle } from 'lucide-react';
import LoadingAnimation from '../common/LoadingAnimation';
import { HeldOrder } from '../interfaces/dashboard';

const HeldOrders = () => {
  const { data, error, isLoading } = useGetDashboardHeldOrdersQuery('');

  if (isLoading) return <div className="h-full flex justify-center items-center"><LoadingAnimation /></div>;
  if (error) return <div>Error loading held orders</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Held Orders</CardTitle>
        <PauseCircle className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{data?.length || 0}</p>
      </CardContent>
    </Card>
  );
};

export default HeldOrders;

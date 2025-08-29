
'use client';
import { useGetDashboardPendingPurchaseOrdersQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import LoadingAnimation from '../common/LoadingAnimation';
import { PendingPurchaseOrder } from '../interfaces/dashboard';

const PendingPurchaseOrders = () => {
  const { data, error, isLoading } = useGetDashboardPendingPurchaseOrdersQuery('');

  if (isLoading) return <div className="h-full flex justify-center items-center"><LoadingAnimation /></div>;
  if (error) return <div>Error loading pending purchase orders</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Pending Purchase Orders</CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{data?.length || 0}</p>
      </CardContent>
    </Card>
  );
};

export default PendingPurchaseOrders;

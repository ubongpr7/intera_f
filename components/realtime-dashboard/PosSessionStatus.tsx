
'use client';
import { useGetDashboardPosSessionStatusQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi } from 'lucide-react';
import LoadingAnimation from '../common/LoadingAnimation';
import { PosSession } from '../interfaces/dashboard';

const PosSessionStatus = () => {
  const { data, error, isLoading } = useGetDashboardPosSessionStatusQuery('');

  if (isLoading) return <div className="h-full flex justify-center items-center"><LoadingAnimation /></div>;
  if (error) return <div>Error loading POS session status</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">POS Session Status</CardTitle>
        <Wifi className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {data ? (
          <div>
            <p className="text-sm font-medium">Status: {data.status}</p>
            <p className="text-sm text-gray-500">Opened by: {data.opened_by}</p>
          </div>
        ) : (
          <p>No active POS session</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PosSessionStatus;

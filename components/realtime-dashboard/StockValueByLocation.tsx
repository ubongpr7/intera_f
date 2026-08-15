
'use client';
import { useGetDashboardStockValueByLocationQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { StockLocation } from '../interfaces/dashboard';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { QueryStateBoundary } from '../common/QueryStateBoundary';

const StockValueByLocation = () => {
  const { data, error, isLoading, isFetching, refetch } = useGetDashboardStockValueByLocationQuery('');

  const chartData = data?.map((location: StockLocation) => ({
    name: location.name,
    value: location.total_stock_value,
  }));

  return (
    <QueryStateBoundary isLoading={isLoading} isFetching={isFetching} error={error} onRetry={refetch} loadingText="Loading stock value by location..." errorTitle="Unable to load stock value by location">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Stock Value By Location</CardTitle>
        <MapPin className="h-4 w-4 text-gray-500" />
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
    </QueryStateBoundary>
  );
};

export default StockValueByLocation;


'use client';
import { useGetDashboardInventoryByCategoryQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart } from 'lucide-react';
import { InventoryCategory } from '../interfaces/dashboard';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip } from 'recharts';
import { QueryStateBoundary } from '../common/QueryStateBoundary';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const InventoryByCategory = () => {
  const { data, error, isLoading, isFetching, refetch } = useGetDashboardInventoryByCategoryQuery('');

  const chartData = data?.map((category: InventoryCategory) => ({
    name: category.name,
    value: category.inventory_count,
  }));

  return (
    <QueryStateBoundary isLoading={isLoading} isFetching={isFetching} error={error} onRetry={refetch} loadingText="Loading inventory by category..." errorTitle="Unable to load inventory by category">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Inventory By Category</CardTitle>
        <PieChart className="h-4 w-4 text-gray-500" />
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
    </QueryStateBoundary>
  );
};

export default InventoryByCategory;

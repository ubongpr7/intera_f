
'use client';
import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '../buttons/button';
import { ArrowUp, ArrowDown, Activity } from 'lucide-react';
import { useGetDashboardRecentSalesQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { useGetDashboardRecentOrdersQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import LoadingAnimation from '../common/LoadingAnimation';

const InventoryMovementChart = () => {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const today = new Date().toISOString().slice(0, 10);

  const { data: salesData, error: salesError, isLoading: salesLoading } = useGetDashboardRecentSalesQuery(today);
  const { data: orderData, error: orderError, isLoading: orderLoading } = useGetDashboardRecentOrdersQuery('');

  if (salesLoading || orderLoading) return <div className="h-full flex justify-center items-center"><LoadingAnimation /></div>;
  if (salesError || orderError) return <div>Error loading chart data</div>;

  const processChartData = () => {
    const salesByDate = salesData?.sales_data?.reduce((acc: any, sale: any) => {
      const date = new Date(sale.created_at).toLocaleDateString('en-US', { weekday: 'short' });
      acc[date] = (acc[date] || 0) + sale.items_sold;
      return acc;
    }, {});

    const ordersByDate = orderData?.reduce((acc: any, order: any) => {
        const date = new Date(order.created_at).toLocaleDateString('en-US', { weekday: 'short' });
        acc[date] = (acc[date] || 0) + order.items_count;
        return acc;
      }, {});

    const dates = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return dates.map(date => ({
      date,
      incoming: ordersByDate?.[date] || 0,
      outgoing: salesByDate?.[date] || 0,
    }));
  };

  const chartData = processChartData();

  const avgIncoming = chartData.reduce((acc, item) => acc + item.incoming, 0) / chartData.length;
  const avgOutgoing = chartData.reduce((acc, item) => acc + item.outgoing, 0) / chartData.length;

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold">Inventory Movement</h2>
          <div className="flex space-x-2">
            <Button
              variant={viewMode === 'daily' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('daily')}
            >
              Daily
            </Button>
            <Button
              variant={viewMode === 'weekly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('weekly')}
            >
              Weekly
            </Button>
          </div>
        </div>
        <Activity className="w-6 h-6 text-sky-600" />
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorIncoming" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorOutgoing" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              contentStyle={{ 
                border: 'none', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
              }}
            />
            <Area
              type="monotone"
              dataKey="incoming"
              stroke="#3B82F6"
              fillOpacity={1}
              fill="url(#colorIncoming)"
            />
            <Area
              type="monotone"
              dataKey="outgoing"
              stroke="#EF4444"
              fillOpacity={1}
              fill="url(#colorOutgoing)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="p-4 bg-blue-50 rounded-lg flex items-center space-x-3">
          <ArrowUp className="w-6 h-6 text-blue-600" />
          <div>
            <p className="text-sm text-gray-500">Avg. Daily Incoming</p>
            <p className="text-xl font-bold">{avgIncoming.toFixed(0)} units</p>
          </div>
        </div>
        <div className="p-4 bg-red-50 rounded-lg flex items-center space-x-3">
          <ArrowDown className="w-6 h-6 text-red-600" />
          <div>
            <p className="text-sm text-gray-500">Avg. Daily Outgoing</p>
            <p className="text-xl font-bold">{avgOutgoing.toFixed(0)} units</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InventoryMovementChart;

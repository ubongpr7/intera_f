'use client';
import React, { useState } from 'react';
import { useGetPurchaseOrderAnalyticsQuery, useGetPurchaseOrderSummaryQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Spinner from '@/components/common/Spinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { formatMoneyCompactForProfile } from '@/lib/currency-utils';
import { TrendingUp, Calendar, Clock, Package, CheckCircle, AlertCircle, ArrowUpRight, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label, isCurrency = false }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <p className="font-semibold text-gray-800">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {isCurrency ? formatMoneyCompactForProfile(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const statusColors: Record<string, string> = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'approved': 'bg-blue-100 text-blue-800',
    'issued': 'bg-indigo-100 text-indigo-800',
    'received': 'bg-purple-100 text-purple-800',
    'completed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
};

// Format date for X-axis based on time period
const formatXAxis = (tickItem: string, timePeriod: string) => {
  if (timePeriod === 'monthly') {
    const date = new Date(tickItem);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  } else {
    // For weekly data in format "YYYY-Www"
    const [year, week] = tickItem.split('-W');
    return `W${week} ${year}`;
  }
};

// Combined Purchase Order Dashboard with Time Series
const PurchaseOrderDashboard = () => {
  const { data: analyticsData, error: analyticsError, isLoading: analyticsLoading } = useGetPurchaseOrderAnalyticsQuery(undefined);
  const { data: summaryData, error: summaryError, isLoading: summaryLoading } = useGetPurchaseOrderSummaryQuery(undefined);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<'weekly' | 'monthly'>('monthly');

  if (analyticsLoading || summaryLoading) return (
    <div className="col-span-1 lg:col-span-2 rounded-2xl bg-white p-6 shadow-lg border border-gray-100 h-96 flex items-center justify-center">
      <Spinner />
    </div>
  );

  if (analyticsError || summaryError) return (
    <div className="col-span-1 lg:col-span-2 rounded-2xl bg-white p-6 shadow-lg border border-gray-100">
      <div className="flex flex-col items-center justify-center py-10">
        <div className="rounded-full bg-red-100 p-4 mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Error Loading Data</h3>
        <p className="text-gray-500 text-sm">Please try refreshing the page</p>
      </div>
    </div>
  );

  if (!analyticsData || !summaryData) return null;

  // Prepare data for charts
  const statusData = Object.entries(analyticsData?.status_distribution || {})
    .filter(([_, value]) => value as number > 0)
    .map(([name, value]) => ({ name, value }));
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Summary metrics with icons and colors
  const summaryMetrics = [
    {
      id: 1,
      title: 'Total Orders',
      value: summaryData?.total_orders,
      icon: <Package className="w-5 h-5" />,
      color: 'bg-gradient-to-r from-indigo-500 to-purple-600',
      change: '+12%',
      trend: 'up'
    },
    {
      id: 2,
      title: 'Pending Approval',
      value: summaryData?.pending_approval,
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-gradient-to-r from-amber-500 to-orange-600',
      change: '+5%',
      trend: 'up'
    },
    {
      id: 3,
      title: 'Overdue Orders',
      value: summaryData?.overdue_orders,
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'bg-gradient-to-r from-rose-500 to-pink-600',
      change: '-3%',
      trend: 'down'
    },
    {
      id: 4,
      title: 'This Week',
      value: summaryData?.orders_this_week,
      icon: <Calendar className="w-5 h-5" />,
      color: 'bg-gradient-to-r from-blue-500 to-cyan-600',
      change: '+8%',
      trend: 'up'
    },
    {
      id: 5,
      title: 'This Month',
      value: summaryData?.orders_this_month,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-gradient-to-r from-green-500 to-emerald-600',
      change: '+15%',
      trend: 'up'
    },
    {
      id: 6,
      title: 'Monthly Value',
      value: formatMoneyCompactForProfile(summaryData?.total_value_this_month),
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'bg-gradient-to-r from-teal-500 to-green-600',
      change: '+18%',
      trend: 'up'
    }
  ];

  // Analytics metrics
  const analyticsMetrics = [
    {
      id: 1,
      title: 'Total Orders',
      value: analyticsData?.total_purchase_orders,
      description: 'All purchase orders'
    },
    {
      id: 2,
      title: 'Total Value',
      value: formatMoneyCompactForProfile(analyticsData?.total_order_value),
      description: 'Total value of all orders'
    },
    {
      id: 3,
      title: 'Average Value',
      value: formatMoneyCompactForProfile(analyticsData?.average_order_value),
      description: 'Average order value'
    },
    {
      id: 4,
      title: 'Cost Per Order',
      value: formatMoneyCompactForProfile(analyticsData?.cost_per_order),
      description: 'Average cost per order'
    },
    {
      id: 5,
      title: 'Avg Processing Time',
      value: `${analyticsData?.average_processing_time} days`,
      description: 'Average order processing time'
    },
    {
      id: 6,
      title: 'Avg Delivery Time',
      value: `${analyticsData?.average_delivery_time} days`,
      description: 'Average delivery time'
    },
    {
      id: 7,
      title: 'On-Time Rate',
      value: `${analyticsData?.on_time_delivery_rate}%`,
      description: 'Percentage of on-time deliveries'
    }
  ];

  // Get the appropriate trend data based on selection
  const trendData = timePeriod === 'monthly' 
    ? analyticsData?.monthly_trends 
    : analyticsData?.weekly_trends;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Summary Section - 2/5 width */}
      <div className="lg:col-span-2">
        <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Order Summary</h2>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center">
              View details <ArrowUpRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {summaryMetrics.map((metric) => (
              <div 
                key={metric.id} 
                className={`rounded-xl p-4 text-white ${metric.color} transition-all duration-300 hover:shadow-md`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="bg-white/20 p-1.5 rounded-md backdrop-blur-sm">
                    {metric.icon}
                  </div>
                  <span className={`text-xs flex items-center ${metric.trend === 'up' ? 'text-green-100' : 'text-rose-100'}`}>
                    {metric.change}
                  </span>
                </div>
                <h3 className="text-lg font-semibold">{metric.value}</h3>
                <p className="text-xs opacity-90">{metric.title}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Status Distribution Chart */}
        <div className="bg-gray-50 p-4 rounded-xl mb-6">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2 text-indigo-600" /> Status Distribution
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} orders`, 'Count']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Analytics Section - 3/5 width */}
      <div className="lg:col-span-3">
        <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Order Analytics</h2>
            <div className="flex space-x-2">
              <button 
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${timePeriod === 'monthly' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setTimePeriod('monthly')}
              >
                Monthly
              </button>
              <button 
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${timePeriod === 'weekly' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setTimePeriod('weekly')}
              >
                Weekly
              </button>
              <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                Export
              </button>
            </div>
          </div>

          {/* Analytics Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {analyticsMetrics.map((metric, index) => (
              <div 
                key={metric.id} 
                className={`p-3 bg-gray-50 rounded-lg border border-gray-100 transition-all duration-300 hover:shadow-sm ${index === 6 ? 'md:col-span-2' : ''}`}
              >
                <p className="text-sm text-gray-500 mb-1">{metric.title}</p>
                <p className="text-lg font-semibold text-gray-800">{metric.value}</p>
                <p className="text-xs text-gray-400 mt-1">{metric.description}</p>
              </div>
            ))}
          </div>

          {/* Time Series Chart Section */}
          <div className="bg-gray-50 p-4 rounded-xl mb-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-800 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-indigo-600" /> 
                {timePeriod === 'monthly' ? 'Monthly' : 'Weekly'} Trends
              </h4>
              <div className="text-sm text-gray-500">
                {timePeriod === 'monthly' ? 'Last 12 months' : 'Last 8 weeks'}
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Order Count</h5>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis 
                      dataKey={timePeriod === 'monthly' ? 'month' : 'week'} 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(tick) => formatXAxis(tick, timePeriod)}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#8884d8" 
                      strokeWidth={2} 
                      dot={{ r: 4 }} 
                      activeDot={{ r: 6 }} 
                      name="Orders" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Order Value</h5>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis 
                      dataKey={timePeriod === 'monthly' ? 'month' : 'week'} 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(tick) => formatXAxis(tick, timePeriod)}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }} 
                      tickFormatter={(value) => formatMoneyCompactForProfile(value)}
                    />
                    <Tooltip content={<CustomTooltip isCurrency={true} />} />
                    <Line 
                      type="monotone" 
                      dataKey="total_value" 
                      stroke="#82ca9d" 
                      strokeWidth={2} 
                      dot={{ r: 4 }} 
                      activeDot={{ r: 6 }} 
                      name="Value" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          
          {/* Expandable Tables Section */}
          <div className="space-y-4">
            {/* Status Distribution Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button 
                className="w-full p-4 bg-gray-50 text-left font-semibold text-gray-800 flex items-center justify-between"
                onClick={() => setExpandedSection(expandedSection === 'status' ? null : 'status')}
              >
                <span>Status Distribution Details</span>
                {expandedSection === 'status' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              
              {expandedSection === 'status' && (
                <div className="p-4 bg-white">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Count</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(analyticsData?.status_distribution || {}).map(([status, count]: [string, any]) => (
                          <TableRow key={status} className="hover:bg-gray-50">
                            <TableCell><StatusBadge status={status} /></TableCell>
                            <TableCell className="text-right font-medium">{count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>

            {/* Top Suppliers Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button 
                className="w-full p-4 bg-gray-50 text-left font-semibold text-gray-800 flex items-center justify-between"
                onClick={() => setExpandedSection(expandedSection === 'suppliers' ? null : 'suppliers')}
              >
                <span>Top Suppliers by Value</span>
                {expandedSection === 'suppliers' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              
              {expandedSection === 'suppliers' && (
                <div className="p-4 bg-white">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Supplier</TableHead>
                          <TableHead className="text-right">Total Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analyticsData?.top_suppliers_by_value?.map((supplier: any, index: number) => (
                          <TableRow key={index} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{supplier.supplier__name}</TableCell>
                            <TableCell className="text-right">{formatMoneyCompactForProfile(supplier.total_value)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>

            {/* Supplier Performance Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button 
                className="w-full p-4 bg-gray-50 text-left font-semibold text-gray-800 flex items-center justify-between"
                onClick={() => setExpandedSection(expandedSection === 'performance' ? null : 'performance')}
              >
                <span>Supplier Performance</span>
                {expandedSection === 'performance' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              
              {expandedSection === 'performance' && (
                <div className="p-4 bg-white">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Supplier</TableHead>
                          <TableHead className="text-right">Orders</TableHead>
                          <TableHead className="text-right">Total Value</TableHead>
                          <TableHead className="text-right">On-time Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analyticsData?.supplier_performance?.map((supplier: any, index: number) => (
                          <TableRow key={index} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{supplier.supplier__name}</TableCell>
                            <TableCell className="text-right">{supplier.order_count}</TableCell>
                            <TableCell className="text-right">{formatMoneyCompactForProfile(supplier.total_value)}</TableCell>
                            <TableCell className="text-right">
                              <span className="inline-flex items-center">
                                {Math.round((supplier.on_time_deliveries / supplier.order_count) * 100)}%
                                {Math.round((supplier.on_time_deliveries / supplier.order_count) * 100) > 80 ? 
                                  <CheckCircle className="w-4 h-4 text-green-500 ml-1" /> : 
                                  <AlertCircle className="w-4 h-4 text-amber-500 ml-1" />
                                }
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderDashboard;
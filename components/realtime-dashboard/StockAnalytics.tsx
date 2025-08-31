'use client';
import React, { useState } from 'react';
import { useGetStockAnalyticsQuery, useGetDashboardStockValueByLocationQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Spinner from '@/components/common/Spinner';
import { MapPin, Box, Warehouse, TrendingUp, AlertCircle, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { formatMoneyCompactForProfile } from '@/lib/currency-utils';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, CartesianGrid } from 'recharts';

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-md border border-gray-200">
        <p className="font-semibold text-gray-800">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.name.includes('Value') ? formatMoneyCompactForProfile(entry.value) : entry.value.toLocaleString()}
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
    'in_stock': 'bg-green-100 text-green-800',
    'low_stock': 'bg-yellow-100 text-yellow-800',
    'out_of_stock': 'bg-red-100 text-red-800',
    'on_order': 'bg-blue-100 text-blue-800',
    'reserved': 'bg-purple-100 text-purple-800'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
};

// Combined Stock Analytics Dashboard
const StockAnalyticsDashboard = () => {
  const { data: analyticsData, error: analyticsError, isLoading: analyticsLoading } = useGetStockAnalyticsQuery(undefined);
  const { data: locationData, error: locationError, isLoading: locationLoading } = useGetDashboardStockValueByLocationQuery('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  if (analyticsLoading || locationLoading) return (
    <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100 h-96 flex items-center justify-center">
      <Spinner />
    </div>
  );

  if (analyticsError || locationError) return (
    <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100">
      <div className="flex flex-col items-center justify-center py-10">
        <div className="rounded-full bg-red-100 p-4 mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Error Loading Stock Data</h3>
        <p className="text-gray-500 text-sm">Please try refreshing the page</p>
      </div>
    </div>
  );

  if (!analyticsData || !locationData) return null;

  // Prepare data for charts
  const statusData = Object.entries(analyticsData?.status_distribution || {}).map(([name, value]) => ({ name, value }));
  const agingData = Object.entries(analyticsData?.aging_analysis || {}).map(([name, value]) => ({ 
    name: name.replace('_', ' '), 
    value 
  }));
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Summary metrics
  const summaryMetrics = [
    {
      id: 1,
      title: 'Total Stock Items',
      value: analyticsData?.total_stock_items,
      icon: <Box className="w-5 h-5" />,
      color: 'bg-gradient-to-r from-indigo-500 to-purple-600',
      description: 'All items in inventory'
    },
    {
      id: 2,
      title: 'Total Locations',
      value: analyticsData?.total_locations,
      icon: <MapPin className="w-5 h-5" />,
      color: 'bg-gradient-to-r from-cyan-500 to-blue-600',
      description: 'Storage locations'
    },
    {
      id: 3,
      title: 'Total Stock Value',
      value: formatMoneyCompactForProfile(analyticsData?.total_stock_value),
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-gradient-to-r from-green-500 to-emerald-600',
      description: 'Total inventory value'
    }
  ];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Stock Analytics</h2>
        <div className="flex space-x-2">
          <button className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {summaryMetrics.map((metric) => (
          <div 
            key={metric.id} 
            className={`rounded-xl p-5 text-white ${metric.color} transition-all duration-300 hover:shadow-md`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                {metric.icon}
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">{metric.value}</h3>
            <p className="text-sm opacity-90">{metric.title}</p>
            <p className="text-xs opacity-75 mt-2">{metric.description}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Stock Value by Location */}
        <div className="bg-gray-50 p-4 rounded-xl">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-indigo-600" /> Stock Value by Location
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={locationData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(value) => formatMoneyCompactForProfile(value)} />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 12 }} 
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="total_stock_value" 
                name="Stock Value" 
                fill="#8884d8" 
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-gray-50 p-4 rounded-xl">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2 text-indigo-600" /> Stock Status Distribution
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
              <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Aging Analysis Chart */}
      <div className="bg-gray-50 p-4 rounded-xl mb-8">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
          <Warehouse className="w-4 h-4 mr-2 text-indigo-600" /> Stock Aging Analysis
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={agingData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              name="Items" 
              fill="#FF8042" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Expandable Tables Section */}
      <div className="space-y-4">
        {/* Location Distribution Table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button 
            className="w-full p-4 bg-gray-50 text-left font-semibold text-gray-800 flex items-center justify-between"
            onClick={() => setExpandedSection(expandedSection === 'location' ? null : 'location')}
          >
            <span>Location Distribution Details</span>
            {expandedSection === 'location' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {expandedSection === 'location' && (
            <div className="p-4 bg-white">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Item Count</TableHead>
                      <TableHead className="text-right">Total Quantity</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData?.location_distribution?.map((loc: any, index: number) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{loc.location__name}</TableCell>
                        <TableCell className="text-right">{loc.item_count.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{loc.total_quantity.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{formatMoneyCompactForProfile(loc.total_value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

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
                        <TableCell className="text-right font-medium">{count.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        {/* Aging Analysis Table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button 
            className="w-full p-4 bg-gray-50 text-left font-semibold text-gray-800 flex items-center justify-between"
            onClick={() => setExpandedSection(expandedSection === 'aging' ? null : 'aging')}
          >
            <span>Aging Analysis Details</span>
            {expandedSection === 'aging' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {expandedSection === 'aging' && (
            <div className="p-4 bg-white">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Age Range</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(analyticsData?.aging_analysis || {}).map(([range, count]: [string, any]) => (
                      <TableRow key={range} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{range.replace('_', ' ')}</TableCell>
                        <TableCell className="text-right">{count.toLocaleString()}</TableCell>
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
  );
};

export default StockAnalyticsDashboard;
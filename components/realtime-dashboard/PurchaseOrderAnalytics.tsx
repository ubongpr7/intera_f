'use client';
import React from 'react';
import { useGetPurchaseOrderAnalyticsQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Spinner from '@/components/common/Spinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PurchaseOrderAnalytics = () => {
  const { data, error, isLoading } = useGetPurchaseOrderAnalyticsQuery(undefined);

  console.log("Purchase Order Analytics Data:", data);

  if (isLoading) return <Spinner />;
  if (error) return <div>Error loading purchase order analytics.</div>;
  if (!data) return null;

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Purchase Order Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 border rounded-lg"><h4 className="font-semibold">Total Orders</h4><p className="text-2xl">{data?.total_purchase_orders}</p></div>
          <div className="p-4 border rounded-lg"><h4 className="font-semibold">Total Value</h4><p className="text-2xl">${data?.total_order_value}</p></div>
          <div className="p-4 border rounded-lg"><h4 className="font-semibold">Average Value</h4><p className="text-2xl">${data?.average_order_value}</p></div>
          <div className="p-4 border rounded-lg"><h4 className="font-semibold">Cost Per Order</h4><p className="text-2xl">${data?.cost_per_order}</p></div>
          <div className="p-4 border rounded-lg"><h4 className="font-semibold">Avg Processing Time</h4><p className="text-2xl">{data?.average_processing_time} days</p></div>
          <div className="p-4 border rounded-lg"><h4 className="font-semibold">Avg Delivery Time</h4><p className="text-2xl">{data?.average_delivery_time} days</p></div>
          <div className="p-4 border rounded-lg"><h4 className="font-semibold">On-Time Rate</h4><p className="text-2xl">{data?.on_time_delivery_rate}%</p></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="font-semibold mb-2">Monthly Trends</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.monthly_trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" name="Orders" />
                <Line type="monotone" dataKey="total_value" stroke="#82ca9d" name="Value" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Weekly Trends</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.weekly_trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" name="Orders" />
                <Line type="monotone" dataKey="total_value" stroke="#82ca9d" name="Value" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">Status Distribution</h4>
            <Table>
              <TableHeader><TableRow><TableHead>Status</TableHead><TableHead>Count</TableHead></TableRow></TableHeader>
              <TableBody>
                {Object.entries(data?.status_distribution || {}).map(([status, count]: [string, any]) => (
                  <TableRow key={status}><TableCell>{status}</TableCell><TableCell>{count}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Top 5 Suppliers by Value</h4>
            <Table>
              <TableHeader><TableRow><TableHead>Supplier</TableHead><TableHead>Total Value</TableHead></TableRow></TableHeader>
              <TableBody>
                {data?.top_suppliers_by_value?.map((supplier: any, index: number) => (
                  <TableRow key={index}><TableCell>{supplier.supplier__name}</TableCell><TableCell>${supplier.total_value}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="mt-6">
            <h4 className="font-semibold mb-2">Supplier Performance</h4>
            <Table>
                <TableHeader><TableRow><TableHead>Supplier</TableHead><TableHead>Orders</TableHead><TableHead>Total Value</TableHead><TableHead>On-time Deliveries</TableHead></TableRow></TableHeader>
                <TableBody>
                    {data?.supplier_performance?.map((supplier: any, index: number) => (
                        <TableRow key={index}>
                            <TableCell>{supplier.supplier__name}</TableCell>
                            <TableCell>{supplier.order_count}</TableCell>
                            <TableCell>${supplier.total_value}</TableCell>
                            <TableCell>{supplier.on_time_deliveries}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>

      </CardContent>
    </Card>
  );
};

export default PurchaseOrderAnalytics;
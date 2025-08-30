'use client';
import React from 'react';
import { useGetStockAnalyticsQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Spinner from '@/components/common/Spinner';
import { formatMoneyCompactForProfile } from '@/lib/currency-utils';

const StockAnalytics = () => {
  const { data, error, isLoading } = useGetStockAnalyticsQuery(undefined);

  if (isLoading) return <Spinner />;
  if (error) return <div>Error loading stock analytics.</div>;
  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-4 border rounded-lg">
            <h4 className="text-lg font-semibold">Total Stock Items</h4>
            <p className="text-2xl">{data?.total_stock_items}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="text-lg font-semibold">Total Locations</h4>
            <p className="text-2xl">{data?.total_locations}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="text-lg font-semibold">Total Stock Value</h4>
            <p className="text-2xl">{formatMoneyCompactForProfile(data?.total_stock_value)}</p>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-lg font-semibold mb-2">Location Distribution</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Item Count</TableHead>
                <TableHead>Total Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.location_distribution?.map((loc: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{loc.location__name}</TableCell>
                  <TableCell>{loc.item_count}</TableCell>
                  <TableCell>{loc.total_quantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mb-4">
          <h4 className="text-lg font-semibold mb-2">Status Distribution</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(data?.status_distribution || {}).map(([status, count]: [string, any]) => (
                <TableRow key={status}>
                  <TableCell>{status}</TableCell>
                  <TableCell>{count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-2">Aging Analysis</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Age Range</TableHead>
                <TableHead>Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(data?.aging_analysis || {}).map(([range, count]: [string, any]) => (
                <TableRow key={range}>
                  <TableCell>{range.replace('_', ' ')}</TableCell>
                  <TableCell>{count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockAnalytics;
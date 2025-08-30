'use client';
import React from 'react';
import { useGetPurchaseOrderAnalyticsQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Spinner from '@/components/common/Spinner';

const PurchaseOrderAnalytics = () => {
  const { data, error, isLoading } = useGetPurchaseOrderAnalyticsQuery(undefined);

  if (isLoading) return <Spinner />;
  if (error) return <div>Error loading purchase order analytics.</div>;
  if (!data) return null;

  const {
    total_purchase_orders,
    total_order_value,
    average_order_value,
    status_distribution,
    top_suppliers_by_value,
  } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Order Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-4 border rounded-lg">
            <h4 className="text-lg font-semibold">Total Orders</h4>
            <p className="text-2xl">{total_purchase_orders}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="text-lg font-semibold">Total Order Value</h4>
            <p className="text-2xl">${total_order_value}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="text-lg font-semibold">Average Order Value</h4>
            <p className="text-2xl">${average_order_value}</p>
          </div>
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
              {Object.entries(status_distribution).map(([status, count]: [string, any]) => (
                <TableRow key={status}>
                  <TableCell>{status}</TableCell>
                  <TableCell>{count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-2">Top Suppliers by Value</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Total Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top_suppliers_by_value.map((supplier: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{supplier.supplier_name}</TableCell>
                  <TableCell>${supplier.total_value}</TableCell>
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

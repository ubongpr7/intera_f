'use client';
import React from 'react';
import { useGetPurchaseOrderSummaryQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Spinner from '@/components/common/Spinner';

const PurchaseOrderSummary = () => {
  const { data, error, isLoading } = useGetPurchaseOrderSummaryQuery(undefined);

  if (isLoading) return <Spinner />;
  if (error) return <div>Error loading purchase order summary.</div>;
  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Order Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold">Total Orders</h4>
            <p className="text-2xl">{data?.total_orders}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold">Pending Approval</h4>
            <p className="text-2xl">{data?.pending_approval}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold">Overdue Orders</h4>
            <p className="text-2xl">{data?.overdue_orders}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold">Orders This Week</h4>
            <p className="text-2xl">{data?.orders_this_week}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold">Orders This Month</h4>
            <p className="text-2xl">{data?.orders_this_month}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold">Value This Month</h4>
            <p className="text-2xl">${data?.total_value_this_month}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PurchaseOrderSummary;
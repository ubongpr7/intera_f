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

  const {
    total_orders,
    pending_approval,
    overdue_orders,
    orders_this_week,
    orders_this_month,
    total_value_this_month,
  } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Order Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold">Total Orders</h4>
            <p className="text-2xl">{total_orders}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold">Pending Approval</h4>
            <p className="text-2xl">{pending_approval}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold">Overdue Orders</h4>
            <p className="text-2xl">{overdue_orders}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold">Orders This Week</h4>
            <p className="text-2xl">{orders_this_week}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold">Orders This Month</h4>
            <p className="text-2xl">{orders_this_month}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold">Value This Month</h4>
            <p className="text-2xl">${total_value_this_month}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PurchaseOrderSummary;

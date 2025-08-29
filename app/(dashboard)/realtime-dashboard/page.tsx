
'use client';
import React from 'react';
import QuickStats from '@/components/realtime-dashboard/QuickStats';
import InventorySummary from '@/components/realtime-dashboard/InventorySummary';
import StockAlerts from '@/components/realtime-dashboard/StockAlerts';
import RecentOrders from '@/components/realtime-dashboard/RecentOrders';
import RecentProducts from '@/components/realtime-dashboard/RecentProducts';

const RealtimeDashboard = () => {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl font-bold mb-6">Real-time Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="col-span-1 md:col-span-2 lg:col-span-4">
          <QuickStats />
        </div>
        <div className="col-span-1 md:col-span-2">
          <InventorySummary />
        </div>
        <div className="col-span-1 md:col-span-2">
          <StockAlerts />
        </div>
        <div className="col-span-1 md:col-span-2">
          <RecentOrders />
        </div>
        <div className="col-span-1 md:col-span-2">
          <RecentProducts />
        </div>
      </div>
    </div>
  );
};

export default RealtimeDashboard;

'use client';
import React from 'react';
import QuickStats from '@/components/realtime-dashboard/QuickStats';
import StockAlerts from '@/components/realtime-dashboard/StockAlerts';
import RecentOrders from '@/components/realtime-dashboard/RecentOrders';
import RecentSales from '@/components/realtime-dashboard/RecentSales';
import InventoryMovementChart from '@/components/realtime-dashboard/InventoryMovementChart';

const RealtimeDashboard = () => {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl font-bold mb-6">Real-time Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-6">
            <InventoryMovementChart />
            <RecentOrders />
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="grid grid-cols-1 gap-6">
            <QuickStats />
            <StockAlerts />
            <RecentSales />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeDashboard;
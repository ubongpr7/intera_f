'use client';
import React from 'react';
import QuickStats from '@/components/realtime-dashboard/QuickStats';
import StockAlerts from '@/components/realtime-dashboard/StockAlerts';
import RecentOrders from '@/components/realtime-dashboard/RecentOrders';
import RecentSales from '@/components/realtime-dashboard/RecentSales';
import InventoryMovementChart from '@/components/realtime-dashboard/InventoryMovementChart';
import TopSellingProducts from '@/components/realtime-dashboard/TopSellingProducts';
import RecentPriceChanges from '@/components/realtime-dashboard/RecentPriceChanges';
import HeldOrders from '@/components/realtime-dashboard/HeldOrders';
import InventoryByCategory from '@/components/realtime-dashboard/InventoryByCategory';
import StockValueByLocation from '@/components/realtime-dashboard/StockValueByLocation';
import TopSuppliers from '@/components/realtime-dashboard/TopSuppliers';
import PendingPurchaseOrders from '@/components/realtime-dashboard/PendingPurchaseOrders';
import RecentCustomers from '@/components/realtime-dashboard/RecentCustomers';
import BulkTaskStatus from '@/components/realtime-dashboard/BulkTaskStatus';
import PosSessionStatus from '@/components/realtime-dashboard/PosSessionStatus';
import StockAnalytics from '@/components/realtime-dashboard/StockAnalytics';
import PurchaseOrderDashboard from '@/components/realtime-dashboard/PurchaseOrderAnalytics';
import PurchaseOrderSummary from '@/components/realtime-dashboard/PurchaseOrderSummary';

const RealtimeDashboard = () => {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl font-bold mb-6">Real-time Dashboard</h1>
      <div className="grid grid-cols-1  gap-6">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <QuickStats />
          <HeldOrders />
          <PendingPurchaseOrders />
          <PosSessionStatus />
          <BulkTaskStatus />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
          <InventoryMovementChart />
          <TopSellingProducts />
          <RecentPriceChanges />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
          <InventoryByCategory />
          <StockValueByLocation />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <RecentOrders />
        <RecentSales />
      </div>
      <div className="grid grid-cols-1 gap-6 mt-6">
        <StockAnalytics />
        <PurchaseOrderDashboard />
      </div>
    </div>
  );
};

export default RealtimeDashboard;
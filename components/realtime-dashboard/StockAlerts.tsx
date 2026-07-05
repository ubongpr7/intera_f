'use client';
import { useGetDashboardStockAlertsQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { AlertTriangle, Package } from 'lucide-react';
import { QueryStateBoundary } from '../common/QueryStateBoundary';

const StockAlerts = () => {
  const { data, error, isLoading, isFetching, refetch } = useGetDashboardStockAlertsQuery('');

  return (
    <QueryStateBoundary
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      isEmpty={!data?.length}
      onRetry={refetch}
      loadingText="Loading stock alerts..."
      emptyTitle="No stock alerts"
      emptyDescription="Low-stock and exception alerts will appear here when inventory thresholds are reached."
      errorTitle="Unable to load stock alerts"
    >
    <div className="rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Stock Alerts</h2>
        <AlertTriangle className="w-6 h-6 text-red-600" />
      </div>

      <div className="space-y-4">
        {data?.map((alert: any) => (
          <div key={alert.id} className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50/80 p-4 text-red-950 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-100">
            <div>
              <p className="font-medium mb-1">{alert.product_name}</p>
              <p className="text-sm text-red-800/80 dark:text-red-200/80">{alert.sku}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-red-600 dark:text-red-300" />
              <span className="font-bold text-red-600 dark:text-red-200">{alert.stock}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
    </QueryStateBoundary>
  );
};

export default StockAlerts;

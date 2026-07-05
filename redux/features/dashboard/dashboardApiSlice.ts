import { apiSlice } from '../../services/apiSlice';
import { buildQuery } from '../common/queryParams';
import type { StructuralLocationScopeParams } from '@/lib/structuralLocationScope';

type DashboardStructuralScopeParams = StructuralLocationScopeParams & {
  date?: string;
  stock_status?: string;
};

export const dashboardApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getRealtimeDashboardStats: builder.query({
      query: () => ({
        url: `/product_api/dashboard/stats/`,
        service: 'product',
      }),
    }),
    getDashboardInventorySummary: builder.query({
      query: () => ({
        url: `/product_api/analytics/inventory-summary/`,
        service: 'product',
      }),
    }),
    getDashboardStockAlerts: builder.query({
      query: () => ({
        url: `/product_api/analytics/stock-alerts/`,
        service: 'product',
      }),
    }),
    getDashboardRecentOrders: builder.query({
      query: () => ({
        url: `/order_api/purchase-orders/`,
        service: 'inventory',
      }),
    }),
    getDashboardRecentSales: builder.query({
        query: (params?: string | DashboardStructuralScopeParams) => ({
            url: typeof params === "string" ? buildQuery(`/pos_api/analytics/daily-sales/`, { date: params }) : buildQuery(`/pos_api/analytics/daily-sales/`, params),
            service: "pos" ,
          }),
    }),
    getDashboardProductData: builder.query({
        query: () => ({
          url: `/product_api/products/`,
          method: "GET",
          service: "product",
        }),
      }),
      getDashboardTopSellingProducts: builder.query({
        query: () => ({
          url: `/product_api/analytics/top-selling/`,
          service: 'product',
        }),
      }),
      getDashboardRecentPriceChanges: builder.query({
        query: (days = 7) => ({
          url: `/product_api/management/price-history/recent/?days=${days}`,
          service: 'product',
        }),
      }),
      getDashboardHeldOrders: builder.query({
        query: (params?: StructuralLocationScopeParams) => ({
          url: buildQuery(`/pos_api/orders/held_orders/`, params),
          service: 'pos',
        }),
      }),
      getDashboardInventoryByCategory: builder.query({
        query: () => ({
          url: `/inventory_api/categories/`,
          service: 'inventory',
        }),
      }),
      getDashboardStockValueByLocation: builder.query({
        query: () => ({
          url: `/stock_api/locations/`,
          service: 'inventory',
        }),
      }),
      getDashboardTopSuppliers: builder.query({
        query: () => ({
            url: `/company_api/companies/?is_supplier=true`,
            service: 'inventory',
        }),
      }),
      getDashboardPendingPurchaseOrders: builder.query({
        query: () => ({
            url: `/order_api/purchase-orders/?status=pending`,
            service: 'inventory',
        }),
      }),
      getDashboardRecentCustomers: builder.query({
        query: () => ({
            url: `/pos_api/customers/`,
            service: 'pos',
        }),
      }),
      getDashboardBulkTaskStatus: builder.query({
        query: () => ({
            url: `/product_api/products/bulk_task_status/`,
            service: 'product',
        }),
      }),
      getDashboardPosSessionStatus: builder.query({
        query: () => ({
            url: `/pos_api/sessions/current/`,
            service: 'pos',
        }),
      }),
      getDashboardStockAnalytics: builder.query({
        query: (params?: StructuralLocationScopeParams) => ({
          url: buildQuery(`/stock_api/inventory-items/analytics/`, params),
          service: 'inventory',
        }),
      }),
      getDashboardPurchaseOrderAnalytics: builder.query({
        query: (params?: StructuralLocationScopeParams) => ({
          url: buildQuery(`/order_api/purchase-orders/analytics/`, params),
          service: 'inventory',
        }),
      }),
      getPurchaseOrderSummary: builder.query({
        query: (params?: StructuralLocationScopeParams) => ({
          url: buildQuery(`/order_api/purchase-orders/dashboard_summary/`, params),
          service: 'inventory',
        }),
      }),
      getDashboardLowStockItems: builder.query({
        query: (params: DashboardStructuralScopeParams = {}) => ({
          url: buildQuery(`/stock_api/inventory-items/low_stock/`, params),
          service: 'inventory',
        }),
      }),
  }),
});

export const {
    useGetRealtimeDashboardStatsQuery,
    useGetDashboardInventorySummaryQuery,
    useGetDashboardStockAlertsQuery,
    useGetDashboardRecentOrdersQuery,
    useGetDashboardRecentSalesQuery,
    useGetDashboardProductDataQuery,
    useGetDashboardTopSellingProductsQuery,
    useGetDashboardRecentPriceChangesQuery,
    useGetDashboardHeldOrdersQuery,
    useGetDashboardInventoryByCategoryQuery,
    useGetDashboardStockValueByLocationQuery,
    useGetDashboardTopSuppliersQuery,
    useGetDashboardPendingPurchaseOrdersQuery,
    useGetDashboardRecentCustomersQuery,
    useGetDashboardBulkTaskStatusQuery,
    useGetDashboardPosSessionStatusQuery,
    useGetDashboardStockAnalyticsQuery,
    useGetDashboardPurchaseOrderAnalyticsQuery,
    useGetPurchaseOrderSummaryQuery,
    useGetDashboardLowStockItemsQuery,
} = dashboardApiSlice;

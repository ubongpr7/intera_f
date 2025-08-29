
import { apiSlice } from '../../services/apiSlice';

const dashboardApi = 'dashboard_api';
const service = 'dashboard';

export const dashboardApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getDashboardStats: builder.query({
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
        query: (date) => ({
            url: `/pos_api/analytics/daily_sales/?date=${date}`,
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
  }),
});

export const {
    useGetDashboardStatsQuery,
    useGetDashboardInventorySummaryQuery,
    useGetDashboardStockAlertsQuery,
    useGetDashboardRecentOrdersQuery,
    useGetDashboardRecentSalesQuery,
    useGetDashboardProductDataQuery,
} = dashboardApiSlice;

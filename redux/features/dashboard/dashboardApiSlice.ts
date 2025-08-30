import { apiSlice } from '../../services/apiSlice';

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
        query: () => ({
          url: `/pos_api/orders/held_orders/`,
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
      getStockAnalytics: builder.query({
        query: () => ({
          url: `/stock_api/stock-items/analytics/`,
          service: 'inventory',
        }),
      }),
      getPurchaseOrderAnalytics: builder.query({
        query: () => ({
          url: `/order_api/purchase-orders/analytics/`,
          service: 'inventory',
        }),
      }),
      getPurchaseOrderSummary: builder.query({
        query: () => ({
          url: `/order_api/purchase-orders/dashboard_summary/`,
          service: 'inventory',
        }),
      }),
      getLowStockItems: builder.query({
        query: (params={}) => ({
          url: `/inventory_api/inventories/low_stock/?${new URLSearchParams(params)}`,
          service: 'inventory',
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
    useGetStockAnalyticsQuery,
    useGetPurchaseOrderAnalyticsQuery,
    useGetPurchaseOrderSummaryQuery,
    useGetLowStockItemsQuery,
} = dashboardApiSlice;
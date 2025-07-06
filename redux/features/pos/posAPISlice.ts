import { apiSlice } from "../../services/apiSlice"

export const posAPISlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Session endpoints
    getCurrentSession: builder.query({
      query: () => ({
        url: "/pos_api/sessions/current/",
        service: "pos" ,
      }),
    }),

    openSession: builder.mutation({
      query: (data) => ({
        url: "/pos_api/sessions/open_session/",
        method: "POST",
        body: data,
        service: "pos" ,
      }),
    }),

    closeSession: builder.mutation({
      query: ({ sessionId, closingBalance }) => ({
        url: `/pos_api/sessions/${sessionId}/close_session/`,
        method: "POST",
        body: { closing_balance: closingBalance },
        service: "pos" ,
      }),
    }),

    // Order endpoints
    getCurrentOrder: builder.query({
      query: (sessionId) => ({
        url: `/pos_api/orders/current_draft/?session_id=${sessionId}`,
        service: "pos" ,
      }),
    }),

    createOrGetDraftOrder: builder.mutation({
      query: (data) => ({
        url: "/pos_api/orders/create_or_get_draft/",
        method: "POST",
        body: data,
        service: "pos" ,
      }),
    }),

    addItemToOrder: builder.mutation({
      query: ({ orderId, ...data }) => ({
        url: `/pos_api/orders/${orderId}/add_item/`,
        method: "POST",
        body: data,
        service: "pos" ,
      }),
    }),

    updateOrderItem: builder.mutation({
      query: ({ orderId, ...data }) => ({
        url: `/pos_api/orders/${orderId}/update_item/`,
        method: "POST",
        body: data,
        service: "pos" ,
      }),
    }),

    removeOrderItem: builder.mutation({
      query: ({ orderId, itemId }) => ({
        url: `/pos_api/orders/${orderId}/remove_item/`,
        method: "POST",
        body: { item_id: itemId },
        service: "pos" ,
      }),
    }),

    processPayment: builder.mutation({
      query: ({ orderId, ...data }) => ({
        url: `/pos_api/orders/${orderId}/process_payment/`,
        method: "POST",
        body: data,
        service: "pos" ,
      }),
    }),

    holdOrder: builder.mutation({
      query: ({ orderId, ...data }) => ({
        url: `/pos_api/orders/${orderId}/hold_order/`,
        method: "POST",
        body: data,
        service: "pos" ,
      }),
    }),

    getHeldOrders: builder.query({
      query: () => ({
        url: "/pos_api/orders/held_orders/",
        service: "pos" ,
      }),
    }),

    retrieveHeldOrder: builder.mutation({
      query: (data) => ({
        url: "/pos_api/orders/retrieve_held_order/",
        method: "POST",
        body: data,
        service: "pos" ,
      }),
    }),

    // Product endpoints (proxy to product service)
    searchProducts: builder.query({
      query: (searchTerm) => ({
        url: `/pos_api/products/search/?q=${searchTerm}`,
        service: "pos" ,
      }),
    }),

    getPOSCategories: builder.query({
      query: () => ({
        url: "/pos_api/products/categories/",
        service: "pos" ,
      }),
    }),

    getFeaturedProducts: builder.query({
      query: () => ({
        url: "/pos_api/products/featured/",
        service: "pos" ,
      }),
    }),

    

    // Customer endpoints
    getCustomers: builder.query({
      query: (search = "") => ({
        url: `/pos_api/customers/?search=${search}`,
        service: "pos" ,
      }),
    }),

    // Table endpoints
    getTables: builder.query({
      query: () => ({
        url: "/pos_api/tables/",
        service: "pos" ,
      }),
    }),

    // Analytics
    getDailySales: builder.query({
      query: (date) => ({
        url: `/pos_api/analytics/daily_sales/?date=${date}`,
        service: "pos" ,
      }),
    }),
  }),
})

export const {
  useGetCurrentSessionQuery,
  useOpenSessionMutation,
  useCloseSessionMutation,
  useGetCurrentOrderQuery,
  useCreateOrGetDraftOrderMutation,
  useAddItemToOrderMutation,
  useUpdateOrderItemMutation,
  useRemoveOrderItemMutation,
  useProcessPaymentMutation,
  useHoldOrderMutation,
  useGetHeldOrdersQuery,
  useRetrieveHeldOrderMutation,
  useSearchProductsQuery,
  useGetPOSCategoriesQuery,
  useGetFeaturedProductsQuery,
  useGetCustomersQuery,
  useGetTablesQuery,
  useGetDailySalesQuery,
} = posAPISlice

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

    getSessions: builder.query({
      query: () => ({
        url: "/pos_api/sessions/",
        service: "pos",
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

    createCustomer: builder.mutation({
      query: (data) => ({
        url: "/pos_api/customers/",
        method: "POST",
        body: data,
        service: "pos",
      }),
    }),

    updateCustomer: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/pos_api/customers/${id}/`,
        method: "PUT",
        body: data,
        service: "pos",
      }),
    }),

    deleteCustomer: builder.mutation({
      query: (id) => ({
        url: `/pos_api/customers/${id}/`,
        method: "DELETE",
        service: "pos",
      }),
    }),

    // Table endpoints
    getTables: builder.query({
      query: () => ({
        url: "/pos_api/tables/",
        service: "pos" ,
      }),
    }),

    createTable: builder.mutation({
      query: (data) => ({
        url: "/pos_api/tables/",
        method: "POST",
        body: data,
        service: "pos",
      }),
    }),

    updateTable: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/pos_api/tables/${id}/`,
        method: "PUT",
        body: data,
        service: "pos",
      }),
    }),

    deleteTable: builder.mutation({
      query: (id) => ({
        url: `/pos_api/tables/${id}/`,
        method: "DELETE",
        service: "pos",
      }),
    }),

    // Analytics
    getDailySales: builder.query({
      query: (date) => ({
        url: `/pos_api/analytics/daily_sales/?date=${date}`,
        service: "pos" ,
      }),
    }),

    // Configuration endpoints
    getConfigurations: builder.query({
      query: () => ({
        url: "/pos_api/configurations/",
        service: "pos",
      }),
    }),
    createConfiguration: builder.mutation({
      query: (data) => ({
        url: "/pos_api/configurations/",
        method: "POST",
        body: data,
        service: "pos",
      }),
    }),
    getCurrentConfiguration: builder.query({
      query: () => ({
        url: "/pos_api/configurations/current/",
        service: "pos",
      }),
    }),
    getConfiguration: builder.query({
      query: (id) => ({
        url: `/pos_api/configurations/${id}/`,
        service: "pos",
      }),
    }),
    updateConfiguration: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/pos_api/configurations/${id}/`,
        method: "PUT",
        body: data,
        service: "pos",
      }),
    }),
    partialUpdateConfiguration: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/pos_api/configurations/${id}/`,
        method: "PATCH",
        body: data,
        service: "pos",
      }),
    }),
    deleteConfiguration: builder.mutation({
      query: (id) => ({
        url: `/pos_api/configurations/${id}/`,
        method: "DELETE",
        service: "pos",
      }),
    }),

    // Discount endpoints
    getDiscounts: builder.query({
      query: () => ({
        url: "/pos_api/discounts/",
        service: "pos",
      }),
    }),
    createDiscount: builder.mutation({
      query: (data) => ({
        url: "/pos_api/discounts/",
        method: "POST",
        body: data,
        service: "pos",
      }),
    }),
    getDiscount: builder.query({
      query: (id) => ({
        url: `/pos_api/discounts/${id}/`,
        service: "pos",
      }),
    }),
    updateDiscount: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/pos_api/discounts/${id}/`,
        method: "PUT",
        body: data,
        service: "pos",
      }),
    }),
    partialUpdateDiscount: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/pos_api/discounts/${id}/`,
        method: "PATCH",
        body: data,
        service: "pos",
      }),
    }),
    deleteDiscount: builder.mutation({
      query: (id) => ({
        url: `/pos_api/discounts/${id}/`,
        method: "DELETE",
        service: "pos",
      }),
    }),

    // Order endpoints
    getOrders: builder.query({
        query: (search = "") => ({
            url: `/pos_api/orders/?search=${search}`,
            service: "pos",
        }),
    }),
    createOrder: builder.mutation({
        query: (data) => ({
            url: "/pos_api/orders/",
            method: "POST",
            body: data,
            service: "pos",
        }),
    }),
    getOrder: builder.query({
        query: (id) => ({
            url: `/pos_api/orders/${id}/`,
            service: "pos",
        }),
    }),
    updateOrder: builder.mutation({
        query: ({ id, ...data }) => ({
            url: `/pos_api/orders/${id}/`,
            method: "PUT",
            body: data,
            service: "pos",
        }),
    }),
    partialUpdateOrder: builder.mutation({
        query: ({ id, ...data }) => ({
            url: `/pos_api/orders/${id}/`,
            method: "PATCH",
            body: data,
            service: "pos",
        }),
    }),
    deleteOrder: builder.mutation({
        query: (id) => ({
            url: `/pos_api/orders/${id}/`,
            method: "DELETE",
            service: "pos",
        }),
    }),
    addTipToOrder: builder.mutation({
        query: ({ id, ...data }) => ({
            url: `/pos_api/orders/${id}/add_tip/`,
            method: "POST",
            body: data,
            service: "pos",
        }),
    }),
    applyDiscountToOrder: builder.mutation({
        query: ({ id, ...data }) => ({
            url: `/pos_api/orders/${id}/apply_discount/`,
            method: "POST",
            body: data,
            service: "pos",
        }),
    }),

    // Terminal endpoints
    getTerminals: builder.query({
        query: () => ({
            url: "/pos_api/terminals/",
            service: "pos",
        }),
    }),
    createTerminal: builder.mutation({
        query: (data) => ({
            url: "/pos_api/terminals/",
            method: "POST",
            body: data,
            service: "pos",
        }),
    }),
    getTerminal: builder.query({
        query: (id) => ({
            url: `/pos_api/terminals/${id}/`,
            service: "pos",
        }),
    }),
    updateTerminal: builder.mutation({
        query: ({ id, ...data }) => ({
            url: `/pos_api/terminals/${id}/`,
            method: "PUT",
            body: data,
            service: "pos",
        }),
    }),
    partialUpdateTerminal: builder.mutation({
        query: ({ id, ...data }) => ({
            url: `/pos_api/terminals/${id}/`,
            method: "PATCH",
            body: data,
            service: "pos",
        }),
    }),
    deleteTerminal: builder.mutation({
        query: (id) => ({
            url: `/pos_api/terminals/${id}/`,
            method: "DELETE",
            service: "pos",
        }),
    }),
  }),
})

export const {
  useGetCurrentSessionQuery,
  useOpenSessionMutation,
  useCloseSessionMutation,
  useGetSessionsQuery,
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
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useGetTablesQuery,
  useCreateTableMutation,
  useUpdateTableMutation,
  useDeleteTableMutation,
  useGetDailySalesQuery,
  useGetConfigurationsQuery,
  useCreateConfigurationMutation,
  useGetCurrentConfigurationQuery,
  useGetConfigurationQuery,
  useUpdateConfigurationMutation,
  usePartialUpdateConfigurationMutation,
  useDeleteConfigurationMutation,
  useGetDiscountsQuery,
  useCreateDiscountMutation,
  useGetDiscountQuery,
  useUpdateDiscountMutation,
  usePartialUpdateDiscountMutation,
  useDeleteDiscountMutation,
  useGetOrdersQuery,
  useCreateOrderMutation,
  useGetOrderQuery,
  useUpdateOrderMutation,
  usePartialUpdateOrderMutation,
  useDeleteOrderMutation,
  useAddTipToOrderMutation,
  useApplyDiscountToOrderMutation,
  useGetTerminalsQuery,
  useCreateTerminalMutation,
  useGetTerminalQuery,
  useUpdateTerminalMutation,
  usePartialUpdateTerminalMutation,
  useDeleteTerminalMutation,
} = posAPISlice

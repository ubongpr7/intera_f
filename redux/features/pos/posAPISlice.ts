import { apiSlice } from "../../services/apiSlice"
import type { StructuralLocationScopeParams } from "@/lib/structuralLocationScope"
import type {
  DecimalValue,
  POSAddOrderItemPayload,
  POSConfiguration,
  POSCreateOrGetDraftPayload,
  POSCustomer,
  POSDailySalesAnalytics,
  POSDiscount,
  POSHoldOrder,
  POSOrder,
  POSOrderInventoryMutationPayload,
  POSOrderInventorySummary,
  POSOrderItem,
  POSProcessPaymentPayload,
  POSRemittance,
  POSRemittanceActionPayload,
  POSRetrieveHeldOrderPayload,
  POSSession,
  POSSessionCloseoutSummary,
  POSSessionOpeningDefaults,
  POSTable,
  POSTerminalDeviceBinding,
  POSTerminal,
  PaginatedPOSResponse,
  POSListParams,
  POSUpdateOrderItemPayload,
} from "./posTypes"

const pos_api = "pos_api"
const service = "pos"
type POSStructuralScopeParams = StructuralLocationScopeParams
type POSDailySalesQueryParams = POSStructuralScopeParams & {
  date?: string
}

const unsupportedEndpoint = (detail: string) => async () => ({
  error: {
    status: 501,
    data: { detail },
  } as const,
})

export const posAPISlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentSession: builder.query<POSSession | null, void | string>({
      query: () => ({
        url: `/${pos_api}/sessions/current/`,
        service,
      }),
    }),
    getSessionOpeningDefaults: builder.query<POSSessionOpeningDefaults, string | void>({
      query: (terminalId) => ({
        url: `/${pos_api}/sessions/opening_defaults/`,
        params: terminalId ? { terminal: terminalId } : undefined,
        service,
      }),
    }),
    getSessionCloseoutSummary: builder.query<POSSessionCloseoutSummary, { sessionId: string; closingBalance?: DecimalValue | null }>({
      query: ({ sessionId, closingBalance }) => ({
        url: `/${pos_api}/sessions/${sessionId}/closeout_summary/`,
        params: closingBalance !== undefined && closingBalance !== null && closingBalance !== "" ? { closing_balance: closingBalance } : undefined,
        service,
      }),
    }),
    openSession: builder.mutation<POSSession, Partial<POSSession>>({
      query: (data) => ({
        url: `/${pos_api}/sessions/open_session/`,
        method: "POST",
        body: data,
        service,
      }),
    }),
    closeSession: builder.mutation<POSSession, { sessionId: string; closingBalance: DecimalValue; force?: boolean }>({
      query: ({ sessionId, closingBalance, force }) => ({
        url: `/${pos_api}/sessions/${sessionId}/close_session/`,
        method: "POST",
        body: { closing_balance: closingBalance, force },
        service,
      }),
    }),
    getSessions: builder.query<POSSession[], void | string>({
      query: () => ({
        url: `/${pos_api}/sessions/`,
        service,
      }),
    }),
    getSession: builder.query<POSSession, string>({
      query: (id) => ({
        url: `/${pos_api}/sessions/${id}/`,
        service,
      }),
    }),
    createSession: builder.mutation<POSSession, Partial<POSSession>>({
      query: (data) => ({
        url: `/${pos_api}/sessions/`,
        method: "POST",
        body: data,
        service,
      }),
    }),
    updateSession: builder.mutation<POSSession, { id: string; data: Partial<POSSession> }>({
      query: ({ id, data }) => ({
        url: `/${pos_api}/sessions/${id}/`,
        method: "PUT",
        body: data,
        service,
      }),
    }),
    partialUpdateSession: builder.mutation<POSSession, { id: string; data: Partial<POSSession> }>({
      query: ({ id, data }) => ({
        url: `/${pos_api}/sessions/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),
    deleteSession: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${pos_api}/sessions/${id}/`,
        method: "DELETE",
        service,
      }),
    }),

    getCurrentOrder: builder.query<POSOrder, string>({
      query: (sessionId) => ({
        url: `/${pos_api}/orders/current_draft/`,
        params: { session_id: sessionId },
        service,
      }),
    }),
    getCurrentDraftOrder: builder.query<POSOrder, string>({
      query: (sessionId) => ({
        url: `/${pos_api}/orders/current_draft/`,
        params: { session_id: sessionId },
        service,
      }),
    }),
    getCurrentActiveOrder: builder.query<POSOrder, string>({
      query: (sessionId) => ({
        url: `/${pos_api}/orders/current_active/`,
        params: { session_id: sessionId },
        service,
      }),
    }),
    createOrGetDraftOrder: builder.mutation<POSOrder, POSCreateOrGetDraftPayload>({
      query: (data) => ({
        url: `/${pos_api}/orders/create_or_get_draft/`,
        method: "POST",
        body: data,
        service,
      }),
    }),
    addItemToOrder: builder.mutation<POSOrderItem, { orderId: string } & POSAddOrderItemPayload>({
      query: ({ orderId, ...data }) => ({
        url: `/${pos_api}/orders/${orderId}/add_item/`,
        method: "POST",
        body: data,
        service,
      }),
    }),
    updateOrderItem: builder.mutation<POSOrderItem, { orderId: string } & POSUpdateOrderItemPayload>({
      query: ({ orderId, ...data }) => ({
        url: `/${pos_api}/orders/${orderId}/update_item/`,
        method: "POST",
        body: data,
        service,
      }),
    }),
    removeOrderItem: builder.mutation<{ detail: string }, { orderId: string; itemId: string }>({
      query: ({ orderId, itemId }) => ({
        url: `/${pos_api}/orders/${orderId}/remove_item/`,
        method: "POST",
        body: { item_id: itemId },
        service,
      }),
    }),
    processPayment: builder.mutation<POSOrder, { orderId: string } & POSProcessPaymentPayload>({
      query: ({ orderId, ...data }) => ({
        url: `/${pos_api}/orders/${orderId}/process_payment/`,
        method: "POST",
        body: data,
        service,
      }),
    }),
    holdOrder: builder.mutation<POSHoldOrder, { orderId: string; hold_reason?: string }>({
      query: ({ orderId, ...data }) => ({
        url: `/${pos_api}/orders/${orderId}/hold_order/`,
        method: "POST",
        body: data,
        service,
      }),
    }),
    getHeldOrders: builder.query<POSHoldOrder[], POSStructuralScopeParams | void>({
      query: (params) => ({
        url: `/${pos_api}/orders/held_orders/`,
        params: params || undefined,
        service,
      }),
    }),
    retrieveHeldOrder: builder.mutation<POSOrder, POSRetrieveHeldOrderPayload>({
      query: (data) => ({
        url: `/${pos_api}/orders/retrieve_held_order/`,
        method: "POST",
        body: data,
        service,
      }),
    }),
    searchProducts: builder.query<Record<string, never>[], string>({
      queryFn: unsupportedEndpoint("POS product search is not exposed by the current pos_backend_service backend."),
    }),
    getPOSCategories: builder.query<Record<string, never>[], void>({
      queryFn: unsupportedEndpoint("POS category listing is not exposed by the current pos_backend_service backend."),
    }),
    getFeaturedProducts: builder.query<Record<string, never>[], void>({
      queryFn: unsupportedEndpoint("Featured POS products are not exposed by the current pos_backend_service backend."),
    }),

    getCustomers: builder.query<POSCustomer[], string | void>({
      query: (search = "") => ({
        url: `/${pos_api}/customers/`,
        params: search ? { search } : undefined,
        service,
      }),
    }),
    getCustomersPage: builder.query<PaginatedPOSResponse<POSCustomer>, POSListParams>({
      query: (params) => ({ url: `/${pos_api}/customers/`, params, service }),
    }),
    getPOSCustomer: builder.query<POSCustomer, string>({
      query: (id) => ({
        url: `/${pos_api}/customers/${id}/`,
        service,
      }),
    }),
    createCustomer: builder.mutation<POSCustomer, Partial<POSCustomer>>({
      query: (data) => ({
        url: `/${pos_api}/customers/`,
        method: "POST",
        body: data,
        service,
      }),
    }),
    updateCustomer: builder.mutation<POSCustomer, { id: string; data: Partial<POSCustomer> } | ({ id: string } & Partial<POSCustomer>)>({
      query: (input) => {
        const { id, ...rest } = input as { id: string; data?: Partial<POSCustomer> } & Partial<POSCustomer>
        const body = "data" in input ? input.data : rest
        return {
          url: `/${pos_api}/customers/${id}/`,
          method: "PUT",
          body,
          service,
        }
      },
    }),
    partialUpdateCustomer: builder.mutation<POSCustomer, { id: string; data: Partial<POSCustomer> }>({
      query: ({ id, data }) => ({
        url: `/${pos_api}/customers/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),
    deleteCustomer: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${pos_api}/customers/${id}/`,
        method: "DELETE",
        service,
      }),
    }),

    getTables: builder.query<POSTable[], void | string>({
      query: () => ({
        url: `/${pos_api}/tables/`,
        service,
      }),
    }),
    getTablesPage: builder.query<PaginatedPOSResponse<POSTable>, POSListParams>({
      query: (params) => ({ url: `/${pos_api}/tables/`, params, service }),
    }),
    getTable: builder.query<POSTable, string>({
      query: (id) => ({
        url: `/${pos_api}/tables/${id}/`,
        service,
      }),
    }),
    createTable: builder.mutation<POSTable, Partial<POSTable>>({
      query: (data) => ({
        url: `/${pos_api}/tables/`,
        method: "POST",
        body: data,
        service,
      }),
    }),
    updateTable: builder.mutation<POSTable, { id: string; data: Partial<POSTable> } | ({ id: string } & Partial<POSTable>)>({
      query: (input) => {
        const { id, ...rest } = input as { id: string; data?: Partial<POSTable> } & Partial<POSTable>
        const body = "data" in input ? input.data : rest
        return {
          url: `/${pos_api}/tables/${id}/`,
          method: "PUT",
          body,
          service,
        }
      },
    }),
    partialUpdateTable: builder.mutation<POSTable, { id: string; data: Partial<POSTable> }>({
      query: ({ id, data }) => ({
        url: `/${pos_api}/tables/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),
    deleteTable: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${pos_api}/tables/${id}/`,
        method: "DELETE",
        service,
      }),
    }),

    getDailySales: builder.query<POSDailySalesAnalytics, POSDailySalesQueryParams | string | void>({
      query: (arg) => ({
        url: `/${pos_api}/analytics/daily-sales/`,
        params:
          typeof arg === "string"
            ? { date: arg }
            : arg || undefined,
        service,
      }),
    }),

    getConfigurations: builder.query<POSConfiguration[], void | string>({
      query: () => ({
        url: `/${pos_api}/configurations/`,
        service,
      }),
    }),
    getConfigurationsPage: builder.query<PaginatedPOSResponse<POSConfiguration>, POSListParams>({
      query: (params) => ({ url: `/${pos_api}/configurations/`, params, service }),
    }),
    createConfiguration: builder.mutation<POSConfiguration, Partial<POSConfiguration>>({
      query: (data) => ({
        url: `/${pos_api}/configurations/`,
        method: "POST",
        body: data,
        service,
      }),
    }),
    getCurrentConfiguration: builder.query<POSConfiguration, void | string>({
      query: () => ({
        url: `/${pos_api}/configurations/current/`,
        service,
      }),
    }),
    getConfiguration: builder.query<POSConfiguration, string>({
      query: (id) => ({
        url: `/${pos_api}/configurations/${id}/`,
        service,
      }),
    }),
    updateConfiguration: builder.mutation<POSConfiguration, { id: string; data: Partial<POSConfiguration> } | ({ id: string } & Partial<POSConfiguration>)>({
      query: (input) => {
        const { id, ...rest } = input as { id: string; data?: Partial<POSConfiguration> } & Partial<POSConfiguration>
        const body = "data" in input ? input.data : rest
        return {
          url: `/${pos_api}/configurations/${id}/`,
          method: "PUT",
          body,
          service,
        }
      },
    }),
    partialUpdateConfiguration: builder.mutation<POSConfiguration, { id: string; data: Partial<POSConfiguration> }>({
      query: ({ id, data }) => ({
        url: `/${pos_api}/configurations/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),
    deleteConfiguration: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${pos_api}/configurations/${id}/`,
        method: "DELETE",
        service,
      }),
    }),

    getDiscounts: builder.query<POSDiscount[], void | string>({
      query: () => ({
        url: `/${pos_api}/discounts/`,
        service,
      }),
    }),
    getDiscountsPage: builder.query<PaginatedPOSResponse<POSDiscount>, POSListParams>({
      query: (params) => ({ url: `/${pos_api}/discounts/`, params, service }),
    }),
    createDiscount: builder.mutation<POSDiscount, Partial<POSDiscount>>({
      query: (data) => ({
        url: `/${pos_api}/discounts/`,
        method: "POST",
        body: data,
        service,
      }),
    }),
    getDiscount: builder.query<POSDiscount, string>({
      query: (id) => ({
        url: `/${pos_api}/discounts/${id}/`,
        service,
      }),
    }),
    updateDiscount: builder.mutation<POSDiscount, { id: string; data: Partial<POSDiscount> } | ({ id: string } & Partial<POSDiscount>)>({
      query: (input) => {
        const { id, ...rest } = input as { id: string; data?: Partial<POSDiscount> } & Partial<POSDiscount>
        const body = "data" in input ? input.data : rest
        return {
          url: `/${pos_api}/discounts/${id}/`,
          method: "PUT",
          body,
          service,
        }
      },
    }),
    partialUpdateDiscount: builder.mutation<POSDiscount, { id: string; data: Partial<POSDiscount> }>({
      query: ({ id, data }) => ({
        url: `/${pos_api}/discounts/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),
    deleteDiscount: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${pos_api}/discounts/${id}/`,
        method: "DELETE",
        service,
      }),
    }),

    getRemittances: builder.query<POSRemittance[], Record<string, unknown> | void>({
      query: (params) => ({
        url: `/${pos_api}/remittances/`,
        params: params || undefined,
        service,
      }),
    }),
    handoverRemittance: builder.mutation<POSRemittance, { id: string } & POSRemittanceActionPayload>({
      query: ({ id, ...data }) => ({
        url: `/${pos_api}/remittances/${id}/handover/`,
        method: "POST",
        body: data,
        service,
      }),
    }),
    receiveRemittance: builder.mutation<POSRemittance, { id: string } & POSRemittanceActionPayload>({
      query: ({ id, ...data }) => ({
        url: `/${pos_api}/remittances/${id}/receive/`,
        method: "POST",
        body: data,
        service,
      }),
    }),
    depositRemittance: builder.mutation<POSRemittance, { id: string } & POSRemittanceActionPayload>({
      query: ({ id, ...data }) => ({
        url: `/${pos_api}/remittances/${id}/deposit/`,
        method: "POST",
        body: data,
        service,
      }),
    }),
    reconcileRemittance: builder.mutation<POSRemittance, { id: string } & POSRemittanceActionPayload>({
      query: ({ id, ...data }) => ({
        url: `/${pos_api}/remittances/${id}/reconcile/`,
        method: "POST",
        body: data,
        service,
      }),
    }),
    disputeRemittance: builder.mutation<POSRemittance, { id: string } & POSRemittanceActionPayload>({
      query: ({ id, ...data }) => ({
        url: `/${pos_api}/remittances/${id}/dispute/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    getOrders: builder.query<POSOrder[], string | void>({
      query: (search = "") => ({
        url: `/${pos_api}/orders/`,
        params: search ? { search } : undefined,
        service,
      }),
    }),
    createOrder: builder.mutation<POSOrder, Partial<POSOrder>>({
      query: (data) => ({
        url: `/${pos_api}/orders/`,
        method: "POST",
        body: data,
        service,
      }),
    }),
    getOrder: builder.query<POSOrder, string>({
      query: (id) => ({
        url: `/${pos_api}/orders/${id}/`,
        service,
      }),
    }),
    updateOrder: builder.mutation<POSOrder, { id: string; data: Partial<POSOrder> } | ({ id: string } & Partial<POSOrder>)>({
      query: (input) => {
        const { id, ...rest } = input as { id: string; data?: Partial<POSOrder> } & Partial<POSOrder>
        const body = "data" in input ? input.data : rest
        return {
          url: `/${pos_api}/orders/${id}/`,
          method: "PUT",
          body,
          service,
        }
      },
    }),
    partialUpdateOrder: builder.mutation<POSOrder, { id: string; data: Partial<POSOrder> }>({
      query: ({ id, data }) => ({
        url: `/${pos_api}/orders/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),
    deleteOrder: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${pos_api}/orders/${id}/`,
        method: "DELETE",
        service,
      }),
    }),
    addTipToOrder: builder.mutation<POSOrder, { id: string; tip_amount?: DecimalValue; tip_percent?: DecimalValue }>({
      query: ({ id, ...data }) => ({
        url: `/${pos_api}/orders/${id}/add_tip/`,
        method: "POST",
        body: data,
        service,
      }),
    }),
    applyDiscountToOrder: builder.mutation<POSOrder, { id: string; discount_amount?: DecimalValue; discount_percent?: DecimalValue }>({
      query: ({ id, ...data }) => ({
        url: `/${pos_api}/orders/${id}/apply_discount/`,
        method: "POST",
        body: data,
        service,
      }),
    }),
    getOrderInventorySummary: builder.query<POSOrderInventorySummary, string>({
      query: (id) => ({
        url: `/${pos_api}/orders/${id}/inventory_summary/`,
        service,
      }),
    }),
    requestOrderReservation: builder.mutation<POSOrder, { id: string } & POSOrderInventoryMutationPayload>({
      query: ({ id, ...data }) => ({
        url: `/${pos_api}/orders/${id}/request_reservation/`,
        method: "POST",
        body: data,
        service,
      }),
    }),
    confirmOrderReservation: builder.mutation<POSOrder, { id: string } & POSOrderInventoryMutationPayload>({
      query: ({ id, ...data }) => ({
        url: `/${pos_api}/orders/${id}/confirm_reservation/`,
        method: "POST",
        body: data,
        service,
      }),
    }),
    releaseOrderReservation: builder.mutation<POSOrder, { id: string } & POSOrderInventoryMutationPayload>({
      query: ({ id, ...data }) => ({
        url: `/${pos_api}/orders/${id}/release_reservation/`,
        method: "POST",
        body: data,
        service,
      }),
    }),
    confirmOrderFulfillment: builder.mutation<POSOrder, { id: string } & POSOrderInventoryMutationPayload>({
      query: ({ id, ...data }) => ({
        url: `/${pos_api}/orders/${id}/confirm_fulfillment/`,
        method: "POST",
        body: data,
        service,
      }),
    }),
    markOrderInventoryFailed: builder.mutation<POSOrder, { id: string } & POSOrderInventoryMutationPayload>({
      query: ({ id, ...data }) => ({
        url: `/${pos_api}/orders/${id}/mark_inventory_failed/`,
        method: "POST",
        body: data,
        service,
      }),
    }),
    cancelOrder: builder.mutation<POSOrder, string>({
      query: (id) => ({
        url: `/${pos_api}/orders/${id}/cancel_order/`,
        method: "POST",
        body: {},
        service,
      }),
    }),

    getTerminals: builder.query<POSTerminal[], void | string>({
      query: () => ({
        url: `/${pos_api}/terminals/`,
        service,
      }),
    }),
    getTerminalsPage: builder.query<PaginatedPOSResponse<POSTerminal>, POSListParams>({
      query: (params) => ({ url: `/${pos_api}/terminals/`, params, service }),
    }),
    getCurrentTerminalBinding: builder.query<POSTerminalDeviceBinding | null, void>({
      query: () => ({
        url: `/${pos_api}/terminals/device_binding/`,
        service,
      }),
    }),
    assignCurrentDeviceTerminal: builder.mutation<POSTerminalDeviceBinding, { terminal_id: string; device_label?: string }>({
      query: (body) => ({
        url: `/${pos_api}/terminals/assign_device/`,
        method: "POST",
        body,
        service,
      }),
    }),
    detachCurrentDeviceTerminal: builder.mutation<{ detail: string }, void>({
      query: () => ({
        url: `/${pos_api}/terminals/detach_device/`,
        method: "POST",
        body: {},
        service,
      }),
    }),
    detachTerminalBinding: builder.mutation<{ detail: string }, string>({
      query: (id) => ({
        url: `/${pos_api}/terminals/${id}/detach_terminal_binding/`,
        method: "POST",
        body: {},
        service,
      }),
    }),
    createTerminal: builder.mutation<POSTerminal, Partial<POSTerminal>>({
      query: (data) => ({
        url: `/${pos_api}/terminals/`,
        method: "POST",
        body: data,
        service,
      }),
    }),
    getTerminal: builder.query<POSTerminal, string>({
      query: (id) => ({
        url: `/${pos_api}/terminals/${id}/`,
        service,
      }),
    }),
    updateTerminal: builder.mutation<POSTerminal, { id: string; data: Partial<POSTerminal> } | ({ id: string } & Partial<POSTerminal>)>({
      query: (input) => {
        const { id, ...rest } = input as { id: string; data?: Partial<POSTerminal> } & Partial<POSTerminal>
        const body = "data" in input ? input.data : rest
        return {
          url: `/${pos_api}/terminals/${id}/`,
          method: "PUT",
          body,
          service,
        }
      },
    }),
    partialUpdateTerminal: builder.mutation<POSTerminal, { id: string; data: Partial<POSTerminal> }>({
      query: ({ id, data }) => ({
        url: `/${pos_api}/terminals/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),
    deleteTerminal: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${pos_api}/terminals/${id}/`,
        method: "DELETE",
        service,
      }),
    }),
  }),
})

export const {
  useGetCurrentSessionQuery,
  useGetSessionOpeningDefaultsQuery,
  useGetSessionCloseoutSummaryQuery,
  useOpenSessionMutation,
  useCloseSessionMutation,
  useGetSessionsQuery,
  useGetSessionQuery,
  useCreateSessionMutation,
  useUpdateSessionMutation,
  usePartialUpdateSessionMutation,
  useDeleteSessionMutation,
  useGetCurrentOrderQuery,
  useGetCurrentDraftOrderQuery,
  useGetCurrentActiveOrderQuery,
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
  useGetCustomersPageQuery,
  useGetPOSCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  usePartialUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useGetTablesQuery,
  useGetTablesPageQuery,
  useGetTableQuery,
  useCreateTableMutation,
  useUpdateTableMutation,
  usePartialUpdateTableMutation,
  useDeleteTableMutation,
  useGetDailySalesQuery,
  useGetConfigurationsQuery,
  useGetConfigurationsPageQuery,
  useCreateConfigurationMutation,
  useGetCurrentConfigurationQuery,
  useGetConfigurationQuery,
  useUpdateConfigurationMutation,
  usePartialUpdateConfigurationMutation,
  useDeleteConfigurationMutation,
  useGetDiscountsQuery,
  useGetDiscountsPageQuery,
  useCreateDiscountMutation,
  useGetDiscountQuery,
  useUpdateDiscountMutation,
  usePartialUpdateDiscountMutation,
  useDeleteDiscountMutation,
  useGetRemittancesQuery,
  useHandoverRemittanceMutation,
  useReceiveRemittanceMutation,
  useDepositRemittanceMutation,
  useReconcileRemittanceMutation,
  useDisputeRemittanceMutation,
  useGetOrdersQuery,
  useCreateOrderMutation,
  useGetOrderQuery,
  useUpdateOrderMutation,
  usePartialUpdateOrderMutation,
  useDeleteOrderMutation,
  useAddTipToOrderMutation,
  useApplyDiscountToOrderMutation,
  useGetOrderInventorySummaryQuery,
  useRequestOrderReservationMutation,
  useConfirmOrderReservationMutation,
  useReleaseOrderReservationMutation,
  useConfirmOrderFulfillmentMutation,
  useMarkOrderInventoryFailedMutation,
  useCancelOrderMutation,
  useGetTerminalsQuery,
  useGetTerminalsPageQuery,
  useGetCurrentTerminalBindingQuery,
  useAssignCurrentDeviceTerminalMutation,
  useDetachCurrentDeviceTerminalMutation,
  useDetachTerminalBindingMutation,
  useCreateTerminalMutation,
  useGetTerminalQuery,
  useUpdateTerminalMutation,
  usePartialUpdateTerminalMutation,
  useDeleteTerminalMutation,
} = posAPISlice

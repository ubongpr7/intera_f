import { apiSlice } from "../../services/apiSlice";
import { buildQuery } from "../common/queryParams";
import type {
  GoodsReceiptInterface,
  GoodsReceiptListParams,
  OrderListParams,
  PurchaseOrderAnalyticsResponse,
  PurchaseOrderDashboardSummary,
  PurchaseOrderInterface,
  PurchaseOrderLineItem,
  PurchaseOrderReceiveItemsPayload,
  PurchaseOrderReturnPayload,
  PurchaseOrderWorkflowPayload,
  ReturnOrderInterface,
  ReturnOrderProcessPayload,
  SalesOrderInterface,
  SalesOrderLineItem,
  SalesOrderReleasePayload,
  SalesOrderReservePayload,
  SalesOrderShipPayload,
  SalesOrderShipmentInterface,
  SalesOrderShipmentListParams,
} from "./orderTypes";

const orderApi = "order_api";
const service = "inventory";

type EntityId = string | number;

export const orderApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listGoodsReceipts: builder.query<GoodsReceiptInterface[], GoodsReceiptListParams | void>({
      query: (params) => ({
        url: buildQuery(`/${orderApi}/goods-receipts/`, params),
        service,
      }),
    }),

    getGoodsReceipt: builder.query<GoodsReceiptInterface, EntityId>({
      query: (id) => ({
        url: `/${orderApi}/goods-receipts/${id}/`,
        service,
      }),
    }),

    listSalesOrderShipments: builder.query<SalesOrderShipmentInterface[], SalesOrderShipmentListParams | void>({
      query: (params) => ({
        url: buildQuery(`/${orderApi}/sales-order-shipments/`, params),
        service,
      }),
    }),

    listPurchaseOrders: builder.query<PurchaseOrderInterface[], OrderListParams | string | void>({
      query: (params) => ({
        url:
          typeof params === "string"
            ? buildQuery(`/${orderApi}/purchase-orders/`, { search: params })
            : buildQuery(`/${orderApi}/purchase-orders/`, params),
        service,
      }),
    }),

    createPurchaseOrder: builder.mutation<PurchaseOrderInterface, Partial<PurchaseOrderInterface>>({
      query: (data) => ({
        url: `/${orderApi}/purchase-orders/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    getPurchaseOrder: builder.query<PurchaseOrderInterface, EntityId>({
      query: (id) => ({
        url: `/${orderApi}/purchase-orders/${id}/`,
        service,
      }),
    }),

    updatePurchaseOrder: builder.mutation<PurchaseOrderInterface, { id: EntityId; data: Partial<PurchaseOrderInterface> }>({
      query: ({ id, data }) => ({
        url: `/${orderApi}/purchase-orders/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),

    listPurchaseOrderLineItems: builder.query<PurchaseOrderLineItem[], EntityId>({
      query: (purchaseOrderId) => ({
        url: `/${orderApi}/purchase-orders/${purchaseOrderId}/line_items/`,
        service,
      }),
    }),

    createPurchaseOrderLineItem: builder.mutation<
      PurchaseOrderLineItem,
      { data: Partial<PurchaseOrderLineItem>; purchase_order_id: EntityId }
    >({
      query: ({ data, purchase_order_id }) => ({
        url: `/${orderApi}/purchase-orders/${purchase_order_id}/add_line_item/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    updatePurchaseOrderLineItem: builder.mutation<
      PurchaseOrderLineItem,
      { reference: EntityId; id: EntityId; data: Partial<PurchaseOrderLineItem> }
    >({
      query: ({ reference, id, data }) => ({
        url: `/${orderApi}/purchase-orders/${reference}/update_line_item/`,
        method: "PATCH",
        body: { line_item_id: id, ...data },
        service,
      }),
    }),

    deletePurchaseOrderLineItem: builder.mutation<void, { reference: EntityId; id: EntityId }>({
      query: ({ reference, id }) => ({
        url: buildQuery(`/${orderApi}/purchase-orders/${reference}/remove_line_item/`, { line_item_id: id }),
        method: "DELETE",
        service,
      }),
    }),

    approvePurchaseOrder: builder.mutation<Record<string, unknown>, EntityId>({
      query: (id) => ({
        url: `/${orderApi}/purchase-orders/${id}/approve/`,
        method: "PUT",
        service,
      }),
    }),

    issuePurchaseOrder: builder.mutation<Record<string, unknown>, { id: EntityId; data?: PurchaseOrderWorkflowPayload } | EntityId>({
      query: (arg) => {
        const payload = typeof arg === "object" ? arg : { id: arg };
        return {
          url: `/${orderApi}/purchase-orders/${payload.id}/issue/`,
          method: "PUT",
          body: payload.data,
          service,
        };
      },
    }),

    receivePurchaseOrder: builder.mutation<Record<string, unknown>, EntityId>({
      query: (id) => ({
        url: `/${orderApi}/purchase-orders/${id}/receive/`,
        method: "PUT",
        service,
      }),
    }),

    receivePurchaseOrderItems: builder.mutation<Record<string, unknown>, { id: EntityId; data: PurchaseOrderReceiveItemsPayload }>({
      query: ({ id, data }) => ({
        url: `/${orderApi}/purchase-orders/${id}/receive_items/`,
        method: "PUT",
        body: data,
        service,
      }),
    }),

    completePurchaseOrder: builder.mutation<Record<string, unknown>, EntityId>({
      query: (id) => ({
        url: `/${orderApi}/purchase-orders/${id}/complete/`,
        method: "PUT",
        service,
      }),
    }),

    cancelPurchaseOrder: builder.mutation<Record<string, unknown>, { id: EntityId; notes?: string } | EntityId>({
      query: (arg) => {
        const payload = typeof arg === "object" ? arg : { id: arg };
        return {
          url: `/${orderApi}/purchase-orders/${payload.id}/cancel/`,
          method: "PUT",
          body: typeof arg === "object" ? { notes: payload.notes } : undefined,
          service,
        };
      },
    }),

    createReturnOrderFromPurchaseOrder: builder.mutation<Record<string, unknown>, { id: EntityId; data: PurchaseOrderReturnPayload }>({
      query: ({ id, data }) => ({
        url: `/${orderApi}/purchase-orders/${id}/create_return_order/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    getPurchaseOrderAnalytics: builder.query<PurchaseOrderAnalyticsResponse, void>({
      query: () => ({
        url: `/${orderApi}/purchase-orders/analytics/`,
        service,
      }),
    }),

    getPurchaseOrderDashboardSummary: builder.query<PurchaseOrderDashboardSummary, void>({
      query: () => ({
        url: `/${orderApi}/purchase-orders/dashboard_summary/`,
        service,
      }),
    }),

    downloadPurchaseOrderPdf: builder.query<Blob, EntityId>({
      query: (id) => ({
        url: `/${orderApi}/purchase-orders/${id}/download_pdf/`,
        service,
        responseHandler: (response: Response) => response.blob(),
      }),
    }),

    bulkDownloadPurchaseOrderPdf: builder.mutation<Blob, Record<string, unknown>>({
      query: (data) => ({
        url: `/${orderApi}/purchase-orders/bulk_pdf_download/`,
        method: "POST",
        body: data,
        service,
        responseHandler: (response: Response) => response.blob(),
      }),
    }),

    resendPurchaseOrderEmail: builder.mutation<Record<string, unknown>, Record<string, unknown>>({
      query: (data) => ({
        url: `/${orderApi}/purchase-orders/resend_email/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    listSalesOrders: builder.query<SalesOrderInterface[], OrderListParams | string | void>({
      query: (params) => ({
        url:
          typeof params === "string"
            ? buildQuery(`/${orderApi}/sales-orders/`, { search: params })
            : buildQuery(`/${orderApi}/sales-orders/`, params),
        service,
      }),
    }),

    createSalesOrder: builder.mutation<SalesOrderInterface, Partial<SalesOrderInterface>>({
      query: (data) => ({
        url: `/${orderApi}/sales-orders/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    getSalesOrder: builder.query<SalesOrderInterface, EntityId>({
      query: (id) => ({
        url: `/${orderApi}/sales-orders/${id}/`,
        service,
      }),
    }),

    updateSalesOrder: builder.mutation<SalesOrderInterface, { id: EntityId; data: Partial<SalesOrderInterface> }>({
      query: ({ id, data }) => ({
        url: `/${orderApi}/sales-orders/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),

    getSalesOrderLineItems: builder.query<SalesOrderLineItem[], EntityId>({
      query: (id) => ({
        url: `/${orderApi}/sales-orders/${id}/line_items/`,
        service,
      }),
    }),

    getSalesOrderShipments: builder.query<SalesOrderShipmentInterface[], EntityId>({
      query: (id) => ({
        url: `/${orderApi}/sales-orders/${id}/shipments/`,
        service,
      }),
    }),

    createSalesOrderLineItem: builder.mutation<SalesOrderLineItem, { id: EntityId; data: Partial<SalesOrderLineItem> }>({
      query: ({ id, data }) => ({
        url: `/${orderApi}/sales-orders/${id}/add_line_item/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    updateSalesOrderLineItem: builder.mutation<SalesOrderLineItem, { id: EntityId; line_item_id: EntityId; data: Partial<SalesOrderLineItem> }>({
      query: ({ id, line_item_id, data }) => ({
        url: `/${orderApi}/sales-orders/${id}/update_line_item/`,
        method: "PATCH",
        body: { line_item_id, ...data },
        service,
      }),
    }),

    deleteSalesOrderLineItem: builder.mutation<void, { id: EntityId; line_item_id: EntityId }>({
      query: ({ id, line_item_id }) => ({
        url: buildQuery(`/${orderApi}/sales-orders/${id}/remove_line_item/`, { line_item_id }),
        method: "DELETE",
        service,
      }),
    }),

    reserveSalesOrderStock: builder.mutation<Record<string, unknown>, { id: EntityId; data: SalesOrderReservePayload }>({
      query: ({ id, data }) => ({
        url: `/${orderApi}/sales-orders/${id}/reserve/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    releaseSalesOrderStock: builder.mutation<Record<string, unknown>, { id: EntityId; data: SalesOrderReleasePayload }>({
      query: ({ id, data }) => ({
        url: `/${orderApi}/sales-orders/${id}/release/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    shipSalesOrder: builder.mutation<SalesOrderShipmentInterface, { id: EntityId; data: SalesOrderShipPayload }>({
      query: ({ id, data }) => ({
        url: `/${orderApi}/sales-orders/${id}/ship/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    completeSalesOrder: builder.mutation<SalesOrderInterface, EntityId>({
      query: (id) => ({
        url: `/${orderApi}/sales-orders/${id}/complete/`,
        method: "POST",
        service,
      }),
    }),

    cancelSalesOrder: builder.mutation<SalesOrderInterface, { id: EntityId; notes?: string } | EntityId>({
      query: (arg) => {
        const payload = typeof arg === "object" ? arg : { id: arg };
        return {
          url: `/${orderApi}/sales-orders/${payload.id}/cancel/`,
          method: "POST",
          body: typeof arg === "object" ? { notes: payload.notes } : undefined,
          service,
        };
      },
    }),

    listReturnOrders: builder.query<ReturnOrderInterface[], OrderListParams | string | void>({
      query: (params) => ({
        url:
          typeof params === "string"
            ? buildQuery(`/${orderApi}/return-orders/`, { search: params })
            : buildQuery(`/${orderApi}/return-orders/`, params),
        service,
      }),
    }),

    getReturnOrder: builder.query<ReturnOrderInterface, EntityId>({
      query: (id) => ({
        url: `/${orderApi}/return-orders/${id}/`,
        service,
      }),
    }),

    dispatchReturnOrder: builder.mutation<Record<string, unknown>, { id: EntityId; data: ReturnOrderProcessPayload }>({
      query: ({ id, data }) => ({
        url: `/${orderApi}/return-orders/${id}/dispatch/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    completeReturnOrder: builder.mutation<ReturnOrderInterface, EntityId>({
      query: (id) => ({
        url: `/${orderApi}/return-orders/${id}/complete/`,
        method: "POST",
        service,
      }),
    }),

    cancelReturnOrder: builder.mutation<ReturnOrderInterface, { id: EntityId; notes?: string } | EntityId>({
      query: (arg) => {
        const payload = typeof arg === "object" ? arg : { id: arg };
        return {
          url: `/${orderApi}/return-orders/${payload.id}/cancel/`,
          method: "POST",
          body: typeof arg === "object" ? { notes: payload.notes } : undefined,
          service,
        };
      },
    }),
  }),
});

export const purchaseOderApiSlice = orderApiSlice;
export const purchaseOderManagementApiSlice = orderApiSlice;

export const {
  useListGoodsReceiptsQuery,
  useGetGoodsReceiptQuery,
  useListSalesOrderShipmentsQuery,
  useListPurchaseOrdersQuery,
  useCreatePurchaseOrderMutation,
  useGetPurchaseOrderQuery,
  useUpdatePurchaseOrderMutation,
  useListPurchaseOrderLineItemsQuery,
  useCreatePurchaseOrderLineItemMutation,
  useUpdatePurchaseOrderLineItemMutation,
  useDeletePurchaseOrderLineItemMutation,
  useApprovePurchaseOrderMutation,
  useIssuePurchaseOrderMutation,
  useReceivePurchaseOrderMutation,
  useReceivePurchaseOrderItemsMutation,
  useCompletePurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  useCreateReturnOrderFromPurchaseOrderMutation,
  useGetPurchaseOrderAnalyticsQuery,
  useGetPurchaseOrderDashboardSummaryQuery,
  useDownloadPurchaseOrderPdfQuery,
  useLazyDownloadPurchaseOrderPdfQuery,
  useBulkDownloadPurchaseOrderPdfMutation,
  useResendPurchaseOrderEmailMutation,
  useListSalesOrdersQuery,
  useCreateSalesOrderMutation,
  useGetSalesOrderQuery,
  useUpdateSalesOrderMutation,
  useGetSalesOrderLineItemsQuery,
  useGetSalesOrderShipmentsQuery,
  useCreateSalesOrderLineItemMutation,
  useUpdateSalesOrderLineItemMutation,
  useDeleteSalesOrderLineItemMutation,
  useReserveSalesOrderStockMutation,
  useReleaseSalesOrderStockMutation,
  useShipSalesOrderMutation,
  useCompleteSalesOrderMutation,
  useCancelSalesOrderMutation,
  useListReturnOrdersQuery,
  useGetReturnOrderQuery,
  useDispatchReturnOrderMutation,
  useCompleteReturnOrderMutation,
  useCancelReturnOrderMutation,
} = orderApiSlice;

export const useCreatePurchaseOderMutation = useCreatePurchaseOrderMutation;
export const useUpdatePurchaseOderMutation = useUpdatePurchaseOrderMutation;
export const useGetPurchaseOderQuery = useGetPurchaseOrderQuery;
export const useGetPurchaseOderDataQuery = useListPurchaseOrdersQuery;
export const useGetPurchseOrderLineItemsQuery = useListPurchaseOrderLineItemsQuery;
export const useApprovePurchaseOderMutation = useApprovePurchaseOrderMutation;
export const useIssuePurchaseOderMutation = useIssuePurchaseOrderMutation;
export const useReceivePurchaseOderMutation = useReceivePurchaseOrderMutation;
export const useCompletePurchaseOderMutation = useCompletePurchaseOrderMutation;

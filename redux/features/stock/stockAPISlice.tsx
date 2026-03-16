import { apiSlice } from "../../services/apiSlice";
import { buildQuery } from "../common/queryParams";
import type {
  CreateInventoryVariantPayload,
  LowStockItem,
  StockAnalyticsResponse,
  StockItem,
  StockItemListParams,
  StockLocation,
  StockLocationListParams,
  StockLocationType,
  StockReservation,
  StockReservationMutationPayload,
  StockReservationPayload,
  StockStatusUpdatePayload,
  StockStatusUpdateResponse,
  StockTrackingEntry,
  StockTransferPayload,
  StockTransferResponse,
} from "./stockTypes";

const stockApi = "stock_api";
const service = "inventory";

type EntityId = string | number;

export const stockApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listStockLocationTypes: builder.query<StockLocationType[], void>({
      query: () => ({
        url: `/${stockApi}/location-types/`,
        service,
      }),
    }),

    listStockLocations: builder.query<StockLocation[], StockLocationListParams | void>({
      query: (params) => ({
        url: buildQuery(`/${stockApi}/locations/`, params),
        service,
      }),
    }),

    createStockLocation: builder.mutation<StockLocation, Partial<StockLocation>>({
      query: (data) => ({
        url: `/${stockApi}/locations/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    getStockLocation: builder.query<StockLocation, EntityId>({
      query: (id) => ({
        url: `/${stockApi}/locations/${id}/`,
        service,
      }),
    }),

    updateStockLocation: builder.mutation<StockLocation, { id: EntityId; data: Partial<StockLocation> }>({
      query: ({ id, data }) => ({
        url: `/${stockApi}/locations/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),

    deleteStockLocation: builder.mutation<void, EntityId>({
      query: (id) => ({
        url: `/${stockApi}/locations/${id}/`,
        method: "DELETE",
        service,
      }),
    }),

    getLocationStockItems: builder.query<StockItem[], { id: EntityId; status?: string } | EntityId>({
      query: (arg) => {
        const payload = typeof arg === "object" ? arg : { id: arg };
        return {
          url: buildQuery(`/${stockApi}/locations/${payload.id}/stock_items/`, { status: payload.status }),
          service,
        };
      },
    }),

    transferLocationStock: builder.mutation<StockTransferResponse, { id: EntityId; data: StockTransferPayload }>({
      query: ({ id, data }) => ({
        url: `/${stockApi}/locations/${id}/transfer_stock/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    listStockItems: builder.query<StockItem[], StockItemListParams | string | void>({
      query: (params) => ({
        url:
          typeof params === "string"
            ? buildQuery(`/${stockApi}/stock-items/`, { purchase_order: params })
            : buildQuery(`/${stockApi}/stock-items/`, params),
        service,
      }),
    }),

    createStockItem: builder.mutation<StockItem, Partial<StockItem>>({
      query: (stockData) => ({
        url: `/${stockApi}/stock-items/`,
        method: "POST",
        body: stockData,
        service,
      }),
    }),

    getStockItem: builder.query<StockItem, EntityId>({
      query: (id) => ({
        url: `/${stockApi}/stock-items/${id}/`,
        service,
      }),
    }),

    updateStockItem: builder.mutation<StockItem, { id: EntityId; data: Partial<StockItem> }>({
      query: ({ id, data }) => ({
        url: `/${stockApi}/stock-items/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),

    deleteStockItem: builder.mutation<void, EntityId>({
      query: (id) => ({
        url: `/${stockApi}/stock-items/${id}/`,
        method: "DELETE",
        service,
      }),
    }),

    getExpiringStockItems: builder.query<StockItem[], { days?: number } | void>({
      query: (params) => ({
        url: buildQuery(`/${stockApi}/stock-items/expiring_soon/`, params),
        service,
      }),
    }),

    updateStockItemStatus: builder.mutation<StockStatusUpdateResponse, { id: EntityId; data: StockStatusUpdatePayload }>({
      query: ({ id, data }) => ({
        url: `/${stockApi}/stock-items/${id}/update_status/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    createStockItemForVariant: builder.mutation<StockItem, CreateInventoryVariantPayload>({
      query: (data) => ({
        url: `/${stockApi}/stock-items/create_for_variants/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    getInventoryStockItems: builder.query<StockItem[], EntityId>({
      query: (inventoryId) => ({
        url: buildQuery(`/${stockApi}/stock-items/inventory-items/`, { inventory_id: inventoryId }),
        service,
      }),
    }),

    getStockItemTrackingHistory: builder.query<StockTrackingEntry[], EntityId>({
      query: (id) => ({
        url: `/${stockApi}/stock-items/${id}/tracking_history/`,
        service,
      }),
    }),

    getStockAnalytics: builder.query<StockAnalyticsResponse, void>({
      query: () => ({
        url: `/${stockApi}/stock-items/analytics/`,
        service,
      }),
    }),

    getLowStockItems: builder.query<LowStockItem[], void>({
      query: () => ({
        url: `/${stockApi}/stock-items/low_stock/`,
        service,
      }),
    }),

    listReservations: builder.query<
      StockReservation[],
      {
        inventory?: string
        inventory_item?: string
        status?: string
        external_order_type?: string
        external_order_id?: string
        external_order_line_id?: string
      } | void
    >({
      query: (params) => ({
        url: buildQuery(`/${stockApi}/reservations/`, params),
        service,
      }),
    }),

    createReservation: builder.mutation<StockReservation, StockReservationPayload>({
      query: (data) => ({
        url: `/${stockApi}/reservations/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    getReservation: builder.query<StockReservation, EntityId>({
      query: (id) => ({
        url: `/${stockApi}/reservations/${id}/`,
        service,
      }),
    }),

    releaseReservation: builder.mutation<StockReservation, { id: EntityId; data: StockReservationMutationPayload }>({
      query: ({ id, data }) => ({
        url: `/${stockApi}/reservations/${id}/release/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    fulfillReservation: builder.mutation<StockReservation, { id: EntityId; data: StockReservationMutationPayload }>({
      query: ({ id, data }) => ({
        url: `/${stockApi}/reservations/${id}/fulfill/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    getFilteredStockItemDataLocation: builder.query<StockLocation[], string>({
      query: (reference) => ({
        url: buildQuery(`/${stockApi}/locations/`, { search: reference }),
        service,
      }),
    }),
  }),
});

export const {
  useListStockLocationTypesQuery,
  useListStockLocationsQuery,
  useCreateStockLocationMutation,
  useGetStockLocationQuery,
  useUpdateStockLocationMutation,
  useDeleteStockLocationMutation,
  useGetLocationStockItemsQuery,
  useTransferLocationStockMutation,
  useListStockItemsQuery,
  useCreateStockItemMutation,
  useGetStockItemQuery,
  useUpdateStockItemMutation,
  useDeleteStockItemMutation,
  useGetExpiringStockItemsQuery,
  useUpdateStockItemStatusMutation,
  useCreateStockItemForVariantMutation,
  useGetInventoryStockItemsQuery,
  useGetStockItemTrackingHistoryQuery,
  useGetStockAnalyticsQuery,
  useGetLowStockItemsQuery,
  useListReservationsQuery,
  useCreateReservationMutation,
  useGetReservationQuery,
  useReleaseReservationMutation,
  useFulfillReservationMutation,
  useGetFilteredStockItemDataLocationQuery,
} = stockApiSlice;

export const useGetStockItemDataQuery = useListStockItemsQuery;
export const useCreateStockItemLocationMutation = useCreateStockLocationMutation;
export const useUpdateStockItemLocationMutation = useUpdateStockLocationMutation;
export const useDeleteStockItemLocationMutation = useDeleteStockLocationMutation;
export const useGetStockItemDataLocationQuery = useListStockLocationsQuery;
export const useGetStockItemDataForInventoryQuery = useGetInventoryStockItemsQuery;
export const useGetStockLocationTypesQuery = useListStockLocationTypesQuery;

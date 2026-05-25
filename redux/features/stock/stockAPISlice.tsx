import { apiSlice } from "../../services/apiSlice";
import { buildQuery } from "../common/queryParams";
import type {
  CreateInventoryVariantPayload,
  InventoryItem,
  InventoryItemListParams,
  LowStockItem,
  StockBalanceListParams,
  StockBalanceRow,
  StockAnalyticsResponse,
  StockLot,
  StockLotListParams,
  StockLocation,
  StockLocationListParams,
  StockLocationType,
  StockReservation,
  StockReservationListParams,
  StockReservationMutationPayload,
  StockReservationPayload,
  StockSerial,
  StockSerialListParams,
  StockStatusUpdatePayload,
  StockStatusUpdateResponse,
  StockTrackingEntry,
  StockMovement,
  StockMovementListParams,
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

    getLocationInventoryItems: builder.query<InventoryItem[], { id: EntityId; status?: string } | EntityId>({
      query: (arg) => {
        const payload = typeof arg === "object" ? arg : { id: arg };
        return {
          url: buildQuery(`/${stockApi}/locations/${payload.id}/inventory_items/`, { status: payload.status }),
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

    listInventoryItems: builder.query<InventoryItem[], InventoryItemListParams | string | void>({
      query: (params) => ({
        url:
          typeof params === "string"
            ? buildQuery(`/${stockApi}/inventory-items/`, { purchase_order: params })
            : buildQuery(`/${stockApi}/inventory-items/`, params),
        service,
      }),
    }),

    createInventoryItem: builder.mutation<InventoryItem, Partial<InventoryItem>>({
      query: (stockData) => ({
        url: `/${stockApi}/inventory-items/`,
        method: "POST",
        body: stockData,
        service,
      }),
    }),

    getInventoryItem: builder.query<InventoryItem, EntityId>({
      query: (id) => ({
        url: `/${stockApi}/inventory-items/${id}/`,
        service,
      }),
    }),

    updateInventoryItem: builder.mutation<InventoryItem, { id: EntityId; data: Partial<InventoryItem> }>({
      query: ({ id, data }) => ({
        url: `/${stockApi}/inventory-items/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),

    deleteInventoryItem: builder.mutation<void, EntityId>({
      query: (id) => ({
        url: `/${stockApi}/inventory-items/${id}/`,
        method: "DELETE",
        service,
      }),
    }),

    getExpiringInventoryItems: builder.query<InventoryItem[], { days?: number } | void>({
      query: (params) => ({
        url: buildQuery(`/${stockApi}/inventory-items/expiring_soon/`, params),
        service,
      }),
    }),

    updateInventoryItemStatus: builder.mutation<StockStatusUpdateResponse, { id: EntityId; data: StockStatusUpdatePayload }>({
      query: ({ id, data }) => ({
        url: `/${stockApi}/inventory-items/${id}/update_status/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    createInventoryItemForVariant: builder.mutation<InventoryItem, CreateInventoryVariantPayload>({
      query: (data) => ({
        url: `/${stockApi}/inventory-items/create_for_variants/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    getInventoryStockItems: builder.query<InventoryItem[], InventoryItemListParams | void>({
      query: (params) => ({
        url: buildQuery(`/${stockApi}/inventory-items/`, params),
        service,
      }),
    }),

    getInventoryItemTrackingHistory: builder.query<StockTrackingEntry[], EntityId>({
      query: (id) => ({
        url: `/${stockApi}/inventory-items/${id}/tracking_history/`,
        service,
      }),
    }),

    getStockAnalytics: builder.query<StockAnalyticsResponse, void>({
      query: () => ({
        url: `/${stockApi}/inventory-items/analytics/`,
        service,
      }),
    }),

    getLowStockItems: builder.query<LowStockItem[], void>({
      query: () => ({
        url: `/${stockApi}/inventory-items/low_stock/`,
        service,
      }),
    }),

    listStockBalances: builder.query<StockBalanceRow[], StockBalanceListParams | void>({
      query: (params) => ({
        url: buildQuery(`/${stockApi}/balances/`, params),
        service,
      }),
    }),

    listStockLots: builder.query<StockLot[], StockLotListParams | void>({
      query: (params) => ({
        url: buildQuery(`/${stockApi}/lots/`, params),
        service,
      }),
    }),

    listStockSerials: builder.query<StockSerial[], StockSerialListParams | void>({
      query: (params) => ({
        url: buildQuery(`/${stockApi}/serials/`, params),
        service,
      }),
    }),

    listStockMovements: builder.query<StockMovement[], StockMovementListParams | void>({
      query: (params) => ({
        url: buildQuery(`/${stockApi}/movements/`, params),
        service,
      }),
    }),

    listReservations: builder.query<StockReservation[], StockReservationListParams | void>({
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
  useGetLocationInventoryItemsQuery,
  useTransferLocationStockMutation,
  useListInventoryItemsQuery,
  useCreateInventoryItemMutation,
  useGetInventoryItemQuery,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useGetExpiringInventoryItemsQuery,
  useUpdateInventoryItemStatusMutation,
  useCreateInventoryItemForVariantMutation,
  useGetInventoryStockItemsQuery,
  useGetInventoryItemTrackingHistoryQuery,
  useGetStockAnalyticsQuery,
  useGetLowStockItemsQuery,
  useListStockBalancesQuery,
  useListStockLotsQuery,
  useListStockSerialsQuery,
  useListStockMovementsQuery,
  useListReservationsQuery,
  useCreateReservationMutation,
  useGetReservationQuery,
  useReleaseReservationMutation,
  useFulfillReservationMutation,
  useGetFilteredStockItemDataLocationQuery,
} = stockApiSlice;

export const useGetStockItemDataQuery = useListInventoryItemsQuery;
export const useCreateStockItemLocationMutation = useCreateStockLocationMutation;
export const useUpdateStockItemLocationMutation = useUpdateStockLocationMutation;
export const useDeleteStockItemLocationMutation = useDeleteStockLocationMutation;
export const useGetStockItemDataLocationQuery = useListStockLocationsQuery;
export const useGetStockItemDataForInventoryQuery = useGetInventoryStockItemsQuery;
export const useGetStockLocationTypesQuery = useListStockLocationTypesQuery;
export const useGetLocationStockItemsQuery = useGetLocationInventoryItemsQuery;
export const useListStockItemsQuery = useListInventoryItemsQuery;
export const useCreateStockItemMutation = useCreateInventoryItemMutation;
export const useGetStockItemQuery = useGetInventoryItemQuery;
export const useUpdateStockItemMutation = useUpdateInventoryItemMutation;
export const useDeleteStockItemMutation = useDeleteInventoryItemMutation;
export const useGetExpiringStockItemsQuery = useGetExpiringInventoryItemsQuery;
export const useUpdateStockItemStatusMutation = useUpdateInventoryItemStatusMutation;
export const useCreateStockItemForVariantMutation = useCreateInventoryItemForVariantMutation;
export const useGetStockItemTrackingHistoryQuery = useGetInventoryItemTrackingHistoryQuery;

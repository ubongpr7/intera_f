import { apiSlice, unwrapListResponse } from "../../services/apiSlice";
import { buildQuery } from "../common/queryParams";
import type { StructuralLocationScopeParams } from "@/lib/structuralLocationScope";
import type {
  CreateInventoryVariantPayload,
  InventoryItem,
  InventoryItemListParams,
  LowStockItem,
  PaginatedStockResponse,
  StockBalanceListParams,
  StockBalanceRow,
  StockAnalyticsResponse,
  StockLot,
  StockLotListParams,
  StockLocation,
  StockLocationListParams,
  PaginatedStockLocationResponse,
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
  StockMovementSummaryResponse,
  StockTransferPayload,
  StockTransferResponse,
  StockReservationSummaryResponse,
  WarehouseConfiguration,
  WarehouseReport,
  WarehouseZone,
  CycleCountSchedule,
  StockCountSession,
} from "./stockTypes";

const stockApi = "stock_api";
const service = "inventory";

type EntityId = string | number;
type StructuralScopeParams = StructuralLocationScopeParams & {
  stock_location?: string;
};

export const stockApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listStockLocationTypes: builder.query<StockLocationType[], void>({
      query: () => ({
        url: `/${stockApi}/location-types/`,
        service,
      }),
      transformResponse: (response: StockLocationType[] | { results?: StockLocationType[] }) =>
        unwrapListResponse<StockLocationType>(response),
    }),

    listStockLocations: builder.query<StockLocation[], StockLocationListParams | void>({
      query: (params) => ({
        url: buildQuery(`/${stockApi}/locations/`, params),
        service,
      }),
      transformResponse: (response: StockLocation[] | { results?: StockLocation[] }) =>
        unwrapListResponse<StockLocation>(response),
    }),

    listStockLocationsPage: builder.query<PaginatedStockLocationResponse, StockLocationListParams>({
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

    getWarehouseConfiguration: builder.query<WarehouseConfiguration, EntityId>({
      query: (locationId) => ({ url: `/${stockApi}/warehouse-configurations/?location=${locationId}`, service }),
      transformResponse: (response: WarehouseConfiguration[] | { results?: WarehouseConfiguration[] }) => unwrapListResponse<WarehouseConfiguration>(response)[0],
    }),
    createWarehouseConfiguration: builder.mutation<WarehouseConfiguration, Partial<WarehouseConfiguration>>({
      query: (data) => ({ url: `/${stockApi}/warehouse-configurations/`, method: "POST", body: data, service }),
    }),
    updateWarehouseConfiguration: builder.mutation<WarehouseConfiguration, { id: EntityId; data: Partial<WarehouseConfiguration> }>({
      query: ({ id, data }) => ({ url: `/${stockApi}/warehouse-configurations/${id}/`, method: "PATCH", body: data, service }),
    }),
    getWarehouseReport: builder.query<WarehouseReport, EntityId>({
      query: (locationId) => ({ url: `/${stockApi}/locations/${locationId}/warehouse-report/`, service }),
    }),
    listWarehouseZones: builder.query<WarehouseZone[], EntityId>({
      query: (locationId) => ({ url: `/${stockApi}/warehouse-zones/?location=${locationId}`, service }),
      transformResponse: (response: WarehouseZone[] | { results?: WarehouseZone[] }) => unwrapListResponse<WarehouseZone>(response),
    }),
    createWarehouseZone: builder.mutation<WarehouseZone, Partial<WarehouseZone>>({
      query: (data) => ({ url: `/${stockApi}/warehouse-zones/`, method: "POST", body: data, service }),
    }),
    listCycleCountSchedules: builder.query<CycleCountSchedule[], EntityId | void>({
      query: (locationId) => ({ url: buildQuery(`/${stockApi}/cycle-count-schedules/`, locationId ? { location: locationId } : undefined), service }),
      transformResponse: (response: CycleCountSchedule[] | { results?: CycleCountSchedule[] }) => unwrapListResponse<CycleCountSchedule>(response),
    }),
    createCycleCountSchedule: builder.mutation<CycleCountSchedule, Partial<CycleCountSchedule>>({
      query: (data) => ({ url: `/${stockApi}/cycle-count-schedules/`, method: "POST", body: data, service }),
    }),
    listStockCountSessions: builder.query<StockCountSession[], EntityId | void>({
      query: (locationId) => ({ url: buildQuery(`/${stockApi}/stock-count-sessions/`, locationId ? { location: locationId } : undefined), service }),
      transformResponse: (response: StockCountSession[] | { results?: StockCountSession[] }) => unwrapListResponse<StockCountSession>(response),
    }),
    createStockCountSession: builder.mutation<StockCountSession, { location: EntityId; notes?: string }>({
      query: (data) => ({ url: `/${stockApi}/stock-count-sessions/`, method: "POST", body: data, service }),
    }),
    recordStockCountLines: builder.mutation<StockCountSession, { id: EntityId; lines: Array<{ id: EntityId; counted_quantity: string | number; notes?: string }> }>({
      query: ({ id, lines }) => ({ url: `/${stockApi}/stock-count-sessions/${id}/record_counts/`, method: "POST", body: { lines }, service }),
    }),
    submitStockCount: builder.mutation<StockCountSession, EntityId>({
      query: (id) => ({ url: `/${stockApi}/stock-count-sessions/${id}/submit/`, method: "POST", body: {}, service }),
    }),
    approveStockCount: builder.mutation<StockCountSession, { id: EntityId; stock_location_id: EntityId }>({
      query: ({ id, stock_location_id }) => ({ url: `/${stockApi}/stock-count-sessions/${id}/approve/`, method: "POST", body: { stock_location_id }, service }),
    }),

    getLocationInventoryItems: builder.query<InventoryItem[], { id: EntityId; status?: string } | EntityId>({
      query: (arg) => {
        const payload = typeof arg === "object" ? arg : { id: arg };
        return {
          url: buildQuery(`/${stockApi}/locations/${payload.id}/inventory_items/`, { status: payload.status }),
          service,
        };
      },
      transformResponse: (response: InventoryItem[] | { results?: InventoryItem[] }) =>
        unwrapListResponse<InventoryItem>(response),
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
      transformResponse: (response: InventoryItem[] | { results?: InventoryItem[] }) =>
        unwrapListResponse<InventoryItem>(response),
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

    getExpiringInventoryItems: builder.query<InventoryItem[], ({ days?: number } & StructuralScopeParams) | void>({
      query: (params) => ({
        url: buildQuery(`/${stockApi}/inventory-items/expiring_soon/`, params),
        service,
      }),
      transformResponse: (response: InventoryItem[] | { results?: InventoryItem[] }) =>
        unwrapListResponse<InventoryItem>(response),
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
      transformResponse: (response: InventoryItem[] | { results?: InventoryItem[] }) =>
        unwrapListResponse<InventoryItem>(response),
    }),

    getInventoryItemTrackingHistory: builder.query<StockTrackingEntry[], EntityId>({
      query: (id) => ({
        url: `/${stockApi}/inventory-items/${id}/tracking_history/`,
        service,
      }),
    }),

    getStockAnalytics: builder.query<StockAnalyticsResponse, StructuralScopeParams | void>({
      query: (params) => ({
        url: buildQuery(`/${stockApi}/inventory-items/analytics/`, params),
        service,
      }),
    }),

    getLowStockItems: builder.query<LowStockItem[], StructuralScopeParams | void>({
      query: (params) => ({
        url: buildQuery(`/${stockApi}/inventory-items/low_stock/`, params),
        service,
      }),
      transformResponse: (response: LowStockItem[] | { results?: LowStockItem[] }) =>
        unwrapListResponse<LowStockItem>(response),
    }),

    listStockBalances: builder.query<StockBalanceRow[], StockBalanceListParams | void>({
      query: (params) => ({
        url: buildQuery(`/${stockApi}/balances/`, params),
        service,
      }),
      transformResponse: (response: StockBalanceRow[] | { results?: StockBalanceRow[] }) =>
        unwrapListResponse<StockBalanceRow>(response),
    }),

    listStockBalancesPage: builder.query<PaginatedStockResponse<StockBalanceRow>, StockBalanceListParams>({
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
      transformResponse: (response: StockLot[] | { results?: StockLot[] }) =>
        unwrapListResponse<StockLot>(response),
    }),

    listStockLotsPage: builder.query<PaginatedStockResponse<StockLot>, StockLotListParams>({
      query: (params) => ({
        url: buildQuery(`/${stockApi}/lots/`, params),
        service,
      }),
    }),

    setStockLotStatus: builder.mutation<StockLot, { id: EntityId; status: string }>({
      query: ({ id, status }) => ({ url: `/${stockApi}/lots/${id}/set_status/`, method: "POST", body: { status }, service }),
    }),

    listStockSerials: builder.query<StockSerial[], StockSerialListParams | void>({
      query: (params) => ({
        url: buildQuery(`/${stockApi}/serials/`, params),
        service,
      }),
      transformResponse: (response: StockSerial[] | { results?: StockSerial[] }) =>
        unwrapListResponse<StockSerial>(response),
    }),

    listStockSerialsPage: builder.query<PaginatedStockResponse<StockSerial>, StockSerialListParams>({
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
      transformResponse: (response: StockMovement[] | { results?: StockMovement[] }) =>
        unwrapListResponse<StockMovement>(response),
    }),

    listStockMovementsPage: builder.query<PaginatedStockResponse<StockMovement>, StockMovementListParams>({
      query: (params) => ({
        url: buildQuery(`/${stockApi}/movements/`, params),
        service,
      }),
    }),

    getStockMovementSummary: builder.query<StockMovementSummaryResponse, StockMovementListParams | void>({
      query: (params) => ({
        url: buildQuery(`/${stockApi}/movements/summary/`, params),
        service,
      }),
    }),

    listReservations: builder.query<StockReservation[], StockReservationListParams | void>({
      query: (params) => ({
        url: buildQuery(`/${stockApi}/reservations/`, params),
        service,
      }),
      transformResponse: (response: StockReservation[] | { results?: StockReservation[] }) =>
        unwrapListResponse<StockReservation>(response),
    }),

    listReservationsPage: builder.query<PaginatedStockResponse<StockReservation>, StockReservationListParams>({
      query: (params) => ({
        url: buildQuery(`/${stockApi}/reservations/`, params),
        service,
      }),
    }),

    getReservationSummary: builder.query<StockReservationSummaryResponse, StockReservationListParams | void>({
      query: (params) => ({
        url: buildQuery(`/${stockApi}/reservations/summary/`, params),
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
      transformResponse: (response: StockLocation[] | { results?: StockLocation[] }) =>
        unwrapListResponse<StockLocation>(response),
    }),
  }),
});

export const {
  useListStockLocationTypesQuery,
  useListStockLocationsQuery,
  useListStockLocationsPageQuery,
  useCreateStockLocationMutation,
  useGetStockLocationQuery,
  useUpdateStockLocationMutation,
  useDeleteStockLocationMutation,
  useGetWarehouseConfigurationQuery,
  useGetWarehouseReportQuery,
  useCreateWarehouseConfigurationMutation,
  useUpdateWarehouseConfigurationMutation,
  useListWarehouseZonesQuery,
  useCreateWarehouseZoneMutation,
  useListCycleCountSchedulesQuery,
  useCreateCycleCountScheduleMutation,
  useListStockCountSessionsQuery,
  useCreateStockCountSessionMutation,
  useRecordStockCountLinesMutation,
  useSubmitStockCountMutation,
  useApproveStockCountMutation,
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
  useListStockBalancesPageQuery,
  useListStockLotsQuery,
  useListStockLotsPageQuery,
  useSetStockLotStatusMutation,
  useListStockSerialsQuery,
  useListStockSerialsPageQuery,
  useListStockMovementsQuery,
  useListStockMovementsPageQuery,
  useGetStockMovementSummaryQuery,
  useListReservationsQuery,
  useListReservationsPageQuery,
  useGetReservationSummaryQuery,
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

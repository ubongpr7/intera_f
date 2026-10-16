import { apiSlice } from "../../services/apiSlice";
import { unwrapListResponse } from "../../services/apiSlice";
import { buildQuery } from "../common/queryParams";
import type { StructuralLocationScopeParams } from "@/lib/structuralLocationScope";
import type {
  AdjustStockPayload,
  AdjustStockResponse,
  AvailableCatalogVariant,
  InventoryAnalytics,
  InventoryData,
  InventoryItemUnit,
  InventoryItemUnitListParams,
  InventoryReorderPolicy,
  InventoryListParams,
  PaginatedInventoryResponse,
  InventorySetupSummary,
  InventoryStockSummary,
  InventorySummary,
} from "./inventoryTypes";

const inventoryApi = "inventory_api";
const service = "inventory";

type EntityId = string | number;
type InventoryScopeParams = StructuralLocationScopeParams & Pick<InventoryListParams, "stock_location_id">;

export const inventoryApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listInventories: builder.query<InventorySummary[], InventoryListParams | void>({
      query: (params) => ({
        url: buildQuery(`/${inventoryApi}/items/`, params),
        service,
      }),
      transformResponse: (response: InventorySummary[] | { results?: InventorySummary[] }) => unwrapListResponse<InventorySummary>(response),
    }),

    listInventoryPage: builder.query<PaginatedInventoryResponse, InventoryListParams>({
      query: (params) => ({
        url: buildQuery(`/${inventoryApi}/items/`, params),
        service,
      }),
    }),

    createInventory: builder.mutation<InventoryData, Partial<InventoryData>>({
      query: (inventoryData) => ({
        url: `/${inventoryApi}/items/`,
        method: "POST",
        body: inventoryData,
        service,
      }),
    }),

    getAvailableCatalogVariants: builder.query<AvailableCatalogVariant[], void>({
      query: () => ({
        url: `/${inventoryApi}/items/available-catalog-variants/`,
        service,
      }),
    }),

    getInventory: builder.query<InventoryData, EntityId>({
      query: (id) => ({
        url: `/${inventoryApi}/items/${id}/`,
        service,
      }),
    }),

    updateInventory: builder.mutation<InventoryData, { id: EntityId; data: Partial<InventoryData> }>({
      query: ({ id, data }) => ({
        url: `/${inventoryApi}/items/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),

    deleteInventory: builder.mutation<void, EntityId>({
      query: (id) => ({
        url: `/${inventoryApi}/items/${id}/`,
        method: "DELETE",
        service,
      }),
    }),

    listInventoryItemUnits: builder.query<InventoryItemUnit[], InventoryItemUnitListParams | void>({
      query: (params) => ({
        url: buildQuery(`/${inventoryApi}/units/`, params),
        service,
      }),
      transformResponse: (response: InventoryItemUnit[] | { results?: InventoryItemUnit[] }) =>
        unwrapListResponse<InventoryItemUnit>(response),
    }),

    createInventoryItemUnit: builder.mutation<InventoryItemUnit, Partial<InventoryItemUnit>>({
      query: (data) => ({
        url: `/${inventoryApi}/units/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    updateInventoryItemUnit: builder.mutation<InventoryItemUnit, { id: EntityId; data: Partial<InventoryItemUnit> }>({
      query: ({ id, data }) => ({
        url: `/${inventoryApi}/units/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),

    deleteInventoryItemUnit: builder.mutation<void, EntityId>({
      query: (id) => ({
        url: `/${inventoryApi}/units/${id}/`,
        method: "DELETE",
        service,
      }),
    }),

    getInventoryReorderPolicy: builder.query<InventoryReorderPolicy, { id: EntityId; structural_location_id: EntityId }>({
      query: ({ id, structural_location_id }) => ({
        url: buildQuery(`/${inventoryApi}/items/${id}/reorder-policy/`, { structural_location_id }),
        service,
      }),
    }),

    updateInventoryReorderPolicy: builder.mutation<Partial<InventoryReorderPolicy>, { id: EntityId; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({
        url: `/${inventoryApi}/items/${id}/reorder-policy/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),

    getLowStockInventories: builder.query<InventorySummary[], InventoryScopeParams | void>({
      query: (params) => ({
        url: buildQuery(`/${inventoryApi}/items/low_stock/`, params),
        service,
      }),
      transformResponse: (response: InventorySummary[] | { results?: InventorySummary[] }) => unwrapListResponse<InventorySummary>(response),
    }),

    getInventoriesNeedingReorder: builder.query<InventorySummary[], InventoryScopeParams | void>({
      query: (params) => ({
        url: buildQuery(`/${inventoryApi}/items/needs_reorder/`, params),
        service,
      }),
      transformResponse: (response: InventorySummary[] | { results?: InventorySummary[] }) => unwrapListResponse<InventorySummary>(response),
    }),

    getInventorySetupSummary: builder.query<InventorySetupSummary, InventoryScopeParams | void>({
      query: (params) => ({
        url: buildQuery(`/${inventoryApi}/items/summary/`, params),
        service,
      }),
    }),

    getInventoryStockSummary: builder.query<InventoryStockSummary, EntityId>({
      query: (id) => ({
        url: `/${inventoryApi}/items/${id}/stock_summary/`,
        service,
      }),
    }),

    getMinimalInventory: builder.query<InventorySummary, EntityId>({
      query: (id) => ({
        url: `/${inventoryApi}/items/${id}/minimal_item/`,
        service,
      }),
    }),

    adjustInventoryStock: builder.mutation<AdjustStockResponse, { id: EntityId; data: AdjustStockPayload }>({
      query: ({ id, data }) => ({
        url: `/${inventoryApi}/items/${id}/adjust_stock/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    getInventoryAnalytics: builder.query<InventoryAnalytics, InventoryScopeParams | void>({
      query: (params) => ({
        url: buildQuery(`/stock_api/inventory-items/analytics/`, params),
        service,
      }),
    }),
  }),
});

export const {
  useListInventoriesQuery,
  useListInventoryPageQuery,
  useCreateInventoryMutation,
  useGetAvailableCatalogVariantsQuery,
  useGetInventoryQuery,
  useUpdateInventoryMutation,
  useDeleteInventoryMutation,
  useListInventoryItemUnitsQuery,
  useCreateInventoryItemUnitMutation,
  useUpdateInventoryItemUnitMutation,
  useDeleteInventoryItemUnitMutation,
  useGetInventoryReorderPolicyQuery,
  useUpdateInventoryReorderPolicyMutation,
  useGetLowStockInventoriesQuery,
  useGetInventoriesNeedingReorderQuery,
  useGetInventorySetupSummaryQuery,
  useGetInventoryStockSummaryQuery,
  useGetMinimalInventoryQuery,
  useAdjustInventoryStockMutation,
  useGetInventoryAnalyticsQuery,
} = inventoryApiSlice;

export const useGetInventoryDataQuery = useListInventoriesQuery;

import { apiSlice } from "../../services/apiSlice";
import { unwrapListResponse } from "../../services/apiSlice";
import { buildQuery } from "../common/queryParams";
import type { StructuralLocationScopeParams } from "@/lib/structuralLocationScope";
import type {
  AdjustStockPayload,
  AdjustStockResponse,
  CategoryData,
  InventoryAnalytics,
  InventoryCategoryListParams,
  InventoryData,
  InventoryListParams,
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
    listInventoryCategories: builder.query<CategoryData[], InventoryCategoryListParams | void>({
      query: (params) => ({
        url: buildQuery(`/${inventoryApi}/categories/`, params),
        service,
      }),
      transformResponse: (response: CategoryData[] | { results?: CategoryData[] }) => unwrapListResponse<CategoryData>(response),
    }),

    createCategory: builder.mutation<CategoryData, Partial<CategoryData>>({
      query: (data) => ({
        url: `/${inventoryApi}/categories/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    getCategory: builder.query<CategoryData, EntityId>({
      query: (id) => ({
        url: `/${inventoryApi}/categories/${id}/`,
        service,
      }),
    }),

    updateCategory: builder.mutation<CategoryData, { id: EntityId; data: Partial<CategoryData> }>({
      query: ({ id, data }) => ({
        url: `/${inventoryApi}/categories/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),

    deleteCategory: builder.mutation<void, EntityId>({
      query: (id) => ({
        url: `/${inventoryApi}/categories/${id}/`,
        method: "DELETE",
        service,
      }),
    }),

    getCategoryTree: builder.query<CategoryData[], void>({
      query: () => ({
        url: `/${inventoryApi}/categories/tree/`,
        service,
      }),
    }),

    getCategoryChildren: builder.query<CategoryData[], EntityId>({
      query: (id) => ({
        url: `/${inventoryApi}/categories/${id}/children/`,
        service,
      }),
      transformResponse: (response: CategoryData[] | { results?: CategoryData[] }) => unwrapListResponse<CategoryData>(response),
    }),

    getCategoryInventories: builder.query<InventorySummary[], EntityId>({
      query: (id) => ({
        url: `/${inventoryApi}/categories/${id}/items/`,
        service,
      }),
      transformResponse: (response: InventorySummary[] | { results?: InventorySummary[] }) => unwrapListResponse<InventorySummary>(response),
    }),

    listInventories: builder.query<InventorySummary[], InventoryListParams | void>({
      query: (params) => ({
        url: buildQuery(`/${inventoryApi}/items/`, params),
        service,
      }),
      transformResponse: (response: InventorySummary[] | { results?: InventorySummary[] }) => unwrapListResponse<InventorySummary>(response),
    }),

    createInventory: builder.mutation<InventoryData, Partial<InventoryData>>({
      query: (inventoryData) => ({
        url: `/${inventoryApi}/items/`,
        method: "POST",
        body: inventoryData,
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
  useListInventoryCategoriesQuery,
  useCreateCategoryMutation,
  useGetCategoryQuery,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetCategoryTreeQuery,
  useGetCategoryChildrenQuery,
  useGetCategoryInventoriesQuery,
  useListInventoriesQuery,
  useCreateInventoryMutation,
  useGetInventoryQuery,
  useUpdateInventoryMutation,
  useDeleteInventoryMutation,
  useGetLowStockInventoriesQuery,
  useGetInventoriesNeedingReorderQuery,
  useGetInventorySetupSummaryQuery,
  useGetInventoryStockSummaryQuery,
  useGetMinimalInventoryQuery,
  useAdjustInventoryStockMutation,
  useGetInventoryAnalyticsQuery,
} = inventoryApiSlice;

export const useGetInventoryCategoriesQuery = useListInventoryCategoriesQuery;
export const useGetInventoryDataQuery = useListInventoriesQuery;

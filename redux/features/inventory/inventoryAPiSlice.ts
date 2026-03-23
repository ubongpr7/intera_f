import { apiSlice } from "../../services/apiSlice";
import { buildQuery } from "../common/queryParams";
import type {
  AdjustStockPayload,
  AdjustStockResponse,
  CategoryData,
  InventoryAnalytics,
  InventoryCategoryListParams,
  InventoryData,
  InventoryListParams,
  InventoryStockSummary,
  InventorySummary,
} from "./inventoryTypes";

const inventoryApi = "inventory_api";
const service = "inventory";

type EntityId = string | number;

export const inventoryApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listInventoryCategories: builder.query<CategoryData[], InventoryCategoryListParams | void>({
      query: (params) => ({
        url: buildQuery(`/${inventoryApi}/categories/`, params),
        service,
      }),
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
    }),

    getCategoryInventories: builder.query<InventorySummary[], EntityId>({
      query: (id) => ({
        url: `/${inventoryApi}/categories/${id}/items/`,
        service,
      }),
    }),

    listInventories: builder.query<InventorySummary[], InventoryListParams | void>({
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

    getLowStockInventories: builder.query<InventorySummary[], void>({
      query: () => ({
        url: `/${inventoryApi}/items/low_stock/`,
        service,
      }),
    }),

    getInventoriesNeedingReorder: builder.query<InventorySummary[], void>({
      query: () => ({
        url: `/${inventoryApi}/items/needs_reorder/`,
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

    getInventoryAnalytics: builder.query<InventoryAnalytics, void>({
      query: () => ({
        url: `/${inventoryApi}/items/analytics/`,
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
  useGetInventoryStockSummaryQuery,
  useGetMinimalInventoryQuery,
  useAdjustInventoryStockMutation,
  useGetInventoryAnalyticsQuery,
} = inventoryApiSlice;

export const useGetInventoryCategoriesQuery = useListInventoryCategoriesQuery;
export const useGetInventoryDataQuery = useListInventoriesQuery;

import { apiSlice, unwrapListResponse } from "../../services/apiSlice"
import type { CostingPeriod, Id, ListResponse, MaterialRequirement, ProductionCostSummary, ProductionOrder, Recipe, WasteRecord } from "./manufacturingTypes"

const service = "inventory" as const
const list = <T>(response: ListResponse<T>) => unwrapListResponse<T>(response)

export const manufacturingApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listManufacturingRecipes: builder.query<Recipe[], void>({
      query: () => ({ url: "/manufacturing_api/recipes/", service }),
      transformResponse: (response: ListResponse<Recipe>) => list(response),
    }),
    listProductionOrders: builder.query<ProductionOrder[], void>({
      query: () => ({ url: "/manufacturing_api/production-orders/", service }),
      transformResponse: (response: ListResponse<ProductionOrder>) => list(response),
    }),
    createManufacturingRecipe: builder.mutation<Recipe, Record<string, unknown>>({
      query: (body) => ({ url: "/manufacturing_api/recipes/", method: "POST", body, service }),
      invalidatesTags: ["Manufacturing"],
    }),
    createProductionOrder: builder.mutation<ProductionOrder, Record<string, unknown>>({
      query: (body) => ({ url: "/manufacturing_api/production-orders/", method: "POST", body, service }),
      invalidatesTags: ["Manufacturing"],
    }),
    getProductionRequirements: builder.query<MaterialRequirement[], Id>({
      query: (id) => ({ url: `/manufacturing_api/production-orders/${id}/requirements/`, service }),
    }),
    getProductionCostSummary: builder.query<ProductionCostSummary, Id>({
      query: (id) => ({ url: `/manufacturing_api/production-orders/${id}/cost_summary/`, service }),
    }),
    releaseProductionOrder: builder.mutation<ProductionOrder, Id>({
      query: (id) => ({ url: `/manufacturing_api/production-orders/${id}/release/`, method: "POST", service }),
      invalidatesTags: ["Manufacturing"],
    }),
    reserveProductionMaterials: builder.mutation<unknown, Id>({
      query: (id) => ({ url: `/manufacturing_api/production-orders/${id}/reserve_materials/`, method: "POST", service }),
      invalidatesTags: ["Manufacturing"],
    }),
    recordProductionWaste: builder.mutation<WasteRecord, { orderId: Id; data: Record<string, unknown> }>({
      query: ({ orderId, data }) => ({ url: `/manufacturing_api/production-orders/${orderId}/record_waste/`, method: "POST", body: data, service }),
      invalidatesTags: ["Manufacturing"],
    }),
    createQualityInspection: builder.mutation<unknown, { orderId: Id; data: Record<string, unknown> }>({
      query: ({ orderId, data }) => ({ url: `/manufacturing_api/production-orders/${orderId}/inspect/`, method: "POST", body: data, service }),
      invalidatesTags: ["Manufacturing"],
    }),
    listCostingPeriods: builder.query<CostingPeriod[], void>({
      query: () => ({ url: "/manufacturing_api/costing-periods/", service }),
      transformResponse: (response: ListResponse<CostingPeriod>) => list(response),
    }),
    closeCostingPeriod: builder.mutation<CostingPeriod, Id>({
      query: (id) => ({ url: `/manufacturing_api/costing-periods/${id}/close/`, method: "POST", service }),
      invalidatesTags: ["Manufacturing"],
    }),
  }),
  overrideExisting: false,
})

export const {
  useListManufacturingRecipesQuery,
  useListProductionOrdersQuery,
  useCreateManufacturingRecipeMutation,
  useCreateProductionOrderMutation,
  useGetProductionRequirementsQuery,
  useGetProductionCostSummaryQuery,
  useReleaseProductionOrderMutation,
  useReserveProductionMaterialsMutation,
  useRecordProductionWasteMutation,
  useCreateQualityInspectionMutation,
  useListCostingPeriodsQuery,
  useCloseCostingPeriodMutation,
} = manufacturingApiSlice

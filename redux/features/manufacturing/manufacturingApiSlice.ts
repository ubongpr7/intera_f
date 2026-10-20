import { apiSlice, unwrapListResponse } from "../../services/apiSlice"
import type { CostingPeriod, Id, ListResponse, MaterialRequirement, Nonconformance, ProductionCostSummary, ProductionOrder, Recipe, WasteRecord, WorkCenter, WorkCenterBlock, WorkCenterCapacity } from "./manufacturingTypes"

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
    recordProductionOutput: builder.mutation<unknown, { orderId: Id; data: Record<string, unknown> }>({
      query: ({ orderId, data }) => ({ url: `/manufacturing_api/production-orders/${orderId}/record_output/`, method: "POST", body: data, service }),
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
    listWorkCenters: builder.query<WorkCenter[], void>({
      query: () => ({ url: "/manufacturing_api/work-centers/", service }),
      transformResponse: (response: ListResponse<WorkCenter>) => list(response),
    }),
    createWorkCenter: builder.mutation<WorkCenter, Partial<WorkCenter>>({
      query: (body) => ({ url: "/manufacturing_api/work-centers/", method: "POST", body, service }),
      invalidatesTags: ["Manufacturing"],
    }),
    updateWorkCenter: builder.mutation<WorkCenter, { id: Id; data: Partial<WorkCenter> }>({
      query: ({ id, data }) => ({ url: `/manufacturing_api/work-centers/${id}/`, method: "PATCH", body: data, service }),
      invalidatesTags: ["Manufacturing"],
    }),
    listWorkCenterBlocks: builder.query<WorkCenterBlock[], Id>({
      query: (id) => ({ url: `/manufacturing_api/work-centers/${id}/blocks/`, service }),
      transformResponse: (response: ListResponse<WorkCenterBlock>) => list(response),
    }),
    getWorkCenterCapacity: builder.query<WorkCenterCapacity, { id: Id; dateFrom?: string; dateTo?: string }>({
      query: ({ id, dateFrom, dateTo }) => ({
        url: `/manufacturing_api/work-centers/${id}/capacity/`,
        params: { date_from: dateFrom, date_to: dateTo },
        service,
      }),
    }),
    createWorkCenterBlock: builder.mutation<WorkCenterBlock, { workCenterId: Id; data: Omit<WorkCenterBlock, "id" | "work_center" | "created_at"> }>({
      query: ({ workCenterId, data }) => ({ url: `/manufacturing_api/work-centers/${workCenterId}/blocks/`, method: "POST", body: data, service }),
      invalidatesTags: ["Manufacturing"],
    }),
    listNonconformances: builder.query<Nonconformance[], void>({
      query: () => ({ url: "/manufacturing_api/nonconformances/", service }),
      transformResponse: (response: ListResponse<Nonconformance>) => list(response),
    }),
    createNonconformance: builder.mutation<Nonconformance, Partial<Nonconformance>>({
      query: (body) => ({ url: "/manufacturing_api/nonconformances/", method: "POST", body, service }),
      invalidatesTags: ["Manufacturing"],
    }),
    transitionNonconformance: builder.mutation<Nonconformance, { id: Id; action: "contain" | "investigate" | "close" }>({
      query: ({ id, action }) => ({ url: `/manufacturing_api/nonconformances/${id}/${action}/`, method: "POST", service }),
      invalidatesTags: ["Manufacturing"],
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
  useRecordProductionOutputMutation,
  useCreateQualityInspectionMutation,
  useListCostingPeriodsQuery,
  useCloseCostingPeriodMutation,
  useListWorkCentersQuery,
  useCreateWorkCenterMutation,
  useUpdateWorkCenterMutation,
  useListWorkCenterBlocksQuery,
  useGetWorkCenterCapacityQuery,
  useCreateWorkCenterBlockMutation,
  useListNonconformancesQuery,
  useCreateNonconformanceMutation,
  useTransitionNonconformanceMutation,
} = manufacturingApiSlice

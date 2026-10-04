import { apiSlice, unwrapListResponse } from "../../services/apiSlice"
import { buildQuery } from "../common/queryParams"
import type {
  CreateCustomerReturnPayload,
  CustomerReturn,
  JournalEntry,
  SalesMarginResponse,
  ValuationSnapshot,
} from "./accountingTypes"

const inventoryService = "inventory" as const

export const accountingApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSalesMargin: builder.query<SalesMarginResponse, Record<string, string | number | undefined> | void>({
      query: (params) => ({
        url: buildQuery("/order_api/sales-orders/margin/", params),
        service: inventoryService,
      }),
    }),
    listCustomerReturns: builder.query<CustomerReturn[], void>({
      query: () => ({ url: "/order_api/customer-returns/", service: inventoryService }),
      transformResponse: (response: CustomerReturn[] | { results?: CustomerReturn[] }) => unwrapListResponse(response),
    }),
    createCustomerReturn: builder.mutation<CustomerReturn, CreateCustomerReturnPayload>({
      query: (body) => ({ url: "/order_api/customer-returns/", method: "POST", body, service: inventoryService }),
    }),
    completeCustomerReturn: builder.mutation<CustomerReturn, { id: string | number; location_id: string | number; notes?: string }>({
      query: ({ id, ...body }) => ({ url: `/order_api/customer-returns/${id}/complete/`, method: "POST", body, service: inventoryService }),
    }),
    listJournalEntries: builder.query<JournalEntry[], void>({
      query: () => ({ url: "/accounting_api/journal-entries/", service: inventoryService }),
      transformResponse: (response: JournalEntry[] | { results?: JournalEntry[] }) => unwrapListResponse(response),
    }),
    listValuationSnapshots: builder.query<ValuationSnapshot[], { snapshot_date?: string } | void>({
      query: (params) => ({ url: buildQuery("/accounting_api/valuation-snapshots/", params), service: inventoryService }),
      transformResponse: (response: ValuationSnapshot[] | { results?: ValuationSnapshot[] }) => unwrapListResponse(response),
    }),
    captureValuation: builder.mutation<ValuationSnapshot[], { snapshot_date?: string; costing_method?: string }>({
      query: (body) => ({ url: "/accounting_api/valuation-snapshots/capture/", method: "POST", body, service: inventoryService }),
    }),
  }),
})

export const {
  useGetSalesMarginQuery,
  useListCustomerReturnsQuery,
  useCreateCustomerReturnMutation,
  useCompleteCustomerReturnMutation,
  useListJournalEntriesQuery,
  useListValuationSnapshotsQuery,
  useCaptureValuationMutation,
} = accountingApiSlice

import { apiSlice } from "../../services/apiSlice"
import type { AuditEventListResponse, AuditFilterOptions, AuditQueryParams } from "./auditTypes"
import type { DashboardWorkspaceSnapshot } from "./auditRealtimeDashboardTypes"

const service = "audit" as const

export const auditApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listAuditEvents: builder.query<AuditEventListResponse, AuditQueryParams | void>({
      query: (params) => ({
        url: "/api/v1/audits/",
        params: params ?? { limit: 50, offset: 0 },
        service,
      }),
    }),

    getAuditFilterOptions: builder.query<AuditFilterOptions, { workspace_id?: string } | void>({
      query: (params) => ({
        url: "/api/v1/audits/filters",
        params: params ?? undefined,
        service,
      }),
    }),

    getRealtimeDashboardSnapshot: builder.query<DashboardWorkspaceSnapshot, string>({
      query: (workspaceId) => ({
        url: `/api/v1/realtime/workspaces/${encodeURIComponent(workspaceId)}/dashboard`,
        service,
      }),
    }),
  }),
})

export const { useListAuditEventsQuery, useGetAuditFilterOptionsQuery, useGetRealtimeDashboardSnapshotQuery } = auditApiSlice

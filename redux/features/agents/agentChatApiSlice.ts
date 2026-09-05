import type { FetchBaseQueryError } from "@reduxjs/toolkit/query"
import { getCookie } from "cookies-next"

import { apiSlice } from "@/redux/services/apiSlice"
import { readCookieValue } from "@/lib/authCookies"
import { getFrontendOrigin } from "@/lib/frontendOrigin"
import type {
  AgentConversation,
  AgentConversationDetail,
  CreateAgentConversationRequest,
  UpdateAgentConversationRequest,
} from "./agentChatTypes"

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "")

export const getAgentGatewayBaseUrl = () => {
  const base =
    typeof window === "undefined"
      ? (process.env.KA2A_GATEWAY_INTERNAL_URL || process.env.NEXT_PUBLIC_KA2A_GATEWAY_URL || "http://localhost:7006").trim()
      : (process.env.NEXT_PUBLIC_KA2A_GATEWAY_URL || "http://localhost:7006").trim()
  return stripTrailingSlash(base)
}

export const getAgentGatewayWebSocketBaseUrl = () => {
  const httpBase = getAgentGatewayBaseUrl()
  if (httpBase.startsWith("https://")) {
    return `wss://${httpBase.slice("https://".length)}`
  }
  if (httpBase.startsWith("http://")) {
    return `ws://${httpBase.slice("http://".length)}`
  }
  return httpBase
}

export const getGatewayAccessToken = () =>
  readCookieValue("accessToken", (name) => getCookie(name))

export const getGatewayAuthorizationContext = () =>
  readCookieValue("authorizationContext", (name) => getCookie(name))

const buildGatewayHeaders = (contentType = true) => {
  const headers = new Headers()
  const accessToken = getGatewayAccessToken()
  const authorizationContext = readCookieValue("authorizationContext", (name) => getCookie(name))
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }
  if (authorizationContext) {
    headers.set("X-Intera-Authorization-Context", authorizationContext)
  }
  const frontendOrigin = getFrontendOrigin()
  if (frontendOrigin) headers.set("X-Intera-Frontend-Origin", frontendOrigin)
  if (contentType) {
    headers.set("Content-Type", "application/json")
  }
  return headers
}

const fetchError = (error: unknown): { error: FetchBaseQueryError } => ({
  error: {
    status: "FETCH_ERROR",
    error: error instanceof Error ? error.message : String(error),
  },
})

const httpError = (status: number, data: unknown): { error: FetchBaseQueryError } => ({
  error: { status, data },
})

const requestJson = async <T>(
  path: string,
  init: RequestInit = {},
): Promise<{ data: T } | { error: FetchBaseQueryError }> => {
  try {
    const response = await fetch(`${getAgentGatewayBaseUrl()}${path}`, {
      ...init,
      cache: "no-store",
      headers: init.headers ?? buildGatewayHeaders(init.method !== "GET"),
    })
    const text = await response.text()
    if (!response.ok) {
      return httpError(response.status, text || response.statusText)
    }
    if (!text.trim()) {
      return { data: {} as T }
    }
    return { data: JSON.parse(text) as T }
  } catch (error) {
    return fetchError(error)
  }
}

const toCreateConversationBody = (body: CreateAgentConversationRequest) => ({
  agent_slug: body.agentSlug,
  title: body.title,
  history_length: body.historyLength,
})

const toUpdateConversationBody = (body: Omit<UpdateAgentConversationRequest, "conversationId">) => ({
  title: body.title,
  status: body.status,
  history_length: body.historyLength,
})

export const agentChatApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listAgentConversations: builder.query<AgentConversation[], { status?: string; limit?: number } | void>({
      queryFn: async (arg) => {
        const search = new URLSearchParams()
        if (arg?.status) {
          search.set("status", arg.status)
        }
        if (typeof arg?.limit === "number") {
          search.set("limit", `${arg.limit}`)
        }
        const suffix = search.size ? `?${search.toString()}` : ""
        return requestJson<AgentConversation[]>(`/conversations${suffix}`, {
          method: "GET",
          headers: buildGatewayHeaders(false),
        })
      },
      providesTags: ["AgentConversation"],
    }),
    getAgentConversation: builder.query<AgentConversationDetail, string>({
      queryFn: async (conversationId) =>
        requestJson<AgentConversationDetail>(`/conversations/${encodeURIComponent(conversationId)}`, {
          method: "GET",
          headers: buildGatewayHeaders(false),
        }),
      providesTags: (_result, _error, conversationId) => [{ type: "AgentConversation", id: conversationId }],
    }),
    createAgentConversation: builder.mutation<AgentConversationDetail, CreateAgentConversationRequest>({
      queryFn: async (body) =>
        requestJson<AgentConversationDetail>("/conversations", {
          method: "POST",
          headers: buildGatewayHeaders(true),
          body: JSON.stringify(toCreateConversationBody(body)),
        }),
      invalidatesTags: ["AgentConversation"],
    }),
    updateAgentConversation: builder.mutation<AgentConversation, UpdateAgentConversationRequest>({
      queryFn: async ({ conversationId, ...body }) =>
        requestJson<AgentConversation>(`/conversations/${encodeURIComponent(conversationId)}`, {
          method: "PATCH",
          headers: buildGatewayHeaders(true),
          body: JSON.stringify(toUpdateConversationBody(body)),
        }),
      invalidatesTags: (_result, _error, arg) => [
        "AgentConversation",
        { type: "AgentConversation", id: arg.conversationId },
      ],
    }),
    deleteAgentConversation: builder.mutation<{ deleted: boolean; conversationId: string }, string>({
      queryFn: async (conversationId) =>
        requestJson<{ deleted: boolean; conversationId: string }>(
          `/conversations/${encodeURIComponent(conversationId)}`,
          {
            method: "DELETE",
            headers: buildGatewayHeaders(false),
          },
        ),
      invalidatesTags: ["AgentConversation"],
    }),
  }),
})

export const {
  useListAgentConversationsQuery,
  useGetAgentConversationQuery,
  useCreateAgentConversationMutation,
  useUpdateAgentConversationMutation,
  useDeleteAgentConversationMutation,
} = agentChatApiSlice

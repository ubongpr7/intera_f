import { apiSlice } from "@/redux/services/apiSlice"
import type {
  CallEndResponse,
  CallSession,
  ChatConversation,
  ChatMessage,
  SupportAssistResponse,
  SupportHumanRequestResponse,
  UploadAttachmentResponse,
} from "./chatTypes"

export const chatApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listChatConversations: builder.query<ChatConversation[], void>({
      query: () => ({ url: "/api/v1/conversations", service: "chat" }),
      providesTags: ["ChatConversations"],
    }),
    listChatMessages: builder.query<ChatMessage[], string>({
      query: (conversationId) => ({ url: `/api/v1/conversations/${conversationId}/messages`, service: "chat" }),
      providesTags: (_result, _error, conversationId) => [{ type: "ChatMessages", id: conversationId }],
    }),
    createChatConversation: builder.mutation<ChatConversation, {
      kind: "direct" | "group"
      title?: string
      subject?: string
      context_workspace_id?: string
      context_label?: string
      participants: Array<{ user_id: string; display_name?: string; email?: string; role?: string }>
    }>({
      query: (body) => ({ url: "/api/v1/conversations", method: "POST", body, service: "chat" }),
      invalidatesTags: ["ChatConversations"],
    }),
    createChatMessage: builder.mutation<ChatMessage, {
      conversationId: string
      body?: string
      kind?: "text" | "voice" | "file" | "image"
      attachment_ids?: string[]
      workspace_id?: string
    }>({
      query: ({ conversationId, ...body }) => ({
        url: `/api/v1/conversations/${conversationId}/messages`,
        method: "POST",
        body,
        service: "chat",
      }),
      invalidatesTags: (_result, _error, { conversationId }) => [
        { type: "ChatMessages", id: conversationId },
        "ChatConversations",
      ],
    }),
    uploadChatAttachment: builder.mutation<UploadAttachmentResponse, { conversationId: string; file: File }>({
      query: ({ conversationId, file }) => {
        const formData = new FormData()
        formData.append("file", file)
        return {
          url: `/api/v1/conversations/${conversationId}/messages/attachments/upload`,
          method: "POST",
          body: formData,
          service: "chat",
          meta: { isFileUpload: true },
        }
      },
      invalidatesTags: (_result, _error, { conversationId }) => [{ type: "ChatMessages", id: conversationId }],
    }),
    supportAssist: builder.mutation<SupportAssistResponse, { conversation_id?: string; body: string }>({
      query: (body) => ({ url: "/api/v1/support/assist", method: "POST", body, service: "chat" }),
      invalidatesTags: ["ChatConversations"],
    }),
    requestSupportAgent: builder.mutation<SupportHumanRequestResponse, string>({
      query: (conversationId) => ({ url: `/api/v1/support/${conversationId}/request-human`, method: "POST", body: {}, service: "chat" }),
      invalidatesTags: ["ChatConversations"],
    }),
    listSupportInbox: builder.query<ChatConversation[], void>({
      query: () => ({ url: "/api/v1/support/inbox", service: "chat" }),
      providesTags: ["ChatConversations"],
    }),
    claimSupportConversation: builder.mutation<ChatConversation, { conversationId: string; display_name?: string; email?: string }>({
      query: ({ conversationId, ...body }) => ({ url: `/api/v1/support/${conversationId}/claim`, method: "POST", body, service: "chat" }),
      invalidatesTags: ["ChatConversations"],
    }),
    resolveSupportConversation: builder.mutation<ChatConversation, string>({
      query: (conversationId) => ({ url: `/api/v1/support/${conversationId}/resolve`, method: "POST", body: {}, service: "chat" }),
      invalidatesTags: ["ChatConversations"],
    }),
    startChatCall: builder.mutation<CallSession, { conversation_id?: string; call_type: "support" | "internal"; workspace_id?: string }>({
      query: (body) => ({ url: "/api/v1/calls/token", method: "POST", body, service: "chat" }),
    }),
    joinChatCall: builder.mutation<CallSession, string>({
      query: (callId) => ({ url: `/api/v1/calls/${callId}/token`, method: "POST", body: {}, service: "chat" }),
    }),
    endChatCall: builder.mutation<CallEndResponse, string>({
      query: (callId) => ({ url: `/api/v1/calls/${callId}/end`, method: "POST", body: {}, service: "chat" }),
    }),
  }),
})

export const {
  useListChatConversationsQuery,
  useListChatMessagesQuery,
  useCreateChatConversationMutation,
  useCreateChatMessageMutation,
  useUploadChatAttachmentMutation,
  useSupportAssistMutation,
  useRequestSupportAgentMutation,
  useListSupportInboxQuery,
  useClaimSupportConversationMutation,
  useResolveSupportConversationMutation,
  useStartChatCallMutation,
  useJoinChatCallMutation,
  useEndChatCallMutation,
} = chatApiSlice

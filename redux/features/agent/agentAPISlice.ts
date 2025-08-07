import { get } from 'http';
import { apiSlice } from '../../services/apiSlice';
import { list } from 'postcss';

export const agentApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    
    createConversation: builder.mutation({
      query: () => ({
        url: `conversation/create`,
        method: 'POST',
        body: {},
        service:'agent'

      }),
    }),
    
    sendMessage: builder.mutation({
      query: ({data}) => ({
        url: `message/send`,
        method: 'POST',
        body: data,
        service:'agent'
      }),
    }),
    registerAgent: builder.mutation({
      query: ({data}) => ({
        url: `agent/register`,
        method: 'POST',
        body: data,
        service:'agent'
      }),
    }),
    getFilesQuery: builder.query({
      query: (file_id) => ({
        url: `message/file/${file_id}`,
        service: 'agent'
      }),
    }),
    updateAPIKey: builder.mutation({
      query: ({ data }) => ({
        url: `api_key/update`,
        method: 'POST',
        body: data,
        service: 'agent'
      }),
    }),

    pendingMessages: builder.mutation({
      query: () => ({
        url: `message/pending`,
        method: 'POST',
        body: {},
        service:'agent'

      }),
    }),
    getEvent: builder.mutation({
      query: () => ({
        url: `events/get`,
        method: 'POST',
        body: {},
        service:'agent'

      }),
    }),
    listConversations: builder.mutation({
      query: () => ({
        url: `conversation/list`,
        method: 'POST',
        body: {},
        service:'agent'
      }),
    }),
    listTask: builder.mutation({
      query: ({data}) => ({
        url: `task/list`,
        method: 'POST',
        body: data,
        service:'agent'

      }),
    }),
    listMessages: builder.mutation({
      query: () => ({
        url: `message/list`,
        method: 'POST',
        body: {},
        service:'agent'

      }),
    }),
    listAgents:builder.mutation({
      query:()=>({
        url:'agent/list',
        method:'POST',
        service:'agent',

      })
    }),


  }),
});
export const {
  useCreateConversationMutation,
    useSendMessageMutation,
    useRegisterAgentMutation,
    useGetFilesQueryQuery,
    useUpdateAPIKeyMutation,
    usePendingMessagesMutation,
    useGetEventMutation,
    useListConversationsMutation,
    useListTaskMutation,
    useListMessagesMutation,
    useListAgentsMutation,
} = agentApiSlice;
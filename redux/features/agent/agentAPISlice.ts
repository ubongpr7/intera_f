import { get } from 'http';
import { apiSlice } from '../../services/apiSlice';
import { list } from 'postcss';

export const agentApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    
    createConversationMutation: builder.mutation({
      query: () => ({
        url: `conversation/create`,
        method: 'POST',
        body: {},
        service:'agent'

      }),
    }),
    
    sendMessageMutation: builder.mutation({
      query: ({data}) => ({
        url: `message/send`,
        method: 'POST',
        body: data,
        service:'agent'
      }),
    }),
    registerAgentMutation: builder.mutation({
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
    updateAPIKeyMutation: builder.mutation({
      query: ({ data }) => ({
        url: `api_key/update`,
        method: 'POST',
        body: data,
        service: 'agent'
      }),
    }),

    pendingMessagesMutation: builder.mutation({
      query: () => ({
        url: `message/pending`,
        method: 'POST',
        body: {},
        service:'agent'

      }),
    }),
    getEventMutation: builder.mutation({
      query: () => ({
        url: `events/get`,
        method: 'POST',
        body: {},
        service:'agent'

      }),
    }),
    listConversationsMutation: builder.mutation({
      query: () => ({
        url: `conversation/list`,
        method: 'POST',
        body: {},
        service:'agent'
      }),
    }),
    listTaskMutation: builder.mutation({
      query: () => ({
        url: `task/list`,
        method: 'POST',
        body: {},
        service:'agent'

      }),
    }),
    listMessagesMutation: builder.mutation({
      query: () => ({
        url: `message/list`,
        method: 'POST',
        body: {},
        service:'agent'

      }),
    }),
    listAgentsMutation:builder.mutation({
      query:()=>({
        url:'agent/list',
        method:'POST',
        service:'agent',

      })
    }),

    askAgentMutation: builder.mutation({
      query: ({  data }) => ({
        url: `api/ask`,
        method: 'POST',
        body: data,
        service:'agent'

      }),
    }),

  }),
});
export const {
  useCreateConversationMutationMutation,
    useSendMessageMutationMutation,
    useRegisterAgentMutationMutation,
    useGetFilesQueryQuery,
    useUpdateAPIKeyMutationMutation,
    usePendingMessagesMutationMutation,
    useGetEventMutationMutation,
    useListConversationsMutationMutation,
    useListTaskMutationMutation,
    useListMessagesMutationMutation,
    useListAgentsMutationMutation,
    useAskAgentMutationMutation,
} = agentApiSlice;
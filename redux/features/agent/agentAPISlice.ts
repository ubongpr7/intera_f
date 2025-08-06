import { get } from 'http';
import { apiSlice } from '../../services/apiSlice';

export const agentApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    
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
    useAskAgentMutationMutation,
} = agentApiSlice;
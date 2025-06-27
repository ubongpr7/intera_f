import { apiSlice } from '../../services/apiSlice';

const management_api=`management`

export const activityLogs = apiSlice.injectEndpoints({
  endpoints: builder => ({
    
    getUserActivities: builder.query({
      query: (id) => `/${management_api}/activity-logs/?user_id=${id}`,
    }),
  
  }),

});

export const {
  useGetUserActivitiesQuery
} = activityLogs;
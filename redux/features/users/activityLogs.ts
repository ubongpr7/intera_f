import { apiSlice } from '../../services/apiSlice';

const management_api=`management_api`

export const activityLogs = apiSlice.injectEndpoints({
  endpoints: builder => ({
    
    getUserActivities: builder.query({
      query: (id) => `/${management_api}/activities/${id}/`,
    }),
  
  }),

});

export const {
  useGetUserActivitiesQuery
} = activityLogs;
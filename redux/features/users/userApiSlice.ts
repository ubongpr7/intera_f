import { apiSlice } from '../../services/apiSlice';
import { UserData } from '../../../components/interfaces/User';
const user_api='api/v1/accounts'
export const userApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    updateUser: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${user_api}/users/${id}/`,
        method: 'PATCH',
        body: data
      }),
    }),
    createStaffUser: builder.mutation({
      query: (CompanyDataInterface: Partial<UserData>) => ({
        url: `/${user_api}/create-staff/`,
        method: 'POST',
        body: CompanyDataInterface
      }),
    
    }),
    getAUser: builder.mutation({
      query: ({ id }) => ({
        url: `/${user_api}/users/${id}/`,
        method: 'GET',
      }),
    }),
    getLoggedInUser: builder.query({
      query: () => `/${user_api}/user/`,
    }),
  
    getCompanyUsers: builder.query<UserData[], void>({
      query: () => `/${user_api}/staff/list/`,
    }),
  
    
  }),

});

export const { 
  useUpdateUserMutation,
  useCreateStaffUserMutation,
  useGetAUserMutation,
  useGetLoggedInUserQuery,
  useGetCompanyUsersQuery,
  
} = userApiSlice;
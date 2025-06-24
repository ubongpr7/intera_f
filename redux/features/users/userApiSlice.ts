import { apiSlice } from '../../services/apiSlice';
import { UserData } from '../../../components/interfaces/User';
const user_api='api/v1/accounts'
const	service = 'users'

export const userApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    updateUser: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${user_api}/users/${id}/`,
        method: 'PATCH',
        body: data,
				service:service,
      }),
    }),
    createStaffUser: builder.mutation({
      query: (CompanyDataInterface: Partial<UserData>) => ({
        url: `/${user_api}/create-staff/`,
        method: 'POST',
        body: CompanyDataInterface,
				service:service,
      }),
    
    }),
    getAUser: builder.mutation({
      query: ({ id }) => ({
        url: `/${user_api}/users/${id}/`,
        method: 'GET',
				service:service,
      }),
    }),
    getLoggedInUser: builder.query({
      query: () => ({
        url:`/${user_api}/user/`,
				service:service,
      })
      
    }),
  
    getCompanyUsers: builder.query<UserData[], void>({
      query: () => ({
        url:`/${user_api}/staff/list/`,
				service:service,
      })
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
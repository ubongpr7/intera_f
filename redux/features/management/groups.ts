import { apiSlice } from '../../services/apiSlice';
import { GroupData, RoleData } from '../../../components/interfaces/management';
const management_api=`management_api`

export const groupsAPISlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    createGroup: builder.mutation({
          query: (companyData: Partial<GroupData>) => ({
            url: `/${management_api}/staff/groups/`,
            method: 'POST',
            body: companyData
          }),
        }),
    updateGroup: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/staff/groups/${id}/`,
        method: 'PUT',
        body: data
      }),
    }),
    
    getGroups: builder.query<GroupData[], void>({
      query: () => `/${management_api}/staff/group/list/`,
    }),
    createRole: builder.mutation({
          query: (companyData: Partial<RoleData>) => ({
            url: `/${management_api}/staff/roles/`,
            method: 'POST',
            body: companyData
          }),
        }),
    updateRole: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/staff/roles/${id}/`,
        method: 'PUT',
        body: data
      }),
    }),
    
    getRoles: builder.query<RoleData[], void>({
      query: () => `/${management_api}/staff/role/list/`,
    }),
  
  }),

});

export const {
    useCreateGroupMutation,
  useUpdateGroupMutation,
  useGetGroupsQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useGetRolesQuery,
} = groupsAPISlice;
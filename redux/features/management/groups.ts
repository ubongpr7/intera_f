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
        url: `/${management_api}/staff/group-details/${id}/`,
        method: 'PUT',
        body: data
      }),
    }),
    getGroup: builder.query({
      query: (id) => `/${management_api}/staff/group-details/${id}/`,
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
    deactivateRole: builder.mutation({
      query: ({ id }) => ({
        url: `/${management_api}/roles/${id}/deactivate/`,
        method: 'POST',
        body: {},
      }),
    }),
    getRole: builder.query({
      query: (id) => `/${management_api}/roles/${id}/`,
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
  useGetGroupQuery,
  useGetRoleQuery,
  useDeactivateRoleMutation
} = groupsAPISlice;
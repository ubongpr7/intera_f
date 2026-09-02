import { apiSlice } from '../../services/apiSlice';
import type { GroupData, PaginatedManagementResponse, RoleData } from './managementTypes';
const management_api=`management`
const service='users'
export const groupsAPISlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    createGroup: builder.mutation({
          query: (companyData: Partial<GroupData>) => ({
            url: `/${management_api}/groups/`,
            method: 'POST',
            body: companyData,
            service:service
          }),
        }),
    updateGroup: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/groups/${id}/`,
        method: 'PUT',
        body: data,
        service:service

      }),
    }),
    getGroup: builder.query({
      query: (id) => ({
        url:`/${management_api}/groups/${id}/`,
        service:service
      }),

    }),
    getGroups: builder.query<GroupData[], void>({
      query: () =>({
        url: `/${management_api}/groups/`,
        service:service
      }),
    }),
    getGroupsPage: builder.query<PaginatedManagementResponse<GroupData>, { page: number; page_size: number; search?: string; ordering?: string }>({
      query: (params) => ({
        url: `/${management_api}/groups/`,
        params,
        service,
      }),
    }),
    createRole: builder.mutation({
          query: (companyData: Partial<RoleData>) => ({
            url: `/${management_api}/roles/`,
            method: 'POST',
            body: companyData,
            service:service

          }),
        }),
    updateRole: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/roles/${id}/`,
        method: 'PUT',
        body: data,
        service:service

      }),
    }),
    deactivateRole: builder.mutation({
      query: ({ id }) => ({
        url: `/${management_api}/roles/${id}/deactivate/`,
        method: 'POST',
        body: {},
        service:service
      }),
    }),
    getRole: builder.query({
      query: (id) =>({
        url: `/${management_api}/roles/${id}/`,
        service:service
      })
    }),
    getRoles: builder.query<RoleData[], void>({
      query: () =>({
        url: `${management_api}/roles/`,
        service:service
      
      }),
    }),
    getRolesPage: builder.query<PaginatedManagementResponse<RoleData>, { page: number; page_size: number; search?: string; ordering?: string }>({
      query: (params) => ({
        url: `/${management_api}/roles/`,
        params,
        service,
      }),
    }),
  
  }),

});

export const {
    useCreateGroupMutation,
  useUpdateGroupMutation,
  useGetGroupsQuery,
  useGetGroupsPageQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useGetRolesQuery,
  useGetRolesPageQuery,
  useGetGroupQuery,
  useGetRoleQuery,
  useDeactivateRoleMutation
} = groupsAPISlice;

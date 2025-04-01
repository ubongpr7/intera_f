import { apiSlice } from '../../services/apiSlice';

const management_api=`permission_api`

export const permisionsAPISlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    
    updateUserPermission: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/users/${id}/permissions/`,
        method: 'PUT',
        body: data
      }),
    }),
    
    getUserPermission: builder.query({
      query: (id) => `/${management_api}/users/${id}/permissions/`,
    }),
  
    updateGroupPermission: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/groups/${id}/permissions/`,
        method: 'PUT',
        body: data
      }),
    }),
    
    getGroupPermission: builder.query({
      query: (id) => `/${management_api}/groups/${id}/permissions/`,
    }),
    updateRolePermission: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/roles/${id}/permissions/`,
        method: 'PUT',
        body: data
      }),
    }),
    
    getRolePermission: builder.query({
      query: (id) => `/${management_api}/roles/${id}/permissions/`,
    }),
  
  }),

});

export const {
  useUpdateUserPermissionMutation,
  useGetUserPermissionQuery,
  useUpdateGroupPermissionMutation,
  useGetGroupPermissionQuery,
  useUpdateRolePermissionMutation,
  useGetRolePermissionQuery,
} = permisionsAPISlice;
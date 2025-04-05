import { RoleAssignment } from '../../../components/interfaces/management';
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
    assignUserRole: builder.mutation({
      query: (  data:Partial<RoleAssignment> ) => ({
        url: `/${management_api}/role-assignments/roles/`,
        method: 'POST',
        body: data
      }),
    }),
    getUserPermission: builder.query({
      query: (id) => `/${management_api}/users/${id}/permissions/`,
    }),
  
    getUserGroups: builder.query({
      query: (id) => `/${management_api}/user/${id}/groups/`,
    }),
  
    updateGroupPermission: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/groups/${id}/permissions/`,
        method: 'PUT',
        body: data
      }),
    }),
    updateUserGroup: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/user/${id}/groups/`,
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
  useAssignUserRoleMutation,
  useUpdateUserPermissionMutation,
  useGetUserPermissionQuery,
  useUpdateGroupPermissionMutation,
  useGetGroupPermissionQuery,
  useUpdateRolePermissionMutation,
  useGetRolePermissionQuery,
  useUpdateUserGroupMutation,
  useGetUserGroupsQuery,

} = permisionsAPISlice;
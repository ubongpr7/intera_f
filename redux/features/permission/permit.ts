import { RoleAssignment } from '../../../components/interfaces/management';
import { apiSlice } from '../../services/apiSlice';

const management_api=`permission_api`
const service= 'users'

export const permisionsAPISlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    
    updateUserPermission: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/users/${id}/permissions/`,
        method: 'PUT',
        body: data,
        service: service,
      }),
    }),
    assignUserRole: builder.mutation({
      query: (  data:Partial<RoleAssignment> ) => ({
        url: `/${management_api}/role-assignments/roles/`,
        method: 'POST',
        body: data,
        service: service,
      }),
    }),
    getUserPermission: builder.query({
      query: (id) =>({
        url: `/${management_api}/users/${id}/permissions/`,
        service: service,
      })
    }),
  
    getUserGroups: builder.query({
      query: (id) =>({
        url: `/${management_api}/user/${id}/groups/`,
        service: service,
      })
    }),
  
    updateGroupPermission: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/groups/${id}/permissions/`,
        method: 'PUT',
        body: data,
        service: service,
      }),
    }),
    updateUserGroup: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/user/${id}/groups/`,
        method: 'PUT',
        body: data,
        service: service,
      }),
    }),
    
    getGroupPermission: builder.query({
      query: (id) =>({
        url: `/${management_api}/groups/${id}/permissions/`,
        service: service,
      })
    }),
    updateRolePermission: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/roles/${id}/permissions/`,
        method: 'PUT',
        body: data,
        service: service,
      }),
    }),
    
    getRolePermission: builder.query({
      query: (id) =>({
        url: `/${management_api}/roles/${id}/permissions/`,
        service: service,
      })
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
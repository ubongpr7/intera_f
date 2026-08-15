import { apiSlice } from "../../services/apiSlice";
import type { RoleAssignment } from "../management/managementTypes";
import type {
  PermissionUpdatePayload,
  RoleAssignmentRecord,
  UserGroupsResponse,
  UserGroupUpdatePayload,
  UserPermissionsResponse,
} from "./permissionTypes";

const permissionApi = "permission_api";
const service = "users";

export const permisionsAPISlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listRoleAssignments: builder.query<RoleAssignmentRecord[], void>({
      query: () => ({
        url: `/${permissionApi}/role-assignments/`,
        service,
      }),
    }),

    getRoleAssignment: builder.query<RoleAssignmentRecord, string>({
      query: (id) => ({
        url: `/${permissionApi}/role-assignments/${id}/`,
        service,
      }),
    }),

    assignUserRole: builder.mutation<RoleAssignmentRecord, Partial<RoleAssignment>>({
      query: (data) => ({
        url: `/${permissionApi}/role-assignments/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    updateRoleAssignment: builder.mutation<RoleAssignmentRecord, { id: string; data: Partial<RoleAssignment> }>({
      query: ({ id, data }) => ({
        url: `/${permissionApi}/role-assignments/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),

    deleteRoleAssignment: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${permissionApi}/role-assignments/${id}/`,
        method: "DELETE",
        service,
      }),
    }),

    getUserPermission: builder.query<UserPermissionsResponse, string | number>({
      query: (id) => ({
        url: `/${permissionApi}/users/${id}/permissions/`,
        service,
      }),
    }),

    updateUserPermission: builder.mutation<{ status: string }, { id: string | number; data: PermissionUpdatePayload }>({
      query: ({ id, data }) => ({
        url: `/${permissionApi}/users/${id}/permissions/`,
        method: "PUT",
        body: data,
        service,
      }),
    }),

    getUserGroups: builder.query<UserGroupsResponse, string | number>({
      query: (id) => ({
        url: `/${permissionApi}/users/${id}/groups/`,
        service,
      }),
    }),

    updateUserGroup: builder.mutation<{ status: string }, { id: string | number; data: UserGroupUpdatePayload }>({
      query: ({ id, data }) => ({
        url: `/${permissionApi}/users/${id}/groups/`,
        method: "PUT",
        body: data,
        service,
      }),
    }),

    getGroupPermission: builder.query<UserPermissionsResponse, string>({
      query: (id) => ({
        url: `/${permissionApi}/groups/${id}/permissions/`,
        service,
      }),
    }),

    updateGroupPermission: builder.mutation<{ status: string }, { id: string; data: PermissionUpdatePayload }>({
      query: ({ id, data }) => ({
        url: `/${permissionApi}/groups/${id}/permissions/`,
        method: "PUT",
        body: data,
        service,
      }),
    }),

    getRolePermission: builder.query<UserPermissionsResponse, string>({
      query: (id) => ({
        url: `/${permissionApi}/roles/${id}/permissions/`,
        service,
      }),
    }),

    updateRolePermission: builder.mutation<{ status: string }, { id: string; data: PermissionUpdatePayload }>({
      query: ({ id, data }) => ({
        url: `/${permissionApi}/roles/${id}/permissions/`,
        method: "PUT",
        body: data,
        service,
      }),
    }),
  }),
});

export const {
  useListRoleAssignmentsQuery,
  useGetRoleAssignmentQuery,
  useAssignUserRoleMutation,
  useUpdateRoleAssignmentMutation,
  useDeleteRoleAssignmentMutation,
  useUpdateUserPermissionMutation,
  useGetUserPermissionQuery,
  useUpdateGroupPermissionMutation,
  useGetGroupPermissionQuery,
  useUpdateRolePermissionMutation,
  useGetRolePermissionQuery,
  useUpdateUserGroupMutation,
  useGetUserGroupsQuery,
} = permisionsAPISlice;

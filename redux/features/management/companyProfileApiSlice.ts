import { apiSlice } from "../../services/apiSlice"
import type {
  CompanyProfile,
  CompanyAddress,
  StaffRole,
  StaffGroup,
  StaffRoleAssignment,
  RecallPolicy,
  ReorderStrategy,
  InventoryPolicy,
  ActivityLog,
  CompanyFormData,
} from "@/types/company-profile"

const management_api = "management"

export const companyApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createCompanyProfile: builder.mutation({
      query: (companyData: CompanyFormData) => ({
        url: `/${management_api}/profiles/`,
        method: "POST",
        body: companyData,
      }),
    }),

    updateCompanyProfile: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/profiles/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),

    getCompanyProfile: builder.query<CompanyProfile, string>({
      query: (id) => ({
        url: `/${management_api}/profiles/${id}/`,
      }),
    }),

    getOwnerCompanyProfile: builder.query<CompanyProfile, void>({
      query: () => ({
        url: `/${management_api}/owner-company-profile/`,
      }),
    }),

    deleteCompanyProfile: builder.mutation({
      query: (id) => ({
        url: `/${management_api}/company-profiles/${id}/`,
        method: "DELETE",
      }),
    }),

    // Company Address endpoints
    createCompanyProfileAddress: builder.mutation({
      query: (address: CompanyAddress) => ({
        url: `/${management_api}/company-addresses/`,
        method: "POST",
        body: address,
      }),
    }),

    updateCompanyProfileAddress: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/company-addresses/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),

    getCompanyProfileAddress: builder.query<CompanyAddress, string>({
      query: (id) => ({
        url: `/${management_api}/company-addresses/${id}/`,
      }),
    }),

    // Staff Role endpoints
    createStaffRole: builder.mutation({
      query: (roleData: Partial<StaffRole>) => ({
        url: `/${management_api}/staff-roles/`,
        method: "POST",
        body: roleData,
      }),
    }),

    updateStaffRole: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/staff-roles/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),

    getStaffRoles: builder.query<StaffRole[], void>({
      query: () => ({
        url: `/${management_api}/staff-roles/`,
      }),
    }),

    getStaffRole: builder.query<StaffRole, string>({
      query: (id) => ({
        url: `/${management_api}/staff-roles/${id}/`,
      }),
    }),

    deleteStaffRole: builder.mutation({
      query: (id) => ({
        url: `/${management_api}/staff-roles/${id}/`,
        method: "DELETE",
      }),
    }),

    // Staff Group endpoints
    createStaffGroup: builder.mutation({
      query: (groupData: Partial<StaffGroup>) => ({
        url: `/${management_api}/staff-groups/`,
        method: "POST",
        body: groupData,
      }),
    }),

    updateStaffGroup: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/staff-groups/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),

    getStaffGroups: builder.query<StaffGroup[], void>({
      query: () => ({
        url: `/${management_api}/staff-groups/`,
      }),
    }),

    getStaffGroup: builder.query<StaffGroup, string>({
      query: (id) => ({
        url: `/${management_api}/staff-groups/${id}/`,
      }),
    }),

    deleteStaffGroup: builder.mutation({
      query: (id) => ({
        url: `/${management_api}/staff-groups/${id}/`,
        method: "DELETE",
      }),
    }),

    // Staff Role Assignment endpoints
    createStaffRoleAssignment: builder.mutation({
      query: (assignmentData: Partial<StaffRoleAssignment>) => ({
        url: `/${management_api}/staff-role-assignments/`,
        method: "POST",
        body: assignmentData,
      }),
    }),

    updateStaffRoleAssignment: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/staff-role-assignments/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),

    getStaffRoleAssignments: builder.query<StaffRoleAssignment[], void>({
      query: () => ({
        url: `/${management_api}/staff-role-assignments/`,
      }),
    }),

    getStaffRoleAssignment: builder.query<StaffRoleAssignment, string>({
      query: (id) => ({
        url: `/${management_api}/staff-role-assignments/${id}/`,
      }),
    }),

    deleteStaffRoleAssignment: builder.mutation({
      query: (id) => ({
        url: `/${management_api}/staff-role-assignments/${id}/`,
        method: "DELETE",
      }),
    }),

    // Recall Policy endpoints
    createRecallPolicy: builder.mutation({
      query: (policyData: Partial<RecallPolicy>) => ({
        url: `/${management_api}/recall-policies/`,
        method: "POST",
        body: policyData,
      }),
    }),

    updateRecallPolicy: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/recall-policies/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),

    getRecallPolicies: builder.query<RecallPolicy[], void>({
      query: () => ({
        url: `/${management_api}/recall-policies/`,
      }),
    }),

    getRecallPolicy: builder.query<RecallPolicy, string>({
      query: (id) => ({
        url: `/${management_api}/recall-policies/${id}/`,
      }),
    }),

    deleteRecallPolicy: builder.mutation({
      query: (id) => ({
        url: `/${management_api}/recall-policies/${id}/`,
        method: "DELETE",
      }),
    }),

    // Reorder Strategy endpoints
    createReorderStrategy: builder.mutation({
      query: (strategyData: Partial<ReorderStrategy>) => ({
        url: `/${management_api}/reorder-strategies/`,
        method: "POST",
        body: strategyData,
      }),
    }),

    updateReorderStrategy: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/reorder-strategies/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),

    getReorderStrategies: builder.query<ReorderStrategy[], void>({
      query: () => ({
        url: `/${management_api}/reorder-strategies/`,
      }),
    }),

    getReorderStrategy: builder.query<ReorderStrategy, string>({
      query: (id) => ({
        url: `/${management_api}/reorder-strategies/${id}/`,
      }),
    }),

    deleteReorderStrategy: builder.mutation({
      query: (id) => ({
        url: `/${management_api}/reorder-strategies/${id}/`,
        method: "DELETE",
      }),
    }),

    // Inventory Policy endpoints
    createInventoryPolicy: builder.mutation({
      query: (policyData: Partial<InventoryPolicy>) => ({
        url: `/${management_api}/inventory-policies/`,
        method: "POST",
        body: policyData,
      }),
    }),

    updateInventoryPolicy: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/inventory-policies/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),

    getInventoryPolicies: builder.query<InventoryPolicy[], void>({
      query: () => ({
        url: `/${management_api}/inventory-policies/`,
      }),
    }),

    getInventoryPolicy: builder.query<InventoryPolicy, string>({
      query: (id) => ({
        url: `/${management_api}/inventory-policies/${id}/`,
      }),
    }),

    deleteInventoryPolicy: builder.mutation({
      query: (id) => ({
        url: `/${management_api}/inventory-policies/${id}/`,
        method: "DELETE",
      }),
    }),

    // Activity Log endpoints
    getActivityLogs: builder.query<
      ActivityLog[],
      { page?: number; action?: string; model_name?: string; search?: string,page_size?: number }
    >({
      query: (params = {}) => ({
        url: `/${management_api}/activity-logs/`,
        params,
      }),
    }),

    getActivityLog: builder.query<ActivityLog, string>({
      query: (id) => ({
        url: `/${management_api}/activity-logs/${id}/`,
      }),
    }),

    // Bulk operations
    bulkDeleteStaffRoles: builder.mutation({
      query: (ids: string[]) => ({
        url: `/${management_api}/staff-roles/bulk-delete/`,
        method: "POST",
        body: { ids },
      }),
    }),

    bulkDeleteStaffGroups: builder.mutation({
      query: (ids: string[]) => ({
        url: `/${management_api}/staff-groups/bulk-delete/`,
        method: "POST",
        body: { ids },
      }),
    }),

    bulkDeleteRecallPolicies: builder.mutation({
      query: (ids: string[]) => ({
        url: `/${management_api}/recall-policies/bulk-delete/`,
        method: "POST",
        body: { ids },
      }),
    }),

    bulkDeleteReorderStrategies: builder.mutation({
      query: (ids: string[]) => ({
        url: `/${management_api}/reorder-strategies/bulk-delete/`,
        method: "POST",
        body: { ids },
      }),
    }),

    bulkDeleteInventoryPolicies: builder.mutation({
      query: (ids: string[]) => ({
        url: `/${management_api}/inventory-policies/bulk-delete/`,
        method: "POST",
        body: { ids },
      }),
    }),

    // Export endpoints
    exportActivityLogs: builder.mutation({
      query: (params = {}) => ({
        url: `/${management_api}/activity-logs/export/`,
        method: "POST",
        body: params,
        responseHandler: (response) => response.blob(),
      }),
    }),

    exportCompanyData: builder.mutation({
      query: (format: "csv" | "pdf" = "csv") => ({
        url: `/${management_api}/company-profiles/export/`,
        method: "POST",
        body: { format },
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
})

export const {
  // Company Profile hooks
  useCreateCompanyProfileMutation,
  useUpdateCompanyProfileMutation,
  useGetCompanyProfileQuery,
  useGetOwnerCompanyProfileQuery,
  useDeleteCompanyProfileMutation,

  // Company Address hooks
  useCreateCompanyProfileAddressMutation,
  useUpdateCompanyProfileAddressMutation,
  useGetCompanyProfileAddressQuery,

  // Staff Role hooks
  useCreateStaffRoleMutation,
  useUpdateStaffRoleMutation,
  useGetStaffRolesQuery,
  useGetStaffRoleQuery,
  useDeleteStaffRoleMutation,

  // Staff Group hooks
  useCreateStaffGroupMutation,
  useUpdateStaffGroupMutation,
  useGetStaffGroupsQuery,
  useGetStaffGroupQuery,
  useDeleteStaffGroupMutation,

  // Staff Role Assignment hooks
  useCreateStaffRoleAssignmentMutation,
  useUpdateStaffRoleAssignmentMutation,
  useGetStaffRoleAssignmentsQuery,
  useGetStaffRoleAssignmentQuery,
  useDeleteStaffRoleAssignmentMutation,

  // Recall Policy hooks
  useCreateRecallPolicyMutation,
  useUpdateRecallPolicyMutation,
  useGetRecallPoliciesQuery,
  useGetRecallPolicyQuery,
  useDeleteRecallPolicyMutation,

  // Reorder Strategy hooks
  useCreateReorderStrategyMutation,
  useUpdateReorderStrategyMutation,
  useGetReorderStrategiesQuery,
  useGetReorderStrategyQuery,
  useDeleteReorderStrategyMutation,

  // Inventory Policy hooks
  useCreateInventoryPolicyMutation,
  useUpdateInventoryPolicyMutation,
  useGetInventoryPoliciesQuery,
  useGetInventoryPolicyQuery,
  useDeleteInventoryPolicyMutation,

  // Activity Log hooks
  useGetActivityLogsQuery,
  useGetActivityLogQuery,

  // Bulk operation hooks
  useBulkDeleteStaffRolesMutation,
  useBulkDeleteStaffGroupsMutation,
  useBulkDeleteRecallPoliciesMutation,
  useBulkDeleteReorderStrategiesMutation,
  useBulkDeleteInventoryPoliciesMutation,

  // Export hooks
  useExportActivityLogsMutation,
  useExportCompanyDataMutation,
} = companyApiSlice

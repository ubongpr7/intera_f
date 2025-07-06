import { Address } from "@/components/interfaces/common"
import { apiSlice } from "../../services/apiSlice"
import type {
  CompanyProfile,
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
const service= 'users'
export const companyApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createCompanyProfile: builder.mutation({
      query: (companyData: CompanyFormData) => ({
        url: `/${management_api}/profiles/`,
        method: "POST",
        body: companyData,
        service: service,

      }),
    }),

    updateCompanyProfile: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/profiles/${id}/`,
        method: "PATCH",
        body: data,
        service: service,

      }),
    }),

    getCompanyProfile: builder.query<CompanyProfile, string>({
      query: (id) => ({
        url: `/${management_api}/profiles/${id}/`,
        service: service,

      }),
    }),

    getOwnerCompanyProfile: builder.query<CompanyProfile, void>({
      query: () => ({
        url: `/${management_api}/owner-company-profile/`,
        service: service,

      }),
    }),

    deleteCompanyProfile: builder.mutation({
      query: (id) => ({
        url: `/${management_api}/company-profiles/${id}/`,
        method: "DELETE",
        service: service,
      }),
    }),

    // Company Address endpoints
    createCompanyProfileAddress: builder.mutation({
      query: (address) => ({
        url: `/${management_api}/addresses/`,
        method: "POST",
        body: address,
        service: service,
      }),
    }),

    updateCompanyProfileAddress: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/addresses/${id}/`,
        method: "PATCH",
        body: data,
        service: service,
      }),
    }),

    getCompanyProfileAddress: builder.query<Address, string>({
      query: (id) => ({
        url: `/${management_api}/company-addresses/${id}/`,
        service: service,
      }),
    }),

    // Staff Role endpoints
    createStaffRole: builder.mutation({
      query: (roleData: Partial<StaffRole>) => ({
        url: `/${management_api}/roles/`,
        method: "POST",
        body: roleData,
        service: service,
      }),
    }),

    updateStaffRole: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/roles/${id}/`,
        method: "PATCH",
        body: data,
        service: service,
      }),
    }),

    getStaffRoles: builder.query<StaffRole[], void>({
      query: () => ({
        url: `/${management_api}/roles/`,
        service: service,
      }),
    }),

    getStaffRole: builder.query<StaffRole, string>({
      query: (id) => ({
        url: `/${management_api}/oles/${id}/`,
        service: service,

      }),
    }),

    deleteStaffRole: builder.mutation({
      query: (id) => ({
        url: `/${management_api}/roles/${id}/`,
        method: "DELETE",
        service: service,
      }),
    }),

    // Staff Group endpoints
    createStaffGroup: builder.mutation({
      query: (groupData: Partial<StaffGroup>) => ({
        url: `/${management_api}/groups/`,
        method: "POST",
        body: groupData,
        service: service,
      }),
    }),

    updateStaffGroup: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/groups/${id}/`,
        method: "PATCH",
        body: data,
        service: service,

      }),
    }),

    getStaffGroups: builder.query<StaffGroup[], void>({
      query: () => ({
        url: `/${management_api}/groups/`,
        service: service,
      }),
    }),

    getStaffGroup: builder.query<StaffGroup, string>({
      query: (id) => ({
        url: `/${management_api}/groups/${id}/`,
        service: service,

      }),
    }),

    deleteStaffGroup: builder.mutation({
      query: (id) => ({
        url: `/${management_api}/groups/${id}/`,
        method: "DELETE",
        service: service,
      }),
    }),

    // Staff Role Assignment endpoints
    createStaffRoleAssignment: builder.mutation({
      query: (assignmentData: Partial<StaffRoleAssignment>) => ({
        url: `/${management_api}/staff-role-assignments/`,
        method: "POST",
        body: assignmentData,
        service: service,
      }),
    }),

    updateStaffRoleAssignment: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/staff-role-assignments/${id}/`,
        method: "PATCH",
        body: data,
        service: service,
      }),
    }),

    getStaffRoleAssignments: builder.query<StaffRoleAssignment[], void>({
      query: () => ({
        url: `/${management_api}/staff-role-assignments/`,
        service: service,
      }),
    }),

    getStaffRoleAssignment: builder.query<StaffRoleAssignment, string>({
      query: (id) => ({
        url: `/${management_api}/staff-role-assignments/${id}/`,
        service: service,
      }),
    }),

    deleteStaffRoleAssignment: builder.mutation({
      query: (id) => ({
        url: `/${management_api}/staff-role-assignments/${id}/`,
        method: "DELETE",
        service: service,
      }),
    }),

    // Recall Policy endpoints
    createRecallPolicy: builder.mutation({
      query: (policyData: Partial<RecallPolicy>) => ({
        url: `/${management_api}/recall-policies/`,
        method: "POST",
        body: policyData,
        service:service,
      }),
    }),

    updateRecallPolicy: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/recall-policies/${id}/`,
        method: "PATCH",
        body: data,
        service: service,
      }),
    }),

    getRecallPolicies: builder.query<RecallPolicy[], void>({
      query: () => ({
        url: `/${management_api}/recall-policies/`,
        service: service,
      }),
    }),

    getRecallPolicy: builder.query<RecallPolicy, string>({
      query: (id) => ({
        url: `/${management_api}/recall-policies/${id}/`,
        service: service,
      }),
    }),

    deleteRecallPolicy: builder.mutation({
      query: (id) => ({
        url: `/${management_api}/recall-policies/${id}/`,
        method: "DELETE",
        service: service,
      }),
    }),

    // Reorder Strategy endpoints
    createReorderStrategy: builder.mutation({
      query: (strategyData: Partial<ReorderStrategy>) => ({
        url: `/${management_api}/reorder-strategies/`,
        method: "POST",
        body: strategyData,
        service: service,
      }),
    }),

    updateReorderStrategy: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/reorder-strategies/${id}/`,
        method: "PATCH",
        body: data,
        service: service,
      }),
    }),

    getReorderStrategies: builder.query<ReorderStrategy[], void>({
      query: () => ({
        url: `/${management_api}/reorder-strategies/`,
        service: service,
      }),
    }),

    getReorderStrategy: builder.query<ReorderStrategy, string>({
      query: (id) => ({
        url: `/${management_api}/reorder-strategies/${id}/`,
        service: service,
      }),
    }),

    deleteReorderStrategy: builder.mutation({
      query: (id) => ({
        url: `/${management_api}/reorder-strategies/${id}/`,
        method: "DELETE",
        service: service,
      }),
    }),

    // Inventory Policy endpoints
    createInventoryPolicy: builder.mutation({
      query: (policyData: Partial<InventoryPolicy>) => ({
        url: `/${management_api}/inventory-policies/`,
        method: "POST",
        body: policyData,
        service: service,
      }),
    }),

    updateInventoryPolicy: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/inventory-policies/${id}/`,
        method: "PATCH",
        body: data,
        service: service,
      }),
    }),

    getInventoryPolicies: builder.query<InventoryPolicy[], void>({
      query: () => ({
        url: `/${management_api}/inventory-policies/`,
        service: service,
      }),
    }),

    getInventoryPolicy: builder.query<InventoryPolicy, string>({
      query: (id) => ({
        url: `/${management_api}/inventory-policies/${id}/`,
        service: service,
      }),
    }),

    deleteInventoryPolicy: builder.mutation({
      query: (id) => ({
        url: `/${management_api}/inventory-policies/${id}/`,
        method: "DELETE",
        service: service,
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
        service: service,

      }),
    }),

    getActivityLog: builder.query<ActivityLog, string>({
      query: (id) => ({
        url: `/${management_api}/activity-logs/${id}/`,
        service: service,

      }),
    }),

    // Bulk operations
    bulkDeleteStaffRoles: builder.mutation({
      query: (ids: string[]) => ({
        url: `/${management_api}/staff-roles/bulk-delete/`,
        method: "POST",
        body: { ids },
        service: service,
      }),
    }),

    bulkDeleteStaffGroups: builder.mutation({
      query: (ids: string[]) => ({
        url: `/${management_api}/staff-groups/bulk-delete/`,
        method: "POST",
        body: { ids },
        service: service,
      }),
    }),

    bulkDeleteRecallPolicies: builder.mutation({
      query: (ids: string[]) => ({
        url: `/${management_api}/recall-policies/bulk-delete/`,
        method: "POST",
        body: { ids },
        service: service,
      }),
    }),

    bulkDeleteReorderStrategies: builder.mutation({
      query: (ids: string[]) => ({
        url: `/${management_api}/reorder-strategies/bulk-delete/`,
        method: "POST",
        body: { ids },
        service: service,
      }),
    }),

    bulkDeleteInventoryPolicies: builder.mutation({
      query: (ids: string[]) => ({
        url: `/${management_api}/inventory-policies/bulk-delete/`,
        method: "POST",
        body: { ids },
        service: service,
      }),
    }),

    // Export endpoints
    exportActivityLogs: builder.mutation({
      query: (params = {}) => ({
        url: `/${management_api}/activity-logs/export/`,
        method: "POST",
        body: params,
        responseHandler: (response) => response.blob(),
        service: service,

      }),
    }),

    exportCompanyData: builder.mutation({
      query: (format: "csv" | "pdf" = "csv") => ({
        url: `/${management_api}/company-profiles/export/`,
        method: "POST",
        body: { format },
        responseHandler: (response) => response.blob(),
        service: service,

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

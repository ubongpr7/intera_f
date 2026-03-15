import type { Address } from "../common/commonTypes";
import { apiSlice } from "../../services/apiSlice";
import type {
  AddStaffPayload,
  CompanyAgentSetupResponse,
  CompanyFormData,
  CompanyInvitation,
  CompanyInvitationAcceptPayload,
  CompanyInvitationAcceptResponse,
  CompanyProfile,
  CompanyProfileAnalytics,
  CompanyProfileListItem,
  CompanyProfilePoliciesResponse,
  InventoryPolicy,
  RecallPolicy,
  RemoveStaffPayload,
  ReorderStrategy,
  SaveCompanyAgentSetupPayload,
  StaffAssignment,
  StaffGroup,
  StaffGroupListItem,
  StaffRole,
  StaffRoleAssignment,
  StaffRoleListItem,
} from "./companyProfileTypes";

const managementApi = "management";
const service = "users";

export const companyApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listCompanyProfiles: builder.query<CompanyProfileListItem[], void>({
      query: () => ({
        url: `/${managementApi}/profiles/`,
        service,
      }),
    }),

    createCompanyProfile: builder.mutation<CompanyProfile, CompanyFormData>({
      query: (companyData) => ({
        url: `/${managementApi}/profiles/`,
        method: "POST",
        body: companyData,
        service,
      }),
    }),

    updateCompanyProfile: builder.mutation<CompanyProfile, { id: string; data: Partial<CompanyFormData> }>({
      query: ({ id, data }) => ({
        url: `/${managementApi}/profiles/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),

    getCompanyProfile: builder.query<CompanyProfile, string>({
      query: (id) => ({
        url: `/${managementApi}/profiles/${id}/`,
        service,
      }),
    }),

    deleteCompanyProfile: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${managementApi}/profiles/${id}/`,
        method: "DELETE",
        service,
      }),
    }),

    getCompanyProfileStaffAssignments: builder.query<StaffAssignment[], string>({
      query: (profileId) => ({
        url: `/${managementApi}/profiles/${profileId}/staff_active_assignments/`,
        service,
      }),
    }),

    addStaffToCompanyProfile: builder.mutation<StaffAssignment, { profileId: string; data: AddStaffPayload }>({
      query: ({ profileId, data }) => ({
        url: `/${managementApi}/profiles/${profileId}/add_staff/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    removeStaffFromCompanyProfile: builder.mutation<
      { message: string; deactivated_assignments?: number; deactivated_membership?: boolean },
      { profileId: string; data: RemoveStaffPayload }
    >({
      query: ({ profileId, data }) => ({
        url: `/${managementApi}/profiles/${profileId}/remove_staff/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    getCompanyProfileRoles: builder.query<StaffRole[], string>({
      query: (profileId) => ({
        url: `/${managementApi}/profiles/${profileId}/roles/`,
        service,
      }),
    }),

    getCompanyProfileGroups: builder.query<StaffGroup[], string>({
      query: (profileId) => ({
        url: `/${managementApi}/profiles/${profileId}/groups/`,
        service,
      }),
    }),

    getCompanyProfileAddresses: builder.query<Address[], string>({
      query: (profileId) => ({
        url: `/${managementApi}/profiles/${profileId}/addresses/`,
        service,
      }),
    }),

    addAddressToCompanyProfile: builder.mutation<Address, { profileId: string; data: Partial<Address> }>({
      query: ({ profileId, data }) => ({
        url: `/${managementApi}/profiles/${profileId}/add_address/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    getCompanyProfilePolicies: builder.query<CompanyProfilePoliciesResponse, string>({
      query: (profileId) => ({
        url: `/${managementApi}/profiles/${profileId}/policies/`,
        service,
      }),
    }),

    getCompanyProfileAnalytics: builder.query<CompanyProfileAnalytics, string>({
      query: (profileId) => ({
        url: `/${managementApi}/profiles/${profileId}/analytics/`,
        service,
      }),
    }),

    getCompanyAgentSetup: builder.query<CompanyAgentSetupResponse, void>({
      query: () => ({
        url: `/${managementApi}/agent-setup/`,
        method: "GET",
        service,
      }),
    }),

    saveCompanyAgentSetup: builder.mutation<CompanyAgentSetupResponse, SaveCompanyAgentSetupPayload>({
      query: (data) => ({
        url: `/${managementApi}/agent-setup/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    patchCompanyAgentSetup: builder.mutation<CompanyAgentSetupResponse, Partial<SaveCompanyAgentSetupPayload>>({
      query: (data) => ({
        url: `/${managementApi}/agent-setup/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),

    createCompanyProfileAddress: builder.mutation<Address, Partial<Address>>({
      query: (address) => ({
        url: `/${managementApi}/addresses/`,
        method: "POST",
        body: address,
        service,
      }),
    }),

    updateCompanyProfileAddress: builder.mutation<Address, { id: string; data: Partial<Address> }>({
      query: ({ id, data }) => ({
        url: `/${managementApi}/addresses/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),

    getCompanyProfileAddress: builder.query<Address, string>({
      query: (id) => ({
        url: `/${managementApi}/addresses/${id}/`,
        service,
      }),
    }),

    deleteCompanyProfileAddress: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${managementApi}/addresses/${id}/`,
        method: "DELETE",
        service,
      }),
    }),

    createStaffRole: builder.mutation<StaffRole, Partial<StaffRole>>({
      query: (roleData) => ({
        url: `/${managementApi}/roles/`,
        method: "POST",
        body: roleData,
        service,
      }),
    }),

    updateStaffRole: builder.mutation<StaffRole, { id: string; data: Partial<StaffRole> }>({
      query: ({ id, data }) => ({
        url: `/${managementApi}/roles/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),

    getStaffRoles: builder.query<StaffRoleListItem[], void>({
      query: () => ({
        url: `/${managementApi}/roles/`,
        service,
      }),
    }),

    getStaffRole: builder.query<StaffRole, string>({
      query: (id) => ({
        url: `/${managementApi}/roles/${id}/`,
        service,
      }),
    }),

    deleteStaffRole: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${managementApi}/roles/${id}/`,
        method: "DELETE",
        service,
      }),
    }),

    getStaffRoleAssignmentsForRole: builder.query<StaffAssignment[], string>({
      query: (id) => ({
        url: `/${managementApi}/roles/${id}/assignments/`,
        service,
      }),
    }),

    assignUserToStaffRole: builder.mutation<StaffAssignment, { id: string; data: { user_id: string; start_date?: string; end_date?: string | null } }>({
      query: ({ id, data }) => ({
        url: `/${managementApi}/roles/${id}/assign_user/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    deactivateStaffRole: builder.mutation<{ detail: string }, string>({
      query: (id) => ({
        url: `/${managementApi}/roles/${id}/deactivate/`,
        method: "POST",
        service,
      }),
    }),

    createStaffGroup: builder.mutation<StaffGroup, Partial<StaffGroup>>({
      query: (groupData) => ({
        url: `/${managementApi}/groups/`,
        method: "POST",
        body: groupData,
        service,
      }),
    }),

    updateStaffGroup: builder.mutation<StaffGroup, { id: string; data: Partial<StaffGroup> }>({
      query: ({ id, data }) => ({
        url: `/${managementApi}/groups/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),

    getStaffGroups: builder.query<StaffGroupListItem[], void>({
      query: () => ({
        url: `/${managementApi}/groups/`,
        service,
      }),
    }),

    getStaffGroup: builder.query<StaffGroup, string>({
      query: (id) => ({
        url: `/${managementApi}/groups/${id}/`,
        service,
      }),
    }),

    deleteStaffGroup: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${managementApi}/groups/${id}/`,
        method: "DELETE",
        service,
      }),
    }),

    getStaffGroupUsers: builder.query<Array<{ id: number; email: string; first_name: string; last_name: string; get_full_name?: string; role?: string | null }>, string>({
      query: (id) => ({
        url: `/${managementApi}/groups/${id}/users/`,
        service,
      }),
    }),

    addUserToStaffGroup: builder.mutation<{ message: string }, { id: string; user_id: string | number }>({
      query: ({ id, user_id }) => ({
        url: `/${managementApi}/groups/${id}/add_user/`,
        method: "POST",
        body: { user_id },
        service,
      }),
    }),

    removeUserFromStaffGroup: builder.mutation<{ message: string }, { id: string; user_id: string | number }>({
      query: ({ id, user_id }) => ({
        url: `/${managementApi}/groups/${id}/remove_user/`,
        method: "POST",
        body: { user_id },
        service,
      }),
    }),

    createStaffRoleAssignment: builder.mutation<StaffRoleAssignment, Partial<StaffRoleAssignment>>({
      query: (assignmentData) => ({
        url: `/${managementApi}/assignments/`,
        method: "POST",
        body: assignmentData,
        service,
      }),
    }),

    updateStaffRoleAssignment: builder.mutation<StaffRoleAssignment, { id: string; data: Partial<StaffRoleAssignment> }>({
      query: ({ id, data }) => ({
        url: `/${managementApi}/assignments/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),

    getStaffRoleAssignments: builder.query<StaffRoleAssignment[], void>({
      query: () => ({
        url: `/${managementApi}/assignments/`,
        service,
      }),
    }),

    getStaffRoleAssignment: builder.query<StaffRoleAssignment, string>({
      query: (id) => ({
        url: `/${managementApi}/assignments/${id}/`,
        service,
      }),
    }),

    deleteStaffRoleAssignment: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${managementApi}/assignments/${id}/`,
        method: "DELETE",
        service,
      }),
    }),

    createRecallPolicy: builder.mutation<RecallPolicy, Partial<RecallPolicy>>({
      query: (policyData) => ({
        url: `/${managementApi}/recall-policies/`,
        method: "POST",
        body: policyData,
        service,
      }),
    }),

    updateRecallPolicy: builder.mutation<RecallPolicy, { id: string; data: Partial<RecallPolicy> }>({
      query: ({ id, data }) => ({
        url: `/${managementApi}/recall-policies/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),

    getRecallPolicies: builder.query<RecallPolicy[], void>({
      query: () => ({
        url: `/${managementApi}/recall-policies/`,
        service,
      }),
    }),

    getRecallPolicy: builder.query<RecallPolicy, string>({
      query: (id) => ({
        url: `/${managementApi}/recall-policies/${id}/`,
        service,
      }),
    }),

    deleteRecallPolicy: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${managementApi}/recall-policies/${id}/`,
        method: "DELETE",
        service,
      }),
    }),

    createReorderStrategy: builder.mutation<ReorderStrategy, Partial<ReorderStrategy>>({
      query: (strategyData) => ({
        url: `/${managementApi}/reorder-strategies/`,
        method: "POST",
        body: strategyData,
        service,
      }),
    }),

    updateReorderStrategy: builder.mutation<ReorderStrategy, { id: string; data: Partial<ReorderStrategy> }>({
      query: ({ id, data }) => ({
        url: `/${managementApi}/reorder-strategies/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),

    getReorderStrategies: builder.query<ReorderStrategy[], void>({
      query: () => ({
        url: `/${managementApi}/reorder-strategies/`,
        service,
      }),
    }),

    getReorderStrategy: builder.query<ReorderStrategy, string>({
      query: (id) => ({
        url: `/${managementApi}/reorder-strategies/${id}/`,
        service,
      }),
    }),

    deleteReorderStrategy: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${managementApi}/reorder-strategies/${id}/`,
        method: "DELETE",
        service,
      }),
    }),

    getReorderStrategiesByCategory: builder.query<ReorderStrategy[], string>({
      query: (categoryId) => ({
        url: `/${managementApi}/reorder-strategies/by_category/`,
        params: { category_id: categoryId },
        service,
      }),
    }),

    createInventoryPolicy: builder.mutation<InventoryPolicy, Partial<InventoryPolicy>>({
      query: (policyData) => ({
        url: `/${managementApi}/inventory-policies/`,
        method: "POST",
        body: policyData,
        service,
      }),
    }),

    updateInventoryPolicy: builder.mutation<InventoryPolicy, { id: string; data: Partial<InventoryPolicy> }>({
      query: ({ id, data }) => ({
        url: `/${managementApi}/inventory-policies/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),

    getInventoryPolicies: builder.query<InventoryPolicy[], { active_only?: boolean } | void>({
      query: (params) => ({
        url: `/${managementApi}/inventory-policies/`,
        params,
        service,
      }),
    }),

    getInventoryPolicy: builder.query<InventoryPolicy, string>({
      query: (id) => ({
        url: `/${managementApi}/inventory-policies/${id}/`,
        service,
      }),
    }),

    deleteInventoryPolicy: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${managementApi}/inventory-policies/${id}/`,
        method: "DELETE",
        service,
      }),
    }),

    listInvitations: builder.query<CompanyInvitation[], void>({
      query: () => ({
        url: `/${managementApi}/invitations/`,
        service,
      }),
    }),

    getInvitation: builder.query<CompanyInvitation, string>({
      query: (id) => ({
        url: `/${managementApi}/invitations/${id}/`,
        service,
      }),
    }),

    inviteCompanyUser: builder.mutation<CompanyInvitation, { email: string; role?: string; invitation_message?: string }>({
      query: (body) => ({
        url: `/${managementApi}/invitations/invite/`,
        method: "POST",
        body,
        service,
      }),
    }),

    inviteCompanyUsersBulk: builder.mutation<unknown, FormData>({
      query: (body) => ({
        url: `/${managementApi}/invitations/invite-bulk/`,
        method: "POST",
        body,
        meta: { isFileUpload: true },
        service,
      }),
    }),

    getPendingCompanyInvitations: builder.query<CompanyInvitation[], void>({
      query: () => ({
        url: `/${managementApi}/invitations/pending/`,
        service,
      }),
    }),

    getMyCompanyInvitations: builder.query<CompanyInvitation[], void>({
      query: () => ({
        url: `/${managementApi}/invitations/mine/`,
        service,
      }),
    }),

    resendCompanyInvitation: builder.mutation<CompanyInvitation, string>({
      query: (id) => ({
        url: `/${managementApi}/invitations/${id}/resend/`,
        method: "POST",
        service,
      }),
    }),

    revokeCompanyInvitation: builder.mutation<CompanyInvitation, string>({
      query: (id) => ({
        url: `/${managementApi}/invitations/${id}/revoke/`,
        method: "POST",
        service,
      }),
    }),

    acceptCompanyInvitation: builder.mutation<CompanyInvitationAcceptResponse, CompanyInvitationAcceptPayload>({
      query: (body) => ({
        url: `/${managementApi}/invitations/accept/`,
        method: "POST",
        body,
        service,
      }),
    }),

    declineCompanyInvitation: builder.mutation<{ detail: string }, CompanyInvitationAcceptPayload>({
      query: (body) => ({
        url: `/${managementApi}/invitations/decline/`,
        method: "POST",
        body,
        service,
      }),
    }),
  }),
});

export const {
  useListCompanyProfilesQuery,
  useCreateCompanyProfileMutation,
  useUpdateCompanyProfileMutation,
  useGetCompanyProfileQuery,
  useDeleteCompanyProfileMutation,
  useGetCompanyProfileStaffAssignmentsQuery,
  useAddStaffToCompanyProfileMutation,
  useRemoveStaffFromCompanyProfileMutation,
  useGetCompanyProfileRolesQuery,
  useGetCompanyProfileGroupsQuery,
  useGetCompanyProfileAddressesQuery,
  useAddAddressToCompanyProfileMutation,
  useGetCompanyProfilePoliciesQuery,
  useGetCompanyProfileAnalyticsQuery,
  useGetCompanyAgentSetupQuery,
  useSaveCompanyAgentSetupMutation,
  usePatchCompanyAgentSetupMutation,
  useCreateCompanyProfileAddressMutation,
  useUpdateCompanyProfileAddressMutation,
  useGetCompanyProfileAddressQuery,
  useDeleteCompanyProfileAddressMutation,
  useCreateStaffRoleMutation,
  useUpdateStaffRoleMutation,
  useGetStaffRolesQuery,
  useGetStaffRoleQuery,
  useDeleteStaffRoleMutation,
  useGetStaffRoleAssignmentsForRoleQuery,
  useAssignUserToStaffRoleMutation,
  useDeactivateStaffRoleMutation,
  useCreateStaffGroupMutation,
  useUpdateStaffGroupMutation,
  useGetStaffGroupsQuery,
  useGetStaffGroupQuery,
  useDeleteStaffGroupMutation,
  useGetStaffGroupUsersQuery,
  useAddUserToStaffGroupMutation,
  useRemoveUserFromStaffGroupMutation,
  useCreateStaffRoleAssignmentMutation,
  useUpdateStaffRoleAssignmentMutation,
  useGetStaffRoleAssignmentsQuery,
  useGetStaffRoleAssignmentQuery,
  useDeleteStaffRoleAssignmentMutation,
  useCreateRecallPolicyMutation,
  useUpdateRecallPolicyMutation,
  useGetRecallPoliciesQuery,
  useGetRecallPolicyQuery,
  useDeleteRecallPolicyMutation,
  useCreateReorderStrategyMutation,
  useUpdateReorderStrategyMutation,
  useGetReorderStrategiesQuery,
  useGetReorderStrategyQuery,
  useDeleteReorderStrategyMutation,
  useGetReorderStrategiesByCategoryQuery,
  useCreateInventoryPolicyMutation,
  useUpdateInventoryPolicyMutation,
  useGetInventoryPoliciesQuery,
  useGetInventoryPolicyQuery,
  useDeleteInventoryPolicyMutation,
  useListInvitationsQuery,
  useGetInvitationQuery,
  useInviteCompanyUserMutation,
  useInviteCompanyUsersBulkMutation,
  useGetPendingCompanyInvitationsQuery,
  useGetMyCompanyInvitationsQuery,
  useResendCompanyInvitationMutation,
  useRevokeCompanyInvitationMutation,
  useAcceptCompanyInvitationMutation,
  useDeclineCompanyInvitationMutation,
} = companyApiSlice;

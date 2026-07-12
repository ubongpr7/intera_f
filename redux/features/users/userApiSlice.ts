import { getCookie } from "cookies-next";

import { readCookieValue } from "@/lib/authCookies";

import { apiSlice, persistUserIdentity } from "../../services/apiSlice";
import type {
  CompanyInvitation,
  CompanyInvitationAcceptResponse,
  CompanyInvitationAcceptPayload,
  InviteCompanyBulkPayload,
  InviteCompanyPayload,
} from "../management/companyProfileTypes";
import type {
  BulkInviteResponse,
  MfaEmailRequestResponse,
  MfaResetConfirmResponse,
  MfaResetRequestResponse,
  MfaSetupResponse,
  MfaTogglePayload,
  MfaToggleResponse,
  MfaVerifyResponse,
  StaffAssignment,
  UserData,
  UserQuotaMetadata,
  UserSummary,
  VerificationRequestPayload,
  VerificationResponse,
} from "./userTypes";

const accountsApi = "accounts";
const managementApi = "management";
const service = "users";

const getActiveProfileId = () =>
  readCookieValue("profileId", getCookie) ?? readCookieValue("profile", getCookie);

export const userApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listUsers: builder.query<UserSummary[], void>({
      query: () => ({
        url: `/${accountsApi}/users/`,
        service,
      }),
    }),

    getUser: builder.query<UserSummary, string | number>({
      query: (id) => ({
        url: `/${accountsApi}/users/${id}/`,
        service,
      }),
    }),

    updateUser: builder.mutation<UserSummary, { id: string | number; data: Partial<UserSummary> }>({
      query: ({ id, data }) => ({
        url: `/${accountsApi}/users/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),

    deleteUser: builder.mutation<void, string | number>({
      query: (id) => ({
        url: `/${accountsApi}/users/${id}/`,
        method: "DELETE",
        service,
      }),
    }),

    getLoggedInUser: builder.query<UserData, void>({
      query: () => ({
        url: `/${accountsApi}/users/me/`,
        service,
      }),
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          persistUserIdentity(data);
        } catch {
          // Ignore cookie persistence failures.
        }
      },
    }),

    updateLoggedInUser: builder.mutation<UserData, FormData | Partial<UserData>>({
      query: (data) => ({
        url: `/${accountsApi}/users/me/`,
        method: "PATCH",
        body: data,
        meta: data instanceof FormData ? { isFileUpload: true } : undefined,
        service,
      }),
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          persistUserIdentity(data);
        } catch {
          // Ignore cookie persistence failures.
        }
      },
    }),

    searchUsers: builder.query<UserSummary[], string>({
      query: (q) => ({
        url: `/${accountsApi}/users/search/`,
        params: { q },
        service,
      }),
    }),

    getQuotaMetadata: builder.query<UserQuotaMetadata, void>({
      query: () => ({
        url: `/${accountsApi}/users/quota-meta-data/`,
        service,
      }),
    }),


    sendVerificationCode: builder.mutation<VerificationResponse, { email: string }>({
      query: ({ email }) => ({
        url: `/${accountsApi}/verify/`,
        method: "POST",
        body: { email, action: "send_code" },
        service,
      }),
    }),


    mfaSetup: builder.mutation<MfaSetupResponse, { force?: boolean } | void>({
      query: (body) => ({
        url: `/${accountsApi}/mfa/setup/`,
        method: "POST",
        body: body ?? {},
        service,
      }),
    }),

    mfaVerify: builder.mutation<MfaVerifyResponse, { code: string }>({
      query: (body) => ({
        url: `/${accountsApi}/mfa/verify/`,
        method: "POST",
        body,
        service,
      }),
    }),

    mfaEmailRequest: builder.mutation<MfaEmailRequestResponse, void>({
      query: () => ({
        url: `/${accountsApi}/mfa/email/request/`,
        method: "POST",
        body: {},
        service,
      }),
    }),

    mfaEmailVerify: builder.mutation<MfaVerifyResponse, { code: string }>({
      query: (body) => ({
        url: `/${accountsApi}/mfa/email/verify/`,
        method: "POST",
        body,
        service,
      }),
    }),

    mfaResetRequest: builder.mutation<MfaResetRequestResponse, void>({
      query: () => ({
        url: `/${accountsApi}/mfa/reset/request/`,
        method: "POST",
        body: {},
        service,
      }),
    }),

    mfaResetConfirm: builder.mutation<MfaResetConfirmResponse, { code: string }>({
      query: (body) => ({
        url: `/${accountsApi}/mfa/reset/confirm/`,
        method: "POST",
        body,
        service,
      }),
    }),

    mfaToggle: builder.mutation<MfaToggleResponse, MfaTogglePayload>({
      query: (body) => ({
        url: `/${accountsApi}/mfa/toggle/`,
        method: "POST",
        body,
        service,
      }),
    }),

    inviteStaff: builder.mutation<CompanyInvitation, InviteCompanyPayload>({
      query: (body) => ({
        url: `/${managementApi}/invitations/invite/`,
        method: "POST",
        body,
        service,
      }),
    }),

    createStaffUser: builder.mutation<CompanyInvitation, Partial<UserData>>({
      query: (payload) => ({
        url: `/${managementApi}/invitations/invite/`,
        method: "POST",
        body: {
          email: payload.email,
          role: "member",
        },
        service,
      }),
    }),

    inviteStaffBulk: builder.mutation<BulkInviteResponse, FormData | InviteCompanyBulkPayload>({
      query: (payload) => {
        const body =
          payload instanceof FormData
            ? payload
            : (() => {
                const formData = new FormData();
                if (payload.role) formData.append("role", payload.role);
                if (payload.invitation_message) {
                  formData.append("invitation_message", payload.invitation_message);
                }
                if (Array.isArray(payload.emails)) {
                  payload.emails.forEach((email) => formData.append("emails", email));
                } else if (payload.emails) {
                  formData.append("emails", payload.emails);
                }
                if (payload.file) formData.append("file", payload.file);
                if (payload.csv_file) formData.append("csv_file", payload.csv_file);
                return formData;
              })();
        return {
          url: `/${managementApi}/invitations/invite-bulk/`,
          method: "POST",
          body,
          meta: { isFileUpload: true },
          service,
        };
      },
    }),

    getCompanyUsers: builder.query<StaffAssignment[], void>({
      query: () => {
        const profileId = getActiveProfileId();
        return {
          url: profileId
            ? `/${managementApi}/profiles/${profileId}/staff_active_assignments/`
            : `/${managementApi}/invitations/pending/`,
          service,
        };
      },
    }),

    getPendingInvitations: builder.query<CompanyInvitation[], void>({
      query: () => ({
        url: `/${managementApi}/invitations/pending/`,
        service,
      }),
    }),

    getMyInvitations: builder.query<CompanyInvitation[], void>({
      query: () => ({
        url: `/${managementApi}/invitations/mine/`,
        service,
      }),
    }),

    resendInvitation: builder.mutation<CompanyInvitation, string>({
      query: (invitationId) => ({
        url: `/${managementApi}/invitations/${invitationId}/resend/`,
        method: "POST",
        service,
      }),
    }),

    revokeInvitation: builder.mutation<CompanyInvitation, string>({
      query: (invitationId) => ({
        url: `/${managementApi}/invitations/${invitationId}/revoke/`,
        method: "POST",
        service,
      }),
    }),

    acceptInvitation: builder.mutation<CompanyInvitationAcceptResponse, CompanyInvitationAcceptPayload>({
      query: (body) => ({
        url: `/${managementApi}/invitations/accept/`,
        method: "POST",
        body,
        service,
      }),
    }),

    declineInvitation: builder.mutation<{ detail: string }, CompanyInvitationAcceptPayload>({
      query: (body) => ({
        url: `/${managementApi}/invitations/decline/`,
        method: "POST",
        body,
        service,
      }),
    }),

    removeCompanyMember: builder.mutation<
      { message: string; deactivated_assignments?: number; deactivated_membership?: boolean },
      { profileId: string; user_id: number | string }
    >({
      query: ({ profileId, user_id }) => ({
        url: `/${managementApi}/profiles/${profileId}/remove_staff/`,
        method: "POST",
        body: { user_id },
        service,
      }),
    }),
  }),
});

export const {
  useListUsersQuery,
  useGetUserQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetLoggedInUserQuery,
  useUpdateLoggedInUserMutation,
  useSearchUsersQuery,
  useLazySearchUsersQuery,
  useGetQuotaMetadataQuery,
  useSendVerificationCodeMutation,
  useMfaSetupMutation,
  useMfaVerifyMutation,
  useMfaEmailRequestMutation,
  useMfaEmailVerifyMutation,
  useMfaResetRequestMutation,
  useMfaResetConfirmMutation,
  useMfaToggleMutation,
  useInviteStaffMutation,
  useCreateStaffUserMutation,
  useInviteStaffBulkMutation,
  useGetCompanyUsersQuery,
  useGetPendingInvitationsQuery,
  useGetMyInvitationsQuery,
  useResendInvitationMutation,
  useRevokeInvitationMutation,
  useAcceptInvitationMutation,
  useDeclineInvitationMutation,
  useRemoveCompanyMemberMutation,
} = userApiSlice;

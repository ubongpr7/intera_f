import { apiSlice } from '../../services/apiSlice';
import { UserData } from '../../../components/interfaces/User';
import { getCookie } from 'cookies-next';
import { readCookieValue } from '@/lib/authCookies';

const user_api='accounts'
const	service = 'users'

interface StaffAssignment {
  id: string;
  role?: {
    id?: string;
    name?: string;
  };
  user?: {
    id?: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string | null;
  };
}

interface InvitationRow {
  id: string;
  email?: string;
  role?: string;
  status?: string;
  expires_at?: string;
  invitation_code?: string;
  created_at?: string;
}

export interface BulkInviteResponse {
  created_count: number;
  existing_pending_count: number;
  skipped_count: number;
  invalid_count: number;
  created: InvitationRow[];
  existing_pending: InvitationRow[];
  skipped: Array<{ email: string; reason: string }>;
  invalid_emails: string[];
}

export interface MfaSetupResponse {
  mfa_secret: string;
  otpauth_url: string;
  qr_code: string;
  mfa_enabled: boolean;
  has_setup_mfa: boolean;
}

export interface MfaVerifyResponse {
  detail: string;
  mfa_enabled: boolean;
  has_setup_mfa?: boolean;
  access?: string;
  refresh?: string;
  profile?: string | null;
  profile_context?: Record<string, unknown> | null;
  profiles?: Array<Record<string, unknown>>;
}

export const userApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    updateUser: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${user_api}/users/${id}/`,
        method: 'PATCH',
        body: data,
				service:service,
      }),
    }),
    createStaffUser: builder.mutation({
      query: (CompanyDataInterface: Partial<UserData>) => ({
        url: `/management/invitations/invite/`,
        method: 'POST',
        body: {
          email: CompanyDataInterface.email,
          role: "member",
        },
				service:service,
      }),
    
    }),
    inviteStaffBulk: builder.mutation<BulkInviteResponse, FormData>({
      query: (formData) => ({
        url: `/management/invitations/invite-bulk/`,
        method: 'POST',
        body: formData,
        meta: { isFileUpload: true },
				service,
      }),
    }),
    getAUser: builder.mutation({
      query: ({ id }) => ({
        url: `/${user_api}/users/${id}/`,
        method: 'GET',
				service:service,
      }),
    }),
    getLoggedInUser: builder.query({
      query: () => ({
        url:`/${user_api}/users/me/`,
				service:service,
      })
      
    }),
  
    getCompanyUsers: builder.query<UserData[], void>({
      query: () => ({
        url: (() => {
          const profileId = readCookieValue("profileId", getCookie) ?? readCookieValue("profile", getCookie);
          if (profileId) {
            return `/management/profiles/${profileId}/staff_active_assignments/`;
          }
          return `/management/invitations/pending/`;
        })(),
				service:service,
      }),
      transformResponse: (response: StaffAssignment[] | InvitationRow[]): UserData[] => {
        if (!Array.isArray(response)) return [];
        return response
          .map((item: StaffAssignment | InvitationRow) => {
          const staff = (item as StaffAssignment).user;
          if (staff) {
            return {
              id: staff.id ?? 0,
              first_name: staff.first_name ?? '',
              last_name: staff.last_name ?? '',
              email: staff.email ?? '',
              phone: staff.phone ?? null,
              is_verified: true,
              is_staff: false,
              date_joined: new Date().toISOString(),
              password: '',
            } as UserData;
          }
          return null;
        })
          .filter((entry): entry is UserData => Boolean(entry));
      },
    }),
    getPendingInvitations: builder.query<InvitationRow[], void>({
      query: () => ({
        url: `/management/invitations/pending/`,
        method: 'GET',
				service,
      }),
    }),
    revokeInvitation: builder.mutation<InvitationRow, string>({
      query: (invitationId) => ({
        url: `/management/invitations/${invitationId}/revoke/`,
        method: 'POST',
				service,
      }),
    }),
    removeCompanyMember: builder.mutation<
      { message: string; deactivated_assignments?: number; deactivated_membership?: boolean },
      { profileId: string; user_id: number | string }
    >({
      query: ({ profileId, user_id }) => ({
        url: `/management/profiles/${profileId}/remove_staff/`,
        method: 'POST',
        body: { user_id },
				service,
      }),
    }),
    mfaSetup: builder.mutation<MfaSetupResponse, { force?: boolean } | void>({
      query: (body) => ({
        url: `/accounts/mfa/setup/`,
        method: 'POST',
        body: body ?? {},
        service,
      }),
    }),
    mfaVerify: builder.mutation<MfaVerifyResponse, { code: string }>({
      query: (body) => ({
        url: `/accounts/mfa/verify/`,
        method: 'POST',
        body,
        service,
      }),
    }),
  
    
  }),

});

export const { 
  useUpdateUserMutation,
  useCreateStaffUserMutation,
  useInviteStaffBulkMutation,
  useGetAUserMutation,
  useGetLoggedInUserQuery,
  useGetCompanyUsersQuery,
  useGetPendingInvitationsQuery,
  useRevokeInvitationMutation,
  useRemoveCompanyMemberMutation,
  useMfaSetupMutation,
  useMfaVerifyMutation,
  
} = userApiSlice;

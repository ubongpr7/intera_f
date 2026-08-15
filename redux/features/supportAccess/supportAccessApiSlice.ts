import { apiSlice } from "../../services/apiSlice";
import type {
  SupportAccessGrantAcceptResponse,
  SupportAccessCandidateUser,
  SupportAccessGrant,
  SupportAccessGrantCreatePayload,
  SupportAccessGrantExtendPayload,
  SupportAccessGrantRevokePayload,
  SupportAccessGrantRespondPayload,
  SupportAccessPreset,
} from "./supportAccessTypes";

const managementApi = "management";
const service = "users";

export const supportAccessApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listSupportAccessGrants: builder.query<SupportAccessGrant[], void>({
      query: () => ({
        url: `/${managementApi}/support-access-grants/`,
        service,
      }),
    }),

    getSupportAccessGrant: builder.query<SupportAccessGrant, string>({
      query: (id) => ({
        url: `/${managementApi}/support-access-grants/${id}/`,
        service,
      }),
    }),

    createSupportAccessGrant: builder.mutation<SupportAccessGrant, SupportAccessGrantCreatePayload>({
      query: (body) => ({
        url: `/${managementApi}/support-access-grants/`,
        method: "POST",
        body,
        service,
      }),
    }),

    extendSupportAccessGrant: builder.mutation<
      SupportAccessGrant,
      { id: string; data: SupportAccessGrantExtendPayload }
    >({
      query: ({ id, data }) => ({
        url: `/${managementApi}/support-access-grants/${id}/extend/`,
        method: "POST",
        body: data,
        service,
      }),
    }),

    revokeSupportAccessGrant: builder.mutation<
      SupportAccessGrant,
      { id: string; data?: SupportAccessGrantRevokePayload }
    >({
      query: ({ id, data }) => ({
        url: `/${managementApi}/support-access-grants/${id}/revoke/`,
        method: "POST",
        body: data ?? {},
        service,
      }),
    }),

    listSupportAccessPresets: builder.query<SupportAccessPreset[], void>({
      query: () => ({
        url: `/${managementApi}/support-access-grants/presets/`,
        service,
      }),
    }),

    getMySupportAccessRequests: builder.query<SupportAccessGrant[], void>({
      query: () => ({
        url: `/${managementApi}/support-access-grants/mine/`,
        service,
      }),
    }),

    acceptSupportAccessRequest: builder.mutation<
      SupportAccessGrantAcceptResponse,
      SupportAccessGrantRespondPayload
    >({
      query: (body) => ({
        url: `/${managementApi}/support-access-grants/accept/`,
        method: "POST",
        body,
        service,
      }),
    }),

    declineSupportAccessRequest: builder.mutation<
      { detail: string },
      SupportAccessGrantRespondPayload
    >({
      query: (body) => ({
        url: `/${managementApi}/support-access-grants/decline/`,
        method: "POST",
        body,
        service,
      }),
    }),

    searchSupportAccessUsers: builder.query<SupportAccessCandidateUser[], string>({
      query: (q) => ({
        url: `/${managementApi}/support-access-grants/support-users/`,
        params: { q },
        service,
      }),
    }),
  }),
});

export const {
  useListSupportAccessGrantsQuery,
  useGetSupportAccessGrantQuery,
  useCreateSupportAccessGrantMutation,
  useExtendSupportAccessGrantMutation,
  useRevokeSupportAccessGrantMutation,
  useListSupportAccessPresetsQuery,
  useGetMySupportAccessRequestsQuery,
  useAcceptSupportAccessRequestMutation,
  useDeclineSupportAccessRequestMutation,
  useSearchSupportAccessUsersQuery,
  useLazySearchSupportAccessUsersQuery,
} = supportAccessApiSlice;

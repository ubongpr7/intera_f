import { getCookie } from "cookies-next";

import { readCookieValue } from "@/lib/authCookies";

import { apiSlice } from "../../services/apiSlice";
import type {
  AuthSessionResponse,
  AuthUser,
  CompanyMembershipResponse,
  CompanyProfileContext,
  SocialAuthArgs,
  SwitchCompanyPayload,
} from "./authTypes";

type CreateUserResponse = AuthSessionResponse;

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    retrieveUser: builder.query<AuthUser, void>({
      query: () => ({
        url: "/accounts/users/me/",
        service: "users",
      }),
    }),

    socialAuthenticate: builder.mutation<CreateUserResponse, SocialAuthArgs>({
      query: ({ provider, state, code, redirectUri }) => ({
        url: `/auth/o/${provider}/?state=${encodeURIComponent(state)}&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirectUri)}`,
        method: "POST",
        service: "users",
      }),
    }),

    login: builder.mutation<AuthSessionResponse, { email: string; password: string; profile_id?: string; company_code?: string }>({
      query: ({ email, password, profile_id, company_code }) => ({
        url: "/auth/login/",
        method: "POST",
        body: { email, password, profile_id, company_code },
        service: "users",
      }),
    }),

    verifyAccount: builder.mutation<unknown, { userId?: string | number; code?: string }>({
      query: ({ userId, code }) => ({
        url: "/accounts/verify/",
        method: "POST",
        body: { userId, code },
        service: "users",
      }),
    }),

    getverifyAccount: builder.mutation<unknown, { id: string | number }>({
      query: ({ id }) => ({
        url: `/accounts/verify/?id=${id}`,
        method: "GET",
        service: "users",
      }),
    }),

    verifyToken: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/verify/",
        method: "POST",
        service: "users",
      }),
    }),

    register: builder.mutation<
      unknown,
      { first_name: string; last_name: string; email: string; password: string; re_password: string }
    >({
      query: ({ first_name, last_name, email, password, re_password }) => ({
        url: "/djoser/users/",
        method: "POST",
        body: { first_name, last_name, email, password, re_password },
        service: "users",
      }),
    }),

    resendCode: builder.mutation<void, { email: string }>({
      query: ({ email }) => ({
        url: "/accounts/verify/",
        method: "POST",
        body: { email, action: "send_code" },
        service: "users",
      }),
    }),

    verifyCode: builder.mutation<void, { email: string; code: string }>({
      query: ({ email, code }) => ({
        url: "/accounts/verify/",
        method: "POST",
        body: { email, code, action: "verify_code" },
        service: "users",
      }),
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/logout/",
        method: "POST",
        body: { refresh: readCookieValue("refreshToken", getCookie) },
        service: "users",
      }),
    }),

    refresh: builder.mutation<AuthSessionResponse, void>({
      query: () => ({
        url: "/auth/refresh/",
        method: "POST",
        body: { refresh: readCookieValue("refreshToken", getCookie) },
        service: "users",
      }),
    }),

    getUserCompanies: builder.query<CompanyMembershipResponse, void>({
      query: () => ({
        url: "/auth/companies/",
        method: "GET",
        service: "users",
      }),
    }),

    switchCompany: builder.mutation<AuthSessionResponse, SwitchCompanyPayload>({
      query: (body) => ({
        url: "/auth/switch-company/",
        method: "POST",
        body,
        service: "users",
      }),
    }),

    activation: builder.mutation<unknown, { uid: string; token: string }>({
      query: ({ uid, token }) => ({
        url: "/djoser/users/activation/",
        method: "POST",
        body: { uid, token },
        service: "users",
      }),
    }),

    resetPassword: builder.mutation<unknown, { email: string }>({
      query: ({ email }) => ({
        url: "/djoser/users/reset_password/",
        method: "POST",
        body: { email },
        service: "users",
      }),
    }),

    resetPasswordConfirm: builder.mutation<
      unknown,
      { uid: string; token: string; new_password: string; re_new_password: string }
    >({
      query: ({ uid, token, new_password, re_new_password }) => ({
        url: "/djoser/users/reset_password_confirm/",
        method: "POST",
        body: { uid, token, new_password, re_new_password },
        service: "users",
      }),
    }),
  }),
});

export const {
  useRetrieveUserQuery,
  useSocialAuthenticateMutation,
  useLoginMutation,
  useVerifyAccountMutation,
  useGetverifyAccountMutation,
  useRegisterMutation,
  useVerifyTokenMutation,
  useResendCodeMutation,
  useVerifyCodeMutation,
  useRefreshMutation,
  useGetUserCompaniesQuery,
  useSwitchCompanyMutation,
  useLogoutMutation,
  useActivationMutation,
  useResetPasswordMutation,
  useResetPasswordConfirmMutation,
} = authApiSlice;

export type { CompanyProfileContext };

import { getCookie } from 'cookies-next';
import { apiSlice } from '../services/apiSlice';
import { SocialProviderSlug } from '@/lib/socialAuth';
import { readCookieValue } from '@/lib/authCookies';

interface User {
	first_name: string;
	last_name: string;
	email: string;
}

interface SocialAuthArgs {
	provider: SocialProviderSlug;
	state: string;
	code: string;
	redirectUri: string;
}

type CreateUserResponse = AuthSessionResponse;
export interface CompanyProfileContext {
	id: string;
	name: string;
	company_code: string;
	owner_id?: string | null;
	currency?: string | null;
	role?: string | null;
	membership_id?: string | null;
}

export interface AuthSessionResponse {
	access: string;
	refresh: string;
	id: string | number;
	username?: string;
	email?: string;
	first_name?: string;
	is_verified?: boolean;
	profile?: string | null;
	profile_context?: CompanyProfileContext | null;
	profiles?: CompanyProfileContext[];
	currency?: string | null;
	model_name?: string | null;
	provider?: string | null;
	agent_name?: string | null;
}

export interface CompanyMembershipResponse {
	active_profile_id: string | null;
	profiles: CompanyProfileContext[];
}

export interface SwitchCompanyPayload {
	profile_id?: string;
	company_code?: string;
}

const authApiSlice = apiSlice.injectEndpoints({
	endpoints: builder => ({
		retrieveUser: builder.query<User, void>({
			query: () => ({
				url: '/accounts/users/me/',
				service: 'users',
			}),
		}),
		socialAuthenticate: builder.mutation<
			CreateUserResponse,
			SocialAuthArgs
		>({
			query: ({ provider, state, code, redirectUri }) => ({
				url: `/auth/o/${provider}/?state=${encodeURIComponent(
					state
				)}&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirectUri)}`,
				method: 'POST',
				service: 'users',

			}),
		}),
		
		login: builder.mutation<AuthSessionResponse, { email: string; password: string; profile_id?: string; company_code?: string }>({
			query: ({ email, password, profile_id, company_code }) => ({
				url: '/auth/login/',
				method: 'POST',
				body: { email, password, profile_id, company_code },
				service: 'users',

			}),
		}),
		verifyAccount: builder.mutation({
			query: ({ userId, code }) => ({
				url: '/accounts/verify/',
				method: 'POST',
				body: { userId, code },
				service: 'users',

			}),
		}),
		getverifyAccount: builder.mutation({
			query: ({ id, }) => ({
				url: `/accounts/verify/?id=${id}`,
				method: 'GET',
				// body: { id, },
				service: 'users',

			}),
		}),
		register: builder.mutation({
			query: ({
				first_name,
				last_name,
				email,
				password,
				re_password,
			}) => ({
				url: '/djoser/users/',
				method: 'POST',
				body: { first_name, last_name, email, password, re_password },
				service: 'users',
			}),
		}),
		verify: builder.mutation({
			query: () => ({
				url: '/auth/verify/',
				method: 'POST',
				service: 'users',

			}),
		}),
		resendCode: builder.mutation<void, { email: string,action:string }>({
      query: (data) => ({
        url: '/accounts/verify/',
        method: 'POST',
        body: data,
		service: 'users',

      })
    }),
    
    verifyCode: builder.mutation<void, { email: string; code: string,action:string }>({
      query: (data) => ({
        url: '/accounts/verify/',
        method: 'POST',
        body: data,
		service: 'users',

      })
    }),

		logout: builder.mutation({
			query: () => ({
				
				url: '/auth/logout/',
				method: 'POST',
				body: { refresh: readCookieValue("refreshToken", getCookie) },
				service: 'users',

			}),
		}),
		refresh: builder.mutation<AuthSessionResponse, void>({
			query: () => ({
				
				url: '/auth/refresh/',
				method: 'POST',
				body: { refresh: readCookieValue("refreshToken", getCookie) },
				service: 'users',

			}),
		}),
		getUserCompanies: builder.query<CompanyMembershipResponse, void>({
			query: () => ({
				url: '/auth/companies/',
				method: 'GET',
				service: 'users',
			}),
		}),
		switchCompany: builder.mutation<AuthSessionResponse, SwitchCompanyPayload>({
			query: (body) => ({
				url: '/auth/switch-company/',
				method: 'POST',
				body,
				service: 'users',
			}),
		}),
		activation: builder.mutation({
			query: ({ uid, token }) => ({
				url: '/djoser/users/activation/',
				method: 'POST',
				body: { uid, token },
				service: 'users',

			}),
		}),
		resetPassword: builder.mutation({
			query:( {email}) => ({
				url: '/djoser/users/reset_password/',
				method: 'POST',
				body: { email },
				service: 'users',
			}),
		}),
		resetPasswordConfirm: builder.mutation({
			query: ({ uid, token, new_password, re_new_password }) => ({
				url: '/djoser/users/reset_password_confirm/',
				method: 'POST',
				body: { uid, token, new_password, re_new_password },
				service: 'users',
			}),
		}),
	}),
});

export const {
	useRetrieveUserQuery,
	useSocialAuthenticateMutation,
	useLoginMutation,
	useRegisterMutation,
	useVerifyMutation,
	useResendCodeMutation,
	useVerifyCodeMutation,
	useVerifyAccountMutation,
	useGetverifyAccountMutation,
	useRefreshMutation,
	useGetUserCompaniesQuery,
	useSwitchCompanyMutation,
	useLogoutMutation,
	useActivationMutation,
	useResetPasswordMutation,
	useResetPasswordConfirmMutation,
} = authApiSlice;

import { getCookie } from 'cookies-next';
import { apiSlice } from '../services/apiSlice';

interface User {
	first_name: string;
	last_name: string;
	email: string;
}

interface SocialAuthArgs {
	provider: string;
	state: string;
	code: string;
}

interface CreateUserResponse {
	success: boolean;
	user: User;
}
const refreshToken = getCookie("refreshToken");

const authApiSlice = apiSlice.injectEndpoints({
	endpoints: builder => ({
		retrieveUser: builder.query<User, void>({
			query: () => '/users/me/',
		}),
		socialAuthenticate: builder.mutation<
			CreateUserResponse,
			SocialAuthArgs
		>({
			query: ({ provider, state, code }) => ({
				url: `/o/${provider}/?state=${encodeURIComponent(
					state
				)}&code=${encodeURIComponent(code)}`,
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				service: 'users',

			}),
		}),
		
		login: builder.mutation({
			query: ({ email, password }) => ({
				url: '/jwt/create/',
				method: 'POST',
				body: { email, password },
				service: 'users',

			}),
		}),
		verifyAccount: builder.mutation({
			query: ({ userId, code }) => ({
				url: '/api/v1/accounts/verify/',
				method: 'POST',
				body: { userId, code },
				service: 'users',

			}),
		}),
		getverifyAccount: builder.mutation({
			query: ({ id, }) => ({
				url: `/api/v1/accounts/verify/?id=${id}`,
				method: 'GET',
				// body: { id, },
				service: 'users',

			}),
		}),
		register: builder.mutation({
			query: ({
				first_name,
				email,
				password,
				re_password,
			}) => ({
				url: '/api/v1/accounts/register/',
				method: 'POST',
				body: {first_name,  email, password, re_password, },
				service: 'users',
			}),
		}),
		verify: builder.mutation({
			query: () => ({
				url: '/jwt/verify/',
				method: 'POST',
				service: 'users',

			}),
		}),
		resendCode: builder.mutation<void, { email: string,action:string }>({
      query: (data) => ({
        url: '/api/v1/accounts/verify/',
        method: 'POST',
        body: data,
		service: 'users',

      })
    }),
    
    verifyCode: builder.mutation<void, { email: string; code: string,action:string }>({
      query: (data) => ({
        url: '/api/v1/accounts/verify/',
        method: 'POST',
        body: data,
		service: 'users',

      })
    }),
		logout: builder.mutation({
			query: () => ({
				
				url: '/api/v1/accounts/logout/',
				method: 'POST',
				body: { refresh: refreshToken },
				service: 'users',

			}),
		}),
		activation: builder.mutation({
			query: ({ uid, token }) => ({
				url: '/users/activation/',
				method: 'POST',
				body: { uid, token },
				service: 'users',

			}),
		}),
		resetPassword: builder.mutation({
			query:( {email}) => ({
				url: '/auth-api/users/reset_password/',
				method: 'POST',
				body: { email },
				service: 'users',
			}),
		}),
		resetPasswordConfirm: builder.mutation({
			query: ({ uid, token, new_password, re_new_password }) => ({
				url: '/users/reset_password_confirm/',
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
	useLogoutMutation,
	useActivationMutation,
	useResetPasswordMutation,
	useResetPasswordConfirmMutation,
} = authApiSlice;

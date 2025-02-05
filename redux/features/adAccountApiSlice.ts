import { apiSlice } from '../services/apiSlice';
import { getCookie } from 'cookies-next'; // Import getCookie from cookie-next

interface AdAccount {
    id?: number;
    ad_account_id?: string;
    access_token?: string;
}

const ads_manager_api = 'ads_manager_api';

// Function to load the access token from cookies
const loadAccessToken = () => {
    console.log('see refresh token', getCookie('accessToken'))
    return getCookie('accessToken'); // Retrieve the accessToken from cookies
};

// Modify the apiSlice to include the authorization header
const adAccountApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        createAdAccount: builder.mutation<AdAccount, Partial<AdAccount>>({
            query: (adAccountData) => {
                const token = loadAccessToken(); // Get the token from cookies
                return {
                    url: `/${ads_manager_api}/ad-accounts/create/`,
                    method: 'POST',
                    body: adAccountData,
                    headers: {
                        'Content-Type': 'application/json', // Ensure JSON content type
                        ...(token && { Authorization: `Bearer ${token}` }), // Add authorization header if token exists
                    },
                };
            },
        }),
        getAdAccounts: builder.query<AdAccount[], void>({
            query: () => {
                const token = loadAccessToken(); // Get the token from cookies
                return {
                    url: `/${ads_manager_api}/ad-accounts/`,
                    headers: {
                        ...(token && { Authorization: `Bearer ${token}` }), // Add authorization header if token exists
                    },
                };
            },
        }),
        getAdAccount: builder.query<AdAccount, number>({
            query: (id) => {
                const token = loadAccessToken(); // Get the token from cookies
                return {
                    url: `/${ads_manager_api}/ad-accounts/${id}/`,
                    headers: {
                        ...(token && { Authorization: `Bearer ${token}` }), // Add authorization header if token exists
                    },
                };
            },
        }),
        updateAdAccount: builder.mutation<AdAccount, { id: number; data: Partial<AdAccount> }>({
            query: ({ id, data }) => {
                const token = loadAccessToken(); // Get the token from cookies
                return {
                    url: `/${ads_manager_api}/ad-accounts/${id}/`,
                    method: 'PATCH',
                    body: data,
                    headers: {
                        'Content-Type': 'application/json', // Ensure JSON content type
                        ...(token && { Authorization: `Bearer ${token}` }), // Add authorization header if token exists
                    },
                };
            },
        }),
        deleteAdAccount: builder.mutation<{ success: boolean }, number>({
            query: (id) => {
                const token = loadAccessToken(); // Get the token from cookies
                return {
                    url: `/${ads_manager_api}/ad-accounts/${id}/`,
                    method: 'DELETE',
                    headers: {
                        ...(token && { Authorization: `Bearer ${token}` }), // Add authorization header if token exists
                    },
                };
            },
        }),
    }),
});

export const {
    useCreateAdAccountMutation,
    useGetAdAccountsQuery,
    useGetAdAccountQuery,
    useUpdateAdAccountMutation,
    useDeleteAdAccountMutation,
} = adAccountApiSlice;
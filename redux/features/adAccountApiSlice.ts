import { apiSlice } from '../services/apiSlice';

interface AdAccount {
    id?: number;
    ad_account_id?: string;
    access_token?: string;
}

const ads_manager_api = 'ads_manager_api';

// Modify the apiSlice to include the authorization header
const adAccountApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        createAdAccount: builder.mutation<AdAccount, Partial<AdAccount>>({
            query: (adAccountData) => {
                // Get the token from localStorage
                const token = localStorage.getItem("accessToken");
                return {
                    url: `/${ads_manager_api}/ad-accounts/create/`,
                    method: 'POST',
                    body: adAccountData,
                    // Include the authorization header if the token is available
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                };
            },
        }),
        getAdAccounts: builder.query<AdAccount[], void>({
            query: () => {
                // Get the token from localStorage
                const token = localStorage.getItem("accessToken");
                return {
                    url: `/${ads_manager_api}/ad-accounts/`,
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                };
            },
        }),
        getAdAccount: builder.query<AdAccount, number>({
            query: (id) => {
                // Get the token from localStorage
                const token = localStorage.getItem("accessToken");
                return {
                    url: `/${ads_manager_api}/ad-accounts/${id}/`,
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                };
            },
        }),
        updateAdAccount: builder.mutation<AdAccount, { id: number; data: Partial<AdAccount> }>({
            query: ({ id, data }) => {
                // Get the token from localStorage
                const token = localStorage.getItem("accessToken");
                return {
                    url: `/${ads_manager_api}/ad-accounts/${id}/`,
                    method: 'PATCH',
                    body: data,
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                };
            },
        }),
        deleteAdAccount: builder.mutation<{ success: boolean }, number>({
            query: (id) => {
                // Get the token from localStorage
                const token = localStorage.getItem("accessToken");
                return {
                    url: `/${ads_manager_api}/ad-accounts/${id}/`,
                    method: 'DELETE',
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
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

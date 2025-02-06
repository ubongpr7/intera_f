import { apiSlice } from '../services/apiSlice';

interface AdAccount {
    id?: number;
    ad_account_id?: string;
    access_token?: string;
}
const ads_manager_api='ads_manager_api'
const adAccountApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        createAdAccount: builder.mutation<AdAccount, Partial<AdAccount>>({
            query: ({ad_account_id,access_token,account_name,business_manager_id}) => ({
                url: `/${ads_manager_api}/ad-accounts/create/`,
                method: 'POST',
                body: {ad_account_id,access_token,account_name,business_manager_id},
            }),
        }),
        getAdAccounts: builder.query<AdAccount[], void>({
            query: () =>  `/${ads_manager_api}/ad-accounts/`,
        }),
        getAdAccount: builder.query<AdAccount, number>({
            query: (id) => `/${ads_manager_api}/ad-accounts/${id}/`,
        }),
        updateAdAccount: builder.mutation<AdAccount, { id: number; data: Partial<AdAccount> }>({
            query: ({ id, data }) => ({
                url: `/${ads_manager_api}/ad-accounts/${id}/`,
                method: 'PATCH',
                body: data,
            }),
        }),
        deleteAdAccount: builder.mutation<{ success: boolean }, number>({
            query: (id) => ({
                url:  `/${ads_manager_api}/ad-accounts/${id}/`,
                method: 'DELETE',
            }),
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

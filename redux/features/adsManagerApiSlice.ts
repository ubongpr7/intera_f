import { apiSlice } from '../services/apiSlice';

const ads_manager_api = 'ads_manager_api';

// Define an interface for the authentication token
interface AuthHeaders {
    Authorization: string;
}

interface Campaign {
    id?: number;
    campaign_id?: string;
    name: string;
    objective: string;
    budget_optimization: boolean;
    budget_value: number;
    bid_strategy: string;
    buying_type: string;
    pixel_id?: string;
    lead_form_id?: string;
    created_at?: string;
    updated_at?: string;
}

interface AdSet {
    id?: number;
    campaign: number;
    name: string;
    budget_optimization: boolean;
    budget_value: number;
    bid_strategy: string;
    created_at?: string;
    updated_at?: string;
}

interface Ad {
    id?: number;
    account: number;
    adset: number;
    name: string;
    creative_id: string;
    status: string;
    ad_format: string;
    pixel_id?: string;
    lead_form_id?: string;
    created_at?: string;
    updated_at?: string;
}

interface LeadForm {
    id?: number;
    form_id: string;
    name: string;
    questions: object;
    created_at?: string;
    updated_at?: string;
}

const getAuthHeaders = (): AuthHeaders => {
    const token = localStorage.getItem('authToken'); 
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const adManagerApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        // Campaign Endpoints
        createCampaign: builder.mutation<Campaign, Partial<Campaign>>({
            query: campaignData => ({
                url: `/${ads_manager_api}/campaigns/create/`,
                method: 'POST',
                headers: getAuthHeaders(),
                body: campaignData,
            }),
        }),
        getCampaigns: builder.query<Campaign[], void>({
            query: () => ({
                url: `/${ads_manager_api}/campaigns/`,
                headers: getAuthHeaders(),
            }),
        }),
        getCampaign: builder.query<Campaign, number>({
            query: id => ({
                url: `/${ads_manager_api}/campaigns/${id}/`,
                headers: getAuthHeaders(),
            }),
        }),
        updateCampaign: builder.mutation<Campaign, { id: number; data: Partial<Campaign> }>({
            query: ({ id, data }) => ({
                url: `/${ads_manager_api}/campaigns/${id}/`,
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: data,
            }),
        }),
        deleteCampaign: builder.mutation<{ success: boolean }, number>({
            query: id => ({
                url: `/${ads_manager_api}/campaigns/${id}/`,
                method: 'DELETE',
                headers: getAuthHeaders(),
            }),
        }),

        // AdSet Endpoints
        createAdSet: builder.mutation<AdSet, Partial<AdSet>>({
            query: adSetData => ({
                url: `/${ads_manager_api}/adsets/create/`,
                method: 'POST',
                headers: getAuthHeaders(),
                body: adSetData,
            }),
        }),
        getAdSets: builder.query<AdSet[], void>({
            query: () => ({
                url: `/${ads_manager_api}/adsets/`,
                headers: getAuthHeaders(),
            }),
        }),
        getAdSet: builder.query<AdSet, number>({
            query: id => ({
                url: `/${ads_manager_api}/adsets/${id}/`,
                headers: getAuthHeaders(),
            }),
        }),
        updateAdSet: builder.mutation<AdSet, { id: number; data: Partial<AdSet> }>({
            query: ({ id, data }) => ({
                url: `/${ads_manager_api}/adsets/${id}/`,
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: data,
            }),
        }),
        deleteAdSet: builder.mutation<{ success: boolean }, number>({
            query: id => ({
                url: `/${ads_manager_api}/adsets/${id}/`,
                method: 'DELETE',
                headers: getAuthHeaders(),
            }),
        }),

        // Ad Endpoints
        createAd: builder.mutation<Ad, Partial<Ad>>({
            query: adData => ({
                url: `/${ads_manager_api}/ads/create/`,
                method: 'POST',
                headers: getAuthHeaders(),
                body: adData,
            }),
        }),
        getAds: builder.query<Ad[], void>({
            query: () => ({
                url: `/${ads_manager_api}/ads/`,
                headers: getAuthHeaders(),
            }),
        }),
        getAd: builder.query<Ad, number>({
            query: id => ({
                url: `/${ads_manager_api}/ads/${id}/`,
                headers: getAuthHeaders(),
            }),
        }),
        updateAd: builder.mutation<Ad, { id: number; data: Partial<Ad> }>({
            query: ({ id, data }) => ({
                url: `/${ads_manager_api}/ads/${id}/`,
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: data,
            }),
        }),
        deleteAd: builder.mutation<{ success: boolean }, number>({
            query: id => ({
                url: `/${ads_manager_api}/ads/${id}/`,
                method: 'DELETE',
                headers: getAuthHeaders(),
            }),
        }),

        // LeadForm Endpoints
        createLeadForm: builder.mutation<LeadForm, Partial<LeadForm>>({
            query: leadFormData => ({
                url: `/${ads_manager_api}/leadforms/create/`,
                method: 'POST',
                headers: getAuthHeaders(),
                body: leadFormData,
            }),
        }),
        getLeadForms: builder.query<LeadForm[], void>({
            query: () => ({
                url: `/${ads_manager_api}/leadforms/`,
                headers: getAuthHeaders(),
            }),
        }),
        getLeadForm: builder.query<LeadForm, number>({
            query: id => ({
                url: `/${ads_manager_api}/leadforms/${id}/`,
                headers: getAuthHeaders(),
            }),
        }),
        updateLeadForm: builder.mutation<LeadForm, { id: number; data: Partial<LeadForm> }>({
            query: ({ id, data }) => ({
                url: `/${ads_manager_api}/leadforms/${id}/`,
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: data,
            }),
        }),
        deleteLeadForm: builder.mutation<{ success: boolean }, number>({
            query: id => ({
                url: `/${ads_manager_api}/leadforms/${id}/`,
                method: 'DELETE',
                headers: getAuthHeaders(),
            }),
        }),
    }),
});

export const {
    // Campaign Hooks
    useCreateCampaignMutation,
    useGetCampaignsQuery,
    useGetCampaignQuery,
    useUpdateCampaignMutation,
    useDeleteCampaignMutation,

    // AdSet Hooks
    useCreateAdSetMutation,
    useGetAdSetsQuery,
    useGetAdSetQuery,
    useUpdateAdSetMutation,
    useDeleteAdSetMutation,

    // Ad Hooks
    useCreateAdMutation,
    useGetAdsQuery,
    useGetAdQuery,
    useUpdateAdMutation,
    useDeleteAdMutation,

    // LeadForm Hooks
    useCreateLeadFormMutation,
    useGetLeadFormsQuery,
    useGetLeadFormQuery,
    useUpdateLeadFormMutation,
    useDeleteLeadFormMutation,
} = adManagerApiSlice;

import { apiSlice } from '../services/apiSlice';

const ads_manager_api = 'ads_manager_api';

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

const adManagerApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        // Campaign Endpoints
        createCampaign: builder.mutation<Campaign, Partial<Campaign>>({
            query: campaignData => ({
                url: `/${ads_manager_api}/campaigns/create/`,
                method: 'POST',
                body: campaignData,
            }),
        }),
        getCampaigns: builder.query<Campaign[], void>({
            query: () => `/${ads_manager_api}/campaigns/`,
        }),
        getCampaign: builder.query<Campaign, number>({
            query: id => `/${ads_manager_api}/campaigns/${id}/`,
        }),
        updateCampaign: builder.mutation<Campaign, { id: number; data: Partial<Campaign> }>({
            query: ({ id, data }) => ({
                url: `/${ads_manager_api}/campaigns/${id}/`,
                method: 'PATCH',
                body: data,
            }),
        }),
        deleteCampaign: builder.mutation<{ success: boolean }, number>({
            query: id => ({
                url: `/${ads_manager_api}/campaigns/${id}/`,
                method: 'DELETE',
            }),
        }),

        // AdSet Endpoints
        createAdSet: builder.mutation<any, FormData>({
            query: (formData) => ({
                url: `/${ads_manager_api}/adsets/create/`,
                method: "POST",
                body: formData,
                formData: true, // Ensures the request is properly formatted in some configurations
            }),
        }),
        getAdSets: builder.query<AdSet[], void>({
            query: () => `/${ads_manager_api}/adsets/`,
        }),
        getAdSet: builder.query<AdSet, number>({
            query: id => `/${ads_manager_api}/adsets/${id}/`,
        }),
        updateAdSet: builder.mutation<AdSet, { id: number; data: Partial<AdSet> }>({
            query: ({ id, data }) => ({
                url: `/${ads_manager_api}/adsets/${id}/`,
                method: 'PATCH',
                body: data,
            }),
        }),
        deleteAdSet: builder.mutation<{ success: boolean }, number>({
            query: id => ({
                url: `/${ads_manager_api}/adsets/${id}/`,
                method: 'DELETE',
            }),
        }),

        // Ad Endpoints
        createAd: builder.mutation<Ad, Partial<Ad>>({
            query: adData => ({
                url: `/${ads_manager_api}/ads/create/`,
                method: 'POST',
                body: adData,
            }),
        }),
        getAds: builder.query<Ad[], void>({
            query: () => `/${ads_manager_api}/ads/`,
        }),
        getAd: builder.query<Ad, number>({
            query: id => `/${ads_manager_api}/ads/${id}/`,
        }),
        updateAd: builder.mutation<Ad, { id: number; data: Partial<Ad> }>({
            query: ({ id, data }) => ({
                url: `/${ads_manager_api}/ads/${id}/`,
                method: 'PATCH',
                body: data,
            }),
        }),
        deleteAd: builder.mutation<{ success: boolean }, number>({
            query: id => ({
                url: `/${ads_manager_api}/ads/${id}/`,
                method: 'DELETE',
            }),
        }),

        // LeadForm Endpoints
        createLeadForm: builder.mutation<LeadForm, Partial<LeadForm>>({
            query: leadFormData => ({
                url: `/${ads_manager_api}/leadforms/create/`,
                method: 'POST',
                body: leadFormData,
            }),
        }),
        getLeadForms: builder.query<LeadForm[], void>({
            query: () => `/${ads_manager_api}/leadforms/`,
        }),
        getLeadForm: builder.query<LeadForm, number>({
            query: id => `/${ads_manager_api}/leadforms/${id}/`,
        }),
        updateLeadForm: builder.mutation<LeadForm, { id: number; data: Partial<LeadForm> }>({
            query: ({ id, data }) => ({
                url: `/${ads_manager_api}/leadforms/${id}/`,
                method: 'PATCH',
                body: data,
            }),
        }),
        deleteLeadForm: builder.mutation<{ success: boolean }, number>({
            query: id => ({
                url: `/${ads_manager_api}/leadforms/${id}/`,
                method: 'DELETE',
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

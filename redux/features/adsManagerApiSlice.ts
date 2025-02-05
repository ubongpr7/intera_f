import { apiSlice } from '../services/apiSlice';
import { getCookie } from 'cookies-next'; // Import getCookie from cookie-next

const ads_manager_api = 'ads_manager_api';

// Function to load the access token from cookies
const loadAccessToken = () => {
    return getCookie('accessToken'); // Retrieve the accessToken from cookies
};

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
            query: campaignData => {
                const token = loadAccessToken(); // Get the access token from cookies
                return {
                    url: `/${ads_manager_api}/campaigns/create/`,
                    method: 'POST',
                    body: campaignData,
                    headers: {
                        'Content-Type': 'application/json', // Ensure JSON content type
                        ...(token && { Authorization: `Bearer ${token}` }), // Add authorization header if token exists
                    },
                };
            },
        }),
        getCampaigns: builder.query<Campaign[], void>({
            query: () => {
                const token = loadAccessToken(); // Get the access token from cookies
                return {
                    url: `/${ads_manager_api}/campaigns/`,
                    headers: {
                        ...(token && { Authorization: `Bearer ${token}` }), // Add authorization header if token exists
                    },
                };
            },
        }),
        getCampaign: builder.query<Campaign, number>({
            query: id => {
                const token = loadAccessToken(); // Get the access token from cookies
                return {
                    url: `/${ads_manager_api}/campaigns/${id}/`,
                    headers: {
                        ...(token && { Authorization: `Bearer ${token}` }), // Add authorization header if token exists
                    },
                };
            },
        }),
        updateCampaign: builder.mutation<Campaign, { id: number; data: Partial<Campaign> }>({
            query: ({ id, data }) => {
                const token = loadAccessToken(); // Get the access token from cookies
                return {
                    url: `/${ads_manager_api}/campaigns/${id}/`,
                    method: 'PATCH',
                    body: data,
                    headers: {
                        'Content-Type': 'application/json', // Ensure JSON content type
                        ...(token && { Authorization: `Bearer ${token}` }), // Add authorization header if token exists
                    },
                };
            },
        }),
        deleteCampaign: builder.mutation<{ success: boolean }, number>({
            query: id => {
                const token = loadAccessToken(); // Get the access token from cookies
                return {
                    url: `/${ads_manager_api}/campaigns/${id}/`,
                    method: 'DELETE',
                    headers: {
                        ...(token && { Authorization: `Bearer ${token}` }), // Add authorization header if token exists
                    },
                };
            },
        }),

        // AdSet Endpoints
        createAdSet: builder.mutation<AdSet, Partial<AdSet>>({
            query: adSetData => {
                const token = loadAccessToken(); // Get the access token from cookies
                return {
                    url: `/${ads_manager_api}/adsets/create/`,
                    method: 'POST',
                    body: adSetData,
                    headers: {
                        'Content-Type': 'application/json', // Ensure JSON content type
                        ...(token && { Authorization: `Bearer ${token}` }), // Add authorization header if token exists
                    },
                };
            },
        }),
        getAdSets: builder.query<AdSet[], void>({
            query: () => {
                const token = loadAccessToken(); // Get the access token from cookies
                return {
                    url: `/${ads_manager_api}/adsets/`,
                    headers: {
                        ...(token && { Authorization: `Bearer ${token}` }), // Add authorization header if token exists
                    },
                };
            },
        }),
        getAdSet: builder.query<AdSet, number>({
            query: id => {
                const token = loadAccessToken(); // Get the access token from cookies
                return {
                    url: `/${ads_manager_api}/adsets/${id}/`,
                    headers: {
                        ...(token && { Authorization: `Bearer ${token}` }), // Add authorization header if token exists
                    },
                };
            },
        }),
        updateAdSet: builder.mutation<AdSet, { id: number; data: Partial<AdSet> }>({
            query: ({ id, data }) => {
                const token = loadAccessToken(); // Get the access token from cookies
                return {
                    url: `/${ads_manager_api}/adsets/${id}/`,
                    method: 'PATCH',
                    body: data,
                    headers: {
                        'Content-Type': 'application/json', // Ensure JSON content type
                        ...(token && { Authorization: `Bearer ${token}` }), // Add authorization header if token exists
                    },
                };
            },
        }),
        deleteAdSet: builder.mutation<{ success: boolean }, number>({
            query: id => {
                const token = loadAccessToken(); // Get the access token from cookies
                return {
                    url: `/${ads_manager_api}/adsets/${id}/`,
                    method: 'DELETE',
                    headers: {
                        ...(token && { Authorization: `Bearer ${token}` }), // Add authorization header if token exists
                    },
                };
            },
        }),

        // Ad Endpoints
        createAd: builder.mutation<Ad, Partial<Ad>>({
            query: adData => {
                const token = loadAccessToken(); // Get the access token from cookies
                return {
                    url: `/${ads_manager_api}/ads/create/`,
                    method: 'POST',
                    body: adData,
                    headers: {
                        'Content-Type': 'application/json', // Ensure JSON content type
                        ...(token && { Authorization: `Bearer ${token}` }), // Add authorization header if token exists
                    },
                };
            },
        }),
        getAds: builder.query<Ad[], void>({
            query: () => {
                const token = loadAccessToken(); // Get the access token from cookies
                return {
                    url: `/${ads_manager_api}/ads/`,
                    headers: {
                        ...(token && { Authorization: `Bearer ${token}` }), // Add authorization header if token exists
                    },
                };
            },
        }),
        getAd: builder.query<Ad, number>({
            query: id => {
                const token = loadAccessToken(); // Get the access token from cookies
                return {
                    url: `/${ads_manager_api}/ads/${id}/`,
                    headers: {
                        ...(token && { Authorization: `Bearer ${token}` }), // Add authorization header if token exists
                    },
                };
            },
        }),
        updateAd: builder.mutation<Ad, { id: number; data: Partial<Ad> }>({
            query: ({ id, data }) => {
                const token = loadAccessToken(); // Get the access token from cookies
                return {
                    url: `/${ads_manager_api}/ads/${id}/`,
                    method: 'PATCH',
                    body: data,
                    headers: {
                        'Content-Type': 'application/json', // Ensure JSON content type
                        ...(token && { Authorization: `Bearer ${token}` }), // Add authorization header if token exists
                    },
                };
            },
        }),
        deleteAd: builder.mutation<{ success: boolean }, number>({
            query: id => {
                const token = loadAccessToken(); // Get the access token from cookies
                return {
                    url: `/${ads_manager_api}/ads/${id}/`,
                    method: 'DELETE',
                    headers: {
                        ...(token && { Authorization: `Bearer ${token}` }), // Add authorization header if token exists
                    },
                };
            },
        }),

        // LeadForm Endpoints
        createLeadForm: builder.mutation<LeadForm, Partial<LeadForm>>({
            query: leadFormData => {
                const token = loadAccessToken(); // Get the access token from cookies
                return {
                    url: `/${ads_manager_api}/leadforms/create/`,
                    method: 'POST',
                    body: leadFormData,
                    headers: {
                        'Content-Type': 'application/json', // Ensure JSON content type
                        ...(token && { Authorization: `Bearer ${token}` }), // Add authorization header if token exists
                    },
                };
            },
        }),
        getLeadForms: builder.query<LeadForm[], void>({
            query: () => {
                const token = loadAccessToken(); // Get the access token from cookies
                return {
                    url: `/${ads_manager_api}/leadforms/`,
                    headers: {
                        ...(token && { Authorization: `Bearer ${token}` }), // Add authorization header if token exists
                    },
                };
            },
        }),
        getLeadForm: builder.query<LeadForm, number>({
            query: id => {
                const token = loadAccessToken(); // Get the access token from cookies
                return {
                    url: `/${ads_manager_api}/leadforms/${id}/`,
                    headers: {
                        ...(token && { Authorization: `Bearer ${token}` }), // Add authorization header if token exists
                    },
                };
            },
        }),
        updateLeadForm: builder.mutation<LeadForm, { id: number; data: Partial<LeadForm> }>({
            query: ({ id, data }) => {
                const token = loadAccessToken(); // Get the access token from cookies
                return {
                    url: `/${ads_manager_api}/leadforms/${id}/`,
                    method: 'PATCH',
                    body: data,
                    headers: {
                        'Content-Type': 'application/json', // Ensure JSON content type
                        ...(token && { Authorization: `Bearer ${token}` }), // Add authorization header if token exists
                    },
                };
            },
        }),
        deleteLeadForm: builder.mutation<{ success: boolean }, number>({
            query: id => {
                const token = loadAccessToken(); // Get the access token from cookies
                return {
                    url: `/${ads_manager_api}/leadforms/${id}/`,
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
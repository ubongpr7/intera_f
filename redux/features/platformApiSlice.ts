import { apiSlice } from '../services/apiSlice';

const ads_manager_api = 'ads_manager_api';

const adManagerApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getPlatforms: builder.query({
            query: (filter) => ({
                url: `/${ads_manager_api}/platforms/`,
                method: 'GET',
                params: filter, 
            }),
        }),
        getPlacements: builder.query({
            query: (filter) => ({
                url: `/${ads_manager_api}/placements/`,
                method: 'GET',
                params: filter, 
            }),
        }),
    }),
});

export const {
    useGetPlatformsQuery,
    useGetPlacementsQuery,
} = adManagerApiSlice;


// const { data: platforms, isLoading } = useGetPlatformsQuery({ name: "Facebook" });
// const { data: placements } = useGetPlacementsQuery({ platform: "Instagram" });

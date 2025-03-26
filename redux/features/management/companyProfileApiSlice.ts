import { apiSlice } from '../../services/apiSlice';
import { Address, CompanyProfileData } from '../../../components/interfaces/management';
const management_api='management_api'
export const companyApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    createCompanyProfile: builder.mutation({
      query: (companyData: CompanyProfileData) => ({
        url: `/${management_api}/company-profiles/`,
        method: 'POST',
        body: companyData
      }),
    }),
    createCompanyProfileAddress: builder.mutation({
      query: (address: Address) => ({
        url: `/${management_api}/company-addresses/`,
        method: 'POST',
        body: address
      }),
    }),

    updateCompanyProfile: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/company/profiles/${id}/`,
        method: 'PATCH',
        body: data
      }),
    }),
    getOwnerCompanyProfile: builder.query({
      query: () => ({
        url: `/${management_api}/onwnercompany-profile/`,
        // method: 'GET',
      }),
    }),
 
  }),
});

export const { 
  useCreateCompanyProfileMutation,
  useCreateCompanyProfileAddressMutation,
  useUpdateCompanyProfileMutation ,
  useGetOwnerCompanyProfileQuery,
} = companyApiSlice;
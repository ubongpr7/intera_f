import { apiSlice } from '../../services/apiSlice';
import {  CompanyDataInterface } from '../../../components/interfaces/company';
const management_api='company_api'
export const companyApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    createCompany: builder.mutation({
      query: (CompanyDataInterface: Partial<CompanyDataInterface>) => ({
        url: `/${management_api}/companies/`,
        method: 'POST',
        body: CompanyDataInterface
      }),
    }),
    
    updateCompany: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/companies/${id}/`,
        method: 'PATCH',
        body: data
      }),
    }),
    getCompany: builder.query({
      query: (id) => `/${management_api}/companies/${id}/`,
    }),
  
    getCompanyCategories: builder.query({
      query: () => `/${management_api}/categories/`,
    }),
  
    getCompanyData: builder.query({
      query: () => ({
        url: `/${management_api}/companies/`,
        method: 'GET',
      }),
    }),
  }),

});

export const { 
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useGetCompanyQuery,
  useGetCompanyCategoriesQuery,
  useGetCompanyDataQuery
} = companyApiSlice;
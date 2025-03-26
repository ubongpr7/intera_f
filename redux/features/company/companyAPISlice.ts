import { apiSlice } from '../../services/apiSlice';
import {  CompanyAddressDataInterface, CompanyDataInterface, ContactPersonInterface } from '../../../components/interfaces/company';
import exp from 'constants';
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
      query: (id) => `/${management_api}/company/detail/${id}/`,
    }),
  
    getSupplers: builder.query<CompanyDataInterface[], void>({
      query: () => `/${management_api}/suppliers/`,
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
  useGetSupplersQuery,
  useGetCompanyDataQuery
} = companyApiSlice;



export const companyAddressApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    createCompanyAddress: builder.mutation({
      query: (AddressDataInterface: Partial<CompanyAddressDataInterface>) => ({
        url: `/${management_api}/company-addresses/`,
        method: 'POST',
        body: AddressDataInterface
      }),
    }),
    
    updateCompanyAddress: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/company-addresses/${id}/`,
        method: 'PATCH',
        body: data
      }),
    }),
    // getCompanyAddress: builder.query({
    //   query: (id) => `/${management_api}/companies/${id}/`,
    // }),
  
    getCompanyAddresses: builder.query({
      query: (company_id) => `/${management_api}/company-addresses/?company_id=${company_id}`,
    }),
  
  }),

});

export const {
  useCreateCompanyAddressMutation,
  useUpdateCompanyAddressMutation,
  // useGetCompanyAddressQuery,
  useGetCompanyAddressesQuery
} = companyAddressApiSlice;

export const ContactPersonApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    createContactPerson: builder.mutation({
      query: (AddressDataInterface: Partial<ContactPersonInterface>) => ({
        url: `/${management_api}/company-contacts/`,
        method: 'POST',
        body: AddressDataInterface
      }),
    }),
    
    updateContactPerson: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/company-contacts/${id}/`,
        method: 'PATCH',
        body: data
      }),
    }),
    
    getContactPerson: builder.query({
      query: (company_id) => `/${management_api}/company-contacts/?company_id=${company_id}`,
    }),
  
  }),

});

export const {
  useCreateContactPersonMutation,
  useUpdateContactPersonMutation,
  useGetContactPersonQuery
} = ContactPersonApiSlice;
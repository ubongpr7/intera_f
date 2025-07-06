import { apiSlice } from '../../services/apiSlice';
import {  CompanyAddressDataInterface, CompanyDataInterface, ContactPersonInterface } from '../../../components/interfaces/company';
import exp from 'constants';
const management_api='company_api'
const service='inventory'

export const companyApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    createCompany: builder.mutation({
      query: (CompanyDataInterface: Partial<CompanyDataInterface>) => ({
        url: `/${management_api}/companies/`,
        method: 'POST',
        body: CompanyDataInterface,
        service: service,
      }),
    }),

    
    updateCompany: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/companies/${id}/`,
        method: 'PATCH',
        body: data,
        service: service,
      }),
    }),
    getCompany: builder.query({
      query: (id) =>({
        url: `/${management_api}/companies/${id}/`,
        service: service,
      })
    }),
  
    getSupplers: builder.query<CompanyDataInterface[], void>({
      query: () =>({
        url: `/${management_api}/companies/?is_supplier=${true}`,
        service: service,
      })
    }),
  
    getManufacturers: builder.query<CompanyDataInterface[], void>({
      query: () =>({
        url: `/${management_api}/companies/?is_manufacturer=${true}`,
        service: service,
      })
    }),
    getCustomer: builder.query<CompanyDataInterface[], void>({
      query: () =>({
        url: `/${management_api}/companies/?is_customer=${true}`,
        service: service,
      })
    }),
  
    getCompanyData: builder.query({
      query: () => ({
        url: `/${management_api}/companies/`,
        method: 'GET',
        service: service,
      }),
    }),

    getCompanyContactPerson: builder.query({
          query: (company_id) => ({
            url:`/${management_api}/companies/${company_id}/contacts/`,
            service:service
          
          })
        }),
    getCompanyAddress: builder.query({
          query: (company_id) => ({
            url:`/${management_api}/companies/${company_id}/addresses/`,
            service:service
          })
        }),
  }),
});


export const { 
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useGetCompanyQuery,
  useGetSupplersQuery,
  useGetCompanyDataQuery,
  useGetManufacturersQuery,
  useGetCustomerQuery,
  useGetCompanyAddressQuery,
  useGetCompanyContactPersonQuery
} = companyApiSlice;



export const companyAddressApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    createCompanyAddress: builder.mutation({
      query: (AddressDataInterface: Partial<CompanyAddressDataInterface>) => ({
        url: `/${management_api}/company-addresses/`,
        method: 'POST',
        body: AddressDataInterface,
        service: service,
      }),
    }),
    
    updateCompanyAddress: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/company-addresses/${id}/`,
        method: 'PATCH',
        body: data,
        service:service
      }),
    }),
  
    getCompanyAddresses: builder.query({
      query: (company_id) => ({
        url:`/${management_api}/companies/${company_id}/addresses/`,
        service:service
      })
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
        body: AddressDataInterface,
        service:service

      }),
    }),
    
    updateContactPerson: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/company-contacts/${id}/`,
        method: 'PATCH',
        body: data,
        service:service

      }),
    }),
    
    getContactPerson: builder.query({
      query: (company_id) => ({
        url:`/${management_api}/companies/${company_id}/contacts/`,
        service:service
      
      })
    }),
  
  }),

});

export const {
  useCreateContactPersonMutation,
  useUpdateContactPersonMutation,
  useGetContactPersonQuery
} = ContactPersonApiSlice;
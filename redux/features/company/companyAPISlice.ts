import { apiSlice } from "../../services/apiSlice";
import { buildQuery } from "../common/queryParams";
import type {
  CompanyAddressDataInterface,
  CompanyAddressInterface,
  CompanyDataInterface,
  CompanyListParams,
  ContactPersonInterface,
  PaginatedCompanyResponse,
} from "./companyTypes";

const companyApi = "company_api";
const service = "inventory";

type EntityId = string | number;

export const companyApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listCompanies: builder.query<CompanyDataInterface[], CompanyListParams | void>({
      query: (params) => ({
        url: buildQuery(`/${companyApi}/companies/`, params),
        service,
      }),
    }),

    listCompanyPage: builder.query<PaginatedCompanyResponse, CompanyListParams>({
      query: (params) => ({
        url: buildQuery(`/${companyApi}/companies/`, params),
        service,
      }),
    }),

    createCompany: builder.mutation<CompanyDataInterface, Partial<CompanyDataInterface>>({
      query: (companyData) => ({
        url: `/${companyApi}/companies/`,
        method: "POST",
        body: companyData,
        service,
      }),
    }),

    updateCompany: builder.mutation<CompanyDataInterface, { id: EntityId; data: Partial<CompanyDataInterface> }>({
      query: ({ id, data }) => ({
        url: `/${companyApi}/companies/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),

    getCompany: builder.query<CompanyDataInterface, EntityId>({
      query: (id) => ({
        url: `/${companyApi}/companies/${id}/`,
        service,
      }),
    }),

    deleteCompany: builder.mutation<void, EntityId>({
      query: (id) => ({
        url: `/${companyApi}/companies/${id}/`,
        method: "DELETE",
        service,
      }),
    }),

    getSupplers: builder.query<CompanyDataInterface[], void>({
      query: () => ({
        url: buildQuery(`/${companyApi}/companies/`, { is_supplier: true }),
        service,
      }),
    }),

    getManufacturers: builder.query<CompanyDataInterface[], void>({
      query: () => ({
        url: buildQuery(`/${companyApi}/companies/`, { is_manufacturer: true }),
        service,
      }),
    }),

    getCustomer: builder.query<CompanyDataInterface[], void>({
      query: () => ({
        url: buildQuery(`/${companyApi}/companies/`, { is_customer: true }),
        service,
      }),
    }),

    getCompanyData: builder.query<CompanyDataInterface[], CompanyListParams | string | void>({
      query: (params) => ({
        url:
          typeof params === "string"
            ? buildQuery(`/${companyApi}/companies/`, { search: params })
            : buildQuery(`/${companyApi}/companies/`, params),
        service,
      }),
    }),

    getCompanyAddress: builder.query<CompanyAddressInterface[], EntityId>({
      query: (companyId) => ({
        url: `/${companyApi}/companies/${companyId}/addresses/`,
        service,
      }),
    }),

    getCompanyContactPerson: builder.query<ContactPersonInterface[], EntityId>({
      query: (companyId) => ({
        url: `/${companyApi}/companies/${companyId}/contacts/`,
        service,
      }),
    }),

    createCompanyAddress: builder.mutation<CompanyAddressInterface, Partial<CompanyAddressDataInterface>>({
      query: (addressData) => ({
        url: `/${companyApi}/company-addresses/`,
        method: "POST",
        body: addressData,
        service,
      }),
    }),

    updateCompanyAddress: builder.mutation<CompanyAddressInterface, { id: EntityId; data: Partial<CompanyAddressDataInterface> }>({
      query: ({ id, data }) => ({
        url: `/${companyApi}/company-addresses/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),

    deleteCompanyAddress: builder.mutation<void, EntityId>({
      query: (id) => ({
        url: `/${companyApi}/company-addresses/${id}/`,
        method: "DELETE",
        service,
      }),
    }),

    getCompanyAddresses: builder.query<CompanyAddressInterface[], EntityId>({
      query: (companyId) => ({
        url: `/${companyApi}/companies/${companyId}/addresses/`,
        service,
      }),
    }),

    createContactPerson: builder.mutation<ContactPersonInterface, Partial<ContactPersonInterface>>({
      query: (contactData) => ({
        url: `/${companyApi}/company-contacts/`,
        method: "POST",
        body: contactData,
        service,
      }),
    }),

    updateContactPerson: builder.mutation<ContactPersonInterface, { id: EntityId; data: Partial<ContactPersonInterface> }>({
      query: ({ id, data }) => ({
        url: `/${companyApi}/company-contacts/${id}/`,
        method: "PATCH",
        body: data,
        service,
      }),
    }),

    deleteContactPerson: builder.mutation<void, EntityId>({
      query: (id) => ({
        url: `/${companyApi}/company-contacts/${id}/`,
        method: "DELETE",
        service,
      }),
    }),

    getContactPerson: builder.query<ContactPersonInterface[], EntityId>({
      query: (companyId) => ({
        url: `/${companyApi}/companies/${companyId}/contacts/`,
        service,
      }),
    }),
  }),
});

export const {
  useListCompaniesQuery,
  useListCompanyPageQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useGetCompanyQuery,
  useDeleteCompanyMutation,
  useGetSupplersQuery,
  useGetManufacturersQuery,
  useGetCustomerQuery,
  useGetCompanyDataQuery,
  useGetCompanyAddressQuery,
  useGetCompanyContactPersonQuery,
  useCreateCompanyAddressMutation,
  useUpdateCompanyAddressMutation,
  useDeleteCompanyAddressMutation,
  useGetCompanyAddressesQuery,
  useCreateContactPersonMutation,
  useUpdateContactPersonMutation,
  useDeleteContactPersonMutation,
  useGetContactPersonQuery,
} = companyApiSlice;

export const useListSuppliersQuery = useGetSupplersQuery;
export const useListCustomersQuery = useGetCustomerQuery;

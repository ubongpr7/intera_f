import { apiSlice } from "../../services/apiSlice";

export interface LocationOption {
  id: number;
  name: string;
  country_id?: number | null;
  region_id?: number | null;
  subregion_id?: number | null;
}

export interface SharedAddress {
  id: string;
  profile_id: string;
  label: string;
  address_line_1: string;
  address_line_2?: string;
  city: LocationOption | null;
  region: LocationOption | null;
  country: LocationOption | null;
  postal_code?: string;
  landmark?: string;
  is_primary: boolean;
  retired_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SharedAddressWrite {
  label?: string;
  address_line_1: string;
  address_line_2?: string;
  postal_code?: string;
  landmark?: string;
  country?: number | null;
  region?: number | null;
  subregion?: number | null;
  city?: number | null;
  is_primary?: boolean;
  external_reference?: string;
}

export const locationsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listSharedCountries: builder.query<LocationOption[], string | void>({
      query: (search) => ({
        url: "/api/v1/locations/countries/",
        params: search ? { search } : undefined,
        service: "subscriptions",
      }),
    }),
    listSharedRegions: builder.query<LocationOption[], { country_id?: number; search?: string } | void>({
      query: (filters) => ({
        url: "/api/v1/locations/regions/",
        params: filters || undefined,
        service: "subscriptions",
      }),
    }),
    listSharedSubregions: builder.query<LocationOption[], { region_id?: number; search?: string } | void>({
      query: (filters) => ({
        url: "/api/v1/locations/subregions/",
        params: filters || undefined,
        service: "subscriptions",
      }),
    }),
    listSharedCities: builder.query<LocationOption[], { region_id?: number; subregion_id?: number; search?: string } | void>({
      query: (filters) => ({
        url: "/api/v1/locations/cities/",
        params: filters || undefined,
        service: "subscriptions",
      }),
    }),
    listSharedAddresses: builder.query<SharedAddress[], void>({
      query: () => ({ url: "/api/v1/locations/addresses/", service: "subscriptions" }),
    }),
    getSharedAddress: builder.query<SharedAddress, string>({
      query: (addressId) => ({
        url: `/api/v1/locations/addresses/${addressId}/`,
        service: "subscriptions",
      }),
    }),
    createSharedAddress: builder.mutation<SharedAddress, SharedAddressWrite>({
      query: (address) => ({
        url: "/api/v1/locations/addresses/",
        method: "POST",
        body: address,
        service: "subscriptions",
      }),
    }),
    updateSharedAddress: builder.mutation<SharedAddress, {
      id: string;
      data: Partial<SharedAddressWrite>;
    }>({
      query: ({ id, data }) => ({
        url: `/api/v1/locations/addresses/${id}/`,
        method: "PATCH",
        body: data,
        service: "subscriptions",
      }),
    }),
    retireSharedAddress: builder.mutation<SharedAddress, string>({
      query: (id) => ({
        url: `/api/v1/locations/addresses/${id}/retire/`,
        method: "POST",
        service: "subscriptions",
      }),
    }),
  }),
});

export const {
  useListSharedCountriesQuery,
  useListSharedRegionsQuery,
  useListSharedSubregionsQuery,
  useListSharedCitiesQuery,
  useListSharedAddressesQuery,
  useGetSharedAddressQuery,
  useCreateSharedAddressMutation,
  useUpdateSharedAddressMutation,
  useRetireSharedAddressMutation,
} = locationsApiSlice;

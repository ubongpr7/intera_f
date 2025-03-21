import { get } from 'http';
import { apiSlice } from '../../services/apiSlice';

import { DropdownOption } from '../../../components/interfaces/common';

const common_api='common_api'
interface TypeOfData {
  id: number;
  name: string;
  which_model: string;
  slug: string;
  is_active: boolean;
  parent: number | null;
  description: string | null;
  children?: TypeOfData[];
}

export const typeOfApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getTypesByModel: builder.query<TypeOfData[], string>({
      query: (forWhichModel) => ({
        url: `/${common_api}/types/`,
        params: { for_which_model: forWhichModel },
      }),
      
    }),
  }),
});

export const { 
  useGetTypesByModelQuery 
} = typeOfApiSlice;


interface Currency {
  code: string;
  name: string;
}
interface CurrencyInterface {
  id: string;
  code: string;
  name: string;
}

export const currencyApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getCurrencies: builder.query<Currency[], void>({
      query: () => `/${common_api}/currencies/`,
      
    }),
    getCurrency: builder.query<CurrencyInterface[], void>({
      query: () => `/${common_api}/currency/`,
      
    }),
  }),
});

export const { 
  useGetCurrenciesQuery ,
  useGetCurrencyQuery
} = currencyApiSlice;

export const commonApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    
    getUnits: builder.query<Currency[], void>({
      query: () => `/${common_api}/units/`,
      
    }),
  }),
});

export const { 
  useGetUnitsQuery
} = commonApiSlice;

export const dropdownApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCountries: builder.query<DropdownOption[], void>({
      query: () => `/${common_api}/countries/`,
    }),
    getRegions: builder.query<DropdownOption[], number>({
      query: (countryId) => `/${common_api}/regions/?country_id=${countryId}`,
    }),
    getSubregions: builder.query<DropdownOption[], number>({
      query: (regionId) => `/${common_api}/subregions/?region_id=${regionId}`,
    }),
    getCities: builder.query<DropdownOption[], number>({
      query: (subregionId) => `/${common_api}/cities/?subregion_id=${subregionId}`,
    }),
  }),
});

export const {
  useGetCountriesQuery,
  useGetRegionsQuery,
  useGetSubregionsQuery,
  useGetCitiesQuery,
} = dropdownApiSlice;
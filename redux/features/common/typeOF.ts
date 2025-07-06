import { get } from 'http';
import { apiSlice } from '../../services/apiSlice';

import { DropdownOption } from '../../../components/interfaces/common';

const common_api='common_api'
const service ='common'
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
        service:service,
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
    
    getCurrency: builder.query<CurrencyInterface[], void>({
      query: () =>({
        url: `/${common_api}/currency/`,
        service:service,
      })
      
    }),
  }),
});

export const { 
  useGetCurrencyQuery
} = currencyApiSlice;

export const commonApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    
    getUnits: builder.query<Currency[], void>({
      query: () =>({
        url: `/${common_api}/units/`,
        service:service,

      }),
      
    }),
  }),
});

export const { 
  useGetUnitsQuery
} = commonApiSlice;

export const dropdownApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCountries: builder.query<DropdownOption[], void>({
      query: () => ({
        url:`/${common_api}/countries/`,
        service:service,
      
      })
      
    }),
    getRegions: builder.query<DropdownOption[], number>({
      query: (countryId) => ({
        url:`/${common_api}/regions/?country_id=${countryId}`,
        service:service,

      })
    }),
    getSubregions: builder.query<DropdownOption[], number>({
      query: (regionId) =>({
        url: `/${common_api}/subregions/?region_id=${regionId}`,
        service:service,

      })
    }),
    getCities: builder.query<DropdownOption[], number>({
      query: (subregionId) => ({
        url:`/${common_api}/cities/?subregion_id=${subregionId}`,
        service:service,
      })
    }),
  }),
});

export const {
  useGetCountriesQuery,
  useGetRegionsQuery,
  useGetSubregionsQuery,
  useGetCitiesQuery,
} = dropdownApiSlice;
import { apiSlice } from '../../services/apiSlice';
import { StockItem, StockLocation, StockLocationType  } from '../../../components/interfaces/stock';
const management_api='stock_api'
interface StockItemData {
  reference: string;
  stockData: Partial<StockItem>;
}
export const stockApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    createStockItem: builder.mutation({
      query: (stockData: Partial<StockItem>) => ({
        url: `/${management_api}/stock_items/`,
        method: 'POST',
        body: stockData
      }),
    }),
    
    updateStockItem: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/stock_item/${id}/`,
        method: 'PATCH',
        body: data
      }),
    }),
    getStockItem: builder.query({
      query: (id) => `/${management_api}/stock_item/${id}/`,
    }),
  
    getStockItemData: builder.query<StockItem[], string>({
      query: (reference) => ({
        url: `/${management_api}/stock_items/?reference=${reference}`,
        method: 'GET',
      }),
    }),
    createStockItemLocation: builder.mutation({
      query: (stockData: Partial<StockLocation>) => ({
        url: `/${management_api}/stock_locations/`,
        method: 'POST',
        body: stockData
      }),
    }),
    
    updateStockItemLocation: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/stock_locations/${id}/`,
        method: 'PATCH',
        body: data
      }),
    }),
    getStockItemLocation: builder.query({
      query: (id) => `/${management_api}/stock_locations/${id}/`,
    }),
  
    getStockItemDataLocation: builder.query<StockLocation[], void>({
      query: () => ({
        url: `/${management_api}/stock_locations/`,
        method: 'GET',
      }),
    }),
    getFilteredStockItemDataLocation: builder.query({
        query: (reference) => ({
            url: `/${management_api}/stock_locations/?reference=${reference}`,
            method: 'GET',
        }),
        
    }),
      getStockLocationTypes: builder.query<StockLocationType[], string>({
        query: () => ({
          url: `/${management_api}/stock_location_types/`,
        }),
        
      }),
  }),
  
});

export const { 
  useCreateStockItemMutation,
  useUpdateStockItemMutation,
  useGetStockItemQuery,
  useGetStockItemDataQuery,

  useCreateStockItemLocationMutation,
  useUpdateStockItemLocationMutation,
  useGetStockItemLocationQuery,
  useGetStockItemDataLocationQuery,
    useGetFilteredStockItemDataLocationQuery,

    useGetStockLocationTypesQuery,
} = stockApiSlice ;
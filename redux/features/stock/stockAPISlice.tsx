import { apiSlice } from '../../services/apiSlice';
import { StockItem, StockLocation, StockLocationType  } from '../../../components/interfaces/stock';
const management_api='stock_api';
const service ='inventory';

interface StockItemData {
  reference: string;
  stockData: Partial<StockItem>;
}
export const stockApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    createStockItem: builder.mutation({
      query: (stockData: Partial<StockItem>) => ({
        url: `/${management_api}/stock-items/`,
        method: 'POST',
        body: stockData,
				service:service,
      }),
    }),
    
    updateStockItem: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/stock-item/${id}/`,
        method: 'PATCH',
        body: data,
				service:service,
      }),
    }),
    getStockItem: builder.query({
      query: (id) => ({
        url:`/${management_api}/stock-item/${id}/`,
				service:service,
    }),
  }),
  
    getStockItemDataForInventory: builder.query<StockItem[], string>({
      query: (inventory_id) => ({
        url: `/${management_api}/stock-items/get_inventory_items/?inventory_id=${inventory_id}`,
        method: 'GET',
				service:service,
      }),
    }),
    getStockItemData: builder.query<StockItem[], string>({
      query: () => ({
        url: `/${management_api}/stock-items/`,
        method: 'GET',
				service:service,
      }),
    }),
    createStockItemLocation: builder.mutation({
      query: (stockData: Partial<StockLocation>) => ({
        url: `/${management_api}/locations/`,
        method: 'POST',
        body: stockData,
				service:service,
      }),
    }),
    
    updateStockItemLocation: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/locations/${id}/`,
        method: 'PATCH',
        body: data,
				service:service,
      }),
    }),
    getStockItemLocation: builder.query({
      query: (id) => ({
        url:`/${management_api}/locations/${id}/`,
				service:service,
      
      }),
    }),
  
    getStockItemDataLocation: builder.query<StockLocation[], void>({
      query: () => ({
        url: `/${management_api}/locations/`,
        method: 'GET',
				service:service,

      }),
    }),
    getFilteredStockItemDataLocation: builder.query({
        query: (reference) => ({
            url: `/${management_api}/locations/?reference=${reference}`,
            method: 'GET',
				service:service,
        }),
    }),
      getStockLocationTypes: builder.query<StockLocationType[], string>({
        query: () => ({
          url: `/${management_api}/location-types/`,
				service:service,
        }),
        
      }),
  }),
  
});

export const { 
  useCreateStockItemMutation,
  useUpdateStockItemMutation,
  useGetStockItemQuery,
  useGetStockItemDataQuery,
  useGetStockItemDataForInventoryQuery,

  useCreateStockItemLocationMutation,
  useUpdateStockItemLocationMutation,
  useGetStockItemLocationQuery,
  useGetStockItemDataLocationQuery,
    useGetFilteredStockItemDataLocationQuery,

    useGetStockLocationTypesQuery,
} = stockApiSlice ;
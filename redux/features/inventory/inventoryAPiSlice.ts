import { apiSlice } from '../../services/apiSlice';
import { CategoryData, InventoryData } from '../../../components/interfaces/inventory';
const management_api='inventory_api'
const service = 'inventory'
export const inventoryApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    createInventory: builder.mutation({
      query: (inventoryData: Partial<InventoryData>) => ({
        url: `/${management_api}/inventories/`,
        method: 'POST',
        body: inventoryData,
				service:service,
      }),
    }),
    createCategory: builder.mutation({
      query: (data: Partial<CategoryData>) => ({
        url: `/${management_api}/categories/`,
        method: 'POST',
        body: data,
				service:service,

      }),
    }),
    updateInventory: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/inventories/${id}/`,
        method: 'PATCH',
        body: data,
				service:service,
      }),
    }),
    getInventory: builder.query({
      query: (id) => `/${management_api}/inventories/${id}/`,
    }),
    getMinimalInventory: builder.query<InventoryData,string>({
      query: (id) => `/${management_api}/inventories/${id}/minimal_inventory/`,
    }),
  
    getInventoryCategories: builder.query({
      query: () => `/${management_api}/categories/`,
    }),
  
    getInventoryData: builder.query<InventoryData[], void>({
      query: () => ({
        url: `/${management_api}/inventories/`,
        method: 'GET',
				service:service,
      }),
    }),
  }),
  // overrideExisting: true,

});

export const { 
  useCreateInventoryMutation,
  useCreateCategoryMutation,
  useUpdateInventoryMutation,
  useGetInventoryQuery,
  useGetMinimalInventoryQuery,
  useGetInventoryCategoriesQuery,
  useGetInventoryDataQuery
} = inventoryApiSlice;
import { apiSlice } from '../../services/apiSlice';
import { CategoryData, InventoryData } from '../../../components/interfaces/inventory';
const management_api='inventory_api'
export const inventoryApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    createInventory: builder.mutation({
      query: (inventoryData: Partial<InventoryData>) => ({
        url: `/${management_api}/inventories/`,
        method: 'POST',
        body: inventoryData
      }),
    }),
    createCategory: builder.mutation({
      query: (data: Partial<CategoryData>) => ({
        url: `/${management_api}/categories/create/`,
        method: 'POST',
        body: data
      }),
    }),
    updateInventory: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/inventory/${id}/`,
        method: 'PATCH',
        body: data
      }),
    }),
    getInventory: builder.query({
      query: (id) => `/${management_api}/inventories/${id}/`,
    }),
  
    getInventoryCategories: builder.query({
      query: () => `/${management_api}/categories/`,
    }),
  
    getInventoryData: builder.query<InventoryData[], void>({
      query: () => ({
        url: `/${management_api}/inventories/list/`,
        method: 'GET',
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
  useGetInventoryCategoriesQuery,
  useGetInventoryDataQuery
} = inventoryApiSlice;
import { apiSlice } from '../../services/apiSlice';
import { PurchaseOrderInterface  } from '../../../components/interfaces/order';
const management_api='order_api'
export const purchaseOderApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    createPurchaseOder: builder.mutation({
      query: (PurchaseOderData: Partial<PurchaseOrderInterface>) => ({
        url: `/${management_api}/purchase_orders/`,
        method: 'POST',
        body: PurchaseOderData
      }),
    }),
    
    updatePurchaseOder: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/purchase_orders/${id}/`,
        method: 'PATCH',
        body: data
      }),
    }),
    getPurchaseOder: builder.query({
      query: (id) => `/${management_api}/purchase_order/${id}/`,
    }),
  
    // getPurchaseOderCategories: builder.query({
    //   query: () => `/${management_api}/category/`,
    // }),
  
    getPurchaseOderData: builder.query({
      query: () => ({
        url: `/${management_api}/purchase_orders/`,
        method: 'GET',
      }),
    }),
  }),
  // overrideExisting: true,

});

export const { 
  useCreatePurchaseOderMutation,
  useUpdatePurchaseOderMutation,
  useGetPurchaseOderQuery,
//   useGetPurchaseOderCategoriesQuery,
  useGetPurchaseOderDataQuery
} = purchaseOderApiSlice ;
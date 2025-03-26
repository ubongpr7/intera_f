import { apiSlice } from '../../services/apiSlice';
import { PurchaseOrderInterface  } from '../../../components/interfaces/order';
const management_api='order_api'
export const purchaseOderApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    createPurchaseOder: builder.mutation({
      query: (PurchaseOderData: Partial<PurchaseOrderInterface>) => ({
        url: `/${management_api}/purchase_order/`,
        method: 'POST',
        body: PurchaseOderData
      }),
    }),
    
    updatePurchaseOder: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/purchase-order/update/${id}/`,
        method: 'PATCH',
        body: data
      }),
    }),
    getPurchaseOder: builder.query({
      query: (id) => `/${management_api}/purchase-order/item/${id}/`,
    }),
  
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
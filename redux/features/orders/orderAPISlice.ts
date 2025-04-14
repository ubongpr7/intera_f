import { apiSlice } from '../../services/apiSlice';
import { PurchaseOrderInterface, PurchaseOrderLineItem  } from '../../../components/interfaces/order';
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


    getPurchseOrderLineItems: builder.query({
      query: (reference) => ({
        url: `/${management_api}/line-item/?reference=${reference}`,
        method: 'GET',
      }),
    }),
    createPurchaseOrderLineItem: builder.mutation({
      query: (  data:Partial<PurchaseOrderLineItem> ) => ({
        url: `/${management_api}/line-item/`,
        method: 'POST',
        body: data
      }),
    }),
    updatePurchaseOrderLineItem: builder.mutation({
      query: ({ reference,id, data }) => ({
        url: `/${management_api}/line-item/${id}/?reference=${reference}`,
        method: 'PATCH',
        body: data
      }),
    }),
    deletePurchaseOrderLineItem: builder.mutation({
      query: ({reference,id}) => ({
        url: `/${management_api}/line-item/${id}/?reference=${reference}`,
        method: 'DELETE',
      }),
    }),

    
  }),
  
});

export const { 
  useCreatePurchaseOderMutation,
  useUpdatePurchaseOderMutation,
  useGetPurchaseOderQuery,

  useGetPurchaseOderDataQuery,

  useGetPurchseOrderLineItemsQuery,
  useCreatePurchaseOrderLineItemMutation,
  useUpdatePurchaseOrderLineItemMutation,
  useDeletePurchaseOrderLineItemMutation,
  
} = purchaseOderApiSlice ;


export const purchaseOderManagementApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    approvePurchaseOder: builder.mutation({
      query: (id) => ({
        url: `/${management_api}/purchase-orders/${id}/approve/`,
        method: 'PUT',
      }),
    }),
    issuePurchaseOder: builder.mutation({
      query: (id) => ({
        url: `/${management_api}/purchase-orders/${id}/issue/`,
        method: 'PUT',
      }),
    }),
    receivePurchaseOder: builder.mutation({
      query: (id) => ({
        url: `/${management_api}/purchase-orders/${id}/receive/`,
        method: 'PUT',
      }),
    }),
    completePurchaseOder: builder.mutation({
      query: (id) => ({
        url: `/${management_api}/purchase-orders/${id}/complete/`,
        method: 'PUT',
      }),
    }),
  }),
  
});

export const { 
  useApprovePurchaseOderMutation,
  useIssuePurchaseOderMutation,
  useReceivePurchaseOderMutation,
  useCompletePurchaseOderMutation,
} = purchaseOderManagementApiSlice ;
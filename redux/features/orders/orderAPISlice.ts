import { apiSlice } from '../../services/apiSlice';
import { PurchaseOrderInterface, PurchaseOrderLineItem  } from '../../../components/interfaces/order';
const management_api='order_api';
const service = 'inventory';
export const purchaseOderApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    createPurchaseOder: builder.mutation({
      query: (PurchaseOderData: Partial<PurchaseOrderInterface>) => ({
        url: `/${management_api}/purchase-orders/`,
        method: 'POST',
        body: PurchaseOderData,
        service: service,
      }),
    }),
    
    updatePurchaseOder: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${management_api}/purchase-orders/${id}/`,
        method: 'PATCH',
        body: data,
        service: service,
      }),
    }),
    getPurchaseOder: builder.query({
      query: (id) =>({
        url: `/${management_api}/purchase-orders/${id}/`,
        service: service,
      })
    }),
  
    getPurchaseOderData: builder.query({
      query: () => ({
        url: `/${management_api}/purchase-orders/`,
        method: 'GET',
        service: service,
      }),
    }),


    getPurchseOrderLineItems: builder.query({
      query: (reference) => ({
        url: `/${management_api}/line-item/?reference=${reference}`,
        method: 'GET',
        service: service,
      }),
    }),
    createPurchaseOrderLineItem: builder.mutation({
      query: (  data:Partial<PurchaseOrderLineItem> ) => ({
        url: `/${management_api}/line-item/`,
        method: 'POST',
        body: data,
        service: service,
      }),
    }),
    updatePurchaseOrderLineItem: builder.mutation({
      query: ({ reference,id, data }) => ({
        url: `/${management_api}/line-item/${id}/?reference=${reference}`,
        method: 'PATCH',
        body: data,
        service: service,
      }),
    }),
    deletePurchaseOrderLineItem: builder.mutation({
      query: ({reference,id}) => ({
        url: `/${management_api}/line-item/${id}/?reference=${reference}`,
        method: 'DELETE',
        service: service,
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
        service: service,
      }),
    }),
    issuePurchaseOder: builder.mutation({
      query: (id) => ({
        url: `/${management_api}/purchase-orders/${id}/issue/`,
        method: 'PUT',
        service: service,
      }),
    }),
    receivePurchaseOder: builder.mutation({
      query: (id) => ({
        url: `/${management_api}/purchase-orders/${id}/receive/`,
        method: 'PUT',
        service: service,
      }),
    }),
    completePurchaseOder: builder.mutation({
      query: (id) => ({
        url: `/${management_api}/purchase-orders/${id}/complete/`,
        method: 'PUT',
        service: service,
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
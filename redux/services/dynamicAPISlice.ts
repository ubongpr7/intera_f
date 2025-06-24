
// export type MicroserviceName = 'user' | 'order' | 'product'|'inventory'

// export const serviceMap: Record<MicroserviceName, string> = {
//   user: process.env.NEXT_PUBLIC_ORDER_SERVICE_URL!,
//   order: process.env.NEXT_PUBLIC_ORDER_SERVICE_URL!,
//   product: process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL!,
//   inventory: process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL!,
  
// }

// // services/baseApi.ts
// import {
//   createApi,
//   fetchBaseQuery,
//   FetchArgs,
//   BaseQueryFn,
// } from '@reduxjs/toolkit/query/react'

// type CustomArgs = {
//   service: MicroserviceName
//   path: string
// } & Omit<FetchArgs, 'url'>

// const customBaseQuery: BaseQueryFn<CustomArgs, unknown, unknown> = async (
//   args,
//   api,
//   extraOptions
// ) => {
//   const { service, path, ...rest } = args
//   const baseUrl = serviceMap[service]
//   if (!baseUrl) throw new Error(`Service not defined: ${service}`)

//   const fetchFn = fetchBaseQuery({ baseUrl })
// return fetchFn( url: path, ...rest , api, extraOptions)


// export const baseApi = createApi(
//   reducerPath: 'api',
//   baseQuery: customBaseQuery,
//   endpoints: () => (),
// )
// “`

// —

// ✅ 3. *Inject endpoints with type safety*

// “`ts
// // services/orderApi.ts
// import  baseApi  from './baseApi'
// import env from '@/env_file'

// type Order = 
//   id: string
//   total: number


// export const orderApi = baseApi.injectEndpoints(
//   endpoints: (builder) => (
//     getOrder: builder.query<Order, string>(
//       query: (id) => (
//         service: 'order',
//         path: `/orders/{id}`,
//       }),
//     }),
//   }),
// })

// export const { useGetOrderQuery } = orderApi

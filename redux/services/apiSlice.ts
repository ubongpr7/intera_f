// import {createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
// import type {
//   BaseQueryFn,
//   FetchArgs,
//   FetchBaseQueryError,
// } from '@reduxjs/toolkit/query'
// // import { tokenReceived, loggedOut } from './authSlice'
// import { setAuth,logout } from '../features/authSlice'
// import { Mutex } from 'async-mutex'
// import { url } from 'inspector'
// import env from '@/env_file'

// // create a new mutex
// const mutex = new Mutex()
// const baseQuery = fetchBaseQuery({ 
//   baseUrl: env.BACKEND_HOST_URL,
//   credentials: 'include',
// })
// const baseQueryWithReauth: BaseQueryFn<
//   string | FetchArgs,
//   unknown,
//   FetchBaseQueryError
// > = async (args, api, extraOptions) => {
//   await mutex.waitForUnlock()
//   let result = await baseQuery(args, api, extraOptions)
//   if (result.error && result.error.status === 401) {
//     if (!mutex.isLocked()) {
//       const release = await mutex.acquire()
//       try {
//         const refreshResult = await baseQuery(
//           {
//             url: '/jwt/refresh/',
//             method: 'POST',
//           },
//           api,
//           extraOptions
//         )
//         if (refreshResult.data) {
//           api.dispatch(setAuth())
//           // retry the initial query
//           result = await baseQuery(args, api, extraOptions)
//         } else {
//           api.dispatch(logout())
//         }
//       } finally {
//         // release must be called once the mutex should be released again.
//         release()
//       }
//     } else {
//       // wait until the mutex is available without locking it
//       await mutex.waitForUnlock()
//       result = await baseQuery(args, api, extraOptions)
//     }
//   }
//   return result
// }
// export const apiSlice=createApi({
//   reducerPath:'api',
//   baseQuery:baseQueryWithReauth,
//   endpoints:builder=>({})
// })


import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { setAuth, logout } from "../features/authSlice";
import { Mutex } from "async-mutex";
import { setCookie, getCookie, deleteCookie } from "cookies-next";
import env from "@/env_file";
import { setUserDataFromToken } from "@/utils";

// Mutex prevents multiple simultaneous token refresh requests
const mutex = new Mutex();

const baseQuery = fetchBaseQuery({
  baseUrl: env.BACKEND_HOST_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = getCookie("accessToken"); 
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  await mutex.waitForUnlock();
  let result = await baseQuery(args, api, extraOptions);

  // Store tokens after login
  if (result?.data && ((args as FetchArgs).url === "/jwt/create/" || (args as FetchArgs).url === "/jwt/refresh/")) {
    const response = result.data as { access: string; refresh: string,access_token:string,id:string };
    setCookie("accessToken", response.access, { maxAge: 72*60 * 60, path: "/" });
    setCookie("refreshToken", response.refresh, { maxAge: 60 * 60 * 24 * 7, path: "/" });
    
    setUserDataFromToken(response?.access,response?.access_token);

    api.dispatch(setAuth()); // Update auth state in Redux
  }

  if (result.error && result.error.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const refreshToken = getCookie("refreshToken");
        if (refreshToken) {
          const refreshResult = await baseQuery(
            {
              url: "/jwt/refresh/",
              method: "POST",
              body: { refresh: refreshToken },
            },
            api,
            extraOptions
          );

          if (refreshResult.data) {
            const newAccessToken = (refreshResult.data as { access: string }).access;
            setCookie("accessToken", newAccessToken, { maxAge:72* 60 * 60, path: "/" });

            api.dispatch(setAuth()); // Update Redux state
            result = await baseQuery(args, api, extraOptions); // Retry the failed request
          } else {
            deleteCookie("accessToken");
            deleteCookie("refreshToken");
            api.dispatch(logout()); // Clear user session
          }
        } else {
          api.dispatch(logout());
        }
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};

// Create the API slice with custom query handling
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({}),
});

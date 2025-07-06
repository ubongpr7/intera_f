import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { BaseQueryFn, FetchArgs as OriginalFetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query"
import { setAuth, logout } from "../features/authSlice"
import { Mutex } from "async-mutex"
import { setCookie, getCookie, deleteCookie } from "cookies-next"
import env from "../../env_file"

export type serviceType = "users" | "inventory"| "common"|"product"|'pos'
const accessAge = 60*60*24
const refreshAge = 60*60*24
export const serviceMap: Record<serviceType, string> = {
  users: env.BACKEND_HOST_URL,
  inventory: env.INVENNTORY_BACKEND_URL,
  common: env.COMMON_BACKEND_URL,
  product: env.PRODUCT_BACKEND_URL,
  pos: env.POS_BACKEND_URL,
}

const mutex = new Mutex()

interface FetchArgs extends OriginalFetchArgs {
  meta?: {
    isFileUpload?: boolean
  }
  service?: serviceType
}

// Create base queries for each service
const createBaseQuery = (baseUrl: string, isFileUpload = false) => {
  return fetchBaseQuery({
    baseUrl,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const token = getCookie("accessToken")
      const profile = getCookie("profile")

      if (token) {
        headers.set("Authorization", `Bearer ${token}`)
      }

      if (profile) {
        headers.set("X-Profile-ID", `${profile}`)
      }

      if (!isFileUpload) {
        headers.set("Content-Type", "application/json")
      }
      headers.set("X-Requested-With", "XMLHttpRequest")
      return headers
    },
  })
}

// Create base queries for each service
const baseQueries = {
  users: createBaseQuery(serviceMap.users),
  inventory: createBaseQuery(serviceMap.inventory),
  common: createBaseQuery(serviceMap.common),
  product: createBaseQuery(serviceMap.product),
  pos: createBaseQuery(serviceMap.pos),
}

const fileUploadQueries = {
  users: createBaseQuery(serviceMap.users, true),
  inventory: createBaseQuery(serviceMap.inventory, true),
  common: createBaseQuery(serviceMap.common, true),
  product: createBaseQuery(serviceMap.product, true),
  pos: createBaseQuery(serviceMap.pos, true),
}

// Helper function to determine if the request is a file upload
const isFileUpload = (args: string | FetchArgs): boolean => {
  if (typeof args === "string") return false
  if (args.body instanceof FormData) return true
  return args.meta?.isFileUpload === true
}

// Determine the service based on the URL or explicit service parameter
const getServiceForEndpoint = (args: string | FetchArgs): serviceType => {
  if (typeof args === "string") {
    // Default service for string URLs
    return "users"
  }

  // Check if service is explicitly specified
  if (args.service) {
    return args.service
  }

  // Fallback: determine by URL pattern
  const url = args.url
  if (url.includes("/jwt/") || url.includes("/api/v1/accounts/")) {
    return "users"
  }
  if (url.includes("/inventory_api/")) {
    return "inventory"
  }

  // Default to users
  return "users"
}

// Enhanced base query with re-authentication and service-based routing
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  await mutex.waitForUnlock()

  // Convert string args to object format for consistency
  const argsObj = typeof args === "string" ? { url: args } : args
  const service = getServiceForEndpoint(argsObj)
  const isUpload = isFileUpload(argsObj)

  // Select the appropriate base query based on service and upload type
  const appropriateBaseQuery = isUpload ? fileUploadQueries[service] : baseQueries[service]

  // Prepare the final args
  const enhancedArgs = {
    ...argsObj,
    mode: "cors" as RequestMode,
  }

  let result = await appropriateBaseQuery(enhancedArgs, api, extraOptions)

  // Handle authentication responses (only for users service)
  if (result?.data && service === "users") {
    const url = enhancedArgs.url
    if (url === "/jwt/create/" || url === "/jwt/refresh/") {
      const response = result.data as {
        access: string
        refresh: string
        access_token: string
        id: string
        profile: string
        currency:string
      }
      setCookie("accessToken", response.access, { maxAge:  accessAge, path: "/" })
      setCookie("refreshToken", response.refresh, { maxAge:refreshAge, path: "/" })
      setCookie("userID", response.id, { maxAge: refreshAge, path: "/" })
      setCookie("profile", response.profile, { maxAge: refreshAge, path: "/" })
      setCookie("currency", response.currency, { maxAge: refreshAge, path: "/" })
      api.dispatch(setAuth())
    } else if (url === "/api/v1/accounts/logout/") {
      deleteCookie("accessToken")
      deleteCookie("refreshToken")
      deleteCookie("userID")
      deleteCookie("profile")
      deleteCookie("currency")
      api.dispatch(logout())
    }
  }

  // Handle errors
  if (result.error) {
    if (result.error.status === "FETCH_ERROR" && result.error.error?.includes("CORS")) {
    }

    if (result.error.status === 401) {
      if (!mutex.isLocked()) {
        const release = await mutex.acquire()
        try {
          const refreshToken = getCookie("refreshToken")
          // const refreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc1MjY1OTUzNSwiaWF0IjoxNzUwOTMxNTM1LCJqdGkiOiJhMTFjZDY3NGZkYmQ0NTE0OTc4NGE2MjAzNGIxOTBlMiIsInVzZXJfaWQiOjEsInBlcm1pc3Npb25zIjpbInJlc3RvcmVfaW52ZW50b3J5IiwidXBkYXRlX2ludmVudG9yeV9jYXRlZ29yeSIsImNyZWF0ZV9pbnZlbnRvcnkiLCJhcmNoaXZlX2ludmVudG9yeSIsImRlbGV0ZV9pbnZlbnRvcnkiLCJ1cGRhdGVfaW52ZW50b3J5Iiwidmlld19pbnZlbnRvcnlfcmVwb3J0cyIsImFwcHJvdmVfaW52ZW50b3J5X2NhdGVnb3J5IiwicmVqZWN0X2ludmVudG9yeSIsImFwcHJvdmVfaW52ZW50b3J5IiwiY3JlYXRlX2ludmVudG9yeV9jYXRlZ29yeSIsImRlbGV0ZV9pbnZlbnRvcnlfY2F0ZWdvcnkiLCJtYW5hZ2VfaW52ZW50b3J5X3NldHRpbmdzIiwicmVhZF9pbnZlbnRvcnlfY2F0ZWdvcnkiLCJyZWFkX2ludmVudG9yeSJdLCJwcm9maWxlX2lkIjoxLCJvd25lcl9pZCI6MX0.unH-j4NY8tkE4HisouOSNeHFVn6JgvkRxeY-L_KKdY0'

          if (refreshToken) {
            // Always use users service for token refresh
            const refreshResult = await fetchBaseQuery({
                  baseUrl:env.BACKEND_HOST_URL,
                  credentials: "include",
                  prepareHeaders: (headers, { getState }) => {
              
              headers.set("Content-Type", "application/json");
              headers.set("X-Requested-With", "XMLHttpRequest");
              return headers
    },
            })(
                  
              {
                url: "/jwt/refresh/",
                method: "POST",
                body: { refresh: refreshToken },
                mode: "cors",
              },

              api,
              extraOptions,
            )

            if (refreshResult.data) {
              const data = refreshResult.data as { access: string,refresh:string }
              const newAccessToken = data.access
              
              const newRefreshToken = data.refresh
              setCookie("accessToken", newAccessToken, { maxAge:   accessAge, path: "/" })
              setCookie("refreshToken", newRefreshToken, { maxAge:   refreshAge, path: "/" })
              
              api.dispatch(setAuth())
              // Retry the original request with the new token
              result = await appropriateBaseQuery(enhancedArgs, api, extraOptions)
            } else {
              deleteCookie("accessToken")
              deleteCookie("refreshToken")
              deleteCookie("userID")
              deleteCookie("profile")
              api.dispatch(logout())
            }
          } else {
            api.dispatch(logout())
            // window.location='/accounts/signin'
            window.location.href='/accounts/signin'
          }
        } finally {
          release()
        }
      } else {
        await mutex.waitForUnlock()
        result = await appropriateBaseQuery(enhancedArgs, api, extraOptions)
      }
    }
  }

  return result
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["User", "Inventory", "Category"], // Add tag types for caching
  endpoints: (builder) => ({}),
})

export const createFileUploadRequest = (
  url: string,
  formData: FormData,
  method: "POST" | "PATCH" | "PUT" = "POST",
  service?: serviceType,
): FetchArgs => {
  return {
    url,
    method,
    body: formData,
    meta: { isFileUpload: true },
    service,
    mode: "cors",
  }
}

// Helper function to create service-specific requests
export const createServiceRequest = (
  url: string,
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE" = "GET",
  service: serviceType,
  body?: any,
): FetchArgs => {
  return {
    url,
    method,
    body,
    service,
    mode: "cors",
  }
}

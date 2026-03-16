import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { BaseQueryFn, FetchArgs as OriginalFetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query"
import { setAuth, logout } from "../features/authSlice"
import { Mutex } from "async-mutex"
import { setCookie, getCookie, deleteCookie } from "cookies-next"
import { AUTH_COOKIE_NAMES, AUTH_COOKIE_KEYS, readCookieValue } from "@/lib/authCookies"
const BACKEND_HOST_URL = process.env.NEXT_PUBLIC_BACKEND_HOST_URL ?? ''
const COMMON_BACKEND_URL = process.env.NEXT_PUBLIC_COMMON_BACKEND_URL ?? ''
const INVENNTORY_BACKEND_URL = process.env.NEXT_PUBLIC_INVENNTORY_BACKEND_URL ?? ''
const PRODUCT_BACKEND_URL = process.env.NEXT_PUBLIC_PRODUCT_BACKEND_URL ?? ''
const POS_BACKEND_URL = process.env.NEXT_PUBLIC_POS_BACKEND_URL ?? ''
const AGENT_BACKEND_URL = process.env.NEXT_PUBLIC_AGENT_BACKEND_URL ?? ''
const PAYMENT_BACKEND_URL = process.env.NEXT_PUBLIC_PAYMENT_BACKEND_URL ?? ''

export type serviceType = "users" | "inventory"| "common"|"product"|'pos'| "agent"|'payment'
const accessAge = 60*60*24
const refreshAge = 60*60*24
export const serviceMap: Record<serviceType, string> = {
  users: BACKEND_HOST_URL,
  inventory: INVENNTORY_BACKEND_URL,
  common: COMMON_BACKEND_URL,
  product: PRODUCT_BACKEND_URL,
  pos: POS_BACKEND_URL,
  agent: AGENT_BACKEND_URL,
  payment: PAYMENT_BACKEND_URL,
}

const mutex = new Mutex()

interface FetchArgs extends OriginalFetchArgs {
  meta?: {
    isFileUpload?: boolean
  }
  service?: serviceType
}

interface ProfileContext {
  id?: string | number | null
  company_code?: string | null
  currency?: string | null
}

interface AuthResponsePayload {
  access?: string
  refresh?: string
  id?: string | number
  profile?: string | number | null
  profile_context?: ProfileContext | null
  currency?: string | null
  model_name?: string | null
  provider?: string | null
  agent_name?: string | null
}

const AUTH_RESPONSE_URLS = new Set(["/auth/login/", "/auth/refresh/", "/auth/switch-company/", "/accounts/mfa/verify/"])
const AUTH_LOGOUT_URLS = new Set(["/auth/logout/", "/api/v1/accounts/logout/"])

const readAuthCookie = (key: keyof typeof AUTH_COOKIE_NAMES): string | undefined =>
  readCookieValue(key, (name) => getCookie(name))

const setAuthCookie = (key: keyof typeof AUTH_COOKIE_NAMES, value: string, maxAge: number) => {
  setCookie(AUTH_COOKIE_NAMES[key], value, {
    maxAge,
    path: "/",
    sameSite: "lax",
  })
}

const deleteAuthCookie = (key: keyof typeof AUTH_COOKIE_NAMES) => {
  const currentName = AUTH_COOKIE_NAMES[key]
  deleteCookie(currentName)
  if (currentName !== key) {
    deleteCookie(key)
  }
}

const persistAuthSession = (response: AuthResponsePayload) => {
  const profileContext = response.profile_context ?? {}
  const activeProfileId = profileContext.id ?? response.profile ?? null
  const companyCode = profileContext.company_code ?? null
  const currency = response.currency ?? profileContext.currency ?? null

  if (response.access) {
    setAuthCookie("accessToken", response.access, accessAge)
  }
  if (response.refresh) {
    setAuthCookie("refreshToken", response.refresh, refreshAge)
  }
  if (response.id !== undefined && response.id !== null) {
    setAuthCookie("userID", `${response.id}`, refreshAge)
  }
  if (activeProfileId !== undefined && activeProfileId !== null && `${activeProfileId}`.length > 0) {
    setAuthCookie("profileId", `${activeProfileId}`, refreshAge)
    setAuthCookie("profile", `${activeProfileId}`, refreshAge)
  } else {
    deleteAuthCookie("profileId")
    deleteAuthCookie("profile")
  }
  if (companyCode) {
    setAuthCookie("companyCode", companyCode, refreshAge)
  } else {
    deleteAuthCookie("companyCode")
  }
  if (currency) {
    setAuthCookie("currency", currency, refreshAge)
  } else {
    deleteAuthCookie("currency")
  }
  if (response.model_name) {
    setAuthCookie("model_name", response.model_name, accessAge)
  } else {
    deleteAuthCookie("model_name")
  }
  if (response.provider) {
    setAuthCookie("provider", response.provider, accessAge)
  } else {
    deleteAuthCookie("provider")
  }
  if (response.agent_name) {
    setAuthCookie("agent_name", response.agent_name, accessAge)
  } else {
    deleteAuthCookie("agent_name")
  }
  deleteAuthCookie("api_key")
  deleteAuthCookie("tavily_api_key")
}

const clearAuthSession = () => {
  for (const key of AUTH_COOKIE_KEYS) {
    deleteAuthCookie(key)
  }
}

// Create base queries for each service
const createBaseQuery = (baseUrl: string, isFileUpload = false) => {
  return fetchBaseQuery({
    baseUrl,
    credentials: "include",
    timeout: 600000,
    prepareHeaders: (headers) => {
      const token = readAuthCookie("accessToken")
     
      if (token) {
        headers.set("Authorization", `Bearer ${token}`)
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
  agent: createBaseQuery(serviceMap.agent),
  payment: createBaseQuery(serviceMap.payment),
}

const fileUploadQueries = {
  users: createBaseQuery(serviceMap.users, true),
  inventory: createBaseQuery(serviceMap.inventory, true),
  common: createBaseQuery(serviceMap.common, true),
  product: createBaseQuery(serviceMap.product, true),
  pos: createBaseQuery(serviceMap.pos, true),
  agent: createBaseQuery(serviceMap.agent, true),
  payment: createBaseQuery(serviceMap.payment, true),

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
  if (
    url.includes("/jwt/") ||
    url.includes("/api/v1/accounts/") ||
    url.includes("/auth/") ||
    url.includes("/accounts/") ||
    url.includes("/djoser/")
  ) {
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
    if (AUTH_RESPONSE_URLS.has(url) || url.startsWith("/auth/o/")) {
      persistAuthSession(result.data as AuthResponsePayload)
      api.dispatch(setAuth())
    } else if (AUTH_LOGOUT_URLS.has(url)) {
      clearAuthSession()
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
          const refreshToken = readAuthCookie("refreshToken")

          if (refreshToken) {
            // Always use users service for token refresh
            const refreshResult = await fetchBaseQuery({
                  baseUrl:BACKEND_HOST_URL,
                  credentials: "include",
                  prepareHeaders: (headers) => {
              headers.set("Content-Type", "application/json");
              headers.set("X-Requested-With", "XMLHttpRequest");
              return headers
    },
            })(
                  
              {
                url: "/auth/refresh/",
                method: "POST",
                body: { refresh: refreshToken },
                mode: "cors",
              },

              api,
              extraOptions,
            )

            if (refreshResult.data) {
              persistAuthSession(refreshResult.data as AuthResponsePayload)
              api.dispatch(setAuth())
              // Retry the original request with the new token
              result = await appropriateBaseQuery(enhancedArgs, api, extraOptions)
            } else {
              clearAuthSession()
              api.dispatch(logout())
            }
          } else {
            clearAuthSession()
            api.dispatch(logout())
            if (typeof window !== "undefined") {
              if (!window.location.pathname.startsWith("/accounts/signin")) {
                window.location.replace("/accounts/signin")
              }
            }
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

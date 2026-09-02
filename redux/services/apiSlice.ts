import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { BaseQueryFn, FetchArgs as OriginalFetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query"
import { setAuth, logout } from "../features/authSlice"
import { Mutex } from "async-mutex"
import { setCookie, getCookie, deleteCookie } from "cookies-next"
import { jwtDecode } from "jwt-decode"
import { AUTH_COOKIE_NAMES, AUTH_COOKIE_KEYS, readCookieValue } from "@/lib/authCookies"
import { getOrCreatePosDeviceId } from "@/lib/deviceIdentity"

const toBooleanClaim = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "number") {
    if (value === 1) {
      return true
    }
    if (value === 0) {
      return false
    }
    return undefined
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true
    }
    if (["false", "0", "no", "off"].includes(normalized)) {
      return false
    }
  }

  return undefined
}

const resolveBaseUrl = (publicUrl: string, internalUrl?: string) =>
  typeof window === "undefined" ? (internalUrl ?? publicUrl) : publicUrl

const BACKEND_HOST_URL = resolveBaseUrl(
  process.env.NEXT_PUBLIC_BACKEND_HOST_URL ?? "",
  process.env.USERS_INTERNAL_URL,
)
const COMMON_BACKEND_URL = resolveBaseUrl(
  process.env.NEXT_PUBLIC_COMMON_BACKEND_URL ?? "",
  process.env.COMMON_INTERNAL_URL,
)
const INVENNTORY_BACKEND_URL = resolveBaseUrl(
  process.env.NEXT_PUBLIC_INVENNTORY_BACKEND_URL ?? "",
  process.env.INVENTORY_INTERNAL_URL,
)
const PRODUCT_BACKEND_URL = resolveBaseUrl(
  process.env.NEXT_PUBLIC_PRODUCT_BACKEND_URL ?? "",
  process.env.PRODUCT_INTERNAL_URL,
)
const POS_BACKEND_URL = resolveBaseUrl(
  process.env.NEXT_PUBLIC_POS_BACKEND_URL ?? "",
  process.env.POS_INTERNAL_URL,
)
const AGENT_BACKEND_URL = resolveBaseUrl(
  process.env.NEXT_PUBLIC_AGENT_BACKEND_URL ?? "",
  process.env.AGENT_INTERNAL_URL,
)
const PAYMENT_BACKEND_URL = resolveBaseUrl(
  process.env.NEXT_PUBLIC_PAYMENT_BACKEND_URL ?? "",
  process.env.PAYMENT_INTERNAL_URL,
)
const AUDIT_BACKEND_URL = resolveBaseUrl(
  process.env.NEXT_PUBLIC_AUDIT_BACKEND_URL ?? "http://localhost:8091",
  process.env.AUDIT_INTERNAL_URL ?? "http://localhost:8091",
)
const NOTIFICATION_BACKEND_URL = resolveBaseUrl(
  process.env.NEXT_PUBLIC_NOTIFICATION_BACKEND_URL ?? "http://localhost:8092",
  process.env.NOTIFICATION_INTERNAL_URL ?? "http://localhost:8092",
)
const SUBSCRIPTIONS_BACKEND_URL = resolveBaseUrl(
  process.env.NEXT_PUBLIC_SUBSCRIPTIONS_BACKEND_URL ?? "http://localhost:8550",
  process.env.SUBSCRIPTIONS_INTERNAL_URL ?? "http://subscriptions:8550",
)

export type serviceType = "users" | "inventory"| "common"|"product"|'pos'| "agent"|'payment' | "audit" | "notification" | "subscriptions"
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
  audit: AUDIT_BACKEND_URL,
  notification: NOTIFICATION_BACKEND_URL,
  subscriptions: SUBSCRIPTIONS_BACKEND_URL,
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
  name?: string | null
  logo?: string | null
  currency?: string | null
}

interface AuthResponsePayload {
  access?: string
  refresh?: string
  authorization_context?: string
  id?: string | number
  username?: string
  is_staff?: boolean
  is_superuser?: boolean
  profile?: string | number | null
  profile_context?: ProfileContext | null
  currency?: string | null
  model_name?: string | null
  provider?: string | null
  agent_name?: string | null
  email?: string | null
  first_name?: string | null
  last_name?: string | null
  picture?: string | null
}

interface AuthTokenClaims {
  mfa_verified?: boolean
  mfa_enabled?: boolean
  has_setup_mfa?: boolean
  is_staff?: boolean
  is_superuser?: boolean
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

type UserIdentityPayload = {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  picture?: string | null
}

export const persistWorkspaceBranding = (profileContext?: ProfileContext | null) => {
  const companyName = profileContext?.name ?? null
  const companyLogo = profileContext?.logo ?? null
  if (companyName) {
    setAuthCookie("companyName", companyName, refreshAge)
  } else {
    deleteAuthCookie("companyName")
  }
  if (companyLogo) {
    setAuthCookie("companyLogo", companyLogo, refreshAge)
  } else {
    deleteAuthCookie("companyLogo")
  }
}

export const persistUserIdentity = (user?: UserIdentityPayload | null) => {
  const hasField = (field: keyof UserIdentityPayload) =>
    Boolean(user) && Object.prototype.hasOwnProperty.call(user, field)

  if (hasField("first_name")) {
    if (user?.first_name) {
      setAuthCookie("userFirstName", user.first_name, refreshAge)
    } else {
      deleteAuthCookie("userFirstName")
    }
  }
  if (hasField("last_name")) {
    if (user?.last_name) {
      setAuthCookie("userLastName", user.last_name, refreshAge)
    } else {
      deleteAuthCookie("userLastName")
    }
  }
  if (hasField("email")) {
    if (user?.email) {
      setAuthCookie("userEmail", user.email, refreshAge)
    } else {
      deleteAuthCookie("userEmail")
    }
  }
  if (hasField("picture")) {
    if (user?.picture) {
      setAuthCookie("userPicture", user.picture, refreshAge)
    } else {
      deleteAuthCookie("userPicture")
    }
  }
}

export const persistAuthSession = (response: AuthResponsePayload) => {
  const profileContext = response.profile_context ?? {}
  const activeProfileId = profileContext.id ?? response.profile ?? null
  const companyCode = profileContext.company_code ?? null
  const currency = response.currency ?? profileContext.currency ?? null
  let tokenClaims: AuthTokenClaims | null = null

  if (response.access) {
    try {
      tokenClaims = jwtDecode<AuthTokenClaims>(response.access)
    } catch {
      tokenClaims = null
    }
  }

  if (response.access) {
    setAuthCookie("accessToken", response.access, accessAge)
  }
  if (response.refresh) {
    setAuthCookie("refreshToken", response.refresh, refreshAge)
  }
  if (response.authorization_context) {
    setAuthCookie("authorizationContext", response.authorization_context, accessAge)
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
  persistWorkspaceBranding(profileContext)
  if (currency) {
    setAuthCookie("currency", currency, refreshAge)
  } else {
    deleteAuthCookie("currency")
  }
  persistUserIdentity(response)
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

  if (tokenClaims?.mfa_verified === true) {
    setAuthCookie("mfaVerified", "true", refreshAge)
    setAuthCookie("mfaSetupRequired", "false", refreshAge)
  } else if (
    tokenClaims?.mfa_enabled === true ||
    tokenClaims?.has_setup_mfa === true
  ) {
    setAuthCookie("mfaVerified", "false", refreshAge)
    setAuthCookie("mfaSetupRequired", "false", refreshAge)
  } else if (
    tokenClaims?.mfa_enabled === false &&
    tokenClaims?.has_setup_mfa === false
  ) {
    setAuthCookie("mfaVerified", "false", refreshAge)
    setAuthCookie("mfaSetupRequired", "true", refreshAge)
  }

  const isStaffClaim =
    toBooleanClaim(tokenClaims?.is_staff) ??
    toBooleanClaim(response.is_staff) ??
    false
  const isSuperuserClaim =
    toBooleanClaim(tokenClaims?.is_superuser) ??
    toBooleanClaim(response.is_superuser) ??
    false

  if (typeof isStaffClaim === "boolean") {
    setAuthCookie("isStaff", isStaffClaim ? "true" : "false", refreshAge)
  } else {
    deleteAuthCookie("isStaff")
  }

  if (typeof isSuperuserClaim === "boolean") {
    setAuthCookie("isSuperuser", isSuperuserClaim ? "true" : "false", refreshAge)
  } else {
    deleteAuthCookie("isSuperuser")
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

      const authorizationContext = readAuthCookie("authorizationContext")
      if (authorizationContext) {
        headers.set("X-Intera-Authorization-Context", authorizationContext)
      }

      const posDeviceId = getOrCreatePosDeviceId()
      if (posDeviceId) {
        headers.set("X-Device-ID", posDeviceId)
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
  audit: createBaseQuery(serviceMap.audit),
  notification: createBaseQuery(serviceMap.notification),
  subscriptions: createBaseQuery(serviceMap.subscriptions),
}

const fileUploadQueries = {
  users: createBaseQuery(serviceMap.users, true),
  inventory: createBaseQuery(serviceMap.inventory, true),
  common: createBaseQuery(serviceMap.common, true),
  product: createBaseQuery(serviceMap.product, true),
  pos: createBaseQuery(serviceMap.pos, true),
  agent: createBaseQuery(serviceMap.agent, true),
  payment: createBaseQuery(serviceMap.payment, true),
  audit: createBaseQuery(serviceMap.audit, true),
  notification: createBaseQuery(serviceMap.notification, true),
  subscriptions: createBaseQuery(serviceMap.subscriptions, true),

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
      try {
        persistAuthSession(result.data as AuthResponsePayload)
        api.dispatch(setAuth())
      } catch {
        // A local cookie persistence failure must not convert a successful auth response into a failed request.
      }
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
  refetchOnFocus: true,
  refetchOnReconnect: true,
  refetchOnMountOrArgChange: true,
  tagTypes: ["User", "Inventory", "Category", "Agent", "AgentConversation", "GlobalCatalog", "Product"], // Add tag types for caching
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

type ListEnvelope<T> =
  | T[]
  | {
      results?: T[]
      data?: T[]
      items?: T[]
    }

export const unwrapListResponse = <T>(payload: ListEnvelope<T> | unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>

    if (Array.isArray(record.results)) {
      return record.results as T[]
    }

    if (Array.isArray(record.data)) {
      return record.data as T[]
    }

    if (Array.isArray(record.items)) {
      return record.items as T[]
    }
  }

  return []
}

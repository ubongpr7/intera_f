import { apiSlice } from "../../services/apiSlice"
import { buildQuery } from "../common/queryParams"
import type {
  PaymentAnalyticsResponse,
  PaymentProvider,
  PaymentProviderInput,
  PaymentRecord,
  SubscriptionAnalyticsResponse,
  SubscriptionRecord,
  EntitlementSnapshot,
  StartTrialResponse,
  SubscriptionPlanRecord,
  CoinTransactionRecord,
  CoinTopUpResponse,
} from "./paymentTypes"

export const paymentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Payment Providers
    getPaymentProviders: builder.query<PaymentProvider[], Record<string, unknown> | void>({
      query: () => ({
        url: "providers/",
        service: "payment",
      }),
    }),

    createPaymentProvider: builder.mutation<PaymentProvider, PaymentProviderInput>({
      query: (data) => ({
        url: "providers/",
        method: "POST",
        body: data,
        service: "payment",
      }),
    }),

    updatePaymentProvider: builder.mutation<PaymentProvider, { id: string } & Partial<PaymentProviderInput>>({
      query: ({ id, ...data }) => ({
        url: `providers/${id}/`,
        method: "PATCH",
        body: data,
        service: "payment",
      }),
    }),

    deletePaymentProvider: builder.mutation({
      query: (id) => ({
        url: `providers/${id}/`,
        method: "DELETE",
        service: "payment",
      }),
    }),

    // Payment Apps
    getPaymentApps: builder.query({
      query: () => ({
        url: "apps/",
        service: "payment",
      }),
    }),

    createPaymentApp: builder.mutation({
      query: (data) => ({
        url: "apps/",
        method: "POST",
        body: data,
        service: "payment",
      }),
    }),

    updatePaymentApp: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `apps/${id}/`,
        method: "PATCH",
        body: data,
        service: "payment",
      }),
    }),

    deletePaymentApp: builder.mutation({
      query: (id) => ({
        url: `apps/${id}/`,
        method: "DELETE",
        service: "payment",
      }),
    }),

    // Subscription Plans
    getSubscriptionPlans: builder.query<SubscriptionPlanRecord[], Record<string, string> | void>({
      query: (params) => ({
        url: `subscriptions/?${new URLSearchParams(params ?? {}).toString()}`,
        service: "payment",
      }),
    }),

    createSubscriptionPlan: builder.mutation({
      query: (data) => ({
        url: "subscriptions/",
        method: "POST",
        body: data,
        service: "payment",
      }),
    }),

    updateSubscriptionPlan: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `subscriptions/${id}/`,
        method: "PATCH",
        body: data,
        service: "payment",
      }),
    }),

    deleteSubscriptionPlan: builder.mutation({
      query: (id) => ({
        url: `subscriptions/${id}/`,
        method: "DELETE",
        service: "payment",
      }),
    }),

    // Payments
    getPayments: builder.query<PaymentRecord[], Record<string, unknown> | void>({
      query: (params = {}) => ({
        url: buildQuery("payments/", params),
        service: "payment",
      }),
    }),

    getPaymentById: builder.query({
      query: (id) => ({
        url: `payments/${id}/`,
        service: "payment",
      }),
    }),

    initiatePayment: builder.mutation({
      query: (data) => ({
        url: "payments/initiate/",
        method: "POST",
        body: data,
        service: "payment",
      }),
    }),

    verifyPayment: builder.mutation({
      query: (data) => ({
        url: "payments/verify/",
        method: "POST",
        body: data,
        service: "payment",
      }),
    }),

    // Subscriptions
    getSubscriptions: builder.query<SubscriptionRecord[], Record<string, unknown> | void>({
      query: (params = {}) => ({
        url: buildQuery("subscriptions-to-plans/", params),
        service: "payment",
      }),
    }),

    getSubscriptionById: builder.query({
      query: (id) => ({
        url: `subscriptions-to-plans/${id}/`,
        service: "payment",
      }),
    }),

    createSubscription: builder.mutation({
      query: (data) => ({
        url: "subscriptions-to-plans/",
        method: "POST",
        body: data,
        service: "payment",
      }),
    }),

    updateSubscription: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `subscriptions-to-plans/${id}/`,
        method: "PATCH",
        body: data,
        service: "payment",
      }),
    }),

    cancelSubscription: builder.mutation({
      query: (id) => ({
        url: `subscriptions-to-plans/${id}/cancel/`,
        method: "POST",
        service: "payment",
      }),
    }),

    // Webhooks
    getWebhookLogs: builder.query({
      query: (params = {}) => ({
        url: `webhook-logs/?${new URLSearchParams(params).toString()}`,
        service: "payment",
      }),
    }),

    // Analytics
    getPaymentAnalytics: builder.query<PaymentAnalyticsResponse, Record<string, unknown> | void>({
      query: (params = {}) => ({
        url: buildQuery("analytics/payments/", params),
        service: "payment",
      }),
    }),

    getSubscriptionAnalytics: builder.query<SubscriptionAnalyticsResponse, Record<string, unknown> | void>({
      query: (params = {}) => ({
        url: buildQuery("analytics/subscriptions/", params),
        service: "payment",
      }),
    }),

getFeatures: builder.query({
      query: (params = {}) => ({
        url: `features/?${new URLSearchParams(params).toString()}`,
        service: "payment",
      }),
    }),
    

    getFeaturesByApp: builder.query({
      query: (appId) => ({
        url: `features/?application=${appId}`,
        service: "payment",
      }),
    }),

    // Plan Features Management
    addFeatureToPlan: builder.mutation({
      query: ({ planId, featureId }) => ({
        url: `subscriptions/${planId}/add-feature/`,
        method: "POST",
        body: { feature_id: featureId },
        service: "payment",
      }),
    }),

    removeFeatureFromPlan: builder.mutation({
      query: ({ planId, featureId }) => ({
        url: `subscriptions/${planId}/remove-feature/`,
        method: "POST",
        body: { feature_id: featureId },
        service: "payment",
      }),
    }),

    getPlanFeatures: builder.query({
      query: (planId) => ({
        url: `subscriptions/${planId}/features/`,
        service: "payment",
      }),
    }),

    getCurrentEntitlements: builder.query<EntitlementSnapshot, void>({
      query: () => ({
        url: "subscriptions-to-plans/entitlements/?application=intera-ims&include_usage=true",
        service: "payment",
      }),
      keepUnusedDataFor: 60,
    }),

    getCoinTransactions: builder.query<CoinTransactionRecord[], void>({
      query: () => ({
        url: "coin-transactions/",
        service: "payment",
      }),
      keepUnusedDataFor: 30,
    }),

    topUpCoins: builder.mutation<CoinTopUpResponse, {
      amount_usd: number;
      customer_email: string;
      customer_name?: string;
      application_slug?: string;
      provider_slug?: string;
      success_url?: string;
      cancel_url?: string;
      metadata?: Record<string, unknown>;
    }>({
      query: (body) => ({
        url: "payments/coins/top-up/",
        method: "POST",
        body,
        service: "payment",
      }),
    }),

    startSubscriptionTrial: builder.mutation<StartTrialResponse, { plan_slug: string; application?: string }>({
      query: (body) => ({
        url: "subscriptions-to-plans/start-trial/",
        method: "POST",
        body,
        service: "payment",
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(
            paymentApiSlice.util.updateQueryData("getCurrentEntitlements", undefined, () => data.entitlements),
          )
        } catch {
          // The page-level mutation handler owns user-facing error feedback.
        }
      },
    }),

  }),
})

export const {
  // Payment Providers
  useGetPaymentProvidersQuery,
  useCreatePaymentProviderMutation,
  useUpdatePaymentProviderMutation,
  useDeletePaymentProviderMutation,

  // Payment Apps
  useGetPaymentAppsQuery,
  useCreatePaymentAppMutation,
  useUpdatePaymentAppMutation,
  useDeletePaymentAppMutation,

  // Subscription Plans
  useGetSubscriptionPlansQuery,
  useCreateSubscriptionPlanMutation,
  useUpdateSubscriptionPlanMutation,
  useDeleteSubscriptionPlanMutation,

  // Payments
  useGetPaymentsQuery,
  useGetPaymentByIdQuery,
  useInitiatePaymentMutation,
  useVerifyPaymentMutation,

  // Subscriptions
  useGetSubscriptionsQuery,
  useGetSubscriptionByIdQuery,
  useCreateSubscriptionMutation,
  useUpdateSubscriptionMutation,
  useCancelSubscriptionMutation,

  // Webhooks & Analytics
  useGetWebhookLogsQuery,
  useGetPaymentAnalyticsQuery,
  useGetSubscriptionAnalyticsQuery,

  // Features
  useGetFeaturesQuery,
  useGetFeaturesByAppQuery,
  useAddFeatureToPlanMutation,
  useRemoveFeatureFromPlanMutation,
  useGetPlanFeaturesQuery,
  useGetCurrentEntitlementsQuery,
  useStartSubscriptionTrialMutation,
  useGetCoinTransactionsQuery,
  useTopUpCoinsMutation,
} = paymentApiSlice

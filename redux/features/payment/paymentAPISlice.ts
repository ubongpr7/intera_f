import { apiSlice } from "../../services/apiSlice"

export const paymentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Payment Providers
    getPaymentProviders: builder.query({
      query: () => ({
        url: "providers/",
        service: "payment",
      }),
    }),

    createPaymentProvider: builder.mutation({
      query: (data) => ({
        url: "providers/",
        method: "POST",
        body: data,
        service: "payment",
      }),
    }),

    updatePaymentProvider: builder.mutation({
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
    getSubscriptionPlans: builder.query({
      query: () => ({
        url: "subscriptions/",
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
    getPayments: builder.query({
      query: (params = {}) => ({
        url: `payments/?${new URLSearchParams(params).toString()}`,
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
    getSubscriptions: builder.query({
      query: (params = {}) => ({
        url: `subscriptions-to-plans/?${new URLSearchParams(params).toString()}`,
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
    getPaymentAnalytics: builder.query({
      query: (params = {}) => ({
        url: `analytics/payments/?${new URLSearchParams(params).toString()}`,
        service: "payment",
      }),
    }),

    getSubscriptionAnalytics: builder.query({
      query: (params = {}) => ({
        url: `analytics/subscriptions/?${new URLSearchParams(params).toString()}`,
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
} = paymentApiSlice

"use client"

import { useGetCurrentEntitlementsQuery } from "@/redux/features/payment/paymentAPISlice"

type SubscriptionQuotaOptions = {
  requireBillingAuthorization?: boolean
}

export function useSubscriptionQuota(featureSlug: string, usage: number, requested = 1, options: SubscriptionQuotaOptions = {}) {
  const { data, isLoading, isError } = useGetCurrentEntitlementsQuery()
  const feature = data?.features?.[featureSlug]
  const subscription = data?.subscription ?? null
  const normalizedUsage = Math.max(Number(usage) || 0, 0)
  const normalizedRequested = Math.max(Number(requested) || 0, 0)
  const limit = feature?.limit_value ?? null
  const unlimited = Boolean(feature?.is_unlimited || feature?.limit_type === "BOOLEAN")
  const billingAuthorized = Boolean(subscription?.billing_authorized)
  const needsBillingAuthorization = Boolean(options.requireBillingAuthorization)
  const remaining = unlimited || limit === null ? null : Math.max(limit - normalizedUsage, 0)
  const canCreate = Boolean(
    !isLoading &&
    !isError &&
    subscription &&
    (!needsBillingAuthorization || billingAuthorized) &&
    feature &&
    (unlimited || (limit !== null && normalizedUsage + normalizedRequested <= limit)),
  )

  let message = "This action is not included in the current subscription plan."
  if (isLoading) message = "Subscription limits are still loading. Please try again."
  else if (isError) message = "Subscription limits could not be verified. Please retry."
  else if (!subscription) message = "Choose a subscription plan before creating this resource."
  else if (needsBillingAuthorization && !billingAuthorized) {
    message = "Connect a card and choose a subscription plan before creating this resource."
  }
  else if (feature && !unlimited && limit !== null) {
    message = `Your plan allows ${limit.toLocaleString()} ${feature.name.toLowerCase()}. ${remaining ?? 0} remaining.`
  }

  return {
    canCreate,
    billingAuthorized,
    feature,
    hasSubscription: Boolean(subscription),
    isLoading,
    limit,
    message,
    remaining,
    unlimited,
    usage: normalizedUsage,
  }
}

"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { jwtDecode } from "jwt-decode"
import { getCookie } from "cookies-next"
import { useSearchParams } from "next/navigation"
import { AlertTriangle, CalendarClock, CheckCircle2, Coins, CreditCard, Gauge, LockKeyhole, ShieldCheck } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { readCookieValue } from "@/lib/authCookies"
import { useGetTerminalsQuery } from "@/redux/features/pos/posAPISlice"
import { useGetProductDataQuery } from "@/redux/features/product/productAPISlice"
import {
  useGetCurrentEntitlementsQuery,
  useGetPaymentsQuery,
  useGetSubscriptionPlansQuery,
  useInitiatePaymentMutation,
  useVerifyPaymentMutation,
  useCancelSubscriptionMutation,
  useGetCoinTransactionsQuery,
  useTopUpCoinsMutation,
} from "@/redux/features/payment/paymentAPISlice"
import { useListStockLocationsQuery } from "@/redux/features/stock/stockAPISlice"
import type { EntitlementUsageRow, PaymentRecord, SubscriptionPlanRecord } from "@/redux/features/payment/paymentTypes"
import { useGetCompanyUsersQuery, useGetPendingInvitationsQuery } from "@/redux/features/users/userApiSlice"
import type { CompanyInvitation } from "@/redux/features/management/companyProfileTypes"

type Claims = {
  user_id?: string | number
  owner_id?: string | number
  membership_role?: string
  role?: string
}

type PlanLimitIssue = {
  featureSlug: string
  featureName: string
  usage: number
  limit: number
  message: string
}

const label = (value: string) => value.replaceAll("-", " ").replace(/\b\w/g, (char) => char.toUpperCase())

const isWorkspaceOwner = () => {
  const token = readCookieValue("accessToken", (name) => getCookie(name))
  if (!token) return false
  try {
    const claims = jwtDecode<Claims>(token)
    const role = `${claims.membership_role ?? claims.role ?? ""}`.trim().toLowerCase()
    return role === "owner" || (
      claims.user_id !== undefined &&
      claims.owner_id !== undefined &&
      `${claims.user_id}` === `${claims.owner_id}`
    )
  } catch {
    return false
  }
}

const formatPrice = (plan: SubscriptionPlanRecord) => {
  if (Number(plan.price) <= 0 && plan.slug === "enterprise") return "Custom"
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(plan.price))
}

const formatNaira = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)

const formatDate = (value?: string | null) => {
  if (!value) return "Not set"
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

const formatSubscriptionStatus = (status?: string | null, pendingCancellation?: boolean) => {
  if (pendingCancellation) return "Scheduled to end"
  const value = `${status ?? ""}`.trim().toUpperCase()
  if (value === "TRIAL") return "Trial"
  if (value === "ACTIVE") return "Active"
  if (!value) return "Not set"
  return value.charAt(0) + value.slice(1).toLowerCase()
}

const formatFeatureLimit = (feature: SubscriptionPlanRecord["features"][number]) => {
  if (feature.limit_type === "BOOLEAN" || feature.is_unlimited) return feature.name
  return `${Number(feature.limit_value ?? 0).toLocaleString()} ${feature.name.toLowerCase()}`
}

const calculateIncludedCoinsFromPlanPrice = (price: string | number | undefined) => {
  const numericPrice = Number(price ?? 0)
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) return 0
  return Math.round((numericPrice / 50) / 100) * 100
}

const fallbackCoinRateByPlanSlug: Record<string, number> = {
  basic: 50,
  starter: 50,
  growth: 40,
  scale: 40,
  enterprise: 40,
}

const formatUsageStatus = (status?: string) => {
  switch (status) {
    case "at_limit":
      return "At limit"
    case "near_limit":
      return "Near limit"
    case "usage_unavailable":
      return "Usage unavailable"
    case "healthy":
      return "Available"
    case "unlimited":
      return "Unlimited"
    case "enabled":
      return "Enabled"
    default:
      return "Included"
  }
}

const usagePercentage = (row: EntitlementUsageRow) => {
  if (row.is_unlimited || row.limit_type === "BOOLEAN" || row.limit_value === null || row.usage === null) return 0
  if (row.limit_value <= 0) return 0
  return Math.min(100, Math.round((row.usage / row.limit_value) * 100))
}

const normalizePaymentStatus = (status?: string | null) => `${status ?? ""}`.trim().toLowerCase()

const paymentLabel = (payment: PaymentRecord) => {
  const kind = `${payment.metadata?.payment_kind ?? ""}`.trim().toLowerCase()
  if (kind === "coin_topup") return "Intera coin top-up"
  if (payment.plan_name) return payment.plan_name
  return "Subscription charge"
}

const paymentCardLabel = (payment?: PaymentRecord) => {
  const billingCard = payment?.metadata?.billing_card as Record<string, unknown> | undefined
  if (!billingCard) return "No saved card reference yet"
  const brand = `${billingCard.brand ?? billingCard.type ?? "Card"}`
    .replace(/\b\w/g, (char) => char.toUpperCase())
  const last4 = `${billingCard.last4 ?? billingCard.last_4digits ?? ""}`.trim()
  const expiryMonth = `${billingCard.exp_month ?? ""}`.trim()
  const expiryYear = `${billingCard.exp_year ?? ""}`.trim()
  const expiry = expiryMonth && expiryYear ? ` • Expires ${expiryMonth}/${expiryYear}` : ""
  return last4 ? `${brand} ending in ${last4}${expiry}` : `${brand}${expiry}`
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-slate-200 dark:bg-slate-800 ${className}`} />
}

function SubscriptionOverviewSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <SkeletonLine className="h-3 w-24" />
          <SkeletonLine className="mt-4 h-6 w-32" />
        </div>
      ))}
    </div>
  )
}

function PlanCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/60">
          <SkeletonLine className="h-5 w-32" />
          <SkeletonLine className="mt-4 h-8 w-24" />
          <SkeletonLine className="mt-4 h-4 w-full" />
          <SkeletonLine className="mt-2 h-4 w-4/5" />
          <SkeletonLine className="mt-6 h-10 w-full" />
        </div>
      ))}
    </div>
  )
}

function UsageCardsSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <SkeletonLine className="h-5 w-36" />
          <SkeletonLine className="mt-3 h-4 w-24" />
          <SkeletonLine className="mt-5 h-2 w-full" />
        </div>
      ))}
    </>
  )
}

export default function SubscriptionPage() {
  const searchParams = useSearchParams()
  const owner = useMemo(() => isWorkspaceOwner(), [])
  const accessToken = readCookieValue("accessToken", (name) => getCookie(name))
  const tokenClaims = useMemo(() => {
    if (!accessToken) return null
    try {
      return jwtDecode<Claims>(accessToken)
    } catch {
      return null
    }
  }, [accessToken])
  const handledPaymentVerificationRef = useRef<string | null>(null)
  const {
    data: entitlements,
    isLoading: loadingEntitlements,
    isError: entitlementsError,
    refetch,
  } = useGetCurrentEntitlementsQuery(undefined, { refetchOnMountOrArgChange: true })
  const { data: payments = [], isLoading: loadingPayments, refetch: refetchPayments } = useGetPaymentsQuery(undefined, { refetchOnMountOrArgChange: true })
  const { data: coinTransactions = [], refetch: refetchCoinTransactions } = useGetCoinTransactionsQuery(undefined, { refetchOnMountOrArgChange: true })
  const { data: companyUsers = [], isLoading: loadingCompanyUsers } = useGetCompanyUsersQuery()
  const { data: pendingInvitations = [], isLoading: loadingPendingInvitations } = useGetPendingInvitationsQuery()
  const { data: stockLocations = [], isLoading: loadingStockLocations } = useListStockLocationsQuery()
  const { data: terminals = [], isLoading: loadingTerminals } = useGetTerminalsQuery()
  const { data: products = [], isLoading: loadingProducts } = useGetProductDataQuery()
  const { data: plans = [], isLoading: loadingPlans } = useGetSubscriptionPlansQuery(
    { application__slug: "intera-ims" },
    { refetchOnMountOrArgChange: true },
  )
  const [initiatePayment, { isLoading: initiatingPayment }] = useInitiatePaymentMutation()
  const [verifyPayment, { isLoading: verifyingPayment }] = useVerifyPaymentMutation()
  const [cancelSubscription, { isLoading: cancellingSubscription }] = useCancelSubscriptionMutation()
  const [topUpCoins, { isLoading: toppingUpCoins }] = useTopUpCoinsMutation()
  const [coinTopUpAmount, setCoinTopUpAmount] = useState("100")
  const activePlan = entitlements?.subscription?.plan
  const activePlanRecord = useMemo(
    () => plans.find((plan) => plan.slug === activePlan?.slug),
    [plans, activePlan?.slug],
  )
  const activeSubscriptionId = entitlements?.subscription?.id
  const subscriptionPendingCancellation = Boolean(entitlements?.subscription?.pending_cancellation)
  const subscriptionAccessUntil = entitlements?.subscription?.access_until ?? entitlements?.subscription?.current_period_end ?? null
  const billingAuthorized = Boolean(entitlements?.subscription?.billing_authorized)
  const usageRows = useMemo(() => entitlements?.usage ?? [], [entitlements?.usage])
  const features = useMemo(() => Object.entries(entitlements?.features ?? {}), [entitlements?.features])
  const coinBalance = entitlements?.coins?.balance ?? 0
  const coinAllocation = activePlanRecord
    ? calculateIncludedCoinsFromPlanPrice(activePlanRecord.price)
    : entitlements?.coins?.included_allocation ?? entitlements?.coins?.monthly_allocation ?? 0
  const coinPurchaseRate = entitlements?.coins?.purchase_rate_naira
    ?? activePlanRecord?.coin_purchase_rate_naira
    ?? (activePlan?.slug ? fallbackCoinRateByPlanSlug[activePlan.slug] ?? null : null)
  const rolloverEnabled = activePlan ? (entitlements?.coins?.rollover_enabled ?? true) : false
  const canTopUpCoins = Boolean(owner && activePlan && coinPurchaseRate)
  const coinTopUpQuantity = Math.max(Number(coinTopUpAmount) || 0, 0)
  const coinTopUpCost = coinPurchaseRate ? coinTopUpQuantity * coinPurchaseRate : 0
  const localUsageCounts = useMemo(() => {
    const activeUserIds = new Set<string>()
    const activeEmails = new Set<string>()

    companyUsers.forEach((assignment) => {
      const userId = assignment.user?.id
      if (userId !== undefined && userId !== null) {
        activeUserIds.add(String(userId))
      }
      const email = `${assignment.user?.email ?? ""}`.trim().toLowerCase()
      if (email) {
        activeEmails.add(email)
      }
    })

    const ownerId = tokenClaims?.owner_id
    if (ownerId !== undefined && ownerId !== null) {
      activeUserIds.add(String(ownerId))
    }

    const distinctPendingEmails = new Set<string>()
    pendingInvitations.forEach((invite: CompanyInvitation) => {
      const email = `${invite.email ?? ""}`.trim().toLowerCase()
      const status = `${invite.status ?? ""}`.trim().toLowerCase()
      if (!email || status !== "pending" || activeEmails.has(email)) {
        return
      }
      distinctPendingEmails.add(email)
    })

    return {
      "staff-users": activeUserIds.size + distinctPendingEmails.size,
      "structural-locations": stockLocations.filter((location) => Boolean(location.structural)).length,
      "pos-terminals": terminals.length,
      products: products.length,
      "product-variants": products.reduce((total, product) => total + Number(product.variant_count ?? 0), 0),
    } as Record<string, number>
  }, [companyUsers, pendingInvitations, products, stockLocations, terminals, tokenClaims?.owner_id])
  const workspaceUsageLoading =
    loadingCompanyUsers || loadingPendingInvitations || loadingStockLocations || loadingTerminals || loadingProducts
  const usageCountsByFeature = useMemo(() => {
    const localEntries = Object.entries(localUsageCounts)
    if (localEntries.length > 0) {
      return new Map<string, number | null>(
        localEntries.map(([feature, usage]) => [feature, Number.isFinite(Number(usage)) ? Number(usage) : null]),
      )
    }
    const rawCounts = entitlements?.usage_counts ?? {}
    const entries = Object.keys(rawCounts).length > 0
      ? Object.entries(rawCounts)
      : usageRows.map((row) => [row.feature, row.usage] as const)
    return new Map<string, number | null>(
      entries.map(([feature, usage]) => [feature, usage === null || usage === undefined ? null : Number(usage)]),
    )
  }, [entitlements?.usage_counts, localUsageCounts, usageRows])
  const workspaceFootprintRows = useMemo(
    () =>
      Array.from(usageCountsByFeature.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([feature, usage]) => ({
          feature,
          name: label(feature),
          usage,
        })),
    [usageCountsByFeature],
  )
  const billingHistory = useMemo(
    () =>
      payments.filter((payment) => {
        const status = normalizePaymentStatus(payment.status)
        return ["completed", "processing", "failed", "cancelled", "refunded"].includes(status)
      }),
    [payments],
  )
  const latestBillingPayment = useMemo(
    () => billingHistory.find((payment) => Boolean(payment.metadata?.billing_card) || Boolean(payment.customer_email) || Boolean(payment.customer_name)),
    [billingHistory],
  )
  const clearPaymentRedirectParams = () => {
    if (typeof window === "undefined") return
    const url = new URL(window.location.href)
    const removableKeys = ["trxref", "reference", "tx_ref", "transaction_id", "id", "status"]
    let changed = false
    removableKeys.forEach((key) => {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key)
        changed = true
      }
    })
    if (!changed) return
    const nextUrl = `${url.pathname}${url.search ? `?${url.searchParams.toString()}` : ""}${url.hash}`
    window.history.replaceState({}, "", nextUrl)
  }

  const getPlanLimitIssues = (plan: SubscriptionPlanRecord): PlanLimitIssue[] =>
    (plan.features ?? [])
      .filter((feature) => feature.limit_type === "COUNT" && !feature.is_unlimited && feature.limit_value !== null)
      .map((feature) => {
        const usage = usageCountsByFeature.get(feature.slug)
        if (usage === null || usage === undefined || Number.isNaN(Number(usage)) || Number(usage) <= Number(feature.limit_value ?? 0)) {
          return null
        }
        const normalizedUsage = Number(usage)
        const normalizedLimit = Number(feature.limit_value ?? 0)
        if (normalizedUsage > normalizedLimit) {
          return {
            featureSlug: feature.slug,
            featureName: feature.name,
            usage: normalizedUsage,
            limit: normalizedLimit,
            message: `You have ${normalizedUsage.toLocaleString()} ${feature.name.toLowerCase()}, while this plan allows ${normalizedLimit.toLocaleString()}.`,
          }
        }
        return null
      })
      .filter(Boolean) as PlanLimitIssue[]

  useEffect(() => {
    const transactionId = searchParams.get("transaction_id") || searchParams.get("id")
    const reference = searchParams.get("reference") || searchParams.get("tx_ref")
    const status = searchParams.get("status")
    if (!transactionId && !reference) return
    const verificationKey = [transactionId ?? "", reference ?? "", status ?? ""].join("|")
    if (handledPaymentVerificationRef.current === verificationKey) return
    handledPaymentVerificationRef.current = verificationKey
    if (status && status !== "successful" && status !== "completed" && status !== "success") {
      toast.error("Billing authorization was not completed.")
      clearPaymentRedirectParams()
      return
    }
    void verifyPayment({ transaction_id: transactionId, reference })
      .unwrap()
      .then(async () => {
        toast.success("Billing authorization confirmed.")
        await refetch()
        await refetchPayments()
        await refetchCoinTransactions()
        clearPaymentRedirectParams()
      })
      .catch(() => {
        toast.error("Unable to verify billing authorization.")
        clearPaymentRedirectParams()
      })
  }, [refetch, refetchCoinTransactions, refetchPayments, searchParams, verifyPayment])

  const authorizeBilling = async (planSlug: string) => {
    if (!owner) return
    const plan = plans.find((candidate) => candidate.slug === planSlug)
    const limitIssues = plan ? getPlanLimitIssues(plan) : []
    if (limitIssues.length > 0) {
      toast.error("Current workspace usage is above this plan's limits.")
      return
    }
    const customerEmail = readCookieValue("userEmail", (name) => getCookie(name))
    const firstName = readCookieValue("userFirstName", (name) => getCookie(name)) || ""
    const lastName = readCookieValue("userLastName", (name) => getCookie(name)) || ""
    if (!customerEmail) {
      toast.error("Your account email is required before billing can be authorized.")
      return
    }
    try {
      const response = await initiatePayment({
        application_slug: "intera-ims",
        plan_slug: planSlug,
        provider_slug: "paystack",
        customer_email: customerEmail,
        customer_name: [firstName, lastName].filter(Boolean).join(" ").trim() || customerEmail,
        success_url: `${window.location.origin}/subscription`,
        cancel_url: `${window.location.origin}/subscription`,
      }).unwrap()
      if (response?.checkout_url) {
        window.location.assign(response.checkout_url)
        return
      }
      toast.error("Secure billing checkout was not returned.")
    } catch {
      toast.error("Unable to initialize secure billing.")
    }
  }

  const cancelActiveSubscription = async () => {
    if (!owner || !activeSubscriptionId) return
    try {
      await cancelSubscription(activeSubscriptionId).unwrap()
      toast.success("Subscription cancelled.")
      await refetch()
      await refetchPayments()
      await refetchCoinTransactions()
    } catch {
      toast.error("Unable to cancel subscription.")
    }
  }

  const startCoinTopUp = async () => {
    if (!owner) return
    if (!activePlan || !coinPurchaseRate) {
      toast.error("Choose a subscription plan before buying Intera coins.")
      return
    }
    const coinsAmount = Number(coinTopUpAmount)
    if (!Number.isFinite(coinsAmount) || coinsAmount < 1) {
      toast.error("Minimum Intera coin top-up is 1 coin.")
      return
    }
    const customerEmail = readCookieValue("userEmail", (name) => getCookie(name))
    const firstName = readCookieValue("userFirstName", (name) => getCookie(name)) || ""
    const lastName = readCookieValue("userLastName", (name) => getCookie(name)) || ""
    if (!customerEmail) {
      toast.error("Your account email is required before coins can be purchased.")
      return
    }
    try {
      const response = await topUpCoins({
        coins_amount: Math.round(coinsAmount),
        application_slug: "intera-ims",
        provider_slug: "paystack",
        customer_email: customerEmail,
        customer_name: [firstName, lastName].filter(Boolean).join(" ").trim() || customerEmail,
        success_url: `${window.location.origin}/subscription`,
        cancel_url: `${window.location.origin}/subscription`,
      }).unwrap()
      if (response.checkout_url) {
        window.location.assign(response.checkout_url)
        return
      }
      toast.error("Secure checkout was not returned.")
    } catch {
      toast.error("Unable to start Intera coin top-up.")
    }
  }

  return (
    <div className="subscription-workspace space-y-6">
      <Card className="subscription-overview border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardDescription>Workspace subscription</CardDescription>
              <CardTitle className="mt-2 text-3xl">
                {loadingEntitlements ? "Loading plan..." : activePlan?.name ?? "Choose a plan"}
              </CardTitle>
            </div>
            <CreditCard className="h-7 w-7 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingEntitlements ? (
            <SubscriptionOverviewSkeleton />
          ) : entitlementsError ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              Subscription information is temporarily unavailable.
              <Button variant="outline" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : activePlan ? (
            <div className="grid gap-3 md:grid-cols-5">
              <div className="subscription-stat rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</p>
                <p className="mt-2 text-lg font-semibold">
                  {formatSubscriptionStatus(entitlements?.subscription?.status, entitlements?.subscription?.pending_cancellation)}
                </p>
              </div>
              <div className="subscription-stat rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Access until</p>
                <p className="mt-2 text-lg font-semibold">{formatDate(subscriptionAccessUntil)}</p>
              </div>
              <div className="subscription-stat rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Billing</p>
                <p className="mt-2 text-lg font-semibold">
                  {verifyingPayment ? "Verifying..." : subscriptionPendingCancellation ? "Renewal paused" : "Secure billing"}
                </p>
              </div>
              <div className="subscription-stat rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Intera coins</p>
                <p className="mt-2 text-lg font-semibold">{coinBalance.toLocaleString()} available</p>
                <p className="mt-1 text-sm text-slate-500">Includes {coinAllocation.toLocaleString()} per cycle</p>
              </div>
              <div className={`subscription-stat rounded-2xl border p-4 ${ 
                billingAuthorized
                  ? "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-50"
                  : "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-50"
              }`}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">Card</p>
                <p className="mt-2 text-lg font-semibold">{billingAuthorized ? "Connected" : "Not connected"}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              {owner
                ? "Choose a plan and connect a card for billing after the trial. The workspace gets the configured trial period before regular monthly billing applies."
                : "This workspace does not have an active subscription yet. Ask the workspace owner to choose a plan."}
            </div>
          )}
        </CardContent>
      </Card>

      {owner ? (
        <Card className="subscription-billing-details border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              Billing details
            </CardTitle>
            <CardDescription>Review the current plan, saved card reference, billing contact, and recent charges for this workspace.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <div className="space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current plan</p>
                <p className="mt-2 text-lg font-semibold">{activePlan?.name ?? "No active plan"}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {subscriptionPendingCancellation
                    ? `Access remains available until ${formatDate(subscriptionAccessUntil)}.`
                    : `Billing status: ${formatSubscriptionStatus(entitlements?.subscription?.status, entitlements?.subscription?.pending_cancellation)}.`}
                </p>
              </div>
              <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Saved card</p>
                <p className="mt-2 text-sm font-medium">{paymentCardLabel(latestBillingPayment)}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {latestBillingPayment?.provider_name ?? latestBillingPayment?.provider?.name ?? "Billing provider unavailable"}
                </p>
              </div>
              <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Billing contact</p>
                <p className="mt-2 text-sm font-medium">{latestBillingPayment?.customer_email ?? "No billing email recorded yet"}</p>
                <p className="mt-1 text-sm text-slate-500">{latestBillingPayment?.customer_name ?? "No billing name recorded yet"}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Transaction history</p>
                  <p className="mt-1 text-sm text-slate-500">Recent subscription and coin top-up bills for this workspace.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchPayments()}>Refresh</Button>
              </div>
              {loadingPayments ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                      <SkeletonLine className="h-4 w-40" />
                      <SkeletonLine className="mt-3 h-4 w-24" />
                    </div>
                  ))}
                </div>
              ) : billingHistory.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700">
                  No billing transactions have been recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {billingHistory.slice(0, 8).map((payment) => {
                    const status = normalizePaymentStatus(payment.status)
                    const paid = status === "completed"
                    return (
                      <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                        <div>
                          <p className="font-medium">{paymentLabel(payment)}</p>
                          <p className="text-sm text-slate-500">
                            {formatDate(payment.created_at)} • {payment.customer_email ?? "No billing email"}
                          </p>
                          <p className="text-sm text-slate-500">{paymentCardLabel(payment)}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            paid
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          }`}>
                            {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"}
                          </span>
                          <p className="mt-2 text-base font-semibold">{formatNaira(Number(payment.amount ?? 0))}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!owner ? (
        <Card className="subscription-restricted border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardContent className="flex items-center gap-3 p-6 text-sm text-slate-600 dark:text-slate-300">
            <LockKeyhole className="h-5 w-5 text-amber-500" />
            Subscription setup is restricted to the workspace owner.
          </CardContent>
        </Card>
      ) : (
        <Card className="subscription-billing border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-blue-600" />
              Set up subscription billing
            </CardTitle>
            <CardDescription>Select the plan that matches the current workspace size. Card details are handled by secure billing; Intera stores provider references, not raw card data. A small setup charge may appear during billing authorization; monthly plan billing starts after the trial.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingEntitlements ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <SkeletonLine className="h-5 w-56" />
                <SkeletonLine className="mt-3 h-4 w-full" />
                <SkeletonLine className="mt-2 h-4 w-3/4" />
              </div>
            ) : activePlan && activeSubscriptionId ? (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>
                    Current plan: <strong>{activePlan.name}</strong>.{" "}
                    {subscriptionPendingCancellation
                      ? `Renewal is paused and access ends on ${formatDate(subscriptionAccessUntil)}. Resume billing before that date to keep the workspace active.`
                      : "Switching plans will set up billing for the new plan and replace the current active subscription after confirmation."}
                  </span>
                  {subscriptionPendingCancellation ? (
                    <Button
                      variant="outline"
                      onClick={() => void authorizeBilling(activePlan.slug)}
                      disabled={initiatingPayment || verifyingPayment}
                    >
                      {initiatingPayment ? "Opening checkout..." : "Resume renewal"}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={cancelActiveSubscription}
                      disabled={cancellingSubscription || initiatingPayment || verifyingPayment}
                    >
                      {cancellingSubscription ? "Cancelling..." : "Cancel subscription"}
                    </Button>
                  )}
                </div>
                {!billingAuthorized ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-50">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4" />
                      <span>
                        No card is connected yet. Connect a card so the first month remains free and monthly billing can continue afterward. Any setup authorization is not the monthly plan charge.
                      </span>
                    </div>
                    <Button size="sm" onClick={() => authorizeBilling(activePlan.slug)} disabled={initiatingPayment || verifyingPayment}>
                      Connect card
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
            {loadingPlans || loadingEntitlements ? (
              <PlanCardsSkeleton />
            ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {plans.filter((plan) => plan.slug !== "enterprise").map((plan) => {
                const selected = activePlan?.slug === plan.slug
                const busy = initiatingPayment || verifyingPayment || cancellingSubscription
                const limitIssues = getPlanLimitIssues(plan)
                const blockedByUsage = limitIssues.length > 0
                const blockedByLoadingUsage = !selected && workspaceUsageLoading
                return (
                  <div
                    key={plan.id}
                    className={`subscription-plan-card rounded-3xl border p-5 ${ 
                      selected
                        ? "border-emerald-400 bg-emerald-50 text-emerald-950 dark:border-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-50"
                        : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold">{plan.name}</p>
                        <p className="mt-1 text-3xl font-bold">{formatPrice(plan)}</p>
                      </div>
                      {selected ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : null}
                    </div>
                    <p className="mt-3 min-h-12 text-sm text-slate-600 dark:text-slate-300">{plan.description || `${plan.name} plan for Intera IMS.`}</p>
                    <p className="mt-3 text-sm font-medium">{plan.trial_days || 30}-day free trial</p>
                    <ul className="mt-4 space-y-2 text-sm">
                      {(plan.features ?? []).map((feature) => (
                        <li key={feature.slug} className="flex items-start gap-2 text-slate-700 dark:text-slate-200">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{formatFeatureLimit(feature)}</span>
                        </li>
                      ))}
                    </ul>
                    {blockedByUsage ? (
                      <details className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-50">
                        <summary className="cursor-pointer list-none font-semibold">
                          Why can&apos;t I choose this plan?
                        </summary>
                        <p className="mt-2">
                          This workspace is already above one or more limits in this plan.
                        </p>
                        <ul className="mt-2 space-y-1">
                          {limitIssues.map((issue) => (
                            <li key={issue.featureSlug} className="flex items-start gap-2">
                              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              <span>{issue.message}</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : blockedByLoadingUsage ? (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                        Checking current workspace usage for this plan.
                      </div>
                    ) : null}
                    <Button
                      className="mt-4 w-full"
                      variant={selected ? "outline" : "default"}
                      disabled={(selected && !subscriptionPendingCancellation) || busy || blockedByUsage || blockedByLoadingUsage}
                      onClick={() => authorizeBilling(plan.slug)}
                    >
                      {selected
                        ? subscriptionPendingCancellation ? "Resume renewal" : "Current plan"
                        : blockedByLoadingUsage ? "Checking usage..."
                        : blockedByUsage ? "Usage too high" : activePlan ? "Switch to this plan" : "Choose plan"}
                    </Button>
                  </div>
                )
              })}
            </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="subscription-coins border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Coins className="h-5 w-5 text-blue-600" />Intera coin balance</CardTitle>
        <CardDescription>Coins power metered AI and catalog operations. Global catalog imports use 1 coin per imported variant; AI image bulk creation uses 5 coins per uploaded image.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingEntitlements ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <SkeletonLine className="h-4 w-32" />
                <SkeletonLine className="mt-4 h-8 w-48" />
                <SkeletonLine className="mt-5 h-3 w-full" />
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <SkeletonLine className="h-4 w-36" />
                <SkeletonLine className="mt-4 h-10 w-full" />
                <SkeletonLine className="mt-4 h-10 w-32" />
              </div>
            </div>
          ) : (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-slate-500">Available coins</p>
                  <p className="mt-1 text-3xl font-bold">{coinBalance.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Included this cycle</p>
                  <p className="mt-1 text-2xl font-semibold">{coinAllocation.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Current top-up rate</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {coinPurchaseRate ? `${formatNaira(coinPurchaseRate)} / coin` : "Choose a plan"}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                {rolloverEnabled
                  ? "Unused coins roll over while the workspace subscription remains active."
                  : "Unused coins do not roll over."}
              </p>
            </div>
            {owner ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Buy more coins</label>
                  <p className="mt-2 text-sm text-slate-500">
                    {canTopUpCoins
                      ? `Your current plan buys coins at ${formatNaira(coinPurchaseRate ?? 0)} per coin.`
                      : "Choose an active subscription plan before buying Intera coins."}
                  </p>
                  <div className="mt-2 flex overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
                    <input
                      value={coinTopUpAmount}
                      onChange={(event) => setCoinTopUpAmount(event.target.value)}
                      type="number"
                      min={1}
                      step={1}
                      disabled={!canTopUpCoins}
                      className="w-full bg-transparent px-2 py-2 outline-none"
                    />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {canTopUpCoins
                      ? `You will be charged ${formatNaira(coinTopUpCost)} for ${coinTopUpQuantity.toLocaleString()} coins.`
                      : "Coin top-up unlocks after a plan is active."}
                  </p>
                </div>
                <Button className="mt-3 w-full" onClick={startCoinTopUp} disabled={!canTopUpCoins || toppingUpCoins || verifyingPayment || coinTopUpQuantity < 1}>
                  {toppingUpCoins ? "Opening checkout..." : `Buy ${coinTopUpQuantity.toLocaleString()} coins for ${formatNaira(coinTopUpCost)}`}
                </Button>
              </div>
            ) : null}
          </div>
          )}
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-semibold">Recent coin activity</p>
              <Button variant="outline" size="sm" onClick={() => refetchCoinTransactions()}>Refresh</Button>
            </div>
            {coinTransactions.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800">No coin activity has been recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {coinTransactions.slice(0, 8).map((transaction) => (
                  <div key={transaction.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4 text-sm dark:border-slate-800">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-slate-500">{new Date(transaction.created_at).toLocaleString()} • Balance after {Number(transaction.balance_after).toLocaleString()}</p>
                    </div>
                    <span className={transaction.transaction_type === "SPENT" ? "font-semibold text-red-600" : "font-semibold text-emerald-600"}>
                      {transaction.transaction_type === "SPENT" ? "-" : "+"}{Number(transaction.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="subscription-usage border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Gauge className="h-5 w-5 text-blue-600" />Plan usage and limits</CardTitle>
          <CardDescription>Current workspace consumption against the active plan. Usage is read from the owning services.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {loadingEntitlements ? (
            <UsageCardsSkeleton />
          ) : usageRows.length > 0 ? usageRows.map((row) => {
            const percent = usagePercentage(row)
            return (
              <div key={row.feature} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{row.name || label(row.feature)}</p>
                    <p className="mt-1 text-sm text-slate-500">{formatUsageStatus(row.status)}</p>
                  </div>
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                </div>
                {row.limit_type === "COUNT" && !row.is_unlimited ? (
                  <>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                      {row.usage === null ? "Usage unavailable" : `${Number(row.usage).toLocaleString()} / ${Number(row.limit_value ?? 0).toLocaleString()}`}
                    </p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">{row.is_unlimited || row.limit_type === "BOOLEAN" ? "Included" : `Limit: ${row.limit_value ?? 0}`}</p>
                )}
              </div>
            )
          }) : workspaceFootprintRows.length > 0 ? workspaceFootprintRows.map((row) => (
            <div key={row.feature} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{row.name}</p>
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {row.usage === null ? "Usage unavailable" : `${Number(row.usage).toLocaleString()} currently in workspace`}
              </p>
            </div>
          )) : features.length === 0 ? (
            <p className="text-sm text-slate-500">No entitlement is active until a plan trial is selected.</p>
          ) : features.map(([slug, feature]) => (
            <div key={slug} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{feature.name || label(slug)}</p>
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {feature.is_unlimited || feature.limit_type === "BOOLEAN" ? "Included" : `Limit: ${feature.limit_value ?? 0}`}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

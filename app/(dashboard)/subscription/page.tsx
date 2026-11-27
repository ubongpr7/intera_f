"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { jwtDecode } from "jwt-decode"
import { getCookie } from "cookies-next"
import { useSearchParams } from "next/navigation"
import { AlertTriangle, CalendarClock, CheckCircle2, Coins, CreditCard, Gauge, LockKeyhole, ShieldCheck } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { readCookieValue } from "@/lib/authCookies"
import {
  useGetCurrentEntitlementsQuery,
  useGetPaymentsQuery,
  useGetSubscriptionPlansQuery,
  useGetBillingConfigurationQuery,
  useInitiatePaymentMutation,
  useVerifyPaymentMutation,
  useCancelSubscriptionMutation,
  useGetCoinTransactionsQuery,
  useTopUpCoinsMutation,
} from "@/redux/features/payment/paymentAPISlice"
import type { EntitlementUsageRow, PaymentRecord, SubscriptionPlanRecord } from "@/redux/features/payment/paymentTypes"

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

type BillingIntent = {
  planSlug: string
  startTrial: boolean
  locationQuantity: number
  terminalsPerLocation: number
  monthlyTotal: number
  chargeAmount: number
  isUpgrade: boolean
  isDowngrade: boolean
  manualRefundAmount: number
}

const MAX_TERMINALS_PER_LOCATION = 10

const planSlugForLocation = (locations: number) => {
  if (locations <= 3) return "basic"
  if (locations <= 9) return "starter"
  if (locations <= 15) return "growth"
  return "scale"
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
  if (value === "TRIAL") return "Active"
  if (value === "ACTIVE") return "Active"
  if (!value) return "Not set"
  return value.charAt(0) + value.slice(1).toLowerCase()
}

const formatFeatureLimit = (feature: SubscriptionPlanRecord["features"][number], locations?: number, terminalsPerLocation?: number) => {
  if (feature.slug === "structural-locations" && locations) return `${locations.toLocaleString()} ${feature.name.toLowerCase()}`
  if (feature.slug === "pos-terminals" && locations && terminalsPerLocation) return `${(locations * terminalsPerLocation).toLocaleString()} ${feature.name.toLowerCase()}`
  if (feature.limit_type === "BOOLEAN" || feature.is_unlimited) return feature.name
  return `${Number(feature.limit_value ?? 0).toLocaleString()} ${feature.name.toLowerCase()}`
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
  } = useGetCurrentEntitlementsQuery("intera-ims", { refetchOnMountOrArgChange: true })
  const { data: payments = [], isLoading: loadingPayments, refetch: refetchPayments } = useGetPaymentsQuery(
    { application: "intera-ims" },
    { refetchOnMountOrArgChange: true },
  )
  const { data: coinTransactions = [], refetch: refetchCoinTransactions } = useGetCoinTransactionsQuery(undefined, { refetchOnMountOrArgChange: true })
  const { data: plans = [], isLoading: loadingPlans } = useGetSubscriptionPlansQuery(
    { application__slug: "intera-ims" },
    { refetchOnMountOrArgChange: true },
  )
  const [locationQuantityInput, setLocationQuantityInput] = useState("1")
  const locationQuantity = Math.max(1, Math.floor(Number(locationQuantityInput) || 1))
  const orderedPlans = useMemo(
    () => plans
      .filter((plan) => plan.slug !== "enterprise")
      .slice()
      .sort((left, right) => Number(left.price) - Number(right.price)),
    [plans],
  )
  const [terminalsPerLocationInput, setTerminalsPerLocationInput] = useState("1")
  const terminalsPerLocation = Math.min(
    MAX_TERMINALS_PER_LOCATION,
    Math.max(1, Math.floor(Number(terminalsPerLocationInput) || 1)),
  )
  const { data: billingConfiguration, isLoading: loadingBillingConfiguration, isError: billingConfigurationError } = useGetBillingConfigurationQuery(
    {
      locations: String(locationQuantity),
      terminals_per_location: String(terminalsPerLocation),
    },
    { refetchOnMountOrArgChange: true },
  )
  const selectedPlanSlug = planSlugForLocation(locationQuantity)
  const [initiatePayment, { isLoading: initiatingPayment }] = useInitiatePaymentMutation()
  const [verifyPayment, { isLoading: verifyingPayment }] = useVerifyPaymentMutation()
  const [cancelSubscription, { isLoading: cancellingSubscription }] = useCancelSubscriptionMutation()
  const [topUpCoins, { isLoading: toppingUpCoins }] = useTopUpCoinsMutation()
  const [coinTopUpAmount, setCoinTopUpAmount] = useState("100")
  const [billingIntent, setBillingIntent] = useState<BillingIntent | null>(null)
  const [showBillingConfigurator, setShowBillingConfigurator] = useState(false)
  const [showCancellationDialog, setShowCancellationDialog] = useState(false)
  const [cancellationReason, setCancellationReason] = useState("")
  useEffect(() => {
    if (!showBillingConfigurator || !entitlements?.subscription) return
    const locations = Math.max(1, Number(entitlements.subscription.location_quantity ?? 1))
    const configuredTerminalLimit = Number(entitlements.features?.["pos-terminals"]?.limit_value ?? 0)
    const terminalsPerLocation = entitlements.subscription.terminals_per_location
      ?? (configuredTerminalLimit > 0 ? Math.max(1, Math.round(configuredTerminalLimit / locations)) : 1)
    setLocationQuantityInput(String(locations))
    setTerminalsPerLocationInput(String(Math.min(MAX_TERMINALS_PER_LOCATION, Math.max(1, terminalsPerLocation))))
  }, [entitlements?.features, entitlements?.subscription?.id, entitlements?.subscription?.location_quantity, entitlements?.subscription?.terminals_per_location, showBillingConfigurator])
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
  const coinAllocation = entitlements?.coins?.included_allocation
    ?? entitlements?.coins?.monthly_allocation
    ?? (entitlements?.subscription?.location_quantity ?? 1) * 100
  const coinPurchaseRate = entitlements?.coins?.purchase_rate_naira
    ?? activePlanRecord?.coin_purchase_rate_naira
    ?? (activePlan?.slug ? fallbackCoinRateByPlanSlug[activePlan.slug] ?? null : null)
  const rolloverEnabled = activePlan ? (entitlements?.coins?.rollover_enabled ?? true) : false
  const canTopUpCoins = Boolean(owner && activePlan && coinPurchaseRate)
  const coinTopUpQuantity = Math.max(Number(coinTopUpAmount) || 0, 0)
  const coinTopUpCost = coinPurchaseRate ? coinTopUpQuantity * coinPurchaseRate : 0
  const usageCountsByFeature = useMemo(() => {
    const rawCounts = entitlements?.usage_counts ?? {}
    const featuresWithUsage = new Set([...Object.keys(rawCounts), ...usageRows.map((row) => row.feature)])
    return new Map<string, number | null>(
      Array.from(featuresWithUsage, (feature) => {
        const serviceUsage = rawCounts[feature]
        if (serviceUsage !== null && serviceUsage !== undefined && Number.isFinite(Number(serviceUsage))) {
          return [feature, Number(serviceUsage)]
        }

        const entitlementUsage = usageRows.find((row) => row.feature === feature)?.usage
        return [feature, entitlementUsage === null || entitlementUsage === undefined ? null : Number(entitlementUsage)]
      }),
    )
  }, [entitlements?.usage_counts, usageRows])
  const workspaceUsageLoading = useMemo(
    () => plans.some((plan) => plan.features.some((feature) => (
      feature.limit_type === "COUNT" &&
      !feature.is_unlimited &&
      feature.limit_value !== null &&
      usageCountsByFeature.get(feature.slug) === null
    ))),
    [plans, usageCountsByFeature],
  )
  const billingHistory = useMemo(
    () =>
      payments.filter((payment) => {
        const status = normalizePaymentStatus(payment.status)
        return ["completed", "processing", "failed", "cancelled", "refunded"].includes(status)
      }),
    [payments],
  )
  const refundHistory = useMemo(
    () => payments.filter((payment) => (
      normalizePaymentStatus(payment.status) === "completed" &&
      `${payment.metadata?.payment_kind ?? ""}`.toLowerCase() === "subscription_upgrade" &&
      Number(payment.metadata?.manual_refund_amount ?? 0) > 0 &&
      Boolean(payment.metadata?.manual_refund_status)
    )),
    [payments],
  )
  const latestBillingPayment = useMemo(
    () => billingHistory.find((payment) => Boolean(payment.metadata?.billing_card) || Boolean(payment.customer_email) || Boolean(payment.customer_name)),
    [billingHistory],
  )
  const latestPlanPayment = useMemo(
    () => billingHistory.find((payment) => {
      const status = normalizePaymentStatus(payment.status)
      return ["completed", "processing"].includes(status) && Boolean(payment.plan_name || payment.metadata?.plan_slug)
    }),
    [billingHistory],
  )
  const latestPlanPaymentStatus = normalizePaymentStatus(latestPlanPayment?.status)
  const pendingPlanName = latestPlanPayment?.plan_name || "Your selected plan"
  const pendingPlanSlug = `${latestPlanPayment?.metadata?.plan_slug ?? ""}`.trim().toLowerCase()
  const paymentAwaitingActivation = !activePlan && Boolean(latestPlanPayment)
  const hasConfiguredBilling = Boolean(activePlan && activeSubscriptionId)
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

  const authorizeBilling = async (
    planSlug: string,
    startTrial = false,
    requestedLocationQuantity = locationQuantity,
    requestedTerminalsPerLocation = terminalsPerLocation,
  ) => {
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
        start_trial: startTrial,
        location_quantity: requestedLocationQuantity,
        terminals_per_location: requestedTerminalsPerLocation,
      }).unwrap()
      if (response?.scheduled_downgrade) {
        toast.success("Your downgrade is scheduled for the next billing date.")
        await refetch()
        await refetchPayments()
        return
      }
      if (response?.checkout_url) {
        window.location.assign(response.checkout_url)
        return
      }
      toast.error("Secure billing checkout was not returned.")
    } catch {
      toast.error("Unable to initialize secure billing.")
    }
  }

  const openBillingConfirmation = (planSlug: string, startTrial = false) => {
    const requestedTerminals = Number(terminalsPerLocationInput)
    if (!Number.isInteger(requestedTerminals) || requestedTerminals < 1 || requestedTerminals > MAX_TERMINALS_PER_LOCATION) {
      toast.error(`Enter between 1 and ${MAX_TERMINALS_PER_LOCATION} POS terminals per location.`)
      return
    }
    if (!billingConfiguration) {
      toast.error("Your billing quote is still being calculated. Please try again shortly.")
      return
    }
    const currentMonthlyTotal = Number((entitlements?.subscription as { monthly_total?: number } | undefined)?.monthly_total ?? 0)
    const nextMonthlyTotal = Number(billingConfiguration.quote.monthly_total ?? 0)
    const isDowngrade = Boolean(activePlan && nextMonthlyTotal < currentMonthlyTotal)
    const periodEnd = entitlements?.subscription?.current_period_end ? new Date(entitlements.subscription.current_period_end).getTime() : 0
    const periodStart = entitlements?.subscription?.start_date ? new Date(entitlements.subscription.start_date).getTime() : 0
    const now = Date.now()
    const isUpgrade = Boolean(activePlan && nextMonthlyTotal > currentMonthlyTotal && periodEnd > now && periodEnd > periodStart)
    const remainingRatio = isUpgrade ? Math.max(0, Math.min(1, (periodEnd - now) / (periodEnd - periodStart))) : 0
    const manualRefundAmount = isUpgrade ? Math.round(currentMonthlyTotal * remainingRatio * 100) / 100 : 0
    const chargeAmount = isDowngrade ? 0 : nextMonthlyTotal
    setBillingIntent({
      planSlug,
      startTrial,
      locationQuantity,
      terminalsPerLocation,
      monthlyTotal: Number(billingConfiguration?.quote.monthly_total ?? 0),
      chargeAmount,
      isUpgrade,
      isDowngrade,
      manualRefundAmount,
    })
  }

  const confirmBillingIntent = async () => {
    if (!billingIntent) return
    const intent = billingIntent
    setBillingIntent(null)
    await authorizeBilling(intent.planSlug, intent.startTrial, intent.locationQuantity, intent.terminalsPerLocation)
  }

  const cancelActiveSubscription = async () => {
    if (!owner || !activeSubscriptionId || !cancellationReason.trim()) return
    try {
      await cancelSubscription({ id: activeSubscriptionId, reason: cancellationReason.trim() }).unwrap()
      setShowCancellationDialog(false)
      setCancellationReason("")
      toast.success("Subscription cancellation scheduled.")
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
      {hasConfiguredBilling ? <Card className="subscription-overview border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardDescription>Workspace subscription</CardDescription>
              <CardTitle className="mt-2 text-3xl">
                {loadingEntitlements
                  ? "Loading plan..."
                  : activePlan?.name ?? (paymentAwaitingActivation ? pendingPlanName : "Choose a plan")}
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
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-50"
                  : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-50"
              }`}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">Card</p>
                <p className="mt-2 text-lg font-semibold">{billingAuthorized ? "Connected" : "Not connected"}</p>
              </div>
            </div>
          ) : paymentAwaitingActivation ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              {latestPlanPaymentStatus === "processing"
                ? `${pendingPlanName} payment is processing. You do not need to pay again.`
                : `${pendingPlanName} payment was received. Plan activation is being finalized.`}
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              {owner
                ? "Choose a plan and the number of structural locations you need. Billing starts immediately after confirmation."
                : "This workspace does not have an active subscription yet. Ask the workspace owner to choose a plan."}
            </div>
          )}
        </CardContent>
      </Card> : null}

      {owner && hasConfiguredBilling ? (
        <Card className="subscription-billing-details border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
                <p className="mt-2 text-lg font-semibold">{activePlan?.name ?? (paymentAwaitingActivation ? pendingPlanName : "No plan selected")}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {paymentAwaitingActivation
                    ? latestPlanPaymentStatus === "processing"
                      ? "Renewal payment is processing."
                      : "Payment received; activation is pending."
                    : subscriptionPendingCancellation
                    ? `Access remains available until ${formatDate(subscriptionAccessUntil)}.`
                    : `Billing status: ${formatSubscriptionStatus(entitlements?.subscription?.status, entitlements?.subscription?.pending_cancellation)}.`}
                </p>
                {activePlan && entitlements?.subscription?.location_quantity ? (
                  <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    {entitlements.subscription.location_quantity.toLocaleString()} structural location{entitlements.subscription.location_quantity === 1 ? "" : "s"} · {coinAllocation.toLocaleString()} Intera coins per cycle
                  </p>
                ) : null}
                {activePlan && activeSubscriptionId ? (
                  <Button className="mt-4" onClick={() => setShowBillingConfigurator(true)}>
                    Manage plan
                  </Button>
                ) : null}
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
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
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

      {owner && hasConfiguredBilling && refundHistory.length > 0 ? (
        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Refunds</CardTitle>
            <CardDescription>Track subscription refunds for this workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {refundHistory.map((payment) => {
              const refundStatus = `${payment.metadata?.manual_refund_status ?? ""}`.toUpperCase()
              const label = refundStatus === "REFUNDED" || refundStatus === "PROCESSED" ? "Refunded" : refundStatus === "PENDING_REVIEW" ? "Under review" : "Processing"
              return (
                <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <div>
                    <p className="font-medium">Subscription refund</p>
                    <p className="text-sm text-slate-500">{payment.external_payment_id || payment.reference || "Payment"} · {formatDate(payment.created_at)}</p>
                    {refundStatus !== "REFUNDED" && refundStatus !== "PROCESSED" && payment.metadata?.manual_refund_due_at ? <p className="text-sm text-slate-500">Expected by {formatDate(String(payment.metadata.manual_refund_due_at))}</p> : null}
                  </div>
                  <div className="text-right">
                    <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">{label}</span>
                    <p className="mt-2 text-base font-semibold">{formatNaira(Number(payment.metadata?.manual_refund_amount ?? 0))}</p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ) : null}

      {!owner ? (
        <Card className="subscription-restricted border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="flex items-center gap-3 p-6 text-sm text-slate-600 dark:text-slate-300">
            <LockKeyhole className="h-5 w-5 text-amber-500" />
            Subscription setup is restricted to the workspace owner.
          </CardContent>
        </Card>
      ) : !hasConfiguredBilling ? (
        <Card className="subscription-billing border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-blue-600" />
              Set up subscription billing
            </CardTitle>
            <CardDescription>Tell us how many physical stores and checkout terminals you need. One terminal per store is included by default; additional terminals are priced separately.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60 xl:col-start-1 xl:row-start-1">
              <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Plan configuration</p>
                <p className="mt-1 text-sm text-slate-500">{locationQuantity.toLocaleString()} physical store{locationQuantity === 1 ? "" : "s"} · {terminalsPerLocation} terminal{terminalsPerLocation === 1 ? "" : "s"} per store</p>
                <p className="mt-1 text-xs text-slate-500">One terminal per location is included by default.</p>
              </div>
              <Button onClick={() => setShowBillingConfigurator(true)}>
                {activePlan && activeSubscriptionId ? "Manage plan" : "Configure plan"}
              </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 xl:col-start-1 xl:row-start-2">
              {billingConfiguration ? (
                <>
                  <p className="font-semibold ">Estimated monthly total: {formatNaira(Number(billingConfiguration.quote.monthly_total))}</p>
                  {Number(billingConfiguration.quote.extra_terminal_quantity) > 0 ? (
                    <p className="mt-1 text-xs text-blue-800">Includes {Number(billingConfiguration.quote.extra_terminal_quantity).toLocaleString()} additional terminal{Number(billingConfiguration.quote.extra_terminal_quantity) === 1 ? "" : "s"} at {formatNaira(Number(billingConfiguration.quote.terminal_unit_price))} each.</p>
                  ) : <p className="mt-1 text-xs text-blue-800">The default one terminal per location is included.</p>}
                </>
              ) : loadingBillingConfiguration ? (
                <p className="text-sm text-slate-500">Calculating your monthly quote…</p>
              ) : billingConfigurationError ? (
                <p className="text-sm text-amber-800">The pricing service is not available with this configuration yet. Please deploy the updated subscription service before choosing a plan.</p>
              ) : <p className="text-sm text-slate-500">Enter your configuration to calculate a quote.</p>}
            </div>
            {loadingEntitlements ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <SkeletonLine className="h-5 w-56" />
                <SkeletonLine className="mt-3 h-4 w-full" />
                <SkeletonLine className="mt-2 h-4 w-3/4" />
              </div>
            ) : activePlan && activeSubscriptionId ? (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm text-gray-700 ">
                    Current plan: <strong>{activePlan.name}</strong>.{" "}
                    {subscriptionPendingCancellation
                      ? `Renewal is paused and access ends on ${formatDate(subscriptionAccessUntil)}. Resume billing before that date to keep the workspace active.`
                      : "Switching plans will set up billing for the new plan and replace the current active subscription after confirmation."}
                  </span>
                </div>
                {!billingAuthorized ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-50">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4" />
                      <span>
                        No card is connected yet. Continue to secure checkout to authorize monthly billing for this workspace.
                      </span>
                    </div>
                    <Button size="sm" onClick={() => openBillingConfirmation(activePlan.slug, true)} disabled={initiatingPayment || verifyingPayment}>
                      Connect card
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
            {/* The plan preview is rendered inside the configuration modal. */}
            {false && (
            <div className="grid gap-4 md:grid-cols-2 xl:col-start-2 xl:row-start-1 xl:grid-cols-1">
              {orderedPlans.filter((plan) => plan.slug === selectedPlanSlug).map((plan) => {
                const selected = activePlan?.slug === plan.slug
                const paymentPendingForPlan = !activePlan && pendingPlanSlug === plan.slug
                const busy = initiatingPayment || verifyingPayment || cancellingSubscription || loadingBillingConfiguration
                const limitIssues = getPlanLimitIssues(plan)
                const blockedByUsage = limitIssues.length > 0
                const blockedByLoadingUsage = !selected && workspaceUsageLoading
                return (
                  <div
                    key={plan.id}
                    className={`subscription-plan-card rounded-3xl border p-5 ${ 
                        selected
                        ? "border-blue-400 bg-blue-50 text-slate-900 dark:border-blue-500 dark:bg-blue-900/30 dark:text-slate-50"
                        : "border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold">{plan.name}</p>
                        <p className="mt-1 text-3xl font-bold">{billingConfiguration ? formatNaira(Number(billingConfiguration.quote.monthly_total)) : formatPrice(plan)}</p>
                      </div>
                      {selected || paymentPendingForPlan ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : null}
                    </div>
                    <p className="mt-3 min-h-12 text-sm text-slate-600 dark:text-slate-300">{plan.description || `${plan.name} plan for Intera IMS.`}</p>
                    <p className="mt-3 text-sm font-medium">{label(plan.slug)} tier for {locationQuantity.toLocaleString()} location{locationQuantity === 1 ? "" : "s"} and {terminalsPerLocation} terminal{terminalsPerLocation === 1 ? "" : "s"} per location · {billingConfiguration ? formatNaira(Number(billingConfiguration.quote.monthly_total)) : "Calculating…"} / month</p>
                    <ul className="mt-4 space-y-2 text-sm">
                      {(plan.features ?? []).map((feature) => (
                        <li key={feature.slug} className="flex items-start gap-2 text-slate-700 dark:text-slate-200">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{formatFeatureLimit(feature, locationQuantity, terminalsPerLocation)}</span>
                        </li>
                      ))}
                    </ul>
                    {blockedByUsage ? (
                      <details className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-50">
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
                    <div className="mt-4 grid gap-2">
                      {selected || paymentPendingForPlan || !activePlan ? (
                        <Button
                          className={selected ? "border-blue-600 bg-blue-100 text-gray-50 hover:bg-blue-200 " : undefined}
                          disabled={(selected && !subscriptionPendingCancellation) || paymentPendingForPlan || busy || blockedByUsage || blockedByLoadingUsage}
                          onClick={() => openBillingConfirmation(plan.slug, false)}
                        >
                          {paymentPendingForPlan
                            ? latestPlanPaymentStatus === "processing" ? "Payment processing" : "Activation pending"
                            : selected
                            ? subscriptionPendingCancellation ? "Resume renewal" : "Current plan"
                            : blockedByLoadingUsage ? "Checking usage..."
                            : blockedByUsage ? "Usage too high" : `Subscribe for ${locationQuantity.toLocaleString()} location${locationQuantity === 1 ? "" : "s"}`}
                        </Button>
                      ) : (
                        <Button
                          className="border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100 "
                          disabled={busy || blockedByUsage || blockedByLoadingUsage}
                          onClick={() => openBillingConfirmation(plan.slug, false)}
                        >
                          {blockedByLoadingUsage ? "Checking usage..." : blockedByUsage ? "Usage too high" : `Switch to ${plan.name}`}
                        </Button>
                      )}
                      {!activePlan && !selected && !paymentPendingForPlan && !blockedByUsage && !blockedByLoadingUsage ? (
                        <Button disabled={busy} onClick={() => openBillingConfirmation(plan.slug, false)}>
                          Subscribe immediately
                        </Button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {hasConfiguredBilling ? <Card className="subscription-coins border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
                  <div className="mt-2 flex overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
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
      </Card> : null}

      {hasConfiguredBilling ? <Card className="subscription-usage border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
          }) : features.length === 0 ? (
            <p className="text-sm text-slate-500">No active subscription entitlement is available yet.</p>
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
      </Card> : null}
      <Dialog open={showBillingConfigurator} onOpenChange={setShowBillingConfigurator}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto p-8 text-gray-900">
          <DialogHeader>
            <DialogTitle>{activePlan && activeSubscriptionId ? "Manage your plan" : "Configure your plan"}</DialogTitle>
            <DialogDescription>
              Enter the number of physical stores and checkout terminals you need. One terminal per location is included by default; additional terminals are optional.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-5">
            <div>
              <label htmlFor="location-quantity" className="text-sm font-semibold">Structural locations</label>
              <p className="mt-1 text-sm text-slate-500">A structural location means one physical store, branch, or shop.</p>
              <Input
                id="location-quantity"
                type="number"
                min={1}
                max={10000}
                step={1}
                value={locationQuantityInput}
                onChange={(event) => setLocationQuantityInput(event.target.value)}
                className="mt-3"
              />
            </div>
            <div>
              <label htmlFor="terminals-per-location" className="text-sm font-semibold">POS terminals per location</label>
              <p className="mt-1 text-sm text-slate-500">Use 1 for the default setup, or configure up to {MAX_TERMINALS_PER_LOCATION} terminals per physical store.</p>
              <Input
                id="terminals-per-location"
                type="number"
                min={1}
                max={MAX_TERMINALS_PER_LOCATION}
                step={1}
                value={terminalsPerLocationInput}
                onChange={(event) => setTerminalsPerLocationInput(event.target.value)}
                onBlur={() => {
                  const parsed = Math.floor(Number(terminalsPerLocationInput))
                  const next = Number.isFinite(parsed)
                    ? Math.min(MAX_TERMINALS_PER_LOCATION, Math.max(1, parsed))
                    : 1
                  setTerminalsPerLocationInput(String(next))
                }}
                className="mt-3"
              />
            </div>
            {billingConfiguration ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                <p className="font-semibold">Estimated monthly total: {formatNaira(Number(billingConfiguration.quote.monthly_total))}</p>
                <p className="mt-1">{label(selectedPlanSlug)} tier · {locationQuantity.toLocaleString()} location{locationQuantity === 1 ? "" : "s"} · {terminalsPerLocation} terminal{terminalsPerLocation === 1 ? "" : "s"} per location</p>
                <p className="mt-1 text-xs text-blue-800">Locations: {formatNaira(Number(billingConfiguration.quote.location_total))} · Additional terminals: {formatNaira(Number(billingConfiguration.quote.terminal_total))}</p>
              </div>
            ) : billingConfigurationError ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">The pricing service must be updated before a plan can be selected.</div>
            ) : null}
          </div>
          <div>
            <p className="text-sm font-semibold">Your recommended plan</p>
            <p className="mt-1 text-sm text-slate-500">The tier is selected automatically from your structural-location count.</p>
            {loadingPlans ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <SkeletonLine className="h-5 w-32" />
                <SkeletonLine className="mt-4 h-8 w-36" />
                <SkeletonLine className="mt-4 h-4 w-full" />
              </div>
            ) : (() => {
              const plan = orderedPlans.find((candidate) => candidate.slug === selectedPlanSlug)
              if (!plan) return <p className="mt-4 text-sm text-slate-500">No plan is available for this configuration yet.</p>
              const planLimitIssues = getPlanLimitIssues(plan)
              const configurationLimitIssues = [
                Number(usageCountsByFeature.get("structural-locations") ?? 0) > locationQuantity
                  ? { featureSlug: "structural-locations", message: `This workspace currently uses ${Number(usageCountsByFeature.get("structural-locations")).toLocaleString()} structural locations.` }
                  : null,
                Number(usageCountsByFeature.get("pos-terminals") ?? 0) > locationQuantity * terminalsPerLocation
                  ? { featureSlug: "pos-terminals", message: `This workspace currently uses ${Number(usageCountsByFeature.get("pos-terminals")).toLocaleString()} POS terminals.` }
                  : null,
              ].filter(Boolean) as PlanLimitIssue[]
              const limitIssues = [...planLimitIssues, ...configurationLimitIssues]
              const activeLocations = Number(entitlements?.subscription?.location_quantity ?? 0)
              const activeTerminalLimit = Number(entitlements?.features?.["pos-terminals"]?.limit_value ?? 0)
              const activeTerminalsPerLocation = Number(entitlements?.subscription?.terminals_per_location ?? (activeLocations > 0 && activeTerminalLimit > 0 ? Math.round(activeTerminalLimit / activeLocations) : 0))
              const isCurrentConfiguration = Boolean(
                activePlan &&
                activeSubscriptionId &&
                activePlan.slug === plan.slug &&
                activeLocations === locationQuantity &&
                activeTerminalsPerLocation === terminalsPerLocation,
              )
              const busy = initiatingPayment || verifyingPayment || cancellingSubscription || loadingBillingConfiguration
              return (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-900 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-50">
                  <p className="text-lg font-semibold">{plan.name}</p>
                  <p className="mt-2 text-3xl font-bold">{billingConfiguration ? formatNaira(Number(billingConfiguration.quote.monthly_total)) : billingConfigurationError ? "Unavailable" : "Calculating…"}</p>
                  <p className="mt-2 text-sm">{label(plan.slug)} tier · {locationQuantity.toLocaleString()} location{locationQuantity === 1 ? "" : "s"} · {terminalsPerLocation} terminal{terminalsPerLocation === 1 ? "" : "s"} per location</p>
                  {billingConfiguration ? <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Locations: {formatNaira(Number(billingConfiguration.quote.location_total))} · Additional terminals: {formatNaira(Number(billingConfiguration.quote.terminal_total))}</p> : null}
                  <ul className="mt-4 space-y-2 text-sm">
                    {(plan.features ?? []).map((feature) => (
                      <li key={feature.slug} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>{formatFeatureLimit(feature, locationQuantity, terminalsPerLocation)}</span></li>
                    ))}
                  </ul>
                  <Button
                    className="mt-5 w-full"
                    disabled={busy || isCurrentConfiguration || billingConfigurationError || !billingConfiguration || limitIssues.length > 0 || workspaceUsageLoading}
                    onClick={() => openBillingConfirmation(plan.slug, false)}
                  >
                    {isCurrentConfiguration ? "Current plan" : limitIssues.length > 0 ? "Usage too high" : workspaceUsageLoading ? "Checking usage…" : activePlan ? "Update plan" : "Choose this plan"}
                  </Button>
                </div>
              )
            })()}
          </div>
          </div>
          {activePlan && activeSubscriptionId ? (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
              <p className="text-sm text-slate-500">
                {subscriptionPendingCancellation
                  ? "Renewal is currently paused for this subscription."
                  : ""}
              </p>
              {subscriptionPendingCancellation ? (
                <Button
                  onClick={() => openBillingConfirmation(activePlan.slug, false)}
                  disabled={initiatingPayment || verifyingPayment}
                >
                  {initiatingPayment ? "Opening checkout..." : "Resume renewal"}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="text-red-700 dark:text-red-200"
                  onClick={() => setShowCancellationDialog(true)}
                  disabled={cancellingSubscription || initiatingPayment || verifyingPayment}
                >
                  Cancel subscription
                </Button>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog open={showCancellationDialog} onOpenChange={setShowCancellationDialog}>
        <DialogContent className="text-gray-900">
          <DialogHeader>
            <DialogTitle>Before you cancel</DialogTitle>
            <DialogDescription>
              Your subscription will remain active until the end of the current billing period. Tell us why you are cancelling before continuing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="cancellation-reason" className="text-sm font-semibold">Reason for cancellation</label>
            <textarea
              id="cancellation-reason"
              value={cancellationReason}
              onChange={(event) => setCancellationReason(event.target.value)}
              placeholder="Tell us what we could improve..."
              rows={4}
              maxLength={1000}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowCancellationDialog(false)} disabled={cancellingSubscription}>Keep subscription</Button>
            <Button variant="destructive" onClick={() => void cancelActiveSubscription()} disabled={cancellingSubscription || !cancellationReason.trim()}>
              {cancellingSubscription ? "Cancelling..." : "Confirm cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(billingIntent)} onOpenChange={(open) => !open && setBillingIntent(null)}>
        <DialogContent className="text-gray-900">
          <DialogHeader>
            <DialogTitle>
              Confirm your subscription
            </DialogTitle>
            <DialogDescription>
              Review the monthly billing terms before continuing with your subscription.
            </DialogDescription>
          </DialogHeader>
          {(() => {
            const plan = plans.find((candidate) => candidate.slug === billingIntent?.planSlug)
            if (!plan || !billingIntent) return null
            const manualRefundAmount = Number(billingIntent.manualRefundAmount || 0)
            return (
            <div className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <p>{billingIntent.isDowngrade ? "You are scheduling a downgrade to" : "You are subscribing to"} <strong>{plan.name}</strong> for <strong>{billingIntent.locationQuantity.toLocaleString()} structural location{billingIntent.locationQuantity === 1 ? "" : "s"}</strong> with <strong>{billingIntent.terminalsPerLocation} terminal{billingIntent.terminalsPerLocation === 1 ? "" : "s"} per location</strong>.</p>
                {billingIntent.isDowngrade ? (
                  <p>No payment will be taken today. Your current plan remains active until the end of its paid period, then the new plan will begin at the next billing date.</p>
                ) : (
                  <p>Your card will be charged <strong>{billingIntent.chargeAmount ? formatNaira(billingIntent.chargeAmount) : "the calculated quote"}</strong> for the new billing cycle.</p>
                )}
                {billingIntent.isUpgrade && manualRefundAmount > 0 ? <p>The unused value of your current plan is estimated at <strong>{formatNaira(manualRefundAmount)}</strong>. We will review and process that refund manually within <strong>two business days</strong> after the upgrade is completed.</p> : null}
                <p>You will receive <strong>{(billingIntent.locationQuantity * 100).toLocaleString()} Intera coins</strong> for this billing cycle.</p>
              </div>
            )
          })()}
          <DialogFooter>
            <Button onClick={() => void confirmBillingIntent()} disabled={initiatingPayment || verifyingPayment}>
              {initiatingPayment ? "Processing..." : billingIntent?.isDowngrade ? "Continue to Downgrade" : "Continue to Subscribe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

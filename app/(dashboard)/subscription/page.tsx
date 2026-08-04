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
import {
  useGetCurrentEntitlementsQuery,
  useGetSubscriptionPlansQuery,
  useInitiatePaymentMutation,
  useVerifyPaymentMutation,
  useCancelSubscriptionMutation,
  useGetCoinTransactionsQuery,
  useTopUpCoinsMutation,
} from "@/redux/features/payment/paymentAPISlice"
import type { EntitlementUsageRow, SubscriptionPlanRecord } from "@/redux/features/payment/paymentTypes"

type Claims = {
  user_id?: string | number
  owner_id?: string | number
  membership_role?: string
  role?: string
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
  return `$${Number(plan.price).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

const formatDate = (value?: string | null) => {
  if (!value) return "Not set"
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

const formatFeatureLimit = (feature: SubscriptionPlanRecord["features"][number]) => {
  if (feature.limit_type === "BOOLEAN" || feature.is_unlimited) return feature.name
  return `${Number(feature.limit_value ?? 0).toLocaleString()} ${feature.name.toLowerCase()}`
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
  const handledPaymentVerificationRef = useRef<string | null>(null)
  const {
    data: entitlements,
    isLoading: loadingEntitlements,
    isError: entitlementsError,
    refetch,
  } = useGetCurrentEntitlementsQuery(undefined, { refetchOnMountOrArgChange: true })
  const { data: coinTransactions = [], refetch: refetchCoinTransactions } = useGetCoinTransactionsQuery(undefined, { refetchOnMountOrArgChange: true })
  const { data: plans = [], isLoading: loadingPlans } = useGetSubscriptionPlansQuery(
    { application__slug: "intera-ims" },
    { refetchOnMountOrArgChange: true },
  )
  const [initiatePayment, { isLoading: initiatingPayment }] = useInitiatePaymentMutation()
  const [verifyPayment, { isLoading: verifyingPayment }] = useVerifyPaymentMutation()
  const [cancelSubscription, { isLoading: cancellingSubscription }] = useCancelSubscriptionMutation()
  const [topUpCoins, { isLoading: toppingUpCoins }] = useTopUpCoinsMutation()
  const [coinTopUpAmount, setCoinTopUpAmount] = useState("5")
  const activePlan = entitlements?.subscription?.plan
  const activeSubscriptionId = entitlements?.subscription?.id
  const billingAuthorized = Boolean(entitlements?.subscription?.billing_authorized)
  const usageRows = useMemo(() => entitlements?.usage ?? [], [entitlements?.usage])
  const features = useMemo(() => Object.entries(entitlements?.features ?? {}), [entitlements?.features])
  const coinBalance = entitlements?.coins?.balance ?? 0
  const coinAllocation = entitlements?.coins?.monthly_allocation ?? 0
  const coinUsed = entitlements?.coins?.used ?? Math.max(coinAllocation - coinBalance, 0)
  const coinPercent = coinAllocation > 0 ? Math.min(100, Math.round((coinBalance / coinAllocation) * 100)) : 0
  const usageByFeature = useMemo(() => new Map(usageRows.map((row) => [row.feature, row])), [usageRows])

  const getPlanLimitIssues = (plan: SubscriptionPlanRecord) =>
    (plan.features ?? [])
      .filter((feature) => feature.limit_type === "COUNT" && !feature.is_unlimited && feature.limit_value !== null)
      .map((feature) => {
        const row = usageByFeature.get(feature.slug)
        const usage = row?.usage
        if (usage === null || usage === undefined || Number(usage) <= Number(feature.limit_value ?? 0)) {
          return null
        }
        return `${feature.name}: ${Number(usage).toLocaleString()} / ${Number(feature.limit_value ?? 0).toLocaleString()}`
      })
      .filter(Boolean) as string[]

  useEffect(() => {
    const transactionId = searchParams.get("transaction_id") || searchParams.get("id")
    const txRef = searchParams.get("tx_ref")
    const status = searchParams.get("status")
    if (!transactionId && !txRef) return
    const verificationKey = [transactionId ?? "", txRef ?? "", status ?? ""].join("|")
    if (handledPaymentVerificationRef.current === verificationKey) return
    handledPaymentVerificationRef.current = verificationKey
    if (status && status !== "successful" && status !== "completed") {
      toast.error("Billing authorization was not completed.")
      return
    }
    void verifyPayment({ transaction_id: transactionId, tx_ref: txRef })
      .unwrap()
      .then(async () => {
        toast.success("Billing authorization confirmed.")
        await refetch()
        await refetchCoinTransactions()
      })
      .catch(() => toast.error("Unable to verify billing authorization."))
  }, [refetch, refetchCoinTransactions, searchParams, verifyPayment])

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
        provider_slug: "flutterwave",
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
      await refetchCoinTransactions()
    } catch {
      toast.error("Unable to cancel subscription.")
    }
  }

  const startCoinTopUp = async () => {
    if (!owner) return
    const amount = Number(coinTopUpAmount)
    if (!Number.isFinite(amount) || amount < 5) {
      toast.error("Minimum Intera coin top-up is $5.")
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
        amount_usd: amount,
        application_slug: "intera-ims",
        provider_slug: "flutterwave",
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
                <p className="mt-2 text-lg font-semibold">{entitlements?.subscription?.status ?? "Unknown"}</p>
              </div>
              <div className="subscription-stat rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Trial ends</p>
                <p className="mt-2 text-lg font-semibold">{formatDate(entitlements?.subscription?.trial_end_date)}</p>
              </div>
              <div className="subscription-stat rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Billing</p>
                <p className="mt-2 text-lg font-semibold">{verifyingPayment ? "Verifying..." : "Secure billing"}</p>
              </div>
              <div className="subscription-stat rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Intera coins</p>
                <p className="mt-2 text-lg font-semibold">{coinBalance.toLocaleString()} / {coinAllocation.toLocaleString()}</p>
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
            <CardDescription>Select the plan that matches the current workspace size. Card details are handled by secure billing; Intera stores provider references, not raw card data. A small card authorization may appear during setup; monthly plan billing starts after the trial.</CardDescription>
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
                    Current plan: <strong>{activePlan.name}</strong>. Switching plans will set up billing for the new plan and replace the current active subscription after confirmation.
                  </span>
                  <Button
                    variant="outline"
                    onClick={cancelActiveSubscription}
                    disabled={cancellingSubscription || initiatingPayment || verifyingPayment}
                  >
                    {cancellingSubscription ? "Cancelling..." : "Cancel subscription"}
                  </Button>
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
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-50">
                        Current usage is above this plan: {limitIssues.slice(0, 3).join("; ")}
                        {limitIssues.length > 3 ? ` and ${limitIssues.length - 3} more.` : "."}
                      </div>
                    ) : null}
                    <Button
                      className="mt-4 w-full"
                      variant={selected ? "outline" : "default"}
                      disabled={selected || busy || blockedByUsage}
                      onClick={() => authorizeBilling(plan.slug)}
                    >
                      {selected ? "Active" : blockedByUsage ? "Usage too high" : activePlan ? "Switch to this plan" : "Choose plan"}
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">Available coins</p>
                  <p className="mt-1 text-3xl font-bold">{coinBalance.toLocaleString()} / {coinAllocation.toLocaleString()}</p>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <p>{coinUsed.toLocaleString()} used</p>
                  <p>{coinPercent}% remaining</p>
                </div>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${coinPercent}%` }} />
              </div>
            </div>
            {owner ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Buy more coins</label>
                  <p className="mt-2 text-sm text-slate-500">$1 buys 1,000 Intera coins. Minimum top-up is $5.</p>
                  <div className="mt-2 flex overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
                    <span className="px-3 py-2 text-slate-500">$</span>
                    <input
                      value={coinTopUpAmount}
                      onChange={(event) => setCoinTopUpAmount(event.target.value)}
                      type="number"
                      min={5}
                      step={1}
                      className="w-full bg-transparent px-2 py-2 outline-none"
                    />
                  </div>
                </div>
                <Button className="mt-3 w-full" onClick={startCoinTopUp} disabled={toppingUpCoins || verifyingPayment}>
                  {toppingUpCoins ? "Opening checkout..." : `Buy ${(Math.max(Number(coinTopUpAmount) || 0, 0) * 1000).toLocaleString()} coins`}
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
          }) : features.length === 0 ? (
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

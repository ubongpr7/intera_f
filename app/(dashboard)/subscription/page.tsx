"use client"

import { useEffect, useMemo } from "react"
import { jwtDecode } from "jwt-decode"
import { getCookie } from "cookies-next"
import { useSearchParams } from "next/navigation"
import { CalendarClock, CheckCircle2, CreditCard, Gauge, LockKeyhole, ShieldCheck } from "lucide-react"
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
} from "@/redux/features/payment/paymentAPISlice"
import type { SubscriptionPlanRecord } from "@/redux/features/payment/paymentTypes"

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

export default function SubscriptionPage() {
  const searchParams = useSearchParams()
  const owner = useMemo(() => isWorkspaceOwner(), [])
  const {
    data: entitlements,
    isLoading: loadingEntitlements,
    isError: entitlementsError,
    refetch,
  } = useGetCurrentEntitlementsQuery()
  const { data: plans = [], isLoading: loadingPlans } = useGetSubscriptionPlansQuery({ application__slug: "intera-ims" })
  const [initiatePayment, { isLoading: initiatingPayment }] = useInitiatePaymentMutation()
  const [verifyPayment, { isLoading: verifyingPayment }] = useVerifyPaymentMutation()
  const [cancelSubscription, { isLoading: cancellingSubscription }] = useCancelSubscriptionMutation()
  const activePlan = entitlements?.subscription?.plan
  const activeSubscriptionId = entitlements?.subscription?.id
  const features = Object.entries(entitlements?.features ?? {})

  useEffect(() => {
    const transactionId = searchParams.get("transaction_id") || searchParams.get("id")
    const txRef = searchParams.get("tx_ref")
    const status = searchParams.get("status")
    if (!transactionId && !txRef) return
    if (status && status !== "successful" && status !== "completed") {
      toast.error("Flutterwave did not complete the billing authorization.")
      return
    }
    void verifyPayment({ transaction_id: transactionId, tx_ref: txRef })
      .unwrap()
      .then(async () => {
        toast.success("Billing authorization confirmed.")
        await refetch()
      })
      .catch(() => toast.error("Unable to verify Flutterwave billing authorization."))
  }, [refetch, searchParams, verifyPayment])

  const authorizeBilling = async (planSlug: string) => {
    if (!owner) return
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
      toast.error("Flutterwave checkout URL was not returned.")
    } catch {
      toast.error("Unable to initialize Flutterwave billing.")
    }
  }

  const cancelActiveSubscription = async () => {
    if (!owner || !activeSubscriptionId) return
    try {
      await cancelSubscription(activeSubscriptionId).unwrap()
      toast.success("Subscription cancelled.")
      await refetch()
    } catch {
      toast.error("Unable to cancel subscription.")
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
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
          {entitlementsError ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              Subscription information is temporarily unavailable.
              <Button variant="outline" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : activePlan ? (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</p>
                <p className="mt-2 text-lg font-semibold">{entitlements?.subscription?.status ?? "Unknown"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Trial ends</p>
                <p className="mt-2 text-lg font-semibold">{formatDate(entitlements?.subscription?.trial_end_date)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Billing</p>
                <p className="mt-2 text-lg font-semibold">{verifyingPayment ? "Verifying..." : "Flutterwave"}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              {owner
	                ? "Choose a plan and authorize billing through Flutterwave. The workspace gets the configured trial period before regular monthly billing applies."
                : "This workspace does not have an active subscription yet. Ask the workspace owner to choose a plan."}
            </div>
          )}
        </CardContent>
      </Card>

      {!owner ? (
        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardContent className="flex items-center gap-3 p-6 text-sm text-slate-600 dark:text-slate-300">
            <LockKeyhole className="h-5 w-5 text-amber-500" />
            Subscription setup is restricted to the workspace owner.
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-blue-600" />
	              Authorize subscription billing
	            </CardTitle>
	            <CardDescription>Select the plan that matches the current workspace size. Card details are entered only on Flutterwave; Intera stores provider references, not raw card data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activePlan && activeSubscriptionId ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900/60">
                <span>
                  Current plan: <strong>{activePlan.name}</strong>. Switching plans will authorize billing for the new plan and replace the current active subscription after payment confirmation.
                </span>
                <Button
                  variant="outline"
                  onClick={cancelActiveSubscription}
                  disabled={cancellingSubscription || initiatingPayment || verifyingPayment}
                >
                  {cancellingSubscription ? "Cancelling..." : "Cancel subscription"}
                </Button>
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(loadingPlans ? [] : plans).map((plan) => {
              const selected = activePlan?.slug === plan.slug
              const busy = initiatingPayment || verifyingPayment || cancellingSubscription
              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl border p-5 ${
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
                  <Button
                    className="mt-4 w-full"
                    variant={selected ? "outline" : "default"}
                    disabled={selected || busy || plan.slug === "enterprise"}
                    onClick={() => authorizeBilling(plan.slug)}
                  >
                    {plan.slug === "enterprise"
                      ? "Contact support"
                      : selected
                        ? "Active"
                        : activePlan
                          ? "Switch to this plan"
                          : "Authorize card"}
                  </Button>
                </div>
              )
            })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Gauge className="h-5 w-5 text-blue-600" />Plan entitlements</CardTitle>
          <CardDescription>Authoritative capabilities and limits for this workspace.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {features.length === 0 ? (
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

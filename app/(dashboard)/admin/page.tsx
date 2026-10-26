"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { AlertTriangle, Boxes, Building2, CheckCircle2, CreditCard, FileSearch, Link2, PackageSearch, RefreshCw, Settings, ShieldCheck, Users, Webhook } from "lucide-react"

import StatTile from "@/components/dashboard/StatTile"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useGetPaymentAnalyticsQuery, useGetSubscriptionAnalyticsQuery, useGetWebhookLogsQuery } from "@/redux/features/payment/paymentAPISlice"
import { useGetGlobalCatalogAdminStatsQuery, useGetGlobalProductCapturesQuery } from "@/redux/features/product/productAPISlice"
import { useGetAdminSummaryQuery, useListReferralPayoutsQuery } from "@/redux/features/users/userApiSlice"

const adminLinks = [
  {
    href: "/admin/workspaces",
    title: "Workspace management",
    description: "Review workspace owners, verify new workspaces, and manage platform workspaces.",
    icon: Building2,
  },
  {
    href: "/payment-admin",
    title: "Billing and subscriptions",
    description: "Manage plans, payments, providers, and webhook activity.",
    icon: CreditCard,
  },
  {
    href: "/admin/affiliates",
    title: "Affiliate partners",
    description: "Create unique partner links and manage custom commission agreements.",
    icon: Link2,
  },
  {
    href: "/product/global-catalog-admin",
    title: "Global product catalog",
    description: "Curate platform-owned products, variants, and catalog imports.",
    icon: Boxes,
  },
  {
    href: "/audit",
    title: "Audit trail",
    description: "Inspect platform activity, approvals, permissions, and operational events.",
    icon: FileSearch,
  },
  {
    href: "/admin/invitations",
    title: "Staff invitations",
    description: "Invite and revoke platform staff without attaching a workspace.",
    icon: Users,
  },
  {
    href: "/admin/settings",
    title: "Admin settings",
    description: "Configure platform-level access and governance controls.",
    icon: Settings,
  },
]

const formatNumber = (value: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)
const formatCurrency = (value: number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value)

const insightTone = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-950",
  amber: "border-amber-200 bg-amber-50 text-amber-950",
  red: "border-red-200 bg-red-50 text-red-950",
  blue: "border-blue-200 bg-blue-50 text-blue-950",
} as const

function InsightCard({
  icon: Icon,
  title,
  value,
  detail,
  tone,
  href,
}: {
  icon: typeof AlertTriangle
  title: string
  value: number
  detail: string
  tone: keyof typeof insightTone
  href: string
}) {
  return (
    <Link href={href} className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${insightTone[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{title}</p>
        <Icon className="h-5 w-5 opacity-70" />
      </div>
      <div className="mt-3 text-3xl font-semibold">{formatNumber(value)}</div>
      <p className="mt-2 text-sm opacity-80">{detail}</p>
    </Link>
  )
}

export default function AdminPage() {
  const [period, setPeriod] = useState("30d")
  const { data: paymentAnalytics, isFetching: paymentFetching, refetch: refetchPayments } = useGetPaymentAnalyticsQuery({ period })
  const { data: subscriptionAnalytics, isFetching: subscriptionFetching, refetch: refetchSubscriptions } = useGetSubscriptionAnalyticsQuery({ period })
  const { data: catalogStats, isFetching: catalogFetching, refetch: refetchCatalog } = useGetGlobalCatalogAdminStatsQuery()
  const { data: pendingCaptureResponse, isFetching: pendingCaptureFetching, refetch: refetchPendingCaptures } = useGetGlobalProductCapturesQuery({ status: "pending", page_size: 1 })
  const { data: processingCaptureResponse, isFetching: processingCaptureFetching, refetch: refetchProcessingCaptures } = useGetGlobalProductCapturesQuery({ status: "processing", page_size: 1 })
  const { data: reviewCaptureResponse, isFetching: reviewCaptureFetching, refetch: refetchReviewCaptures } = useGetGlobalProductCapturesQuery({ status: "review", page_size: 1 })
  const { data: rejectedCaptureResponse, isFetching: rejectedCaptureFetching, refetch: refetchRejectedCaptures } = useGetGlobalProductCapturesQuery({ status: "rejected", page_size: 1 })
  const { data: payoutResponse, isFetching: payoutFetching, refetch: refetchPayouts } = useListReferralPayoutsQuery()
  const { data: adminSummary, isFetching: summaryFetching, refetch: refetchSummary } = useGetAdminSummaryQuery()
  const { data: webhookResponse, isFetching: webhookFetching, refetch: refetchWebhooks } = useGetWebhookLogsQuery({ limit: 100, ordering: "-created_at" })
  const [isRefreshing, setIsRefreshing] = useState(false)

  const pendingCaptures = (pendingCaptureResponse?.count ?? 0) + (processingCaptureResponse?.count ?? 0)
  const reviewCaptures = reviewCaptureResponse?.count ?? 0
  const rejectedCaptures = rejectedCaptureResponse?.count ?? 0
  const payouts = Array.isArray(payoutResponse) ? payoutResponse : []
  const pendingPayouts = payouts.filter((item) => item.status === "pending")
  const webhookLogs = Array.isArray(webhookResponse) ? webhookResponse : (webhookResponse?.results ?? [])
  const failedWebhooks = webhookLogs.filter((item: any) => {
    const value = String(item.status ?? item.event_status ?? item.state ?? "").toLowerCase()
    return value.includes("fail") || value.includes("error")
  }).length
  const isFetching = summaryFetching || paymentFetching || subscriptionFetching || catalogFetching || pendingCaptureFetching || processingCaptureFetching || reviewCaptureFetching || rejectedCaptureFetching || payoutFetching || webhookFetching

  const refreshDashboard = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([refetchSummary(), refetchPayments(), refetchSubscriptions(), refetchCatalog(), refetchPendingCaptures(), refetchProcessingCaptures(), refetchReviewCaptures(), refetchRejectedCaptures(), refetchPayouts(), refetchWebhooks()])
    } finally {
      setIsRefreshing(false)
    }
  }

  const statusBreakdown = useMemo(
    () => subscriptionAnalytics?.status_breakdown ?? {},
    [subscriptionAnalytics?.status_breakdown],
  )

  const topLineStats = [
    {
      label: "Revenue",
      value: formatCurrency(paymentAnalytics?.total_revenue ?? 0, paymentAnalytics?.currency ?? "NGN"),
      description: `${formatNumber(paymentAnalytics?.successful_payments ?? 0)} successful payments tracked`,
      tone: "green" as const,
      icon: CreditCard,
    },
    {
      label: "Active subscriptions",
      value: formatNumber(subscriptionAnalytics?.active_count ?? 0),
      description: "Subscriptions currently in good standing",
      tone: "blue" as const,
      icon: ShieldCheck,
    },
    {
      label: "Global products",
      value: formatNumber(catalogStats?.total_products ?? 0),
      description: `${formatNumber(catalogStats?.total_variants ?? 0)} curated global variants`,
      tone: "amber" as const,
      icon: PackageSearch,
    },
  ]

  return (
    <div className="admin-portal-surface mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500" />
        <div className="grid gap-6 p-6 lg:grid-cols-[1.5fr_1fr] lg:p-8">
          <div className="space-y-4">
            <Badge className="border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              Admin command center
            </Badge>
            <div className="max-w-3xl space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white lg:text-4xl">Oversee billing, catalog, audit, and live operations from one place.</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 lg:text-base">
                This hub is reserved for `is_staff` and `is_superuser` users. It exposes the parts of the platform that need governance,
                monitoring, and intervention without mixing them into normal workspace flows.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
                <Link href="/payment-admin">Open billing console</Link>
              </Button>
              <Button asChild variant="outline" className="border-gray-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                <Link href="/product/global-catalog-admin">Open global catalog</Link>
              </Button>
              <select value={period} onChange={(event) => setPeriod(event.target.value)} className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" aria-label="Insight period">
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <Button type="button" variant="outline" onClick={() => void refreshDashboard()} disabled={isRefreshing || isFetching} className="gap-2 border-gray-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh insights
              </Button>
            </div>
          </div>

          <Card className="border-gray-200 bg-gray-50 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-950 dark:text-white">Operational snapshot</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">
                A quick read on billing, subscriptions, and catalog pressure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <span className="text-sm text-slate-600 dark:text-slate-300">Payment success rate</span>
                <span className="text-sm font-semibold text-slate-950 dark:text-white">{formatNumber(paymentAnalytics?.conversion_rate ?? 0)}%</span>
              </div>
              <p className="pt-1 text-xs text-slate-500">Completed payments divided by all payment attempts in the selected period.</p>
              <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <span className="text-sm text-slate-600 dark:text-slate-300">Subscription change</span>
                <span className="text-sm font-semibold text-slate-950 dark:text-white">{formatNumber(subscriptionAnalytics?.subscription_change ?? 0)}%</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <span className="text-sm text-slate-600 dark:text-slate-300">Catalog variants</span>
                <span className="text-sm font-semibold text-slate-950 dark:text-white">{formatNumber(catalogStats?.total_variants ?? 0)}</span>
              </div>
              <p className="pt-1 text-xs text-slate-500">Data period: {period}. Refreshes query-backed metrics only.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {topLineStats.map((stat) => (
          <StatTile key={stat.label} label={stat.label} value={stat.value} description={stat.description} icon={stat.icon} tone={stat.tone} />
        ))}
        <StatTile label="Needs review" value={formatNumber(reviewCaptures)} description={`${formatNumber(pendingCaptures)} captures still processing`} icon={AlertTriangle} tone="default" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Users" value={formatNumber(adminSummary?.users.total ?? 0)} description={`${formatNumber(adminSummary?.users.active ?? 0)} active accounts`} icon={Users} tone="blue" />
        <StatTile label="Workspaces" value={formatNumber(adminSummary?.workspaces.total ?? 0)} description={`${formatNumber(adminSummary?.workspaces.verified ?? 0)} verified workspaces`} icon={Boxes} tone="blue" />
        <StatTile label="Platform staff" value={formatNumber(adminSummary?.users.staff ?? 0)} description={`${formatNumber(adminSummary?.users.superusers ?? 0)} superusers`} icon={ShieldCheck} tone="amber" />
        <StatTile label="Active memberships" value={formatNumber(adminSummary?.memberships.active ?? 0)} description="Active user-to-workspace memberships" icon={Users} tone="default" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InsightCard icon={AlertTriangle} title="Catalog capture queue" value={reviewCaptures} detail={`${pendingCaptures} pending or processing · ${rejectedCaptures} rejected`} tone={reviewCaptures ? "amber" : "green"} href="/product/global-catalog-admin" />
        <InsightCard icon={CreditCard} title="Pending affiliate payouts" value={pendingPayouts.length} detail="Manual review and release required" tone={pendingPayouts.length ? "amber" : "green"} href="/admin/affiliates" />
        <InsightCard icon={Webhook} title="Webhook failures" value={failedWebhooks} detail={`${webhookLogs.length} recent webhook records inspected`} tone={failedWebhooks ? "red" : "green"} href="/payment-admin" />
        <InsightCard icon={CheckCircle2} title="Catalog publication" value={catalogStats?.published_products ?? 0} detail={`${catalogStats?.draft_products ?? 0} drafts · ${catalogStats?.archived_products ?? 0} archived`} tone="blue" href="/product/global-catalog-admin" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>Admin surfaces</CardTitle>
            <CardDescription>Core control panels grouped by responsibility.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {adminLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                key={link.href}
                href={link.href}
                className="group rounded-2xl border border-gray-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-blue-700 transition group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-950 dark:text-white">{link.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{link.description}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>Subscription status</CardTitle>
            <CardDescription>Current subscription breakdown by state.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.keys(statusBreakdown).length > 0 ? (
              Object.entries(statusBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
                  <span className="text-sm font-medium capitalize text-slate-700">{status}</span>
                  <Badge variant="secondary">{formatNumber(Number(count ?? 0))}</Badge>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                No subscription breakdown returned yet.
              </div>
            )}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              These insights are sourced from the payment, subscription, catalog, capture, referral, and webhook APIs. They are not workspace inventory estimates.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

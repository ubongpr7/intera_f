"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Activity, Bell, Boxes, CreditCard, FileSearch, PackageSearch, ShieldCheck, Users } from "lucide-react"

import StatTile from "@/components/dashboard/StatTile"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useGetPaymentAnalyticsQuery, useGetSubscriptionAnalyticsQuery } from "@/redux/features/payment/paymentAPISlice"
import { useGetGlobalCatalogAdminStatsQuery } from "@/redux/features/product/productAPISlice"
import { useGetDashboardLowStockItemsQuery, useGetRealtimeDashboardStatsQuery } from "@/redux/features/dashboard/dashboardApiSlice"

const adminLinks = [
  {
    href: "/payment-admin",
    title: "Billing and subscriptions",
    description: "Manage plans, payments, providers, and webhook activity.",
    icon: CreditCard,
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
    href: "/profile/staff",
    title: "Staff and roles",
    description: "Review staff access, memberships, and role assignments.",
    icon: Users,
  },
  {
    href: "/realtime-dashboard",
    title: "Realtime operations",
    description: "Monitor live sales, inventory pressure, and operational movement.",
    icon: Activity,
  },
  {
    href: "/notifications",
    title: "Notifications",
    description: "Track notification delivery and user-facing alerts.",
    icon: Bell,
  },
]

const formatNumber = (value: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)

export default function AdminPage() {
  const period = "30d"
  const { data: paymentAnalytics } = useGetPaymentAnalyticsQuery({ period })
  const { data: subscriptionAnalytics } = useGetSubscriptionAnalyticsQuery({ period })
  const { data: catalogStats } = useGetGlobalCatalogAdminStatsQuery()
  const { data: realtimeStats } = useGetRealtimeDashboardStatsQuery("")
  const { data: lowStockItems = [] } = useGetDashboardLowStockItemsQuery({ stock_status: "low_stock" })

  const statusBreakdown = useMemo(
    () => subscriptionAnalytics?.status_breakdown ?? {},
    [subscriptionAnalytics?.status_breakdown],
  )

  const topLineStats = [
    {
      label: "Revenue",
      value: formatNumber(paymentAnalytics?.total_revenue ?? 0),
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
    {
      label: "Low stock alerts",
      value: formatNumber(lowStockItems.length),
      description: "Items that need operational attention",
      tone: "default" as const,
      icon: Boxes,
    },
  ]

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500" />
        <div className="grid gap-6 p-6 lg:grid-cols-[1.5fr_1fr] lg:p-8">
          <div className="space-y-4">
            <Badge className="border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              Admin command center
            </Badge>
            <div className="max-w-3xl space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 lg:text-4xl">Oversee billing, catalog, audit, and live operations from one place.</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 lg:text-base">
                This hub is reserved for `is_staff` and `is_superuser` users. It exposes the parts of the platform that need governance,
                monitoring, and intervention without mixing them into normal workspace flows.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
                <Link href="/payment-admin">Open billing console</Link>
              </Button>
              <Button asChild variant="outline" className="border-gray-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                <Link href="/product/global-catalog-admin">Open global catalog</Link>
              </Button>
            </div>
          </div>

          <Card className="border-gray-200 bg-gray-50 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-950">Operational snapshot</CardTitle>
              <CardDescription className="text-slate-600">
                A quick read on billing, subscriptions, and catalog pressure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <span className="text-sm text-slate-600">Payment conversion</span>
                <span className="text-sm font-semibold text-slate-950">{formatNumber(paymentAnalytics?.conversion_rate ?? 0)}%</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <span className="text-sm text-slate-600">Subscription churn proxy</span>
                <span className="text-sm font-semibold text-slate-950">{formatNumber(subscriptionAnalytics?.subscription_change ?? 0)}%</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <span className="text-sm text-slate-600">Realtime products</span>
                <span className="text-sm font-semibold text-slate-950">{formatNumber(realtimeStats?.total_products ?? 0)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {topLineStats.map((stat) => (
          <StatTile key={stat.label} label={stat.label} value={stat.value} description={stat.description} icon={stat.icon} tone={stat.tone} />
        ))}
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
                      <h3 className="font-semibold text-slate-950">{link.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{link.description}</p>
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
              Use this hub to investigate admin-level issues first, then drill into the dedicated workspaces for billing, catalog, audit, and live monitoring.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

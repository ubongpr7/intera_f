"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  BarChart3,
  BellRing,
  CreditCard,
  Package,
  Receipt,
  ShieldCheck,
  Settings,
  Users,
  Webhook,
} from "lucide-react"

import StatTile from "@/components/dashboard/StatTile"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaymentProvidersTab } from "@/components/payment-admin/PaymentProvidersTab"
import { PaymentAppsTab } from "@/components/payment-admin/PaymentAppsTab"
import { SubscriptionPlansTab } from "@/components/payment-admin/SubscriptionPlansTab"
import { PaymentsTab } from "@/components/payment-admin/PaymentsTab"
import { SubscriptionsTab } from "@/components/payment-admin/SubscriptionsTab"
import { WebhookLogsTab } from "@/components/payment-admin/WebhookLogsTab"
import { AnalyticsTab } from "@/components/payment-admin/AnalyticsTab"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGetPaymentAnalyticsQuery, useGetSubscriptionAnalyticsQuery } from "@/redux/features/payment/paymentAPISlice"
import { useGetPaymentAppsQuery, useGetPaymentProvidersQuery, useGetSubscriptionPlansQuery, useGetPaymentsQuery, useGetSubscriptionsQuery } from "@/redux/features/payment/paymentAPISlice"

const formatNumber = (value: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)

export default function PaymentAdminPage() {
  const [activeTab, setActiveTab] = useState("analytics")

  const { data: paymentAnalytics } = useGetPaymentAnalyticsQuery({ period: "30d" })
  const { data: subscriptionAnalytics } = useGetSubscriptionAnalyticsQuery({ period: "30d" })
  const { data: providers = [] } = useGetPaymentProvidersQuery({})
  const { data: apps = [] } = useGetPaymentAppsQuery({})
  const { data: plans = [] } = useGetSubscriptionPlansQuery({})
  const { data: payments = [] } = useGetPaymentsQuery({})
  const { data: subscriptions = [] } = useGetSubscriptionsQuery({})

  const headerStats = useMemo(
    () => [
      {
        label: "Revenue",
        value: formatNumber(paymentAnalytics?.total_revenue ?? 0),
        description: "Tracked across the selected period",
        icon: CreditCard,
        tone: "green" as const,
      },
      {
        label: "Active subscriptions",
        value: formatNumber(subscriptionAnalytics?.active_count ?? 0),
        description: "Current live subscriptions",
        icon: ShieldCheck,
        tone: "blue" as const,
      },
      {
        label: "Ending soon",
        value: formatNumber(subscriptionAnalytics?.scheduled_cancellation_count ?? 0),
        description: "Subscriptions set to stop at period end",
        icon: BellRing,
        tone: "amber" as const,
      },
      {
        label: "Billing plans",
        value: formatNumber(plans.length),
        description: "Available subscription plans",
        icon: Receipt,
        tone: "amber" as const,
      },
      {
        label: "Transactions",
        value: formatNumber(payments.length),
        description: "Payment records in the system",
        icon: BarChart3,
        tone: "default" as const,
      },
    ],
    [paymentAnalytics?.total_revenue, subscriptionAnalytics?.active_count, subscriptionAnalytics?.scheduled_cancellation_count, plans.length, payments.length],
  )

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500" />
        <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_0.9fr] lg:p-8">
          <div className="space-y-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              Payment administration
            </div>
            <div className="max-w-3xl space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 lg:text-4xl">Billing, subscriptions, and payment operations in one control center.</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 lg:text-base">
                Manage providers, plans, apps, payments, subscriptions, and webhook activity with the same operational clarity used elsewhere in the platform.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
                <Link href="#analytics">Open analytics</Link>
              </Button>
              <Button asChild variant="outline" className="border-gray-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                <Link href="#providers">Review providers</Link>
              </Button>
            </div>
          </div>

          <Card className="border-gray-200 bg-gray-50 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-950">Payment admin snapshot</CardTitle>
              <CardDescription className="text-slate-600">A quick operational read before you drill into the tabs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <span className="text-sm text-slate-600">Payment success</span>
                <span className="text-sm font-semibold text-slate-950">{formatNumber(paymentAnalytics?.conversion_rate ?? 0)}%</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <span className="text-sm text-slate-600">Providers configured</span>
                <span className="text-sm font-semibold text-slate-950">{formatNumber(providers.length)}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <span className="text-sm text-slate-600">Registered payment apps</span>
                <span className="text-sm font-semibold text-slate-950">{formatNumber(apps.length)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {headerStats.map((stat) => (
          <StatTile key={stat.label} label={stat.label} value={stat.value} description={stat.description} icon={stat.icon} tone={stat.tone} />
        ))}
      </div>

      <Card className="overflow-hidden border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100 bg-gray-50/70">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-slate-950">Billing workspace</CardTitle>
              <CardDescription className="text-slate-600">
                Admin tabs for finance, subscription governance, and webhook inspection.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{formatNumber(subscriptions.length)} subscriptions</Badge>
              <Badge variant="secondary">{formatNumber(paymentAnalytics?.successful_payments ?? 0)} successful payments</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-2 md:grid-cols-4 xl:grid-cols-7">
              <TabsTrigger
                value="analytics"
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger
                value="providers"
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
              >
                <Settings className="mr-2 h-4 w-4" />
                Providers
              </TabsTrigger>
              <TabsTrigger
                value="apps"
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
              >
                <Package className="mr-2 h-4 w-4" />
                Apps
              </TabsTrigger>
              <TabsTrigger
                value="plans"
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
              >
                <Receipt className="mr-2 h-4 w-4" />
                Plans
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Payments
              </TabsTrigger>
              <TabsTrigger
                value="subscriptions"
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
              >
                <Users className="mr-2 h-4 w-4" />
                Subscriptions
              </TabsTrigger>
              <TabsTrigger
                value="webhooks"
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
              >
                <Webhook className="mr-2 h-4 w-4" />
                Webhooks
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" id="analytics" className="space-y-6">
              <AnalyticsTab />
            </TabsContent>

            <TabsContent value="providers" id="providers" className="space-y-6">
              <PaymentProvidersTab />
            </TabsContent>

            <TabsContent value="apps" className="space-y-6">
              <PaymentAppsTab />
            </TabsContent>

            <TabsContent value="plans" className="space-y-6">
              <SubscriptionPlansTab />
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <PaymentsTab />
            </TabsContent>

            <TabsContent value="subscriptions" className="space-y-6">
              <SubscriptionsTab />
            </TabsContent>

            <TabsContent value="webhooks" className="space-y-6">
              <WebhookLogsTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

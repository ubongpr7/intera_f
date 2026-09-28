"use client"

import Link from "next/link"
import { ArrowLeft, BadgePercent, CreditCard, MonitorSpeaker, Users2, Wallet } from "lucide-react"
import Configurations from "@/components/pos/Configurations"
import Customers from "@/components/pos/Customers"
import Discounts from "@/components/pos/Discounts"
import Tables from "@/components/pos/Tables"
import Terminals from "@/components/pos/Terminals"
import { useCompanyProfile } from "@/hooks/useCompanyProfile"
import { supportsPosTables } from "@/lib/posExperience"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TabsContent, TabsList, TabsTrigger, UrlTabs } from "@/components/ui/tabs"
import { useGetCurrentConfigurationQuery } from "@/redux/features/pos/posAPISlice"

export default function POSSettingsPage() {
  const { data: currentConfiguration } = useGetCurrentConfigurationQuery()
  const { profile } = useCompanyProfile()
  const tablesEnabled = supportsPosTables(profile?.industry)
  const settingCards = [
    {
      title: "Checkout policy",
      description: "Currency, tax, receipts, split payments, and discount boundaries.",
      icon: CreditCard,
    },
    {
      title: "Terminal setup",
      description: tablesEnabled
        ? "Selling terminals and service tables for live checkout operations."
        : "Selling terminals and device assignments for live checkout operations.",
      icon: MonitorSpeaker,
    },
    {
      title: "Discount controls",
      description: "Reusable cashier-safe discount rules and approval thresholds.",
      icon: BadgePercent,
    },
    {
      title: "Cash remittance",
      description: "Handled from a dedicated remittance workspace, separate from POS policy configuration.",
      icon: Wallet,
    },
  ]

  return (
    <div className="pos-settings-workspace space-y-6">
      <Card className="pos-settings-hero border-gray-200 bg-white shadow-sm">
        <CardHeader className="gap-3 p-6 text-left">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            POS Admin Workspace
          </div>
          <CardTitle className="text-3xl font-semibold tracking-tight text-gray-900">POS settings and controls</CardTitle>
          <CardDescription className="max-w-4xl text-sm leading-6 text-gray-600">
            This page is for administrators and supervisors. Cashier checkout runs in the dedicated POS application,
            while configuration, terminals, customers, and discount policy live here. Cash remittance now has its own
            admin workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-6 pt-0">
          <div className="pos-settings-stat-grid grid gap-4 md:grid-cols-4">
            <div className="pos-settings-stat rounded-[24px] border border-gray-200 bg-gray-50 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Active policy</div>
              <div className="mt-2 text-sm font-semibold text-gray-900">{currentConfiguration?.name || "Default POS"}</div>
            </div>
            <div className="pos-settings-stat rounded-[24px] border border-gray-200 bg-gray-50 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Tax</div>
              <div className="mt-2 text-sm font-semibold text-gray-900">
                {currentConfiguration?.tax_inclusive ? "Inclusive" : "Exclusive"} ·{" "}
                {currentConfiguration?.default_tax_rate ? `${currentConfiguration.default_tax_rate}%` : "0%"}
              </div>
            </div>
            <div className="pos-settings-stat rounded-[24px] border border-gray-200 bg-gray-50 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Split payments</div>
              <div className="mt-2 text-sm font-semibold text-gray-900">
                {currentConfiguration?.allow_split_payment ? "Enabled" : "Disabled"}
              </div>
            </div>
            <div className="pos-settings-stat rounded-[24px] border border-gray-200 bg-gray-50 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Currency</div>
              <div className="mt-2 text-sm font-semibold text-gray-900">{currentConfiguration?.currency || "NGN"}</div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {settingCards.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="pos-settings-feature rounded-[24px] border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{item.title}</div>
                    <Icon className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-gray-700">{item.description}</p>
                </div>
              )
            })}
          </div>

          <div className="pos-settings-actions flex flex-wrap gap-3">
            <Button asChild variant="outline" className="pos-settings-secondary-action">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to dashboard
              </Link>
            </Button>
            <Button asChild className="pos-settings-primary-action">
              <Link href="/pos/remittances">
                <Wallet className="mr-2 h-4 w-4" />
                Open remittance workspace
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <UrlTabs defaultValue="policy" tabValues={["policy", "terminals", "customers", "discounts"]} className="pos-settings-tabs space-y-4">
        <TabsList className="pos-settings-tab-list h-auto flex-wrap justify-start gap-2 rounded-[24px] bg-slate-100 p-1">
          <TabsTrigger
            value="policy"
            className="pos-settings-tab rounded-[18px] px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:text-blue-700"
          >
            Checkout policy
          </TabsTrigger>
          <TabsTrigger
            value="terminals"
            className="pos-settings-tab rounded-[18px] px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:text-blue-700"
          >
            {tablesEnabled ? "Terminals and tables" : "Terminals"}
          </TabsTrigger>
          <TabsTrigger
            value="customers"
            className="pos-settings-tab rounded-[18px] px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:text-blue-700"
          >
            Customers
          </TabsTrigger>
          <TabsTrigger
            value="discounts"
            className="pos-settings-tab rounded-[18px] px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:text-blue-700"
          >
            Discounts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="policy" className="mt-0 space-y-4">
          <Configurations />
        </TabsContent>

        <TabsContent value="terminals" className="mt-0 space-y-4">
          <div className={`grid gap-4 ${tablesEnabled ? "xl:grid-cols-2" : ""}`}>
            <Terminals />
            {tablesEnabled ? <Tables /> : null}
          </div>
        </TabsContent>

        <TabsContent value="customers" className="mt-0 space-y-4">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100 p-6 text-left">
              <CardTitle className="flex items-center gap-2 text-2xl tracking-tight">
                <Users2 className="h-5 w-5 text-blue-600" />
                Customer records
              </CardTitle>
              <CardDescription className="mt-2 text-sm leading-6 text-gray-600">
                Maintain walk-in upgrades, known buyers, and repeat customer details outside the cashier flow.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Customers />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discounts" className="mt-0 space-y-4">
          <Discounts />
        </TabsContent>
      </UrlTabs>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaymentProvidersTab } from "@/components/payment-admin/PaymentProvidersTab"
import { PaymentAppsTab } from "@/components/payment-admin/PaymentAppsTab"
import { SubscriptionPlansTab } from "@/components/payment-admin/SubscriptionPlansTab"
import { PaymentsTab } from "@/components/payment-admin/PaymentsTab"
import { SubscriptionsTab } from "@/components/payment-admin/SubscriptionsTab"
import { WebhookLogsTab } from "@/components/payment-admin/WebhookLogsTab"
import { AnalyticsTab } from "@/components/payment-admin/AnalyticsTab"
import { CreditCard, Settings, Users, BarChart3, Webhook, Receipt, Package } from "lucide-react"

export default function PaymentAdminPage() {
  const [activeTab, setActiveTab] = useState("analytics")

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Payment System Administration</h1>
          <p className="text-muted-foreground">
            Manage payment providers, subscription plans, and monitor payment activities across all your applications.
          </p>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-fit">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Providers
            </TabsTrigger>
            <TabsTrigger value="apps" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Apps
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Plans
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              Webhooks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsTab />
          </TabsContent>

          <TabsContent value="providers" className="space-y-6">
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
      </div>
    </div>
  )
}

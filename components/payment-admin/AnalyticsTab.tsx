"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, Users, CreditCard, Activity } from "lucide-react"
import { useGetPaymentAnalyticsQuery, useGetSubscriptionAnalyticsQuery } from "@/redux/features/payment/paymentAPISlice"

export function AnalyticsTab() {
  const [dateRange, setDateRange] = useState("30d")
  const { data: paymentAnalytics = {}, isLoading: paymentLoading } = useGetPaymentAnalyticsQuery({ period: dateRange })
  const { data: subscriptionAnalytics = {}, isLoading: subscriptionLoading } = useGetSubscriptionAnalyticsQuery({
    period: dateRange,
  })

  const stats = [
    {
      title: "Total Revenue",
      value: `$${paymentAnalytics.total_revenue || 0}`,
      change: paymentAnalytics.revenue_change || 0,
      icon: DollarSign,
    },
    {
      title: "Active Subscriptions",
      value: subscriptionAnalytics.active_count || 0,
      change: subscriptionAnalytics.subscription_change || 0,
      icon: Users,
    },
    {
      title: "Successful Payments",
      value: paymentAnalytics.successful_payments || 0,
      change: paymentAnalytics.payment_change || 0,
      icon: CreditCard,
    },
    {
      title: "Conversion Rate",
      value: `${paymentAnalytics.conversion_rate || 0}%`,
      change: paymentAnalytics.conversion_change || 0,
      icon: Activity,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Overview of payment system performance and metrics.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const isPositive = stat.change >= 0
          const TrendIcon = isPositive ? TrendingUp : TrendingDown

          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendIcon className={`mr-1 h-3 w-3 ${isPositive ? "text-green-500" : "text-red-500"}`} />
                  <span className={isPositive ? "text-green-500" : "text-red-500"}>
                    {isPositive ? "+" : ""}
                    {stat.change}%
                  </span>
                  <span className="ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Latest payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentAnalytics.recent_payments?.slice(0, 5).map((payment, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm font-medium">${payment.amount}</span>
                    <Badge variant="outline" className="text-xs">
                      {payment.provider}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(payment.created_at).toLocaleDateString()}
                  </span>
                </div>
              )) || <div className="text-center text-muted-foreground py-4">No recent payments</div>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>Current subscription breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptionAnalytics.status_breakdown ? (
                Object.entries(subscriptionAnalytics.status_breakdown).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          status === "active" ? "bg-green-500" : status === "cancelled" ? "bg-red-500" : "bg-gray-500"
                        }`}
                      />
                      <span className="text-sm font-medium capitalize">{status}</span>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">No subscription data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useMemo } from "react"
import { ArrowUpRight, Copy, Link2, UsersRound, WalletCards } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { toast } from "react-toastify"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGetReferralDashboardQuery } from "@/redux/features/users/userApiSlice"

const money = (value?: string | number) => {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(Number.isFinite(amount) ? amount : 0)
}

const displayName = (firstName?: string, lastName?: string, email?: string) =>
  [firstName, lastName].filter(Boolean).join(" ").trim() || email || "Referred customer"

const metrics: { label: string; value: string | number; Icon: LucideIcon }[] = [
  { label: "Total referrals", value: 0, Icon: UsersRound },
  { label: "Total earnings", value: "", Icon: WalletCards },
  { label: "Pending earnings", value: "", Icon: Link2 },
  { label: "Paid earnings", value: "", Icon: ArrowUpRight },
]

export default function AffiliateDashboardPage() {
  const { data, isLoading, isError } = useGetReferralDashboardQuery()
  const commissionRate = useMemo(() => `${Number(data?.commission_rate ?? 0) * 100}%`, [data?.commission_rate])

  const copyLink = async () => {
    if (!data?.referral_url) return
    try {
      await navigator.clipboard.writeText(data.referral_url)
      toast.success("Affiliate link copied.")
    } catch {
      toast.error("Unable to copy the affiliate link.")
    }
  }

  if (isLoading) return <main className="mx-auto w-full max-w-6xl p-6"><div className="animate-pulse space-y-4"><div className="h-40 rounded-3xl bg-gray-200" /><div className="h-28 rounded-2xl bg-gray-100" /></div></main>
  if (isError || !data) return <main className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center p-6 text-center"><div><h1 className="text-2xl font-semibold text-gray-900">Affiliate dashboard unavailable</h1><p className="mt-2 text-sm text-gray-600">We could not load your referral information. Please refresh and try again.</p></div></main>

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl md:p-9">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <Badge className="border-emerald-300/30 bg-emerald-400/15 text-emerald-200">Affiliate centre</Badge>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">Grow your network. Track every reward.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">Your affiliate account is separate from workspace operations. Share your link, follow registrations, and monitor commissions from one place.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left md:min-w-48"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Commission rate</p><p className="mt-1 text-3xl font-semibold text-emerald-300">{commissionRate}</p></div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ label, Icon }, index) => {
          const values = [data.referred_count, money(data.earnings.total), money(data.earnings.pending), money(data.earnings.paid)]
          return <Card key={label}><CardContent className="flex items-center gap-4 p-5"><div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><Icon className="h-5 w-5" /></div><div><p className="text-sm text-gray-500">{label}</p><p className="mt-1 text-2xl font-semibold text-gray-900">{values[index]}</p></div></CardContent></Card>
        })}
      </section>

      <Card>
        <CardHeader><CardTitle>Share your affiliate link</CardTitle><CardDescription>Customers who register through this link are attributed to your account.</CardDescription></CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row"><div className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700"><span className="block truncate">{data.referral_url}</span><span className="mt-1 block text-xs text-gray-500">Code: {data.referral_code}</span></div><Button onClick={() => void copyLink()}><Copy className="mr-2 h-4 w-4" />Copy link</Button></CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Recent referrals</CardTitle><CardDescription>People who joined through your link.</CardDescription></CardHeader><CardContent>{data.referred_users.length ? <div className="space-y-3">{data.referred_users.slice(0, 8).map((user) => <div key={user.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"><div><p className="font-medium text-gray-900">{displayName(user.first_name, user.last_name, user.email)}</p><p className="text-xs text-gray-500">{user.email}</p></div><span className="text-xs text-gray-500">{user.joined_at ? new Date(user.joined_at).toLocaleDateString() : "Registered"}</span></div>)}</div> : <p className="py-8 text-sm text-gray-500">No referrals yet. Share your link to get started.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Commission history</CardTitle><CardDescription>Subscription commissions and payout status.</CardDescription></CardHeader><CardContent>{data.payouts.length ? <div className="space-y-3">{data.payouts.slice(0, 8).map((payout) => <div key={payout.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"><div><p className="font-medium text-gray-900">{money(payout.commission_amount)}</p><p className="text-xs text-gray-500">{payout.plan_slug || "Subscription"} · {payout.payment_reference}</p></div><Badge variant="outline" className={payout.status === "paid" ? "border-emerald-300 text-emerald-700" : "border-amber-300 text-amber-700"}>{payout.status}</Badge></div>)}</div> : <p className="py-8 text-sm text-gray-500">No commission activity yet.</p>}</CardContent></Card>
      </div>
    </main>
  )
}

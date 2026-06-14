"use client"

import Link from "next/link"
import { ArrowLeft, Wallet } from "lucide-react"
import POSRemittances from "@/components/pos/POSRemittances"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGetCurrentConfigurationQuery } from "@/redux/features/pos/posAPISlice"

export default function POSRemittancesPage() {
  const { data: currentConfiguration } = useGetCurrentConfigurationQuery()

  return (
    <div className="space-y-6">
      <Card className="border-gray-200 bg-white shadow-sm">
        <CardHeader className="gap-3 p-6 text-left">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            <Wallet className="h-3.5 w-3.5" />
            Remittance Workspace
          </div>
          <CardTitle className="text-3xl font-semibold tracking-tight text-gray-900">
            POS cash remittance
          </CardTitle>
          <CardDescription className="max-w-4xl text-sm leading-6 text-gray-600">
            Cash remittance is handled separately from POS settings so supervisors, finance, or cash-control users can
            manage handover, receipt, deposit, reconciliation, and disputes without needing configuration access.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-6 pt-0 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-gray-200 bg-gray-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">Scope</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">Cash control only</p>
            </div>
            <div className="rounded-[24px] border border-gray-200 bg-gray-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">Source</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">Session closeouts</p>
            </div>
            <div className="rounded-[24px] border border-gray-200 bg-gray-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">Currency</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{currentConfiguration?.currency || "NGN"}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/pos">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to cashier POS
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/pos/settings">Open POS settings</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <POSRemittances currencyCode={currentConfiguration?.currency || "NGN"} />
    </div>
  )
}

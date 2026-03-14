"use client"

import { useMemo, useState } from "react"
import { Building2, CheckCircle2, Link2, Loader2, MapPin, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCompanyProfile } from "@/hooks/useCompanyProfile"
import { CompanyBasicInfoForm } from "./CompanyBasicInfoForm"
import { CompanyAddressForm } from "./CompanyAddressForm"
import { CompanySocialLinksForm } from "./CompanySocialLinksForm"
import { PolicyManagement } from "./PolicyManagement"
import type { CompanyProfile } from "@/types/company-profile"

const tabConfig = [
  {
    value: "basic-info",
    label: "Basic Info",
    description: "Identity, industry, and contact profile",
    icon: Building2,
  },
  {
    value: "address",
    label: "Address",
    description: "Headquarters location details",
    icon: MapPin,
  },
  {
    value: "social",
    label: "Social Links",
    description: "Public links and social presence",
    icon: Link2,
  },
  {
    value: "policies",
    label: "Policies",
    description: "Recall, reorder, and stock controls",
    icon: ShieldCheck,
  },
] as const

export default function CompanyProfileContainer() {
  const { profile, isLoading, refetch } = useCompanyProfile()
  const [activeTab, setActiveTab] = useState("basic-info")
  const typedProfile = profile as CompanyProfile | null

  const completionPercentage = useMemo(() => {
    if (!typedProfile) {
      return 0
    }

    const checks = [
      Boolean(typedProfile.name),
      Boolean(typedProfile.industry),
      Boolean(typedProfile.email),
      Boolean(typedProfile.currency),
      Boolean(typedProfile.headquarters_address?.country),
      Boolean(typedProfile.headquarters_address?.city),
      Boolean(
        typedProfile.linkedin ||
          typedProfile.twitter ||
          typedProfile.instagram ||
          typedProfile.facebook ||
          typedProfile.other_link,
      ),
    ]

    const completed = checks.filter(Boolean).length
    return Math.round((completed / checks.length) * 100)
  }, [typedProfile])

  if (isLoading) {
    return (
      <Card className="w-full border-gray-200 shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-100 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-2xl font-semibold tracking-tight text-gray-900">Company profile setup</CardTitle>
            <p className="mt-1 text-sm text-gray-600">
              {typedProfile?.name
                ? `Managing workspace for ${typedProfile.name}`
                : "Complete this setup to activate your company workspace."}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Profile Completion {completionPercentage}%
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-gray-500">
            <span>Workspace readiness</span>
            <span>{completionPercentage}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 sm:grid-cols-2 lg:grid-cols-4">
            {tabConfig.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="h-auto rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition-all data-[state=active]:border-blue-300 data-[state=active]:bg-blue-50"
              >
                <div className="flex w-full items-start gap-3">
                  <div className="rounded-lg bg-gray-100 p-2 text-gray-600">
                    <tab.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-semibold text-gray-900">{tab.label}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{tab.description}</p>
                  </div>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="basic-info" className="mt-6">
            <CompanyBasicInfoForm profile={typedProfile} onSuccess={() => void refetch()} />
          </TabsContent>

          <TabsContent value="address" className="mt-6">
            <CompanyAddressForm profile={typedProfile} onUpdate={() => refetch()} />
          </TabsContent>

          <TabsContent value="social" className="mt-6">
            <CompanySocialLinksForm profile={typedProfile} onUpdate={() => refetch()} />
          </TabsContent>

          <TabsContent value="policies" className="mt-6">
            {typedProfile?.id ? (
              <PolicyManagement profileId={Number(typedProfile.id)} />
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                Save your basic profile first to unlock policy setup.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

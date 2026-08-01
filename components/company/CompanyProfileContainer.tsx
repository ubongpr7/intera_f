"use client"

import Link from "next/link"
import { useCallback, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, Bot, Building2, CheckCircle2, Link2, Loader2, MapPin, ShieldCheck, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCompanyProfile } from "@/hooks/useCompanyProfile"
import { CompanyBasicInfoForm } from "./CompanyBasicInfoForm"
import { CompanyAddressForm } from "./CompanyAddressForm"
import { CompanySocialLinksForm } from "./CompanySocialLinksForm"
import { PolicyManagement } from "./PolicyManagement"
import { useGetUserCompaniesQuery, useSwitchCompanyMutation } from "@/redux/features/auth/authApiSlice"
import { useGetCompanyProfileAnalyticsQuery } from "@/redux/features/management/companyProfileApiSlice"
import type { CompanyProfile } from "@/redux/features/management/companyProfileTypes"
import { cn } from "@/lib/utils"

const tabConfig = [
  {
    value: "basic-info",
    label: "Company identity",
    description: "Name, industry, currency, and core contact details",
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

const validStepValues = new Set(tabConfig.map((tab) => tab.value))
type CompanySetupStep = (typeof tabConfig)[number]["value"]
const isCompanySetupStep = (step: string | null): step is CompanySetupStep =>
  step !== null && validStepValues.has(step as CompanySetupStep)

export default function CompanyProfileContainer() {
  const { profile, isLoading, refetch } = useCompanyProfile()
  const { data: companies, refetch: refetchCompanies } = useGetUserCompaniesQuery()
  const activeProfileId = companies?.active_profile_id ?? null
  const [switchCompany] = useSwitchCompanyMutation()
  const typedProfile = profile as CompanyProfile | null
  const { data: analytics } = useGetCompanyProfileAnalyticsQuery(String(typedProfile?.id ?? ""), {
    skip: !typedProfile?.id,
  })
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const createMode = searchParams.get("mode") === "new"
  const initialStep = searchParams.get("step")
  const [activeTab, setActiveTab] = useState<CompanySetupStep>(
    isCompanySetupStep(initialStep) ? initialStep : "basic-info",
  )
  const resolvedActiveTab = isCompanySetupStep(initialStep) ? initialStep : activeTab
  const editableProfile = createMode ? null : typedProfile

  const goToStep = useCallback(
    (nextStep: CompanySetupStep) => {
      setActiveTab(nextStep)
      const params = new URLSearchParams(searchParams.toString())
      params.set("step", nextStep)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const stepCompletion = useMemo(() => {
    const address = typedProfile?.headquarters_address
    return {
      "basic-info": Boolean(typedProfile?.name?.trim() && typedProfile?.currency?.trim()),
      address: Boolean(address?.country && address?.region && address?.city && address?.street),
      social: Boolean(
        typedProfile?.linkedin || typedProfile?.twitter || typedProfile?.instagram || typedProfile?.facebook || typedProfile?.other_link || typedProfile?.website,
      ),
      policies: Boolean((analytics?.total_policies ?? 0) > 0),
    }
  }, [analytics?.total_policies, typedProfile])

  const activeStepIndex = tabConfig.findIndex((tab) => tab.value === resolvedActiveTab)
  const activeStep = tabConfig[activeStepIndex] ?? tabConfig[0]
  const nextStep = tabConfig[activeStepIndex + 1]
  const previousStep = tabConfig[activeStepIndex - 1]

  const handleBasicInfoSuccess = useCallback(
    async (savedProfile: CompanyProfile) => {
      if (savedProfile?.id && (createMode || !activeProfileId)) {
        await switchCompany({ profile_id: savedProfile.id }).unwrap()
        await refetchCompanies()
        router.replace("/subscription")
        return
      }
      goToStep("address")
      await refetch()
    },
    [activeProfileId, createMode, goToStep, refetch, refetchCompanies, router, switchCompany],
  )

  const handleAddressSuccess = useCallback(async () => {
    await refetch()
    goToStep("social")
  }, [goToStep, refetch])

  const handleSocialSuccess = useCallback(async () => {
    await refetch()
    goToStep("policies")
  }, [goToStep, refetch])

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
    <div className="company-profile-workspace grid gap-6 xl:grid-cols-[300px_1fr]">
      <aside className="space-y-4">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="p-5 text-left text-inherit">
            <CardTitle className="text-xl">Company profile sections</CardTitle>
            <p className="text-sm text-gray-600">
              Manage each part of the company profile without showing onboarding progress outside the dashboard.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0">
            <div className="space-y-2">
              {tabConfig.map((tab, index) => {
                const isComplete = stepCompletion[tab.value]
                const requiresProfileContext = tab.value !== "basic-info" && !typedProfile?.id && !activeProfileId
                return (
                  <button
                    key={tab.value}
                    type="button"
                    disabled={requiresProfileContext}
                    onClick={() => goToStep(tab.value)}
                    className={cn(
                      "w-full rounded-2xl border p-4 text-left transition-colors",
                      resolvedActiveTab === tab.value ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300",
                      requiresProfileContext ? "cursor-not-allowed opacity-60" : "",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "rounded-xl px-2 py-1 text-xs font-semibold",
                          isComplete ? "bg-green-100 text-green-700" : resolvedActiveTab === tab.value ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600",
                        )}
                      >
                        {isComplete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{tab.label}</p>
                        <p className="mt-1 text-xs text-gray-600">{tab.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50 shadow-sm">
          <CardContent className="space-y-3 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Next after profile setup</p>
            <Link href="/profile/staff" className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-blue-300">
              Invite staff and assign roles
              <Users className="h-4 w-4 text-gray-500" />
            </Link>
            <Link href="/agent/settings" className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-blue-300">
              Configure the company agent
              <Bot className="h-4 w-4 text-gray-500" />
            </Link>
          </CardContent>
        </Card>
      </aside>

      <div className="space-y-4">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 p-5 text-left text-inherit">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-2xl">{activeStep.label}</CardTitle>
                <p className="mt-1 text-sm text-gray-600">{activeStep.description}</p>
              </div>
              <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Step {activeStepIndex + 1} of {tabConfig.length}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {resolvedActiveTab === "basic-info" ? (
              <CompanyBasicInfoForm
                profile={editableProfile}
                onSuccess={handleBasicInfoSuccess}
                submitLabel={editableProfile?.id ? "Save and continue" : "Create company and continue"}
              />
            ) : null}

            {resolvedActiveTab === "address" ? (
              typedProfile?.id ? (
                <CompanyAddressForm profile={typedProfile} onUpdate={handleAddressSuccess} submitLabel="Save and continue" />
              ) : (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  Save your company identity first to unlock address setup.
                </div>
              )
            ) : null}

            {resolvedActiveTab === "social" ? (
              typedProfile?.id ? (
                <CompanySocialLinksForm profile={typedProfile} onUpdate={handleSocialSuccess} submitLabel="Save and continue" />
              ) : (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  Save your company identity first to unlock social links.
                </div>
              )
            ) : null}

            {resolvedActiveTab === "policies" ? (
              typedProfile?.id ? (
                <div className="space-y-4">
                  <PolicyManagement profileId={Number(typedProfile.id)} />
                  <div className="flex flex-wrap gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <Button asChild>
                      <Link href="/profile/staff">
                        Continue to staff setup
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/agent/settings">Open AI workspace setup</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  Save your basic profile first to unlock policy setup.
                </div>
              )
            ) : null}
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-gray-600">
            {typedProfile?.name ? `Workspace: ${typedProfile.name}` : "No active company workspace yet."}
          </div>
          <div className="flex flex-wrap gap-2">
            {previousStep ? (
              <Button type="button" variant="outline" onClick={() => goToStep(previousStep.value)}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            ) : null}
            {nextStep ? (
              <Button type="button" variant="outline" onClick={() => goToStep(nextStep.value)}>
                Next step
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

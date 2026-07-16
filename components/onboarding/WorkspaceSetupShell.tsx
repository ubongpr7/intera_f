"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { useMemo, useState } from "react"
import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  ListTodo,
  Users,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getDecodedToken } from "@/lib/utils"
import { useGetUserCompaniesQuery } from "@/redux/features/auth/authApiSlice"
import {
  useGetCompanyAgentSetupQuery,
  useGetCompanyProfileAnalyticsQuery,
  useGetCompanyProfileQuery,
} from "@/redux/features/management/companyProfileApiSlice"

export type WorkspaceSetupStageId = "company" | "team" | "agent"

type WorkspaceSetupStage = {
  id: WorkspaceSetupStageId
  title: string
  description: string
  href: string
  icon: typeof Building2
  complete: boolean
  helper: string
}

type WorkspaceReadiness = {
  basicsComplete: boolean
  addressComplete: boolean
  socialComplete: boolean
  policyComplete: boolean
  teamComplete: boolean
  agentComplete: boolean
}

type DecodedToken = {
  id?: string | number | null
  sub?: string | number | null
  user_id?: string | number | null
}

const normalizeId = (value: string | number | null | undefined): string | null => {
  if (value === null || value === undefined) {
    return null
  }

  const normalized = `${value}`.trim()
  return normalized.length ? normalized : null
}

export const useWorkspaceSetupProgress = () => {
  const { data: companies, isLoading: loadingCompanies } = useGetUserCompaniesQuery()
  const activeProfileId = companies?.active_profile_id ?? null

  const { data: profile, isLoading: loadingProfile } = useGetCompanyProfileQuery(String(activeProfileId), {
    skip: !activeProfileId,
  })
  const { data: analytics, isLoading: loadingAnalytics } = useGetCompanyProfileAnalyticsQuery(String(activeProfileId), {
    skip: !activeProfileId,
  })
  const { data: agentSetup, isLoading: loadingAgentSetup } = useGetCompanyAgentSetupQuery(undefined, {
    skip: !activeProfileId,
  })

  const activeMembership = useMemo(
    () => companies?.profiles?.find((entry) => `${entry.id}` === `${activeProfileId}`) ?? null,
    [activeProfileId, companies?.profiles],
  )
  const token = getDecodedToken() as DecodedToken | null
  const currentUserId = normalizeId(token?.id) ?? normalizeId(token?.user_id) ?? normalizeId(token?.sub)
  const isOwner = useMemo(() => {
    const membershipRole = `${activeMembership?.role ?? ""}`.trim().toLowerCase()
    const membershipOwnerId = normalizeId(activeMembership?.owner_id)

    return membershipRole === "owner" || (membershipOwnerId !== null && currentUserId !== null && membershipOwnerId === currentUserId)
  }, [activeMembership?.owner_id, activeMembership?.role, currentUserId])

  const readiness: WorkspaceReadiness = useMemo(() => {
    const address = profile?.headquarters_address
    return {
      basicsComplete: Boolean(profile?.name?.trim() && profile?.currency?.trim()),
      addressComplete: Boolean(address?.country && address?.region && address?.city && address?.street),
      socialComplete: Boolean(
        profile?.linkedin || profile?.twitter || profile?.instagram || profile?.facebook || profile?.other_link || profile?.website,
      ),
      policyComplete: Boolean((analytics?.total_policies ?? 0) > 0),
      teamComplete: Boolean((analytics?.total_staff ?? 0) > 1 || (analytics?.active_roles ?? 0) > 0 || (analytics?.active_groups ?? 0) > 0),
      agentComplete: Boolean(agentSetup?.configured),
    }
  }, [agentSetup?.configured, analytics?.active_groups, analytics?.active_roles, analytics?.total_policies, analytics?.total_staff, profile])

  const stageProgressCount = [
    readiness.basicsComplete && readiness.addressComplete && readiness.policyComplete,
    readiness.teamComplete,
    readiness.agentComplete,
  ].filter(Boolean).length

  const stages: WorkspaceSetupStage[] = useMemo(
    () => [
      {
        id: "company",
        title: "Company profile",
        description: "Identity, address, and operational policies",
        href: "/profile",
        icon: Building2,
        complete: readiness.basicsComplete && readiness.addressComplete && readiness.policyComplete,
        helper: activeProfileId
          ? `${[readiness.basicsComplete, readiness.addressComplete, readiness.policyComplete].filter(Boolean).length}/3 setup areas complete`
          : "Create and activate a company workspace",
      },
      {
        id: "team",
        title: "Staff and roles",
        description: "Invite people, define groups, and assign access",
        href: "/profile/staff",
        icon: Users,
        complete: readiness.teamComplete,
        helper: readiness.teamComplete
          ? `${analytics?.total_staff ?? 0} staff connected to this workspace`
          : "Assign your first staff member or role",
      },
      {
        id: "agent",
        title: "AI workspace",
        description: "Save the company-level model and instruction setup",
        href: "/agent/settings",
        icon: Bot,
        complete: readiness.agentComplete,
        helper: readiness.agentComplete ? "Company agent setup is active" : "Configure the company agent and model",
      },
    ],
    [
      activeProfileId,
      analytics?.total_staff,
      readiness.addressComplete,
      readiness.agentComplete,
      readiness.basicsComplete,
      readiness.policyComplete,
      readiness.teamComplete,
    ],
  )

  const nextRecommendedStage = stages.find((stage) => !stage.complete) ?? null
  const completionPercentage = Math.round((stageProgressCount / stages.length) * 100)
  const isWorkspaceContextLoading = loadingCompanies || loadingProfile

  return {
    activeProfileId,
    activeMembership,
    isOwner,
    profile,
    analytics,
    readiness,
    stages,
    stageProgressCount,
    completionPercentage,
    nextRecommendedStage,
    isLoading: loadingCompanies || loadingProfile || loadingAnalytics || loadingAgentSetup,
    isWorkspaceContextLoading,
  }
}

export function WorkspaceSetupLoadingCard({
  title = "Loading",
  description = "Please wait while we open this page.",
}: {
  title?: string
  description?: string
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="p-6 text-left text-inherit">
          <div className="h-4 w-40 animate-pulse rounded-full bg-gray-200" />
          <CardTitle className="mt-4 text-3xl tracking-tight">{title}</CardTitle>
          <CardDescription className="max-w-2xl text-sm leading-6 text-gray-600">{description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 p-6 pt-0 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-2xl border border-gray-200 bg-gray-50" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function WorkspaceSetupShell({
  activeStage,
  eyebrow = "Workspace Setup",
  title,
  description,
  children,
}: {
  activeStage: WorkspaceSetupStageId
  eyebrow?: string
  title: string
  description: string
  children: ReactNode
}) {
  const { activeMembership, completionPercentage, isOwner, isWorkspaceContextLoading, nextRecommendedStage, stages } = useWorkspaceSetupProgress()
  const pathname = usePathname()
  const showSetupProgress = !isWorkspaceContextLoading && isOwner && pathname === "/dashboard"
  const [setupGuideOpen, setSetupGuideOpen] = useState(false)

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 lg:px-8">
      {showSetupProgress ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="gap-2 rounded-full border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            onClick={() => setSetupGuideOpen((current) => !current)}
            aria-expanded={setupGuideOpen}
          >
            {setupGuideOpen ? "Hide workspace guide" : "Show workspace guide"}
            {setupGuideOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      ) : null}

      {showSetupProgress ? (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="p-5 text-left text-inherit">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              <ListTodo className="h-3.5 w-3.5" />
              {eyebrow}
            </div>
            <CardTitle className="mt-3 text-xl">{activeMembership?.name || "Complete your company workspace"}</CardTitle>
            <CardDescription>
              {activeMembership
                ? `${completionPercentage}% of the foundation is ready for this workspace.`
                : "Create and activate a company before moving into staff, products, and operations."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0">
            {setupGuideOpen ? (
              <>
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-gray-500">
                    <span>Readiness</span>
                    <span>{completionPercentage}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>

                {nextRecommendedStage ? (
                  <Button asChild className="w-full justify-between">
                    <Link href={nextRecommendedStage.href}>
                      Continue with {nextRecommendedStage.title}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                    Core workspace onboarding is complete. You can move into inventory, products, and POS next.
                  </div>
                )}

                <div className="space-y-3">
                  {stages.map((stage) => {
                    const isActive = activeStage === stage.id
                    return (
                      <Link
                        key={stage.id}
                        href={stage.href}
                        className={cn(
                          "block rounded-2xl border p-4 transition-colors",
                          isActive ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "mt-0.5 rounded-xl p-2",
                              stage.complete ? "bg-green-100 text-green-700" : isActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600",
                            )}
                          >
                            {stage.complete ? <CheckCircle2 className="h-4 w-4" /> : <stage.icon className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">{stage.title}</p>
                              {!stage.complete && !isActive ? <CircleDashed className="h-3.5 w-3.5 text-gray-400" /> : null}
                            </div>
                            <p className="mt-1 text-xs text-gray-600">{stage.description}</p>
                            <p className="mt-2 text-xs font-medium text-gray-500">{stage.helper}</p>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                {nextRecommendedStage ? (
                  <span>
                    Next recommended action: <span className="font-semibold text-gray-900">{nextRecommendedStage.title}</span>
                  </span>
                ) : (
                  <span>Workspace setup is ready. Expand this guide if you want the full onboarding checklist.</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <main className="min-w-0">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 p-6 text-left text-inherit">
            <CardTitle className="text-3xl tracking-tight">{title}</CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6">{description}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">{children}</CardContent>
        </Card>
      </main>
    </div>
  )
}

export function WorkspaceSetupOverview() {
  const { activeMembership, completionPercentage, isLoading, isOwner, nextRecommendedStage, readiness, stages } = useWorkspaceSetupProgress()

  if (isLoading || !isOwner) {
    return null
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="p-6 text-left text-inherit">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              <ListTodo className="h-3.5 w-3.5" />
              Workspace Onboarding
            </div>
            <CardTitle className="mt-3 text-2xl">
              {activeMembership?.name ? `${activeMembership.name} setup` : "Finish your workspace foundation"}
            </CardTitle>
            <CardDescription className="mt-2 max-w-3xl text-sm leading-6">
              Use these setup milestones to keep company context, team access, and AI configuration aligned before you move deeper into products, inventory, and POS.
            </CardDescription>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Progress</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{completionPercentage}%</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-6 pt-0">
        <div className="grid gap-3 lg:grid-cols-3">
          {stages.map((stage) => (
            <Link key={stage.id} href={stage.href} className="rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:border-blue-300">
              <div className="flex items-start gap-3">
                <div className={cn("rounded-xl p-2", stage.complete ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700")}>
                  {stage.complete ? <CheckCircle2 className="h-4 w-4" /> : <stage.icon className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{stage.title}</p>
                  <p className="mt-1 text-xs text-gray-600">{stage.helper}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm text-gray-700">
            {nextRecommendedStage ? (
              <span>
                Next recommended action: <span className="font-semibold text-gray-900">{nextRecommendedStage.title}</span>
              </span>
            ) : (
              <span>
                Core workspace onboarding is complete. Company profile, team, and AI configuration are all in place.
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {nextRecommendedStage ? (
              <Button asChild>
                <Link href={nextRecommendedStage.href}>
                  Continue setup
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/profile">
                {readiness.basicsComplete && readiness.addressComplete ? "Review company setup" : "Open company setup"}
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

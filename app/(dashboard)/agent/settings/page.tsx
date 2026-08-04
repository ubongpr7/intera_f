"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import {
  Bot,
  Building2,
  KeyRound,
  Loader2,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react"
import { toast } from "react-toastify"

import AgentSettingsControlPanel from "@/components/agents/agent-settings-control-panel"
import { WorkspaceSetupShell } from "@/components/onboarding/WorkspaceSetupShell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ReactSelectField, type SelectOption } from "@/components/ui/react-select-field"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { hasTokenPermission, isWorkspaceOwner } from "@/lib/agentPermissions"
import { useGetUserCompaniesQuery, useRefreshMutation } from "@/redux/features/auth/authApiSlice"
import {
  useGetCompanyAgentSetupQuery,
  useSaveCompanyAgentSetupMutation,
} from "@/redux/features/management/companyProfileApiSlice"
import type {
  CompanyAgentSetupResponse,
  SaveCompanyAgentSetupPayload,
} from "@/redux/features/management/companyProfileTypes"

type AgentSetupFormState = {
  name: string
  version: string
  apiKey: string
  tavilyApiKey: string
  specialInstruction: string
  systemInstruction: string
  assistantInstruction: string
}

const EMPTY_FORM: AgentSetupFormState = {
  name: "",
  version: "",
  apiKey: "",
  tavilyApiKey: "",
  specialInstruction: "",
  systemInstruction: "",
  assistantInstruction: "",
}

const parseApiError = (error: unknown): string => {
  const typedError = error as { data?: unknown; status?: number }
  const data = typedError?.data as Record<string, unknown> | undefined
  if (typeof data?.detail === "string") {
    return data.detail
  }

  if (data) {
    for (const [field, value] of Object.entries(data)) {
      if (Array.isArray(value) && value.length > 0) {
        return `${field}: ${String(value[0])}`
      }
      if (typeof value === "string") {
        return `${field}: ${value}`
      }
    }
  }

  if (typedError?.status === 403) {
    return "You do not have permission to manage workspace agent settings."
  }
  return "Unable to save workspace AI settings. Please try again."
}

const renderMaskedPreview = (value?: string | null) => {
  if (!value) {
    return "Not set"
  }
  const prefix = value.slice(0, 4)
  return `${prefix}****`
}

const AgentSetupLoading = () => (
  <div className="space-y-4">
    <div className="h-24 animate-pulse rounded-[28px] border border-gray-200 bg-white" />
    <div className="h-[32rem] animate-pulse rounded-[28px] border border-gray-200 bg-white" />
  </div>
)

const AgentSetupEmptyState = ({ profilesCount }: { profilesCount: number }) => (
  <Card className="border-gray-200 shadow-sm">
    <CardHeader className="p-6 text-left">
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
        <Building2 className="h-3.5 w-3.5" />
        Company Context Required
      </div>
      <CardTitle className="mt-3 text-2xl font-semibold text-gray-900">Select or create a company first</CardTitle>
      <CardDescription className="mt-2 text-sm leading-6 text-gray-600">
        Agent settings are scoped to the active workspace. Switch into a company before configuring models, instructions,
        or default agents.
      </CardDescription>
    </CardHeader>
    <CardContent className="flex flex-wrap gap-3 p-6 pt-0">
      <Button asChild>
        <Link href="/dashboard">Choose company</Link>
      </Button>
      {profilesCount === 0 ? (
        <Button asChild variant="outline">
          <Link href="/profile/create">Create company profile</Link>
        </Button>
      ) : null}
    </CardContent>
  </Card>
)

const AgentSetupAccessDenied = ({ ownerOverride }: { ownerOverride: boolean }) => (
  <Card className="border-amber-200 bg-amber-50 shadow-sm">
    <CardContent className="flex items-start gap-4 p-6">
      <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">Setup Access Required</p>
        <h2 className="text-2xl font-semibold text-amber-950">
          Only the workspace owner or someone with agent setup permission can manage this area.
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-amber-900/80">
          This settings workspace is reserved for <span className="font-semibold">manage_agent_settings</span> or owner
          access. Runtime conversations still happen on <span className="font-semibold">/agent</span>.
        </p>
        {ownerOverride ? (
          <p className="text-sm font-medium text-amber-900">Owner override is active for this workspace.</p>
        ) : null}
      </div>
    </CardContent>
  </Card>
)

const WorkspaceAiSetupSheet = ({
  open,
  onOpenChange,
  form,
  updateField,
  setupResponse,
  savingSetup,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: AgentSetupFormState
  updateField: <T extends keyof AgentSetupFormState>(field: T, value: AgentSetupFormState[T]) => void
  setupResponse?: CompanyAgentSetupResponse
  savingSetup: boolean
  onSave: () => Promise<void>
  }) => {
  const availableVersions = setupResponse?.available_versions ?? []
  const versionOptions = availableVersions.map((version) => ({
    value: String(version.id),
    label: `${version.provider_label} · ${version.model_name}`,
  }))
  const selectedVersion = availableVersions.find((version) => String(version.id) === form.version)
  const fallbackSelectedVersionOption =
    form.version && setupResponse?.agent
      ? {
          value: form.version,
          label: `${setupResponse.agent.provider_label} · ${setupResponse.agent.model_name}`,
        }
      : null
  const selectedVersionOption = versionOptions.find((option) => option.value === form.version) ?? fallbackSelectedVersionOption
  const resolvedVersionOptions =
    selectedVersionOption && !versionOptions.some((option) => option.value === selectedVersionOption.value)
      ? [selectedVersionOption, ...versionOptions]
      : versionOptions

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="agent-settings-sheet w-full max-w-3xl border-gray-800 bg-[linear-gradient(180deg,#020617_0%,#0f172a_58%,#111827_100%)] p-0 text-gray-100 shadow-[0_40px_90px_rgba(2,6,23,0.82)] sm:max-w-3xl"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-gray-800/80 bg-[linear-gradient(115deg,rgba(15,23,42,0.98),rgba(17,24,39,0.96),rgba(30,41,59,0.96))] px-7 py-7 text-left md:px-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-200">
              Workspace AI settings
            </div>
            <SheetTitle className="mt-4 text-3xl font-semibold tracking-tight text-gray-100">
              {setupResponse?.configured ? "Update workspace AI" : "Configure workspace AI"}
            </SheetTitle>
            <SheetDescription className="max-w-2xl text-sm leading-6 text-gray-300">
              Keep the page compact. Model selection, encrypted keys, and instruction layers are managed here in a side
              form instead of inline.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(30,41,59,0.96)_0%,rgba(15,23,42,0.98)_52%,rgba(2,6,23,1)_100%)] px-7 py-6 md:px-8">
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 rounded-[26px] border border-gray-800 bg-gray-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-200">Agent name</span>
                  <Input
                    className="h-12 rounded-2xl border-gray-700 bg-gray-800/80 text-gray-100 placeholder:text-gray-500 focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="Intera workspace copilot"
                  />
                </label>
                <div className="grid gap-2 rounded-[26px] border border-gray-800 bg-gray-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-200">Model version</span>
                  <ReactSelectField
                    options={resolvedVersionOptions}
                    value={selectedVersionOption}
                  onChange={(option) => {
                    const nextOption = Array.isArray(option) ? null : (option as SelectOption | null)
                    updateField("version", nextOption ? String(nextOption.value) : "")
                  }}
                  placeholder="Select provider and model"
                  isSearchable={false}
                  isMulti={false}
                  controlShouldRenderValue
                  />
                  {selectedVersion ? (
                    <p className="text-xs text-gray-200">
                      Selected: {selectedVersion.provider_label} · {selectedVersion.model_name}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 rounded-[26px] border border-gray-800 bg-gray-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
                  <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-200">
                    <KeyRound className="h-4 w-4 text-gray-400" />
                    LLM API key
                  </span>
                  <Input
                    className="h-12 rounded-2xl border-gray-700 bg-gray-800/80 text-gray-100 placeholder:text-gray-500 focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
                    type="password"
                    value={form.apiKey}
                    onChange={(event) => updateField("apiKey", event.target.value)}
                    placeholder={
                      setupResponse?.agent?.has_api_key ? "Enter new key to rotate current value" : "Enter provider API key"
                    }
                  />
                </label>
                <label className="grid gap-2 rounded-[26px] border border-gray-800 bg-gray-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
                  <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-200">
                    <KeyRound className="h-4 w-4 text-gray-400" />
                    Tavily API key
                  </span>
                  <Input
                    className="h-12 rounded-2xl border-gray-700 bg-gray-800/80 text-gray-100 placeholder:text-gray-500 focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
                    type="password"
                    value={form.tavilyApiKey}
                    onChange={(event) => updateField("tavilyApiKey", event.target.value)}
                    placeholder={
                      setupResponse?.agent?.has_tavily_api_key
                        ? "Enter new key to rotate current value"
                        : "Enter Tavily API key"
                    }
                  />
                </label>
              </div>

              <label className="grid gap-2 rounded-[26px] border border-gray-800 bg-gray-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-200">Special instruction</span>
                <Textarea
                  className="min-h-[140px] rounded-2xl border-gray-700 bg-gray-800/80 text-gray-100 placeholder:text-gray-500 focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
                  value={form.specialInstruction}
                  onChange={(event) => updateField("specialInstruction", event.target.value)}
                  placeholder="Organization-level guidance for how the workspace AI should behave."
                  rows={4}
                />
              </label>

              <label className="grid gap-2 rounded-[26px] border border-gray-800 bg-gray-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-200">System instruction</span>
                <Textarea
                  className="min-h-[160px] rounded-2xl border-gray-700 bg-gray-800/80 text-gray-100 placeholder:text-gray-500 focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
                  value={form.systemInstruction}
                  onChange={(event) => updateField("systemInstruction", event.target.value)}
                  placeholder="Base operating instruction used by the workspace AI."
                  rows={4}
                />
              </label>

              <label className="grid gap-2 rounded-[26px] border border-gray-800 bg-gray-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-200">Assistant instruction</span>
                <Textarea
                  className="min-h-[160px] rounded-2xl border-gray-700 bg-gray-800/80 text-gray-100 placeholder:text-gray-500 focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
                  value={form.assistantInstruction}
                  onChange={(event) => updateField("assistantInstruction", event.target.value)}
                  placeholder="Response style, formatting, and interaction guidance."
                  rows={4}
                />
              </label>
            </div>
          </div>

          <div className="border-t border-gray-800 bg-gray-950/95 px-7 py-4 md:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void onSave()} disabled={savingSetup}>
                {savingSetup ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save workspace AI
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("workspace-ai")
  const [setupSheetOpen, setSetupSheetOpen] = useState(false)
  const [form, setForm] = useState<AgentSetupFormState>(EMPTY_FORM)
  const canManageAgentSettings = useMemo(() => hasTokenPermission("manage_agent_settings"), [])
  const ownerOverride = useMemo(() => isWorkspaceOwner(), [])

  const { data: companies, isLoading: loadingCompanies } = useGetUserCompaniesQuery()
  const activeProfileId = companies?.active_profile_id ?? null

  const {
    data: setupResponse,
    isLoading: loadingSetup,
    isFetching: fetchingSetup,
    isError: setupHasError,
    refetch,
  } = useGetCompanyAgentSetupQuery(undefined, {
    skip: !activeProfileId || !canManageAgentSettings,
  })

  const [saveCompanyAgentSetup, { isLoading: savingSetup }] = useSaveCompanyAgentSetupMutation()
  const [refreshSession] = useRefreshMutation()

  const baseForm = useMemo(() => {
    const agent = setupResponse?.agent
    if (!agent) {
      return EMPTY_FORM
    }

    return {
      name: agent.name ?? "",
      version: agent.version ? String(agent.version) : "",
      specialInstruction: agent.special_instruction ?? "",
      systemInstruction: agent.system_instruction ?? "",
      assistantInstruction: agent.assistant_instruction ?? "",
      apiKey: "",
      tavilyApiKey: "",
    }
  }, [setupResponse?.agent])

  const updateField = <T extends keyof AgentSetupFormState>(field: T, value: AgentSetupFormState[T]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const openSetupSheet = () => {
    setForm(baseForm)
    setSetupSheetOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Agent name is required.")
      return
    }
    if (!form.version) {
      toast.error("Choose an LLM model version.")
      return
    }

    const payload: SaveCompanyAgentSetupPayload = {
      name: form.name.trim(),
      version: form.version,
      special_instruction: form.specialInstruction.trim(),
      system_instruction: form.systemInstruction.trim(),
      assistant_instruction: form.assistantInstruction.trim(),
    }

    if (form.apiKey.trim()) {
      payload.api_key = form.apiKey.trim()
    }
    if (form.tavilyApiKey.trim()) {
      payload.tavily_api_key = form.tavilyApiKey.trim()
    }

    try {
      await saveCompanyAgentSetup(payload).unwrap()
      toast.success(setupResponse?.configured ? "Workspace AI updated." : "Workspace AI configured.")
      setForm((prev) => ({ ...prev, apiKey: "", tavilyApiKey: "" }))
      setSetupSheetOpen(false)
      try {
        await refreshSession().unwrap()
      } catch {
        toast.warning("Settings were saved, but the session token could not be refreshed automatically.")
      }
      await refetch()
      router.refresh()
    } catch (error) {
      toast.error(parseApiError(error))
    }
  }

  if (loadingCompanies || (activeProfileId && canManageAgentSettings && loadingSetup)) {
    return (
      <div className="p-2">
        <AgentSetupLoading />
      </div>
    )
  }

  if (!activeProfileId) {
    return (
      <WorkspaceSetupShell
        activeStage="agent"
        className="agent-settings-page"
        title="Manage workspace settings"
        description="Keep agent configuration here. Conversations stay on the agent console, but setup, model selection, and default-agent installs live in this settings workspace."
      >
        <AgentSetupEmptyState profilesCount={companies?.profiles?.length ?? 0} />
      </WorkspaceSetupShell>
    )
  }

  if (!canManageAgentSettings) {
    return (
      <WorkspaceSetupShell
        activeStage="agent"
        className="agent-settings-page"
        title="Manage workspace settings"
        description="Agent setup is restricted to the workspace owner or a staff member with explicit setup permission."
      >
        <AgentSetupAccessDenied ownerOverride={ownerOverride} />
      </WorkspaceSetupShell>
    )
  }

  const configuredAgent = setupResponse?.agent
  const aiConfigured = Boolean(setupResponse?.configured && configuredAgent)

  return (
    <WorkspaceSetupShell
      activeStage="agent"
      className="agent-settings-page"
      title="Manage workspace settings"
      description="Keep setup separate from chat. Configure workspace AI, install default agents, and manage custom agents here. Live conversations stay on the agent console."
    >
      <div className="agent-settings-content grid gap-6">
        <Card className="agent-settings-hero border-gray-200 bg-white shadow-sm">
          <CardHeader className="gap-3 p-6 text-left">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              <Settings2 className="h-3.5 w-3.5" />
              Settings Workspace
            </div>
            <CardTitle className="text-3xl font-semibold tracking-tight text-gray-900">Agent settings</CardTitle>
            <CardDescription className="max-w-4xl text-sm leading-6 text-gray-600">
              This page is for setup only. Workspace AI configuration, default-agent installs, and custom agent management
              happen here. The chat console stays on <span className="font-semibold">/agent</span>. This is not the
              general settings hub for the rest of the application.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 p-6 pt-0 lg:flex-row lg:items-center lg:justify-between">
            <div className="agent-settings-status-grid grid gap-3 sm:grid-cols-3">
              <div className="agent-settings-status-card rounded-[24px] border border-blue-100 bg-blue-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">Access Mode</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {ownerOverride ? "Workspace owner" : "Permission-based"}
                </p>
              </div>
              <div className="agent-settings-status-card rounded-[24px] border border-emerald-100 bg-emerald-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Workspace AI</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">{aiConfigured ? "Configured" : "Not configured"}</p>
              </div>
              <div className="agent-settings-status-card rounded-[24px] border border-violet-100 bg-violet-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-700">Runtime Surface</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">Separated from setup</p>
              </div>
            </div>

            <div className="agent-settings-hero-actions flex flex-wrap gap-3">
              <Button type="button" variant="outline" className="agent-settings-secondary-action" onClick={openSetupSheet}>
                <Bot className="mr-2 h-4 w-4" />
                Configure workspace AI
              </Button>
              <Button asChild className="agent-settings-primary-action">
                <Link href="/agent">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Open agent console
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="agent-settings-tabs space-y-4">
          <TabsList className="agent-settings-tab-list h-auto flex-wrap justify-start gap-2 rounded-[24px] bg-gray-100 p-1">
            <TabsTrigger
              value="workspace-ai"
              className="agent-settings-tab rounded-[18px] border-transparent bg-transparent px-4 py-2.5 data-[state=active]:border-blue-300 data-[state=active]:bg-white data-[state=active]:text-blue-700"
            >
              Workspace AI
            </TabsTrigger>
            <TabsTrigger
              value="workspace-agents"
              className="agent-settings-tab rounded-[18px] border-transparent bg-transparent px-4 py-2.5 data-[state=active]:border-blue-300 data-[state=active]:bg-white data-[state=active]:text-blue-700"
            >
              Agent Setup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workspace-ai" className="mt-0 bg-transparent">
            {setupHasError ? (
              <Card className="border-red-200 bg-red-50 shadow-sm">
                <CardHeader className="p-6 text-left">
                  <CardTitle className="text-lg font-semibold text-red-900">Unable to load workspace AI settings</CardTitle>
                  <CardDescription className="text-sm text-red-700">
                    Check company context and permissions, then retry.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <Button variant="outline" onClick={() => void refetch()}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="p-6 text-left">
                    <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
                      <Bot className="h-5 w-5 text-blue-600" />
                      Current workspace AI
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Keep the live summary here. Open the side form to change anything.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 p-6 pt-0">
                    {aiConfigured && configuredAgent ? (
                      <>
                        <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Agent Name</p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">{configuredAgent.name}</p>
                        </div>
                        <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Model</p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">
                            {configuredAgent.provider_label} · {configuredAgent.model_name}
                          </p>
                        </div>
                        <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Credentials</p>
                          <div className="mt-2 space-y-1 text-sm text-gray-700">
                            <p>Base URL: {configuredAgent.effective_base_url || "Provider default not set"}</p>
                            <p>LLM API Key: {renderMaskedPreview(configuredAgent.api_key_masked)}</p>
                            <p>Tavily API Key: {renderMaskedPreview(configuredAgent.tavily_api_key_masked)}</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
                        No workspace AI setup yet. Use the side form to configure the company-level model and instruction
                        stack.
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 pt-2">
                      <Button type="button" onClick={openSetupSheet}>
                        <Save className="mr-2 h-4 w-4" />
                        {aiConfigured ? "Update workspace AI" : "Configure workspace AI"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => void refetch()} disabled={fetchingSetup}>
                        Refresh
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-6">
                  <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="p-6 text-left">
                      <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
                        <KeyRound className="h-5 w-5 text-blue-600" />
                        Instruction and key layers
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        The workspace AI record stores one model selection and three instruction layers.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 p-6 pt-0 sm:grid-cols-2">
                      <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Special instruction</p>
                        <p className="mt-2 text-sm text-gray-700">
                          {configuredAgent?.special_instruction ? "Configured" : "Not configured"}
                        </p>
                      </div>
                      <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">System instruction</p>
                        <p className="mt-2 text-sm text-gray-700">
                          {configuredAgent?.system_instruction ? "Configured" : "Not configured"}
                        </p>
                      </div>
                      <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-4 sm:col-span-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Assistant instruction</p>
                        <p className="mt-2 text-sm text-gray-700">
                          {configuredAgent?.assistant_instruction ? "Configured" : "Not configured"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="p-6 text-left">
                      <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
                        <Wrench className="h-5 w-5 text-blue-600" />
                        Agent setup stays on the next tab
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        Default installs, custom agents, and tool bindings are managed separately to keep this view clean.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3 p-6 pt-0">
                      <Button type="button" onClick={() => setActiveTab("workspace-agents")}>
                        Open agent setup
                      </Button>
                      <Button asChild variant="outline">
                        <Link href="/agent">Go to agent console</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="workspace-agents" className="mt-0 bg-transparent">
            <AgentSettingsControlPanel />
          </TabsContent>
        </Tabs>

        <WorkspaceAiSetupSheet
          open={setupSheetOpen}
          onOpenChange={setSetupSheetOpen}
          form={form}
          updateField={updateField}
          setupResponse={setupResponse}
          savingSetup={savingSetup}
          onSave={handleSave}
        />
      </div>
    </WorkspaceSetupShell>
  )
}

"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowRightLeft,
  Bot,
  Building2,
  KeyRound,
  Loader2,
  Save,
  Sparkles,
  Workflow,
} from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { WorkspaceSetupShell } from "@/components/onboarding/WorkspaceSetupShell"
import { useGetUserCompaniesQuery, useRefreshMutation } from "@/redux/features/auth/authApiSlice"
import {
  useGetCompanyAgentSetupQuery,
  useSaveCompanyAgentSetupMutation,
} from "@/redux/features/management/companyProfileApiSlice"
import type { SaveCompanyAgentSetupPayload } from "@/redux/features/management/companyProfileTypes"

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
    return "You do not have permission to manage company AI settings."
  }
  return "Unable to save agent setup. Please try again."
}

const AgentSetupLoading = () => (
  <div className="space-y-4">
    <div className="h-24 animate-pulse rounded-2xl border border-gray-200 bg-white" />
    <div className="h-96 animate-pulse rounded-2xl border border-gray-200 bg-white" />
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
        Agent setup is scoped to your active company profile. Switch into a workspace before managing API keys, model
        versions, and instructions.
      </CardDescription>
    </CardHeader>
    <CardContent className="flex flex-wrap gap-3 p-6 pt-0">
      <Button asChild>
        <Link href="/dashboard">
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Choose company
        </Link>
      </Button>
      {profilesCount === 0 ? (
        <Button asChild variant="outline">
          <Link href="/profile/create">Create company profile</Link>
        </Button>
      ) : null}
    </CardContent>
  </Card>
)

export default function Settings() {
  const router = useRouter()
  const [form, setForm] = useState<AgentSetupFormState>(EMPTY_FORM)
  const { data: companies, isLoading: loadingCompanies } = useGetUserCompaniesQuery()
  const activeProfileId = companies?.active_profile_id ?? null

  const {
    data: setupResponse,
    isLoading: loadingSetup,
    isFetching: fetchingSetup,
    isError: setupHasError,
    refetch,
  } = useGetCompanyAgentSetupQuery(undefined, {
    skip: !activeProfileId,
  })
  const [saveCompanyAgentSetup, { isLoading: savingSetup }] = useSaveCompanyAgentSetupMutation()
  const [refreshSession] = useRefreshMutation()

  useEffect(() => {
    const agent = setupResponse?.agent
    if (!agent) {
      setForm((prev) => ({
        ...prev,
        name: "",
        version: "",
        specialInstruction: "",
        systemInstruction: "",
        assistantInstruction: "",
      }))
      return
    }

    setForm((prev) => ({
      ...prev,
      name: agent.name ?? "",
      version: agent.version ? String(agent.version) : "",
      specialInstruction: agent.special_instruction ?? "",
      systemInstruction: agent.system_instruction ?? "",
      assistantInstruction: agent.assistant_instruction ?? "",
      apiKey: "",
      tavilyApiKey: "",
    }))
  }, [setupResponse?.agent])

  const availableVersions = setupResponse?.available_versions
  const selectedVersion = useMemo(
    () => (availableVersions ?? []).find((version) => String(version.id) === form.version),
    [availableVersions, form.version],
  )

  const updateField = <T extends keyof AgentSetupFormState>(field: T, value: AgentSetupFormState[T]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
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
      toast.success(setupResponse?.configured ? "Agent setup updated." : "Agent setup created.")
      setForm((prev) => ({ ...prev, apiKey: "", tavilyApiKey: "" }))
      try {
        await refreshSession().unwrap()
      } catch {
        toast.warning("Setup was saved, but the session token could not be refreshed automatically.")
      }
      await refetch()
      router.refresh()
    } catch (error) {
      toast.error(parseApiError(error))
    }
  }

  if (loadingCompanies || (activeProfileId && loadingSetup)) {
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
        title="Configure the company AI workspace"
        description="Save the company-level model, API credentials, and instruction set here. This becomes the agent context for the active workspace."
      >
        <AgentSetupEmptyState profilesCount={companies?.profiles?.length ?? 0} />
      </WorkspaceSetupShell>
    )
  }

  return (
    <WorkspaceSetupShell
      activeStage="agent"
      title="Configure the company AI workspace"
      description="This is the final onboarding layer for the workspace. Save the company-level model version, encrypted keys, and reusable instructions so the agent system stays scoped to the active company."
    >
      <div className="grid w-full gap-6">
        <Card className="border-blue-100 bg-white/95 shadow-sm">
          <CardHeader className="gap-3 p-6 text-left">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              Company Agent Setup
            </div>
            <CardTitle className="text-3xl font-semibold tracking-tight text-gray-900">Configure your AI workspace</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-600">
              Save per-company LLM configuration, encrypted API keys, and reusable instruction prompts. This setup is
              applied whenever your team works in this company context.
            </CardDescription>
          </CardHeader>
        </Card>

        {setupHasError ? (
          <Card className="border-red-200 bg-red-50 shadow-sm">
            <CardHeader className="p-6 text-left">
              <CardTitle className="text-lg font-semibold text-red-900">Unable to load setup</CardTitle>
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
        ) : null}

        {!setupHasError ? (
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="p-6 text-left">
                <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
                  <Bot className="h-5 w-5 text-blue-600" />
                  Current setup
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Review what is active for this company profile.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6 pt-0">
                {setupResponse?.configured && setupResponse.agent ? (
                  <>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Agent Name</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{setupResponse.agent.name}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Model</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {setupResponse.agent.provider_label} · {setupResponse.agent.model_name}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Credentials</p>
                      <div className="mt-2 space-y-1 text-sm text-gray-700">
                        <p>Base URL: {setupResponse.agent.effective_base_url || "Provider default not set"}</p>
                        <p>LLM API Key: {setupResponse.agent.api_key_masked || "Not set"}</p>
                        <p>Tavily API Key: {setupResponse.agent.tavily_api_key_masked || "Not set"}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
                    No agent setup yet. Complete the form to create it.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="p-6 text-left">
                <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
                  <Workflow className="h-5 w-5 text-blue-600" />
                  Create or update setup
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  API keys are encrypted server-side. Leave API key fields empty to keep existing values.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 p-6 pt-0">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="agent-name">Agent name</Label>
                    <Input
                      id="agent-name"
                      value={form.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      placeholder="e.g. Intera Inventory Copilot"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agent-version">Model version</Label>
                    <Select value={form.version || undefined} onValueChange={(value) => updateField("version", value)}>
                      <SelectTrigger id="agent-version">
                        <SelectValue placeholder="Select provider and model" />
                      </SelectTrigger>
                      <SelectContent>
                        {(availableVersions ?? []).map((version) => (
                          <SelectItem key={version.id} value={String(version.id)}>
                            {version.provider_label} · {version.model_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedVersion ? (
                      <p className="text-xs text-gray-500">
                        Active selection: {selectedVersion.provider_label} · {selectedVersion.model_name}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="llm-api-key" className="flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5 text-gray-500" />
                      LLM API key
                    </Label>
                    <Input
                      id="llm-api-key"
                      type="password"
                      value={form.apiKey}
                      onChange={(event) => updateField("apiKey", event.target.value)}
                      placeholder={
                        setupResponse?.agent?.has_api_key
                          ? "Enter new key to rotate current value"
                          : "Enter provider API key"
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tavily-api-key" className="flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5 text-gray-500" />
                      Tavily API key
                    </Label>
                    <Input
                      id="tavily-api-key"
                      type="password"
                      value={form.tavilyApiKey}
                      onChange={(event) => updateField("tavilyApiKey", event.target.value)}
                      placeholder={
                        setupResponse?.agent?.has_tavily_api_key
                          ? "Enter new key to rotate current value"
                          : "Enter Tavily API key"
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="special-instruction">Special instruction</Label>
                  <Textarea
                    id="special-instruction"
                    value={form.specialInstruction}
                    onChange={(event) => updateField("specialInstruction", event.target.value)}
                    placeholder="Organization-level guidance for how the agent should behave."
                    className="min-h-24"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="system-instruction">System instruction</Label>
                  <Textarea
                    id="system-instruction"
                    value={form.systemInstruction}
                    onChange={(event) => updateField("systemInstruction", event.target.value)}
                    placeholder="System prompt used as the base operating instruction."
                    className="min-h-24"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assistant-instruction">Assistant instruction</Label>
                  <Textarea
                    id="assistant-instruction"
                    value={form.assistantInstruction}
                    onChange={(event) => updateField("assistantInstruction", event.target.value)}
                    placeholder="Assistant persona and response style preferences."
                    className="min-h-24"
                  />
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button onClick={() => void handleSave()} disabled={savingSetup || fetchingSetup}>
                    {savingSetup ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save setup
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={savingSetup || fetchingSetup}
                    onClick={() => setForm((prev) => ({ ...prev, apiKey: "", tavilyApiKey: "" }))}
                  >
                    Clear entered keys
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </WorkspaceSetupShell>
  )
}

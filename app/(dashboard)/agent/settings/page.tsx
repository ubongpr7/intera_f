"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import {
  Bot,
  Building2,
  ExternalLink,
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
import { useUrlTabState } from "@/hooks/useUrlTabState"
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

const agentSettingsTabValues = ["workspace-ai", "workspace-agents"] as const

const providerApiKeyLinks: Record<string, { label: string; href: string }> = {
  chatgpt: { label: "OpenAI API keys", href: "https://platform.openai.com/api-keys" },
  openai: { label: "OpenAI API keys", href: "https://platform.openai.com/api-keys" },
  gemini: { label: "Google AI Studio API keys", href: "https://aistudio.google.com/app/apikey" },
  google: { label: "Google AI Studio API keys", href: "https://aistudio.google.com/app/apikey" },
  google_genai: { label: "Google AI Studio API keys", href: "https://aistudio.google.com/app/apikey" },
  "google-genai": { label: "Google AI Studio API keys", href: "https://aistudio.google.com/app/apikey" },
  grok: { label: "xAI API keys", href: "https://console.x.ai/" },
  xai: { label: "xAI API keys", href: "https://console.x.ai/" },
  anthropic: { label: "Anthropic API keys", href: "https://console.anthropic.com/settings/keys" },
  groq: { label: "Groq API keys", href: "https://console.groq.com/keys" },
  mistral: { label: "Mistral API keys", href: "https://console.mistral.ai/api-keys/" },
  cohere: { label: "Cohere API keys", href: "https://dashboard.cohere.com/api-keys" },
}

const tavilyApiKeyLink = "https://app.tavily.com/home"

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
  const selectedProvider = String(selectedVersion?.provider || setupResponse?.agent?.provider || "").trim().toLowerCase()
  const providerApiKeyLink = providerApiKeyLinks[selectedProvider]
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
      <SheetContent side="right" className="w-full max-w-3xl border-gray-200 bg-white p-0 text-gray-900 sm:max-w-3xl">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-gray-100 px-6 py-5">
            <SheetTitle>{setupResponse?.configured ? "Update workspace AI" : "Configure workspace AI"}</SheetTitle>
            <SheetDescription>
              Keep the page compact. Model selection, encrypted keys, and instruction layers are managed here in a side
              form instead of inline.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 px-6 py-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="workspace-agent-name">Agent name</Label>
                  <Input
                    id="workspace-agent-name"
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="Intera workspace copilot"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workspace-model-version">Model version</Label>
                  <ReactSelectField
                    inputId="workspace-model-version"
                    options={resolvedVersionOptions}
                    value={selectedVersionOption}
                    onChange={(option: unknown) => {
                      const nextOption = Array.isArray(option) ? null : (option as SelectOption | null)
                      updateField("version", nextOption ? String(nextOption.value) : "")
                    }}
                    placeholder="Select provider and model"
                    isSearchable={false}
                    isMulti={false}
                    controlShouldRenderValue
                  />
                  {selectedVersion ? (
                    <p className="text-xs text-gray-500">
                      Selected: {selectedVersion.provider_label} · {selectedVersion.model_name}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="workspace-llm-api-key">LLM API key</Label>
                  <Input
                    id="workspace-llm-api-key"
                    type="password"
                    value={form.apiKey}
                    onChange={(event) => updateField("apiKey", event.target.value)}
                    placeholder={
                      setupResponse?.agent?.has_api_key ? "Enter new key to rotate current value" : "Enter provider API key"
                    }
                  />
                  {providerApiKeyLink ? (
                    <a
                      href={providerApiKeyLink.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900 hover:underline"
                    >
                      Don&apos;t have a key? Get one from {providerApiKeyLink.label}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  ) : (
                    <p className="text-xs text-gray-500">Choose a provider to see where to create its API key.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workspace-tavily-api-key">Tavily API key</Label>
                  <Input
                    id="workspace-tavily-api-key"
                    type="password"
                    value={form.tavilyApiKey}
                    onChange={(event) => updateField("tavilyApiKey", event.target.value)}
                    placeholder={
                      setupResponse?.agent?.has_tavily_api_key
                        ? "Enter new key to rotate current value"
                      : "Enter Tavily API key"
                    }
                  />
                  <a
                    href={tavilyApiKeyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900 hover:underline"
                  >
                    Don&apos;t have a key? Get one from Tavily
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workspace-special-instruction">Special instruction</Label>
                <Textarea
                  id="workspace-special-instruction"
                  className="min-h-[140px]"
                  value={form.specialInstruction}
                  onChange={(event) => updateField("specialInstruction", event.target.value)}
                  placeholder="Organization-level guidance for how the workspace AI should behave."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workspace-system-instruction">System instruction</Label>
                <Textarea
                  id="workspace-system-instruction"
                  className="min-h-[160px]"
                  value={form.systemInstruction}
                  onChange={(event) => updateField("systemInstruction", event.target.value)}
                  placeholder="Base operating instruction used by the workspace AI."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workspace-assistant-instruction">Assistant instruction</Label>
                <Textarea
                  id="workspace-assistant-instruction"
                  className="min-h-[160px]"
                  value={form.assistantInstruction}
                  onChange={(event) => updateField("assistantInstruction", event.target.value)}
                  placeholder="Response style, formatting, and interaction guidance."
                  rows={4}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 px-6 py-4">
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

/* Deferred voice provider configuration. Kept out of the active product path pending a later release.
const WorkspaceVoiceSetupSheet = ({
  open,
  onOpenChange,
  form,
  updateField,
  setupResponse,
  speakers,
  speakersLoading,
  saving,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: VoiceSetupFormState
  updateField: <T extends keyof VoiceSetupFormState>(field: T, value: VoiceSetupFormState[T]) => void
  setupResponse?: CompanyVoiceSetupResponse
  speakers?: CompanyVoiceSpeaker[]
  speakersLoading: boolean
  saving: boolean
  onSave: () => void
}) => {
  const useNaijaLingo = form.provider === "naijalingo"
  const speakerOptions: SelectOption[] = [
    { value: "", label: "Provider default" },
    ...(speakers ?? []).map((speaker) => ({ value: speaker.id, label: speakerOptionLabel(speaker) })),
  ]
  const selectedSpeakerOption = speakerOptions.find((option) => option.value === form.speakerId)
    ?? (form.speakerId ? { value: form.speakerId, label: `Saved speaker - ${form.speakerId}` } : speakerOptions[0])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full border-gray-200 bg-white p-0 text-gray-900 sm:max-w-xl">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-gray-100 px-6 py-5">
            <SheetTitle>Nigerian voice output</SheetTitle>
            <SheetDescription>
              Naija Lingo is used only for speech synthesis. Recognition, A2A routing, and the workspace LLM remain on
              the existing voice stack. If it is unavailable, calls fall back to the default voice provider.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 px-6 py-5">
            <div className="space-y-2">
              <Label htmlFor="workspace-voice-provider">Voice provider</Label>
              <ReactSelectField
                inputId="workspace-voice-provider"
                options={[
                  { value: "default", label: "Default workspace voice" },
                  { value: "naijalingo", label: "Naija Lingo" },
                ]}
                value={{ value: form.provider, label: form.provider === "naijalingo" ? "Naija Lingo" : "Default workspace voice" }}
                onChange={(option: unknown) => {
                  const selected = Array.isArray(option) ? null : (option as SelectOption | null)
                  updateField("provider", (selected?.value === "naijalingo" ? "naijalingo" : "default") as WorkspaceVoiceProvider)
                }}
                isSearchable={false}
                isMulti={false}
              />
            </div>

            {useNaijaLingo ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="workspace-naijalingo-api-key">Naija Lingo API key</Label>
                  <Input
                    id="workspace-naijalingo-api-key"
                    type="password"
                    value={form.apiKey}
                    onChange={(event) => updateField("apiKey", event.target.value)}
                    placeholder={setupResponse?.voice.has_naijalingo_api_key ? "Enter a new key to rotate it" : "Enter Naija Lingo API key"}
                  />
                  {setupResponse?.voice.naijalingo_api_key_masked ? (
                    <span className="text-xs text-gray-500">Stored key: {renderMaskedPreview(setupResponse.voice.naijalingo_api_key_masked)}</span>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="workspace-voice-language">Synthesis language</Label>
                    <ReactSelectField
                      inputId="workspace-voice-language"
                      options={[
                        { value: "auto", label: "Automatic" },
                        { value: "pcm", label: "Nigerian Pidgin" },
                        { value: "yo", label: "Yoruba" },
                        { value: "ig", label: "Igbo" },
                        { value: "ha", label: "Hausa" },
                        { value: "en", label: "English" },
                      ]}
                      value={{ value: form.preferredLanguage, label: VOICE_LANGUAGE_LABELS[form.preferredLanguage] }}
                      onChange={(option: unknown) => {
                        const selected = Array.isArray(option) ? null : (option as SelectOption | null)
                        updateField("preferredLanguage", (selected?.value || "auto") as WorkspaceVoiceLanguage)
                      }}
                      isSearchable={false}
                      isMulti={false}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workspace-voice-speaker">Voice</Label>
                    <ReactSelectField
                      inputId="workspace-voice-speaker"
                      options={speakerOptions}
                      value={selectedSpeakerOption}
                      onChange={(option: unknown) => {
                        const selected = Array.isArray(option) ? null : (option as SelectOption | null)
                        updateField("speakerId", selected ? String(selected.value) : "")
                      }}
                      placeholder={speakersLoading ? "Loading available voices..." : "Choose a voice"}
                      isLoading={speakersLoading}
                      isClearable={false}
                      isMulti={false}
                    />
                    <span className="text-xs text-gray-500">Choose a provider voice, or keep the provider default.</span>
                  </div>
                </div>

                <label className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-900">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                    checked={form.enabled}
                    onChange={(event) => updateField("enabled", event.target.checked)}
                  />
                  <span>
                    <span className="block font-semibold text-gray-900">Enable Naija Lingo for new voice calls</span>
                    <span className="mt-1 block text-xs leading-5 text-gray-500">Existing calls keep their current provider until reconnected.</span>
                  </span>
                </label>
              </>
            ) : null}
            </div>
          </div>

          <div className="border-t border-gray-100 px-6 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="button" onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save voice setup
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

*/

export default function SettingsPage() {
  const router = useRouter()
  const { activeValue: activeTab, setActiveValue: setActiveTab } = useUrlTabState({
    defaultValue: "workspace-ai",
    values: agentSettingsTabValues,
  })
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

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as (typeof agentSettingsTabValues)[number])} className="agent-settings-tabs space-y-4">
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

"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  BrainCircuit,
  CheckCircle2,
  Globe2,
  Link2,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wrench,
} from "lucide-react";
import { toast } from "react-toastify";

import { hasTokenPermission, isWorkspaceOwner } from "@/lib/agentPermissions";
import { formatMachineLabel } from "@/lib/displayLabels";
import { extractErrorMessage, formatDate } from "@/lib/utils";
import { confirmAction } from "@/components/common/confirmAction";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ReactSelectField, type SelectOption } from "@/components/ui/react-select-field";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  useAttachWorkspaceAgentSkillMutation,
  useAttachWorkspaceAgentToolMutation,
  useCreateWorkspaceToolConnectionMutation,
  useCreateWorkspaceAgentMutation,
  useDeleteWorkspaceToolConnectionMutation,
  useDeleteWorkspaceAgentMutation,
  useDetachWorkspaceAgentSkillMutation,
  useDetachWorkspaceAgentToolMutation,
  useInstallAgentTemplateMutation,
  useListAgentSkillsQuery,
  useListAgentTemplatesQuery,
  useListAgentToolsQuery,
  useListToolServersQuery,
  useListWorkspaceAgentsQuery,
  useListWorkspaceToolConnectionsQuery,
  useTestWorkspaceToolConnectionMutation,
  useUpdateWorkspaceAgentMutation,
  useUpdateWorkspaceToolConnectionMutation,
} from "@/redux/features/agents/agentControlApiSlice";
import type {
  AgentTemplateRecord,
  CreateWorkspaceAgentPayload,
  SaveWorkspaceToolConnectionPayload,
  ToolServerRecord,
  WorkspaceToolConnectionRecord,
  WorkspaceAgentRecord,
} from "@/redux/features/agents/agentControlTypes";

type AgentFormState = {
  slug: string;
  name: string;
  description: string;
  visibility: "workspace" | "private";
  routing_policy: "direct" | "orchestrated" | "specialist_only";
  preferred_transport: string;
  protocol_version: string;
  version: string;
  system_instruction: string;
  developer_instruction: string;
  assistant_instruction: string;
  documentation_url: string;
  icon_url: string;
  is_enabled: boolean;
};

type ToolConnectionFormState = {
  tool_server: string;
  name: string;
  slug: string;
  auth_type: string;
  server_url_override: string;
  credential_payload_text: string;
  access_token: string;
  refresh_token: string;
  resource_owner_id: string;
  resource_label: string;
  granted_scopes_text: string;
  status: string;
};

const defaultAgentFormState: AgentFormState = {
  slug: "",
  name: "",
  description: "",
  visibility: "workspace",
  routing_policy: "direct",
  preferred_transport: "kafka",
  protocol_version: "0.3.0",
  version: "0.1.0",
  system_instruction: "",
  developer_instruction: "",
  assistant_instruction: "",
  documentation_url: "",
  icon_url: "",
  is_enabled: true,
};

const defaultToolConnectionFormState: ToolConnectionFormState = {
  tool_server: "",
  name: "",
  slug: "",
  auth_type: "api_key_header",
  server_url_override: "",
  credential_payload_text: "",
  access_token: "",
  refresh_token: "",
  resource_owner_id: "",
  resource_label: "",
  granted_scopes_text: "",
  status: "pending",
};

const visibilityOptions = [
  { value: "workspace", label: "Workspace" },
  { value: "private", label: "Private" },
] as const;

const routingOptions = [
  { value: "direct", label: "Direct" },
  { value: "orchestrated", label: "Orchestrated" },
  { value: "specialist_only", label: "Specialist Only" },
] as const;

const toolConnectionAuthTypeOptions: SelectOption[] = [
  { value: "api_key_header", label: "API Key Header" },
  { value: "oauth_workspace", label: "OAuth Workspace" },
  { value: "service_account", label: "Service Account" },
  { value: "custom", label: "Custom" },
];

const toolConnectionStatusOptions: SelectOption[] = [
  { value: "pending", label: "Pending" },
  { value: "connected", label: "Connected" },
  { value: "expired", label: "Expired" },
  { value: "error", label: "Error" },
  { value: "revoked", label: "Revoked" },
];

const humanize = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());

const getSingleSelectOption = (option: SelectOption | readonly SelectOption[] | null): SelectOption | null => {
  if (Array.isArray(option)) {
    return null;
  }
  return option as SelectOption | null;
};

const stringifyExampleJson = (value: unknown) => JSON.stringify(value, null, 2);

const getAgentFormState = (agent: WorkspaceAgentRecord): AgentFormState => ({
  slug: agent.slug,
  name: agent.name,
  description: agent.description ?? "",
  visibility: agent.visibility,
  routing_policy: agent.routing_policy,
  preferred_transport: agent.preferred_transport ?? "kafka",
  protocol_version: agent.protocol_version ?? "0.3.0",
  version: agent.version ?? "0.1.0",
  system_instruction: agent.system_instruction ?? "",
  developer_instruction: agent.developer_instruction ?? "",
  assistant_instruction: agent.assistant_instruction ?? "",
  documentation_url: agent.documentation_url ?? "",
  icon_url: agent.icon_url ?? "",
  is_enabled: Boolean(agent.is_enabled),
});

const getToolConnectionFormState = (connection: WorkspaceToolConnectionRecord): ToolConnectionFormState => ({
  tool_server: connection.tool_server?.id ?? "",
  name: connection.name,
  slug: connection.slug,
  auth_type: connection.auth_type || "api_key_header",
  server_url_override: connection.server_url_override || "",
  credential_payload_text: "",
  access_token: "",
  refresh_token: "",
  resource_owner_id: connection.resource_owner_id || "",
  resource_label: connection.resource_label || "",
  granted_scopes_text: (connection.granted_scopes || []).join(", "),
  status: connection.status || "pending",
});

const AgentEditorSheet = ({
  open,
  onOpenChange,
  title,
  description,
  value,
  onChange,
  onSubmit,
  isBusy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  value: AgentFormState;
  onChange: (next: AgentFormState) => void;
  onSubmit: () => Promise<void>;
  isBusy: boolean;
}) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent
      side="right"
      className="w-full max-w-3xl border-slate-800 bg-[linear-gradient(180deg,#020617_0%,#0f172a_58%,#111827_100%)] p-0 text-white shadow-[0_40px_90px_rgba(2,6,23,0.82)] sm:max-w-3xl"
    >
      <div className="flex h-full flex-col">
        <SheetHeader className="border-b border-slate-800/80 bg-[linear-gradient(115deg,rgba(15,23,42,0.98),rgba(17,24,39,0.96),rgba(30,41,59,0.96))] px-7 py-7 text-left md:px-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-200">
              Workspace settings
          </div>
          <SheetTitle className="mt-4 text-3xl font-semibold tracking-tight text-blue-200">{title}</SheetTitle>
          <SheetDescription className="max-w-2xl text-sm leading-6 text-slate-300">{description}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(30,41,59,0.96)_0%,rgba(15,23,42,0.98)_52%,rgba(2,6,23,1)_100%)] px-7 py-6 md:px-8">
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 rounded-[26px] border border-slate-800 bg-slate-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Slug</span>
                <Input
                  className="h-12 rounded-2xl border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
                  value={value.slug}
                  onChange={(event) => onChange({ ...value, slug: event.target.value })}
                  placeholder="inventory-ops-copilot"
                />
              </label>
              <label className="grid gap-2 rounded-[26px] border border-slate-800 bg-slate-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Name</span>
                <Input
                  className="h-12 rounded-2xl border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
                  value={value.name}
                  onChange={(event) => onChange({ ...value, name: event.target.value })}
                  placeholder="Inventory Ops Copilot"
                />
              </label>
            </div>

            <label className="grid gap-2 rounded-[26px] border border-slate-800 bg-slate-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Description</span>
              <Textarea
                className="min-h-[120px] rounded-2xl border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
                value={value.description}
                onChange={(event) => onChange({ ...value, description: event.target.value })}
                placeholder="Explain what this agent is responsible for in the workspace."
                rows={3}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 rounded-[26px] border border-slate-800 bg-slate-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Visibility</span>
                <select
                  value={value.visibility}
                  onChange={(event) =>
                    onChange({ ...value, visibility: event.target.value as AgentFormState["visibility"] })
                  }
                  className="h-12 rounded-2xl border border-slate-700 bg-slate-800/80 px-4 text-sm text-slate-100 outline-none transition focus:border-blue-400"
                >
                  {visibilityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 rounded-[26px] border border-slate-800 bg-slate-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Routing policy</span>
                <select
                  value={value.routing_policy}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      routing_policy: event.target.value as AgentFormState["routing_policy"],
                    })
                  }
                  className="h-12 rounded-2xl border border-slate-700 bg-slate-800/80 px-4 text-sm text-slate-100 outline-none transition focus:border-blue-400"
                >
                  {routingOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="grid gap-2 rounded-[26px] border border-slate-800 bg-slate-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">System instruction</span>
              <Textarea
                className="min-h-[140px] rounded-2xl border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
                value={value.system_instruction}
                onChange={(event) => onChange({ ...value, system_instruction: event.target.value })}
                rows={4}
                placeholder="Define the baseline operating instruction for this agent."
              />
            </label>

            <label className="grid gap-2 rounded-[26px] border border-slate-800 bg-slate-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Workflow guidance</span>
              <Textarea
                className="min-h-[120px] rounded-2xl border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
                value={value.developer_instruction}
                onChange={(event) => onChange({ ...value, developer_instruction: event.target.value })}
                rows={3}
                placeholder="Add guidance for how this agent should operate."
              />
            </label>

            <label className="grid gap-2 rounded-[26px] border border-slate-800 bg-slate-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Assistant instruction</span>
              <Textarea
                className="min-h-[120px] rounded-2xl border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
                value={value.assistant_instruction}
                onChange={(event) => onChange({ ...value, assistant_instruction: event.target.value })}
                rows={3}
                placeholder="Set the response tone, formatting, and interaction style."
              />
            </label>

            <label className="flex items-start gap-3 rounded-[26px] border border-slate-800 bg-slate-950/72 px-4 py-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
              <Checkbox
                checked={value.is_enabled}
                onCheckedChange={(checked) => onChange({ ...value, is_enabled: Boolean(checked) })}
              />
              <div>
                <p className="font-medium text-slate-100">Enable this agent</p>
                <p className="text-xs leading-5 text-slate-400">
                  Disabled agents stay configured in the workspace but do not appear in the active agent list.
                </p>
              </div>
            </label>

            <details className="rounded-[26px] border border-slate-800 bg-slate-950/72 p-4 shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
              <summary className="cursor-pointer text-sm font-semibold text-slate-100">Advanced settings</summary>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Preferred transport</span>
                  <Input
                    className="h-12 rounded-2xl border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
                    value={value.preferred_transport}
                    onChange={(event) => onChange({ ...value, preferred_transport: event.target.value })}
                    placeholder="kafka"
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Protocol version</span>
                  <Input
                    className="h-12 rounded-2xl border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
                    value={value.protocol_version}
                    onChange={(event) => onChange({ ...value, protocol_version: event.target.value })}
                    placeholder="0.3.0"
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Agent version</span>
                  <Input
                    className="h-12 rounded-2xl border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
                    value={value.version}
                    onChange={(event) => onChange({ ...value, version: event.target.value })}
                    placeholder="0.1.0"
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Documentation URL</span>
                  <Input
                    className="h-12 rounded-2xl border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
                    value={value.documentation_url}
                    onChange={(event) => onChange({ ...value, documentation_url: event.target.value })}
                    placeholder="https://docs.example.com/agent"
                  />
                </label>
                <label className="grid gap-2 text-sm md:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Icon URL</span>
                  <Input
                    className="h-12 rounded-2xl border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
                    value={value.icon_url}
                    onChange={(event) => onChange({ ...value, icon_url: event.target.value })}
                    placeholder="https://cdn.example.com/icon.svg"
                  />
                </label>
              </div>
            </details>
          </div>
        </div>

        <div className="border-t border-slate-800 bg-slate-950/95 px-7 py-4 md:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void onSubmit()} disabled={isBusy}>
              {isBusy ? "Saving..." : "Save agent"}
            </Button>
          </div>
        </div>
      </div>
    </SheetContent>
  </Sheet>
);

const AgentBindingsSheet = ({
  open,
  onOpenChange,
  agent,
  availableToolOptions,
  availableSkillOptions,
  selectedToolOption,
  setSelectedToolOption,
  selectedSkillOption,
  setSelectedSkillOption,
  loadingTools,
  loadingSkills,
  attachingTool,
  attachingSkill,
  detachingTool,
  detachingSkill,
  onAttachTool,
  onAttachSkill,
  onDetachTool,
  onDetachSkill,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: WorkspaceAgentRecord | null;
  availableToolOptions: SelectOption[];
  availableSkillOptions: SelectOption[];
  selectedToolOption: SelectOption | null;
  setSelectedToolOption: (option: SelectOption | null) => void;
  selectedSkillOption: SelectOption | null;
  setSelectedSkillOption: (option: SelectOption | null) => void;
  loadingTools: boolean;
  loadingSkills: boolean;
  attachingTool: boolean;
  attachingSkill: boolean;
  detachingTool: boolean;
  detachingSkill: boolean;
  onAttachTool: () => Promise<void>;
  onAttachSkill: () => Promise<void>;
  onDetachTool: (toolId: string) => Promise<void>;
  onDetachSkill: (skillId: string) => Promise<void>;
}) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="right" className="w-full max-w-3xl border-gray-200 bg-white p-0 text-gray-900 sm:max-w-3xl">
      <div className="flex h-full flex-col">
        <SheetHeader className="border-b border-gray-200 bg-slate-950 px-6 py-6 text-left">
          <SheetTitle className="text-3xl font-semibold tracking-tight text-white">
            Configure tools and skills
          </SheetTitle>
          <SheetDescription className="text-sm leading-6 text-slate-300">
            {agent ? `Adjust the tools and skills for ${agent.name}.` : "Select an agent first."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6">
          {agent ? (
            <div className="space-y-6">
              <Card className="border-gray-200">
                <CardHeader className="p-5">
                  <CardTitle className="text-xl">Tool bindings</CardTitle>
                  <CardDescription>Attach backend tools that this agent can use.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-5 pt-0">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="min-w-0 flex-1">
                      <ReactSelectField
                        value={selectedToolOption}
                        onChange={(option) => setSelectedToolOption((option as SelectOption | null) ?? null)}
                        options={availableToolOptions}
                        placeholder={loadingTools ? "Loading tools..." : "Attach a tool"}
                        helperText={
                          availableToolOptions.length
                            ? "Only tools not already attached are shown here."
                            : "All visible tools are already attached."
                        }
                        isDisabled={!availableToolOptions.length || loadingTools}
                      />
                    </div>
                    <Button type="button" onClick={() => void onAttachTool()} disabled={!selectedToolOption || attachingTool}>
                      {attachingTool ? "Attaching..." : "Attach tool"}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {agent.tool_bindings.length ? (
                      agent.tool_bindings.map((binding) => (
                        <div
                          key={binding.id}
                          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-slate-700"
                        >
                          <span>{binding.tool.display_name}</span>
                          <button
                            type="button"
                            onClick={() => void onDetachTool(binding.tool.id)}
                            className="rounded-full p-1 text-slate-400 transition hover:bg-white hover:text-red-500"
                            disabled={detachingTool}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No tools attached yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader className="p-5">
                  <CardTitle className="text-xl">Skill bindings</CardTitle>
                  <CardDescription>Attach reusable skill profiles that shape this agent’s work.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-5 pt-0">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="min-w-0 flex-1">
                      <ReactSelectField
                        value={selectedSkillOption}
                        onChange={(option) => setSelectedSkillOption((option as SelectOption | null) ?? null)}
                        options={availableSkillOptions}
                        placeholder={loadingSkills ? "Loading skills..." : "Attach a skill"}
                        helperText={
                          availableSkillOptions.length
                            ? "Only skills not already attached are shown here."
                            : "All visible skills are already attached."
                        }
                        isDisabled={!availableSkillOptions.length || loadingSkills}
                      />
                    </div>
                    <Button type="button" onClick={() => void onAttachSkill()} disabled={!selectedSkillOption || attachingSkill}>
                      {attachingSkill ? "Attaching..." : "Attach skill"}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {agent.skill_bindings.length ? (
                      agent.skill_bindings.map((binding) => (
                        <div
                          key={binding.id}
                          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-slate-700"
                        >
                          <span>{binding.skill.name}</span>
                          <button
                            type="button"
                            onClick={() => void onDetachSkill(binding.skill.id)}
                            className="rounded-full p-1 text-slate-400 transition hover:bg-white hover:text-red-500"
                            disabled={detachingSkill}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No skills attached yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-dashed border-gray-300 bg-white">
              <CardContent className="p-6 text-sm text-slate-500">
                Select an installed agent first.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </SheetContent>
  </Sheet>
);

const InstallTemplatesSheet = ({
  open,
  onOpenChange,
  templates,
  selectedTemplateIds,
  onToggleTemplate,
  onToggleAll,
  isLoadingTemplates,
  isInstalling,
  onInstallSelected,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: AgentTemplateRecord[];
  selectedTemplateIds: string[];
  onToggleTemplate: (templateId: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  isLoadingTemplates: boolean;
  isInstalling: boolean;
  onInstallSelected: () => Promise<void>;
}) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent
      side="right"
      className="w-full max-w-3xl border-slate-800 bg-[linear-gradient(180deg,#020617_0%,#0f172a_58%,#111827_100%)] p-0 text-white shadow-[0_40px_90px_rgba(2,6,23,0.82)] sm:max-w-3xl"
    >
      <div className="flex h-full flex-col">
        <SheetHeader className="border-b border-slate-800/80 bg-[linear-gradient(115deg,rgba(15,23,42,0.98),rgba(17,24,39,0.96),rgba(6,78,59,0.86))] px-6 py-6 text-left">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">
            Default agents
          </div>
          <SheetTitle className="mt-4 text-3xl font-semibold tracking-tight text-blue-100">Install default agents</SheetTitle>
          <SheetDescription className="max-w-2xl text-sm leading-6 text-slate-300">
            Only templates not yet installed in this workspace are shown here. Install first, then edit details or bindings afterward.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(22,78,99,0.28)_0%,rgba(15,23,42,0.98)_48%,rgba(2,6,23,1)_100%)] px-6 py-6">
          {isLoadingTemplates && templates.length === 0 ? (
            <div className="space-y-4">
              <div className="rounded-[26px] border border-slate-800 bg-slate-950/72 p-5 shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
                <div className="h-4 w-44 animate-pulse rounded-full bg-slate-800" />
                <div className="mt-4 h-10 w-72 animate-pulse rounded-2xl bg-slate-800/80" />
                <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded-full bg-slate-800/70" />
              </div>
              <div className="grid gap-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`template-skeleton-${index}`}
                    className="rounded-[26px] border border-slate-800 bg-slate-950/72 p-5 shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="h-5 w-52 animate-pulse rounded-full bg-slate-800" />
                        <div className="h-4 w-full max-w-xl animate-pulse rounded-full bg-slate-800/70" />
                        <div className="h-4 w-4/5 animate-pulse rounded-full bg-slate-800/70" />
                      </div>
                      <div className="h-11 w-11 animate-pulse rounded-2xl bg-slate-800" />
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <div className="h-7 w-20 animate-pulse rounded-full bg-slate-800/80" />
                      <div className="h-7 w-20 animate-pulse rounded-full bg-slate-800/80" />
                      <div className="h-7 w-28 animate-pulse rounded-full bg-slate-800/80" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : templates.length ? (
            <div className="space-y-4">
              <div className="rounded-[26px] border border-slate-800 bg-slate-950/72 p-5 shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-3 text-sm text-slate-200">
                    <Checkbox
                      checked={templates.length > 0 && selectedTemplateIds.length === templates.length}
                      onCheckedChange={(checked) => onToggleAll(Boolean(checked))}
                    />
                    <span className="font-medium">
                      {selectedTemplateIds.length
                        ? `${selectedTemplateIds.length} default agent${selectedTemplateIds.length === 1 ? "" : "s"} selected`
                        : "Select default agents to install"}
                    </span>
                  </label>
                  <Button
                    type="button"
                    onClick={() => void onInstallSelected()}
                    disabled={!selectedTemplateIds.length || isInstalling}
                    className="bg-blue-600 text-white hover:bg-blue-500"
                  >
                    {isInstalling
                      ? `Installing ${selectedTemplateIds.length}...`
                      : `Install ${selectedTemplateIds.length || ""} agent${selectedTemplateIds.length === 1 ? "" : "s"}`.trim()}
                  </Button>
                </div>
                {isLoadingTemplates ? (
                  <p className="mt-3 text-xs text-slate-400">Refreshing the default agent catalog...</p>
                ) : null}
              </div>

              {templates.map((template) => (
                <Card key={template.id} className="border-slate-800 bg-slate-950/72 text-white shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
                  <CardHeader className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <Checkbox
                          checked={selectedTemplateIds.includes(template.id)}
                          onCheckedChange={(checked) => onToggleTemplate(template.id, Boolean(checked))}
                          className="mt-1 border-slate-600 data-[state=checked]:border-blue-400 data-[state=checked]:bg-blue-500"
                        />
                        <div className="min-w-0">
                          <CardTitle className="text-xl text-white">{template.name}</CardTitle>
                          <CardDescription className="mt-2 text-sm leading-6 text-slate-300">
                            {template.description || "No description yet."}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-slate-300">
                        <Bot className="h-4 w-4" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 p-5 pt-0">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-slate-200">
                        {template.tool_bindings.length} tools
                      </span>
                      <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-slate-200">
                        {template.skill_bindings.length} skills
                      </span>
                      <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-slate-200">
                        {template.preferred_transport}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-[26px] border border-dashed border-slate-700 bg-slate-950/72 p-6 text-sm text-slate-300 shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
              Every default template has already been installed in this workspace.
            </div>
          )}
        </div>
      </div>
    </SheetContent>
  </Sheet>
);

const ToolConnectionSheet = ({
  open,
  onOpenChange,
  title,
  description,
  value,
  onChange,
  toolServers,
  toolServerOptions,
  onSubmit,
  isBusy,
  isEditing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  value: ToolConnectionFormState;
  onChange: (next: ToolConnectionFormState) => void;
  toolServers: ToolServerRecord[];
  toolServerOptions: SelectOption[];
  onSubmit: () => Promise<void>;
  isBusy: boolean;
  isEditing: boolean;
}) => {
  const selectedServer = toolServers.find((server) => server.id === value.tool_server) ?? null;
  const selectedServerMetadata = (selectedServer?.metadata ?? {}) as Record<string, unknown>;
  const selectedServerAuthConfig = (selectedServer?.auth_config ?? {}) as Record<string, unknown>;
  const supportedAuthTypes = Array.isArray(selectedServerAuthConfig.supportedAuthTypes)
    ? (selectedServerAuthConfig.supportedAuthTypes as string[])
    : [];
  const connectionGuide = Array.isArray(selectedServerMetadata.connectionGuide)
    ? (selectedServerMetadata.connectionGuide as string[])
    : [];
  const capabilityExamples = Array.isArray(selectedServerMetadata.suggestedCapabilities)
    ? (selectedServerMetadata.suggestedCapabilities as string[])
    : [];
  const credentialExample = selectedServerAuthConfig.credentialExample;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent
      side="right"
      className="w-full max-w-3xl border-slate-800 bg-[linear-gradient(180deg,#020617_0%,#0f172a_58%,#111827_100%)] p-0 text-white shadow-[0_40px_90px_rgba(2,6,23,0.82)] sm:max-w-3xl"
    >
      <div className="flex h-full flex-col">
        <SheetHeader className="border-b border-slate-800/80 bg-[linear-gradient(115deg,rgba(15,23,42,0.98),rgba(17,24,39,0.96),rgba(6,78,59,0.86))] px-7 py-7 text-left md:px-8">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200">
            External MCP
          </div>
          <SheetTitle className="mt-4 text-3xl font-semibold tracking-tight text-blue-200">{title}</SheetTitle>
          <SheetDescription className="max-w-2xl text-sm leading-6 text-slate-300">{description}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(22,78,99,0.28)_0%,rgba(15,23,42,0.98)_48%,rgba(2,6,23,1)_100%)] px-7 py-6 md:px-8">
          <div className="grid gap-4">
            <div className="rounded-[26px] border border-slate-800 bg-slate-950/72 p-5 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
              <p className="text-sm font-semibold text-slate-100">How this works</p>
              <div className="mt-3 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Tool server</p>
                  <p className="mt-2 leading-6">
                    This is the MCP server definition in the platform catalog. It tells the workspace what kind of
                    external tool family you are connecting, such as Shopify, Slack, or Notion.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Connection</p>
                  <p className="mt-2 leading-6">
                    This stores your workspace-specific credentials and optional server URL. The server record is shared;
                    the connection is yours.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2 rounded-[26px] border border-slate-800 bg-slate-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Tool server</span>
                <ReactSelectField
                  value={toolServerOptions.find((option) => option.value === value.tool_server) ?? null}
                  onChange={(option) => {
                    const nextOption = getSingleSelectOption(option);
                    onChange({
                      ...value,
                      tool_server: String(nextOption?.value ?? ""),
                    });
                  }}
                  options={toolServerOptions}
                  placeholder="Select MCP server"
                  isSearchable
                  isClearable
                />
                {toolServerOptions.length === 0 ? (
                  <p className="text-xs leading-5 text-amber-300">
                    No MCP servers are in the catalog yet. Seed the platform catalog first, then reopen this sheet.
                  </p>
                ) : (
                  <p className="text-xs leading-5 text-slate-400">
                    Pick the external MCP family first. After that, save the credentials your workspace should use with
                    that server.
                  </p>
                )}
              </div>
              <div className="grid gap-2 rounded-[26px] border border-slate-800 bg-slate-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Auth type</span>
                <ReactSelectField
                  value={toolConnectionAuthTypeOptions.find((option) => option.value === value.auth_type) ?? null}
                  onChange={(option) => {
                    const nextOption = getSingleSelectOption(option);
                    onChange({ ...value, auth_type: String(nextOption?.value ?? "") });
                  }}
                  options={toolConnectionAuthTypeOptions}
                  placeholder="Select auth type"
                  isSearchable={false}
                  isClearable={false}
                />
                <p className="text-xs leading-5 text-slate-400">
                  This is the credential pattern your workspace will save for this connection, not the tool-server type
                  itself.
                </p>
              </div>
            </div>

            {selectedServer ? (
              <div className="rounded-[26px] border border-emerald-900/60 bg-emerald-950/20 p-5 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-emerald-100">{selectedServer.name}</p>
                  <span className="rounded-full border border-emerald-700/50 bg-emerald-900/30 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                    {selectedServer.server_id}
                  </span>
                  <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                    {selectedServer.auth_mode || "none"}
                  </span>
                </div>
                <p className="mt-3 leading-6 text-slate-300">{selectedServer.description || "No server description yet."}</p>
                {connectionGuide.length > 0 ? (
                  <ul className="mt-4 grid gap-2 text-sm text-slate-300">
                    {connectionGuide.map((item) => (
                      <li key={item} className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 leading-6">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Supported auth</p>
                    <p className="mt-2 leading-6 text-slate-300">
                      {supportedAuthTypes.length > 0 ? supportedAuthTypes.join(", ") : value.auth_type || "custom"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Server URL</p>
                    <p className="mt-2 break-all leading-6 text-slate-300">
                      {selectedServer.server_url || "No default URL is stored. Use Server URL Override for your actual endpoint."}
                    </p>
                  </div>
                </div>
                {capabilityExamples.length > 0 ? (
                  <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Typical capabilities</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {capabilityExamples.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-200"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 rounded-[26px] border border-slate-800 bg-slate-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Connection name</span>
                <Input
                  className="h-12 rounded-2xl border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus-visible:border-emerald-400 focus-visible:ring-emerald-500/20"
                  value={value.name}
                  onChange={(event) => onChange({ ...value, name: event.target.value })}
                  placeholder="Shopify Main Store"
                />
              </label>
              <label className="grid gap-2 rounded-[26px] border border-slate-800 bg-slate-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Slug</span>
                <Input
                  className="h-12 rounded-2xl border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus-visible:border-emerald-400 focus-visible:ring-emerald-500/20"
                  value={value.slug}
                  onChange={(event) => onChange({ ...value, slug: event.target.value })}
                  placeholder="shopify-main-store"
                />
              </label>
            </div>

            <label className="grid gap-2 rounded-[26px] border border-slate-800 bg-slate-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Server URL override</span>
              <Input
                className="h-12 rounded-2xl border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus-visible:border-emerald-400 focus-visible:ring-emerald-500/20"
                value={value.server_url_override}
                onChange={(event) => onChange({ ...value, server_url_override: event.target.value })}
                placeholder="Optional override for the MCP endpoint URL"
              />
              <p className="text-xs leading-5 text-slate-400">
                Use this when the provider gives you a tenant-specific or self-hosted MCP endpoint. If the catalog server
                already has a valid URL, you can leave this blank.
              </p>
            </label>

            <label className="grid gap-2 rounded-[26px] border border-slate-800 bg-slate-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Credential payload JSON</span>
              <Textarea
                className="min-h-[150px] rounded-2xl border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus-visible:border-emerald-400 focus-visible:ring-emerald-500/20"
                value={value.credential_payload_text}
                onChange={(event) => onChange({ ...value, credential_payload_text: event.target.value })}
                rows={6}
                placeholder={'{"header_name":"x-api-key","api_key":"..."}'}
              />
              <p className="text-xs leading-5 text-slate-400">
                Use this for API-key or custom header credentials. For example: <span className="font-mono">{"{\"header_name\":\"x-api-key\",\"api_key\":\"...\"}"}</span>
              </p>
              {credentialExample ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Example for selected server</p>
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-950/80 p-3 text-xs leading-6 text-slate-200">
                    {stringifyExampleJson(credentialExample)}
                  </pre>
                </div>
              ) : null}
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 rounded-[26px] border border-slate-800 bg-slate-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Access token</span>
                <Input
                  className="h-12 rounded-2xl border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus-visible:border-emerald-400 focus-visible:ring-emerald-500/20"
                  value={value.access_token}
                  onChange={(event) => onChange({ ...value, access_token: event.target.value })}
                  placeholder={isEditing ? "Leave blank to keep current token" : "Optional bearer or OAuth token"}
                />
              </label>
              <label className="grid gap-2 rounded-[26px] border border-slate-800 bg-slate-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Refresh token</span>
                <Input
                  className="h-12 rounded-2xl border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus-visible:border-emerald-400 focus-visible:ring-emerald-500/20"
                  value={value.refresh_token}
                  onChange={(event) => onChange({ ...value, refresh_token: event.target.value })}
                  placeholder={isEditing ? "Leave blank to keep current refresh token" : "Optional refresh token"}
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 rounded-[26px] border border-slate-800 bg-slate-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Resource label</span>
                <Input
                  className="h-12 rounded-2xl border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus-visible:border-emerald-400 focus-visible:ring-emerald-500/20"
                  value={value.resource_label}
                  onChange={(event) => onChange({ ...value, resource_label: event.target.value })}
                  placeholder="Merchant Admin Store"
                />
              </label>
              <label className="grid gap-2 rounded-[26px] border border-slate-800 bg-slate-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Resource owner ID</span>
                <Input
                  className="h-12 rounded-2xl border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus-visible:border-emerald-400 focus-visible:ring-emerald-500/20"
                  value={value.resource_owner_id}
                  onChange={(event) => onChange({ ...value, resource_owner_id: event.target.value })}
                  placeholder="shop_123"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 rounded-[26px] border border-slate-800 bg-slate-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Granted scopes</span>
                <Input
                  className="h-12 rounded-2xl border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus-visible:border-emerald-400 focus-visible:ring-emerald-500/20"
                  value={value.granted_scopes_text}
                  onChange={(event) => onChange({ ...value, granted_scopes_text: event.target.value })}
                  placeholder="read_products, write_inventory"
                />
              </label>
              <div className="grid gap-2 rounded-[26px] border border-slate-800 bg-slate-950/72 p-4 text-sm shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Status</span>
                <ReactSelectField
                  value={toolConnectionStatusOptions.find((option) => option.value === value.status) ?? null}
                  onChange={(option) => {
                    const nextOption = getSingleSelectOption(option);
                    onChange({ ...value, status: String(nextOption?.value ?? "pending") });
                  }}
                  options={toolConnectionStatusOptions}
                  placeholder="Select status"
                  isSearchable={false}
                  isClearable={false}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 bg-slate-950/95 px-7 py-4 md:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void onSubmit()} disabled={isBusy}>
              {isBusy ? "Saving..." : "Save connection"}
            </Button>
          </div>
        </div>
      </div>
    </SheetContent>
  </Sheet>
  );
};

export default function AgentSettingsControlPanel() {
  const canManageAgentSettings = useMemo(() => hasTokenPermission("manage_agent_settings"), []);
  const ownerOverride = useMemo(() => isWorkspaceOwner(), []);

  const {
    data: templates = [],
    isFetching: loadingTemplates,
    refetch: refetchTemplates,
  } = useListAgentTemplatesQuery(undefined, {
    skip: !canManageAgentSettings,
  });
  const {
    data: workspaceAgents = [],
    isFetching: loadingWorkspaceAgents,
    refetch: refetchWorkspaceAgents,
  } = useListWorkspaceAgentsQuery(undefined, {
    skip: !canManageAgentSettings,
  });
  const { data: tools = [], isFetching: loadingTools } = useListAgentToolsQuery(undefined, {
    skip: !canManageAgentSettings,
  });
  const { data: skills = [], isFetching: loadingSkills } = useListAgentSkillsQuery(undefined, {
    skip: !canManageAgentSettings,
  });
  const { data: toolServers = [] } = useListToolServersQuery(undefined, {
    skip: !canManageAgentSettings,
  });
  const {
    data: toolConnections = [],
    isFetching: loadingToolConnections,
    refetch: refetchToolConnections,
  } = useListWorkspaceToolConnectionsQuery(undefined, {
    skip: !canManageAgentSettings,
  });

  const [createWorkspaceToolConnection, { isLoading: creatingToolConnection }] = useCreateWorkspaceToolConnectionMutation();
  const [updateWorkspaceToolConnection, { isLoading: updatingToolConnection }] = useUpdateWorkspaceToolConnectionMutation();
  const [deleteWorkspaceToolConnection, { isLoading: deletingToolConnection }] = useDeleteWorkspaceToolConnectionMutation();
  const [testWorkspaceToolConnection, { isLoading: testingToolConnection }] = useTestWorkspaceToolConnectionMutation();
  const [createWorkspaceAgent, { isLoading: creatingAgent }] = useCreateWorkspaceAgentMutation();
  const [updateWorkspaceAgent, { isLoading: updatingAgent }] = useUpdateWorkspaceAgentMutation();
  const [deleteWorkspaceAgent, { isLoading: deletingAgent }] = useDeleteWorkspaceAgentMutation();
  const [installAgentTemplate, { isLoading: installingTemplate }] = useInstallAgentTemplateMutation();
  const [attachWorkspaceAgentTool, { isLoading: attachingTool }] = useAttachWorkspaceAgentToolMutation();
  const [detachWorkspaceAgentTool, { isLoading: detachingTool }] = useDetachWorkspaceAgentToolMutation();
  const [attachWorkspaceAgentSkill, { isLoading: attachingSkill }] = useAttachWorkspaceAgentSkillMutation();
  const [detachWorkspaceAgentSkill, { isLoading: detachingSkill }] = useDetachWorkspaceAgentSkillMutation();

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [bindingsSheetOpen, setBindingsSheetOpen] = useState(false);
  const [installSheetOpen, setInstallSheetOpen] = useState(false);
  const [connectionSheetOpen, setConnectionSheetOpen] = useState(false);
  const [createForm, setCreateForm] = useState<AgentFormState>(defaultAgentFormState);
  const [editForm, setEditForm] = useState<AgentFormState>(defaultAgentFormState);
  const [connectionForm, setConnectionForm] = useState<ToolConnectionFormState>(defaultToolConnectionFormState);
  const [selectedInstallTemplateIds, setSelectedInstallTemplateIds] = useState<string[]>([]);
  const [selectedToolOption, setSelectedToolOption] = useState<SelectOption | null>(null);
  const [selectedSkillOption, setSelectedSkillOption] = useState<SelectOption | null>(null);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);

  const resolvedSelectedAgentId =
    selectedAgentId && workspaceAgents.some((agent) => agent.id === selectedAgentId)
      ? selectedAgentId
      : workspaceAgents[0]?.id ?? null;

  const selectedAgent = useMemo(
    () => workspaceAgents.find((agent) => agent.id === resolvedSelectedAgentId) ?? null,
    [resolvedSelectedAgentId, workspaceAgents],
  );

  const installedTemplateIds = useMemo(
    () => new Set(workspaceAgents.map((agent) => agent.source_template?.id).filter(Boolean)),
    [workspaceAgents],
  );

  const installableTemplates = useMemo(
    () => templates.filter((template) => !installedTemplateIds.has(template.id)),
    [installedTemplateIds, templates],
  );

  const availableToolOptions = useMemo<SelectOption[]>(() => {
    if (!selectedAgent) {
      return [];
    }
    const boundToolIds = new Set(selectedAgent.tool_bindings.map((binding) => binding.tool.id));
    return tools
      .filter((tool) => !boundToolIds.has(tool.id))
      .map((tool) => ({
        value: tool.id,
        label: tool.display_name || humanize(tool.key),
      }));
  }, [selectedAgent, tools]);

  const availableSkillOptions = useMemo<SelectOption[]>(() => {
    if (!selectedAgent) {
      return [];
    }
    const boundSkillIds = new Set(selectedAgent.skill_bindings.map((binding) => binding.skill.id));
    return skills
      .filter((skill) => !boundSkillIds.has(skill.id))
      .map((skill) => ({
        value: skill.id,
        label: skill.name || humanize(skill.key),
      }));
  }, [selectedAgent, skills]);

  const toolServerOptions = useMemo<SelectOption[]>(
    () =>
      toolServers
        .filter(
          (server) =>
            server.transport === "mcp" &&
            ((server.metadata?.catalogType as string | undefined) === "external_mcp" ||
              Array.isArray(server.metadata?.connectionGuide)),
        )
        .map((server) => ({
          value: server.id,
          label: `${server.name} (${server.server_id})`,
        })),
    [toolServers],
  );

  const refreshAll = async () => {
    await Promise.all([refetchTemplates(), refetchWorkspaceAgents(), refetchToolConnections()]);
  };

  const handleCreateAgent = async () => {
    try {
      const payload: CreateWorkspaceAgentPayload = {
        ...createForm,
      };
      const response = await createWorkspaceAgent(payload).unwrap();
      toast.success(`Created ${response.name}.`);
      setCreateSheetOpen(false);
      setCreateForm(defaultAgentFormState);
      setSelectedAgentId(response.id);
      await refreshAll();
    } catch (error) {
      toast.error(extractErrorMessage(error, ["slug", "name", "description", "detail"]));
    }
  };

  const handleUpdateAgent = async () => {
    if (!selectedAgent) {
      return;
    }
    try {
      const response = await updateWorkspaceAgent({
        id: selectedAgent.id,
        data: {
          ...editForm,
        },
      }).unwrap();
      toast.success(`Updated ${response.name}.`);
      setEditSheetOpen(false);
      await refreshAll();
    } catch (error) {
      toast.error(extractErrorMessage(error, ["slug", "name", "description", "detail"]));
    }
  };

  const handleDeleteAgent = async (agent: WorkspaceAgentRecord) => {
    const confirmed = await confirmAction({
      title: "Delete workspace agent?",
      description: `Delete ${agent.name}? This removes it from the workspace.`,
      confirmText: "Delete agent",
      destructive: true,
    });
    if (!confirmed) return;

    try {
      await deleteWorkspaceAgent(agent.id).unwrap();
      toast.success(`Deleted ${agent.name}.`);
      await refreshAll();
    } catch (error) {
      toast.error(extractErrorMessage(error, ["detail"]));
    }
  };

  const handleInstallSelectedTemplates = async () => {
    const templatesToInstall = installableTemplates.filter((template) =>
      selectedInstallTemplateIds.includes(template.id),
    );
    if (!templatesToInstall.length) {
      return;
    }
    try {
      let lastInstalledAgentId: string | null = null;
      for (const template of templatesToInstall) {
        const response = await installAgentTemplate({
          templateId: template.id,
          data: {
            is_enabled: true,
          },
        }).unwrap();
        lastInstalledAgentId = response.id;
      }
      toast.success(
        `Installed ${templatesToInstall.length} default agent${templatesToInstall.length === 1 ? "" : "s"} into the workspace.`,
      );
      setInstallSheetOpen(false);
      setSelectedInstallTemplateIds([]);
      if (lastInstalledAgentId) {
        setSelectedAgentId(lastInstalledAgentId);
      }
      await refreshAll();
    } catch (error) {
      toast.error(extractErrorMessage(error, ["slug", "name", "description", "detail"]));
    }
  };

  const handleToggleInstallTemplate = (templateId: string, checked: boolean) => {
    setSelectedInstallTemplateIds((current) => {
      if (checked) {
        return current.includes(templateId) ? current : [...current, templateId];
      }
      return current.filter((item) => item !== templateId);
    });
  };

  const handleToggleAllInstallTemplates = (checked: boolean) => {
    setSelectedInstallTemplateIds(checked ? installableTemplates.map((template) => template.id) : []);
  };

  const handleAttachTool = async () => {
    if (!selectedAgent || !selectedToolOption) {
      return;
    }
    try {
      await attachWorkspaceAgentTool({
        id: selectedAgent.id,
        tool_id: String(selectedToolOption.value),
      }).unwrap();
      toast.success("Tool attached.");
      setSelectedToolOption(null);
      await refreshAll();
    } catch (error) {
      toast.error(extractErrorMessage(error, ["tool_id", "detail"]));
    }
  };

  const handleDetachTool = async (toolId: string) => {
    if (!selectedAgent) {
      return;
    }
    try {
      await detachWorkspaceAgentTool({
        id: selectedAgent.id,
        tool_id: toolId,
      }).unwrap();
      toast.success("Tool detached.");
      await refreshAll();
    } catch (error) {
      toast.error(extractErrorMessage(error, ["tool_id", "detail"]));
    }
  };

  const handleAttachSkill = async () => {
    if (!selectedAgent || !selectedSkillOption) {
      return;
    }
    try {
      await attachWorkspaceAgentSkill({
        id: selectedAgent.id,
        skill_id: String(selectedSkillOption.value),
      }).unwrap();
      toast.success("Skill attached.");
      setSelectedSkillOption(null);
      await refreshAll();
    } catch (error) {
      toast.error(extractErrorMessage(error, ["skill_id", "detail"]));
    }
  };

  const handleDetachSkill = async (skillId: string) => {
    if (!selectedAgent) {
      return;
    }
    try {
      await detachWorkspaceAgentSkill({
        id: selectedAgent.id,
        skill_id: skillId,
      }).unwrap();
      toast.success("Skill detached.");
      await refreshAll();
    } catch (error) {
      toast.error(extractErrorMessage(error, ["skill_id", "detail"]));
    }
  };

  const handleSaveToolConnection = async () => {
    try {
      let credentialPayload: Record<string, unknown> | null = null;
      if (connectionForm.credential_payload_text.trim()) {
        credentialPayload = JSON.parse(connectionForm.credential_payload_text) as Record<string, unknown>;
      }
      const payload: SaveWorkspaceToolConnectionPayload = {
        tool_server: connectionForm.tool_server,
        name: connectionForm.name.trim(),
        slug: connectionForm.slug.trim(),
        connection_scope: "workspace",
        auth_type: connectionForm.auth_type,
        server_url_override: connectionForm.server_url_override.trim(),
        credential_payload: credentialPayload,
        access_token: connectionForm.access_token,
        refresh_token: connectionForm.refresh_token,
        resource_owner_id: connectionForm.resource_owner_id.trim(),
        resource_label: connectionForm.resource_label.trim(),
        granted_scopes: connectionForm.granted_scopes_text
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        status: connectionForm.status,
        metadata: {},
      };

      if (editingConnectionId) {
        await updateWorkspaceToolConnection({
          id: editingConnectionId,
          data: payload,
        }).unwrap();
        toast.success("Connection updated.");
      } else {
        await createWorkspaceToolConnection(payload).unwrap();
        toast.success("Connection created.");
      }
      setConnectionSheetOpen(false);
      setEditingConnectionId(null);
      setConnectionForm(defaultToolConnectionFormState);
      await refreshAll();
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error("Credential payload must be valid JSON.");
        return;
      }
      toast.error(extractErrorMessage(error, ["tool_server", "name", "slug", "detail"]));
    }
  };

  const handleDeleteToolConnection = async (connection: WorkspaceToolConnectionRecord) => {
    const confirmed = await confirmAction({
      title: "Delete tool connection?",
      description: `Delete ${connection.name}? Agents using this connection may lose access to external tools.`,
      confirmText: "Delete connection",
      destructive: true,
    });
    if (!confirmed) return;

    try {
      await deleteWorkspaceToolConnection(connection.id).unwrap();
      toast.success(`Deleted ${connection.name}.`);
      await refreshAll();
    } catch (error) {
      toast.error(extractErrorMessage(error, ["detail"]));
    }
  };

  const handleTestToolConnection = async (connection: WorkspaceToolConnectionRecord) => {
    try {
      const result = await testWorkspaceToolConnection(connection.id).unwrap();
      toast.success(
        `Connection OK. ${result.tool_count ?? 0} tool${result.tool_count === 1 ? "" : "s"} discovered.`,
      );
      await refreshAll();
    } catch (error) {
      toast.error(extractErrorMessage(error, ["detail"]));
      await refreshAll();
    }
  };

  const openEditSheet = (agent: WorkspaceAgentRecord) => {
    setEditForm(getAgentFormState(agent));
    setEditSheetOpen(true);
  };

  const openCreateConnectionSheet = () => {
    setEditingConnectionId(null);
    setConnectionForm(defaultToolConnectionFormState);
    setConnectionSheetOpen(true);
  };

  const openEditConnectionSheet = (connection: WorkspaceToolConnectionRecord) => {
    setEditingConnectionId(connection.id);
    setConnectionForm(getToolConnectionFormState(connection));
    setConnectionSheetOpen(true);
  };

  if (!canManageAgentSettings) {
    return (
      <Card className="border-amber-200 bg-amber-50 shadow-sm">
        <CardContent className="flex items-start gap-4 p-6">
          <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">Setup Access Required</p>
            <h3 className="text-2xl font-semibold text-amber-950">Only the workspace owner or someone with agent setup permission can manage this area.</h3>
            <p className="max-w-3xl text-sm leading-6 text-amber-900/80">
              Agent creation, installation, and binding changes are restricted to the workspace owner or a user assigned the <span className="font-semibold">manage_agent_settings</span> permission.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-blue-100 bg-blue-50/70 shadow-sm">
          <CardContent className="flex items-start gap-4 p-5">
            <div className="rounded-2xl bg-white p-3 text-blue-700 shadow-sm">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">Installed Agents</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {loadingWorkspaceAgents ? "..." : workspaceAgents.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Custom and default agents already attached to this workspace.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-100 bg-violet-50/70 shadow-sm">
          <CardContent className="flex items-start gap-4 p-5">
            <div className="rounded-2xl bg-white p-3 text-violet-700 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-700">Installable Defaults</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {loadingTemplates ? "..." : installableTemplates.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Templates you can still install into this workspace from the platform catalog.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-100 bg-amber-50/70 shadow-sm">
          <CardContent className="flex items-start gap-4 p-5">
            <div className="rounded-2xl bg-white p-3 text-amber-700 shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Access Mode</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {ownerOverride ? "Workspace owner override" : "Permission-based setup access"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Setup access is currently granted through {ownerOverride ? "owner identity" : "manage_agent_settings"}.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-100 bg-emerald-50/70 shadow-sm">
          <CardContent className="flex items-start gap-4 p-5">
            <div className="rounded-2xl bg-white p-3 text-emerald-700 shadow-sm">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">External MCP Connections</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {loadingToolConnections ? "..." : toolConnections.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Workspace-level credentials that external integrations can use when they need access to this workspace.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.78fr)_minmax(0,1fr)]">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                  <BrainCircuit className="h-3.5 w-3.5" />
                  Workspace Agents
                </div>
                <CardTitle className="mt-4 text-3xl font-semibold tracking-tight">Installed agents</CardTitle>
                <CardDescription className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Keep this list compact. Select an agent to inspect or edit it in the detail panel.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => void refreshAll()}>
                  Refresh
                </Button>
                <Button type="button" variant="outline" onClick={() => setInstallSheetOpen(true)}>
                  <Sparkles className="h-4 w-4" />
                  Install default agents
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setCreateForm(defaultAgentFormState);
                    setCreateSheetOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Create custom agent
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {workspaceAgents.length ? (
              <div className="max-h-[38rem] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {workspaceAgents.map((agent) => {
                  const isSelected = agent.id === resolvedSelectedAgentId;
                  return (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => setSelectedAgentId(agent.id)}
                      className={`w-full rounded-[22px] border p-4 text-left transition ${
                        isSelected
                          ? "border-blue-300 bg-blue-50 shadow-[0_18px_44px_-28px_rgba(37,99,235,0.45)]"
                          : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-base font-semibold text-slate-900">{agent.name}</p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                                agent.is_enabled ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {agent.is_enabled ? "on" : "off"}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-xs uppercase tracking-[0.18em] text-slate-500">{agent.slug}</p>
                          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                            <span className="rounded-full bg-white px-2.5 py-1 text-slate-600">{humanize(agent.origin)}</span>
                            <span className="rounded-full bg-white px-2.5 py-1 text-slate-600">{agent.tool_bindings.length} tools</span>
                            <span className="rounded-full bg-white px-2.5 py-1 text-slate-600">{agent.skill_bindings.length} skills</span>
                          </div>
                        </div>
                        <div className="rounded-2xl bg-white p-2.5 text-slate-600 shadow-sm">
                          <Bot className="h-4 w-4" />
                        </div>
                      </div>
                    </button>
                  );
                })}
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-slate-500">
                No workspace agents installed yet. Use <span className="font-semibold">Install default agents</span> or create a custom one.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm xl:sticky xl:top-6">
          <CardHeader className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-700">
                  <Wrench className="h-3.5 w-3.5" />
                  Agent Detail
                </div>
                <CardTitle className="mt-4 text-3xl font-semibold tracking-tight">Selected agent</CardTitle>
                <CardDescription className="mt-2 text-sm leading-6 text-slate-600">
                  Keep the main view short. Use side panels to edit or bind tools and skills.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {selectedAgent ? (
              <div className="space-y-5">
                <div className="rounded-[28px] border border-slate-900 bg-slate-950 p-5 text-white shadow-[0_22px_60px_rgba(2,6,23,0.35)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-2xl font-semibold">{selectedAgent.name}</p>
                        {selectedAgent.source_template ? (
                          <span className="rounded-full border border-slate-700 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                            from {selectedAgent.source_template.name}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{selectedAgent.description || "No description yet."}</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3 text-slate-200">
                      <BrainCircuit className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                      Visibility: {selectedAgent.visibility}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                      Routing: {humanize(selectedAgent.routing_policy)}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                      Transport: {selectedAgent.preferred_transport}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                      Updated: {formatDate(selectedAgent.updated_at, { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button type="button" variant="secondary" onClick={() => openEditSheet(selectedAgent)}>
                      <Settings2 className="h-4 w-4" />
                      Edit agent
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setBindingsSheetOpen(true)}>
                      <Wrench className="h-4 w-4" />
                      Configure bindings
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => void handleDeleteAgent(selectedAgent)}
                      disabled={deletingAgent}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="border-gray-200 bg-gray-50">
                    <CardHeader className="p-5">
                      <CardTitle className="text-xl">Tool coverage</CardTitle>
                      <CardDescription>How many backend tools this agent can invoke.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 pt-0">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-white p-3 text-emerald-700 shadow-sm">
                          <Wrench className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-3xl font-semibold text-slate-900">{selectedAgent.tool_bindings.length}</p>
                          <p className="text-sm text-slate-600">Attached tools</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-gray-200 bg-gray-50">
                    <CardHeader className="p-5">
                      <CardTitle className="text-xl">Skill coverage</CardTitle>
                      <CardDescription>Reusable skill profiles currently bound to this agent.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 pt-0">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-white p-3 text-violet-700 shadow-sm">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-3xl font-semibold text-slate-900">{selectedAgent.skill_bindings.length}</p>
                          <p className="text-sm text-slate-600">Attached skills</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-slate-500">
                Select an installed agent to review and configure it.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                <Globe2 className="h-3.5 w-3.5" />
                External Tools
              </div>
              <CardTitle className="mt-4 text-3xl font-semibold tracking-tight">MCP connections</CardTitle>
              <CardDescription className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Configure workspace-level credentials for external integrations like Shopify or Notion. These records are stored securely and used only when the workspace needs them.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => void refetchToolConnections()}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button type="button" onClick={openCreateConnectionSheet}>
                <Plus className="h-4 w-4" />
                Add connection
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-6 pt-0">
          {toolConnections.length ? (
            toolConnections.map((connection) => (
              <div
                key={connection.id}
                className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm transition hover:border-emerald-200"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-slate-900">{connection.name}</p>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                        {connection.tool_server?.name ?? "Unknown server"}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                          connection.status === "connected"
                            ? "bg-emerald-100 text-emerald-700"
                            : connection.status === "error"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {formatMachineLabel(connection.status)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{connection.slug}</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{formatMachineLabel(connection.auth_type, "Unspecified auth")}</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                        {connection.has_credential_payload ? "connection data present" : "no connection data"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                        {connection.has_access_token ? "access token present" : "no access token"}
                      </span>
                    </div>
                    {connection.resource_label ? (
                      <p className="mt-3 text-sm text-slate-600">Resource: {connection.resource_label}</p>
                    ) : null}
                    {connection.last_error ? (
                      <p className="mt-3 text-sm text-red-600">Last error: {connection.last_error}</p>
                    ) : null}
                    {connection.last_tested_at ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Last tested {formatDate(connection.last_tested_at, { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleTestToolConnection(connection)}
                      disabled={testingToolConnection}
                    >
                      Test
                    </Button>
                    <Button type="button" variant="outline" onClick={() => openEditConnectionSheet(connection)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => void handleDeleteToolConnection(connection)}
                      disabled={deletingToolConnection}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-slate-500">
              No external MCP connections configured yet.
            </div>
          )}
        </CardContent>
      </Card>

      <InstallTemplatesSheet
        open={installSheetOpen}
        onOpenChange={(open) => {
          setInstallSheetOpen(open);
          if (!open) {
            setSelectedInstallTemplateIds([]);
          }
        }}
        templates={installableTemplates}
        selectedTemplateIds={selectedInstallTemplateIds}
        onToggleTemplate={handleToggleInstallTemplate}
        onToggleAll={handleToggleAllInstallTemplates}
        isLoadingTemplates={loadingTemplates}
        isInstalling={installingTemplate}
        onInstallSelected={handleInstallSelectedTemplates}
      />

      <AgentEditorSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        title="Create custom workspace agent"
        description="Create a workspace agent record that can be used in chat and automation."
        value={createForm}
        onChange={setCreateForm}
        onSubmit={handleCreateAgent}
        isBusy={creatingAgent}
      />

      <AgentEditorSheet
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        title={selectedAgent ? `Edit ${selectedAgent.name}` : "Edit workspace agent"}
        description="Update the agent profile, instructions, and visibility without cluttering the main settings surface."
        value={editForm}
        onChange={setEditForm}
        onSubmit={handleUpdateAgent}
        isBusy={updatingAgent}
      />

      <AgentBindingsSheet
        open={bindingsSheetOpen}
        onOpenChange={setBindingsSheetOpen}
        agent={selectedAgent}
        availableToolOptions={availableToolOptions}
        availableSkillOptions={availableSkillOptions}
        selectedToolOption={selectedToolOption}
        setSelectedToolOption={setSelectedToolOption}
        selectedSkillOption={selectedSkillOption}
        setSelectedSkillOption={setSelectedSkillOption}
        loadingTools={loadingTools}
        loadingSkills={loadingSkills}
        attachingTool={attachingTool}
        attachingSkill={attachingSkill}
        detachingTool={detachingTool}
        detachingSkill={detachingSkill}
        onAttachTool={handleAttachTool}
        onAttachSkill={handleAttachSkill}
        onDetachTool={handleDetachTool}
        onDetachSkill={handleDetachSkill}
      />

      <ToolConnectionSheet
        open={connectionSheetOpen}
        onOpenChange={(open) => {
          setConnectionSheetOpen(open);
          if (!open) {
            setEditingConnectionId(null);
            setConnectionForm(defaultToolConnectionFormState);
          }
        }}
        title={editingConnectionId ? "Edit MCP connection" : "Create MCP connection"}
        description="Save workspace-level credentials for external integrations. This first pass is designed for API keys and workspace tokens."
        value={connectionForm}
        onChange={setConnectionForm}
        toolServers={toolServers}
        toolServerOptions={toolServerOptions}
        onSubmit={handleSaveToolConnection}
        isBusy={creatingToolConnection || updatingToolConnection}
        isEditing={Boolean(editingConnectionId)}
      />
    </>
  );
}

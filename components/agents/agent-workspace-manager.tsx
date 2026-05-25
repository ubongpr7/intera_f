"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  BrainCircuit,
  Check,
  Plus,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wrench,
} from "lucide-react";
import { toast } from "react-toastify";

import { extractErrorMessage } from "@/lib/utils";
import { hasTokenPermission, isWorkspaceOwner } from "@/lib/agentPermissions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ReactSelectField, type SelectOption } from "@/components/ui/react-select-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAttachWorkspaceAgentSkillMutation,
  useAttachWorkspaceAgentToolMutation,
  useCreateWorkspaceAgentMutation,
  useDeleteWorkspaceAgentMutation,
  useDetachWorkspaceAgentSkillMutation,
  useDetachWorkspaceAgentToolMutation,
  useGetRuntimeAgentRegistryQuery,
  useInstallAgentTemplateMutation,
  useListAgentSkillsQuery,
  useListAgentTemplatesQuery,
  useListAgentToolsQuery,
  useListWorkspaceAgentsQuery,
  useUpdateWorkspaceAgentMutation,
} from "@/redux/features/agents/agentControlApiSlice";
import type {
  AgentTemplateRecord,
  CreateWorkspaceAgentPayload,
  WorkspaceAgentRecord,
} from "@/redux/features/agents/agentControlTypes";

type AgentWorkspaceManagerProps = {
  activeAgentName?: string;
  onUseAgent?: (slug: string) => void;
};

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

const visibilityOptions = [
  { value: "workspace", label: "Workspace" },
  { value: "private", label: "Private" },
] as const;

const routingOptions = [
  { value: "direct", label: "Direct" },
  { value: "orchestrated", label: "Orchestrated" },
  { value: "specialist_only", label: "Specialist Only" },
] as const;

const humanize = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());

const AgentEditorDialog = ({
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
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border-slate-800 bg-slate-950 text-slate-50">
      <DialogHeader>
        <DialogTitle className="text-white">{title}</DialogTitle>
        <DialogDescription className="text-slate-300">{description}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-200">Slug</span>
          <Input
            value={value.slug}
            onChange={(event) => onChange({ ...value, slug: event.target.value })}
            placeholder="inventory-helper-acme"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-200">Name</span>
          <Input
            value={value.name}
            onChange={(event) => onChange({ ...value, name: event.target.value })}
            placeholder="Inventory Helper Acme"
          />
        </label>
        <label className="grid gap-2 text-sm md:col-span-2">
          <span className="font-medium text-slate-200">Description</span>
          <Textarea
            value={value.description}
            onChange={(event) => onChange({ ...value, description: event.target.value })}
            placeholder="Describe what this agent should handle for the workspace."
            rows={3}
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-200">Visibility</span>
          <select
            value={value.visibility}
            onChange={(event) =>
              onChange({ ...value, visibility: event.target.value as AgentFormState["visibility"] })
            }
            className="h-11 rounded-2xl border border-slate-700 bg-slate-900 px-4 text-sm text-slate-100 outline-none transition focus:border-blue-400"
          >
            {visibilityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-200">Routing policy</span>
          <select
            value={value.routing_policy}
            onChange={(event) =>
              onChange({ ...value, routing_policy: event.target.value as AgentFormState["routing_policy"] })
            }
            className="h-11 rounded-2xl border border-slate-700 bg-slate-900 px-4 text-sm text-slate-100 outline-none transition focus:border-blue-400"
          >
            {routingOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-200">Preferred transport</span>
          <Input
            value={value.preferred_transport}
            onChange={(event) => onChange({ ...value, preferred_transport: event.target.value })}
            placeholder="kafka"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-200">Protocol version</span>
          <Input
            value={value.protocol_version}
            onChange={(event) => onChange({ ...value, protocol_version: event.target.value })}
            placeholder="0.3.0"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-200">Version</span>
          <Input
            value={value.version}
            onChange={(event) => onChange({ ...value, version: event.target.value })}
            placeholder="0.1.0"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-200">Documentation URL</span>
          <Input
            value={value.documentation_url}
            onChange={(event) => onChange({ ...value, documentation_url: event.target.value })}
            placeholder="https://docs.example.com/agent"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-200">Icon URL</span>
          <Input
            value={value.icon_url}
            onChange={(event) => onChange({ ...value, icon_url: event.target.value })}
            placeholder="https://cdn.example.com/icon.svg"
          />
        </label>
        <label className="grid gap-2 text-sm md:col-span-2">
          <span className="font-medium text-slate-200">System instruction</span>
          <Textarea
            value={value.system_instruction}
            onChange={(event) => onChange({ ...value, system_instruction: event.target.value })}
            rows={4}
            placeholder="Core operating instruction for the agent."
          />
        </label>
        <label className="grid gap-2 text-sm md:col-span-2">
          <span className="font-medium text-slate-200">Developer instruction</span>
          <Textarea
            value={value.developer_instruction}
            onChange={(event) => onChange({ ...value, developer_instruction: event.target.value })}
            rows={3}
            placeholder="Additional engineering guidance for the runtime."
          />
        </label>
        <label className="grid gap-2 text-sm md:col-span-2">
          <span className="font-medium text-slate-200">Assistant instruction</span>
          <Textarea
            value={value.assistant_instruction}
            onChange={(event) => onChange({ ...value, assistant_instruction: event.target.value })}
            rows={3}
            placeholder="Response style and interaction guidance."
          />
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm md:col-span-2">
          <Checkbox
            checked={value.is_enabled}
            onCheckedChange={(checked) => onChange({ ...value, is_enabled: Boolean(checked) })}
          />
          <div>
            <p className="font-medium text-slate-200">Enable this agent</p>
            <p className="text-xs text-slate-400">Disabled agents stay in the control plane but do not appear in runtime registry.</p>
          </div>
        </label>
      </div>
      <DialogFooter className="mt-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="button" onClick={() => void onSubmit()} disabled={isBusy}>
          {isBusy ? "Saving..." : "Save agent"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

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

export default function AgentWorkspaceManager({
  activeAgentName,
  onUseAgent,
}: AgentWorkspaceManagerProps) {
  const ownerOverride = useMemo(() => isWorkspaceOwner(), []);
  const canReadAgent = useMemo(() => hasTokenPermission("read_agent"), []);
  const canCreateAgent = useMemo(() => hasTokenPermission("create_agent"), []);
  const canUpdateAgent = useMemo(() => hasTokenPermission("update_agent"), []);
  const canDeleteAgent = useMemo(() => hasTokenPermission("delete_agent"), []);
  const canManageAgent = useMemo(() => hasTokenPermission("manage_agent_settings"), []);
  const canInteract = useMemo(() => hasTokenPermission("interact_with_agent"), []);

  const {
    data: templates = [],
    isFetching: loadingTemplates,
    refetch: refetchTemplates,
  } = useListAgentTemplatesQuery(undefined, {
    skip: !canReadAgent,
  });
  const {
    data: workspaceAgents = [],
    isFetching: loadingWorkspaceAgents,
    refetch: refetchWorkspaceAgents,
  } = useListWorkspaceAgentsQuery(undefined, {
    skip: !canReadAgent,
  });
  const { data: runtimeRegistry, isFetching: loadingRuntimeRegistry, refetch: refetchRuntimeRegistry } =
    useGetRuntimeAgentRegistryQuery(undefined, {
      skip: !canInteract,
    });
  const { data: tools = [], isFetching: loadingTools } = useListAgentToolsQuery(undefined, {
    skip: !canReadAgent,
  });
  const { data: skills = [], isFetching: loadingSkills } = useListAgentSkillsQuery(undefined, {
    skip: !canReadAgent,
  });

  const [createWorkspaceAgent, { isLoading: creatingAgent }] = useCreateWorkspaceAgentMutation();
  const [updateWorkspaceAgent, { isLoading: updatingAgent }] = useUpdateWorkspaceAgentMutation();
  const [deleteWorkspaceAgent, { isLoading: deletingAgent }] = useDeleteWorkspaceAgentMutation();
  const [installAgentTemplate, { isLoading: installingTemplate }] = useInstallAgentTemplateMutation();
  const [attachWorkspaceAgentTool, { isLoading: attachingTool }] = useAttachWorkspaceAgentToolMutation();
  const [detachWorkspaceAgentTool, { isLoading: detachingTool }] = useDetachWorkspaceAgentToolMutation();
  const [attachWorkspaceAgentSkill, { isLoading: attachingSkill }] = useAttachWorkspaceAgentSkillMutation();
  const [detachWorkspaceAgentSkill, { isLoading: detachingSkill }] = useDetachWorkspaceAgentSkillMutation();

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<AgentFormState>(defaultAgentFormState);
  const [editForm, setEditForm] = useState<AgentFormState>(defaultAgentFormState);
  const [installForm, setInstallForm] = useState<AgentFormState>(defaultAgentFormState);
  const [installingTemplateRecord, setInstallingTemplateRecord] = useState<AgentTemplateRecord | null>(null);
  const [selectedToolOption, setSelectedToolOption] = useState<SelectOption | null>(null);
  const [selectedSkillOption, setSelectedSkillOption] = useState<SelectOption | null>(null);
  const runtimeAgents = useMemo(() => runtimeRegistry?.agents ?? [], [runtimeRegistry?.agents]);
  const runtimeAgentMap = useMemo(
    () => new Map(runtimeAgents.map((agent) => [agent.slug, agent])),
    [runtimeAgents],
  );
  const resolvedSelectedAgentId =
    selectedAgentId && workspaceAgents.some((agent) => agent.id === selectedAgentId)
      ? selectedAgentId
      : workspaceAgents[0]?.id ?? null;
  const selectedAgent = useMemo(
    () => workspaceAgents.find((agent) => agent.id === resolvedSelectedAgentId) ?? null,
    [resolvedSelectedAgentId, workspaceAgents],
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

  const refreshAll = async () => {
    if (canReadAgent) {
      await Promise.all([refetchTemplates(), refetchWorkspaceAgents()]);
    }
    if (canInteract) {
      await refetchRuntimeRegistry();
    }
  };

  const handleCreateAgent = async () => {
    try {
      const payload: CreateWorkspaceAgentPayload = {
        ...createForm,
      };
      const response = await createWorkspaceAgent(payload).unwrap();
      toast.success(`Created ${response.name}.`);
      setCreateDialogOpen(false);
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
      setEditDialogOpen(false);
      await refreshAll();
    } catch (error) {
      toast.error(extractErrorMessage(error, ["slug", "name", "description", "detail"]));
    }
  };

  const handleDeleteAgent = async (agent: WorkspaceAgentRecord) => {
    if (!window.confirm(`Delete ${agent.name}? This removes it from the workspace control plane.`)) {
      return;
    }
    try {
      await deleteWorkspaceAgent(agent.id).unwrap();
      toast.success(`Deleted ${agent.name}.`);
      await refreshAll();
    } catch (error) {
      toast.error(extractErrorMessage(error, ["detail"]));
    }
  };

  const handleInstallTemplate = async () => {
    if (!installingTemplateRecord) {
      return;
    }
    try {
      const response = await installAgentTemplate({
        templateId: installingTemplateRecord.id,
        data: {
          slug: installForm.slug || undefined,
          name: installForm.name || undefined,
          description: installForm.description || undefined,
          visibility: installForm.visibility,
          routing_policy: installForm.routing_policy,
          system_instruction: installForm.system_instruction || undefined,
          developer_instruction: installForm.developer_instruction || undefined,
          assistant_instruction: installForm.assistant_instruction || undefined,
          is_enabled: installForm.is_enabled,
        },
      }).unwrap();
      toast.success(`Installed ${response.name} into the workspace.`);
      setInstallDialogOpen(false);
      setInstallingTemplateRecord(null);
      setInstallForm(defaultAgentFormState);
      setSelectedAgentId(response.id);
      await refreshAll();
    } catch (error) {
      toast.error(extractErrorMessage(error, ["slug", "name", "description", "detail"]));
    }
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

  const openInstallDialog = (template: AgentTemplateRecord) => {
    setInstallingTemplateRecord(template);
    setInstallForm({
      ...defaultAgentFormState,
      slug: template.slug,
      name: template.name,
      description: template.description ?? "",
      system_instruction: template.system_instruction ?? "",
      developer_instruction: template.developer_instruction ?? "",
      assistant_instruction: template.assistant_instruction ?? "",
      preferred_transport: template.preferred_transport ?? "kafka",
      protocol_version: template.protocol_version ?? "0.3.0",
      version: template.version ?? "0.1.0",
    });
    setInstallDialogOpen(true);
  };

  const openEditDialog = (agent: WorkspaceAgentRecord) => {
    setEditForm(getAgentFormState(agent));
    setEditDialogOpen(true);
  };

  if (!canReadAgent && !canInteract) {
    return (
      <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">Agent Access Required</p>
            <h2 className="text-xl font-semibold text-amber-950">This workspace does not expose agent setup or chat access for your account.</h2>
            <p className="max-w-3xl text-sm leading-6 text-amber-900/80">
              Ask a workspace administrator to assign at least <span className="font-semibold">read_agent</span> for setup access or{" "}
              <span className="font-semibold">interact_with_agent</span> for runtime chat access.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="rounded-[32px] border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Workspace Agent Control</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">Install default agents, create custom specialists, and control runtime visibility.</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              This is the control plane for the future chat-first agent workspace. The runtime registry shown here is the agent set that will back the workspace chat surface once the Kafka runtime finishes switching from file-based loading to DB-backed loading.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ownerOverride ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                workspace owner override
              </span>
            ) : null}
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${canReadAgent ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
              {canReadAgent ? "read_agent" : "no read_agent"}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${canInteract ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
              {canInteract ? "interact_with_agent" : "no interact_with_agent"}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${canManageAgent ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-500"}`}>
              {canManageAgent ? "manage_agent_settings" : "no manage_agent_settings"}
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)]">
          <div className="space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Workspace Agents</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">
                    {loadingWorkspaceAgents ? "Loading..." : `${workspaceAgents.length} installed`}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => void refreshAll()}>
                    Refresh
                  </Button>
                  {canCreateAgent ? (
                    <Button
                      type="button"
                      onClick={() => {
                        setCreateForm(defaultAgentFormState);
                        setCreateDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Create custom agent
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {workspaceAgents.length ? (
                workspaceAgents.map((agent) => {
                  const isSelected = agent.id === selectedAgentId;
                  const runtimeVisible = runtimeAgentMap.has(agent.slug);
                  return (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => setSelectedAgentId(agent.id)}
                      className={`rounded-[28px] border p-4 text-left transition ${
                        isSelected
                          ? "border-blue-300 bg-blue-50 shadow-[0_18px_44px_-28px_rgba(37,99,235,0.45)]"
                          : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-semibold text-slate-900">{agent.name}</span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                              {agent.origin}
                            </span>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${runtimeVisible ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                              {runtimeVisible ? "runtime" : "not in runtime"}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{agent.description || "No description yet."}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-100 p-2 text-slate-600">
                          <Bot className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white px-2.5 py-1 text-slate-600">{agent.visibility}</span>
                        <span className="rounded-full bg-white px-2.5 py-1 text-slate-600">{humanize(agent.routing_policy)}</span>
                        <span className="rounded-full bg-white px-2.5 py-1 text-slate-600">{agent.tool_bindings.length} tools</span>
                        <span className="rounded-full bg-white px-2.5 py-1 text-slate-600">{agent.skill_bindings.length} skills</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-[28px] border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500 lg:col-span-2">
                  No workspace agents installed yet. Install a default template or create a custom agent.
                </div>
              )}
            </div>

            {selectedAgent ? (
              <div className="rounded-[30px] border border-slate-900 bg-slate-950 p-5 text-slate-50 shadow-[0_20px_55px_rgba(2,6,23,0.35)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xl font-semibold">{selectedAgent.name}</p>
                      <span className="rounded-full border border-slate-700 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                        {selectedAgent.slug}
                      </span>
                    </div>
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
                      {selectedAgent.description || "No description yet."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canInteract && onUseAgent ? (
                      <Button type="button" variant="secondary" onClick={() => onUseAgent(selectedAgent.slug)}>
                        <Sparkles className="h-4 w-4" />
                        {activeAgentName === selectedAgent.slug ? "Active in chat" : "Use in chat"}
                      </Button>
                    ) : null}
                    {canUpdateAgent ? (
                      <Button type="button" variant="outline" onClick={() => openEditDialog(selectedAgent)}>
                        <Settings2 className="h-4 w-4" />
                        Edit
                      </Button>
                    ) : null}
                    {canDeleteAgent ? (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => void handleDeleteAgent(selectedAgent)}
                        disabled={deletingAgent}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="rounded-[26px] border border-slate-800 bg-slate-900/80 p-4">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="h-4 w-4 text-blue-300" />
                      <p className="text-sm font-semibold text-white">Runtime profile</p>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2">Visibility: {selectedAgent.visibility}</div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2">Routing: {humanize(selectedAgent.routing_policy)}</div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2">Transport: {selectedAgent.preferred_transport}</div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2">Version: {selectedAgent.version}</div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2">Tools: {selectedAgent.tool_bindings.length}</div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2">Skills: {selectedAgent.skill_bindings.length}</div>
                    </div>
                    <details className="mt-4 rounded-[22px] border border-slate-800 bg-slate-950/80 p-4">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-200">Agent card payload preview</summary>
                      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-400">
                        {JSON.stringify(selectedAgent.card_payload, null, 2)}
                      </pre>
                    </details>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[26px] border border-slate-800 bg-slate-900/80 p-4">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-emerald-300" />
                        <p className="text-sm font-semibold text-white">Tool bindings</p>
                      </div>
                      {canManageAgent ? (
                        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                          <div className="min-w-0 flex-1">
                            <ReactSelectField
                              value={selectedToolOption}
                              onChange={(option) => setSelectedToolOption((option as SelectOption | null) ?? null)}
                              options={availableToolOptions}
                              placeholder={loadingTools ? "Loading tools..." : "Attach a tool"}
                              helperText={availableToolOptions.length ? "Search and attach another tool." : "All visible tools are already attached."}
                              isDisabled={!availableToolOptions.length || loadingTools}
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={() => void handleAttachTool()}
                            disabled={!selectedToolOption || attachingTool}
                          >
                            {attachingTool ? "Attaching..." : "Attach tool"}
                          </Button>
                        </div>
                      ) : null}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {selectedAgent.tool_bindings.length ? (
                          selectedAgent.tool_bindings.map((binding) => (
                            <div
                              key={binding.id}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200"
                            >
                              <span>{binding.tool.display_name}</span>
                              {canManageAgent ? (
                                <button
                                  type="button"
                                  onClick={() => void handleDetachTool(binding.tool.id)}
                                  className="rounded-full p-1 text-slate-400 transition hover:bg-slate-800 hover:text-red-300"
                                  disabled={detachingTool}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              ) : null}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-400">No tools attached yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[26px] border border-slate-800 bg-slate-900/80 p-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-violet-300" />
                        <p className="text-sm font-semibold text-white">Skill bindings</p>
                      </div>
                      {canManageAgent ? (
                        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                          <div className="min-w-0 flex-1">
                            <ReactSelectField
                              value={selectedSkillOption}
                              onChange={(option) => setSelectedSkillOption((option as SelectOption | null) ?? null)}
                              options={availableSkillOptions}
                              placeholder={loadingSkills ? "Loading skills..." : "Attach a skill"}
                              helperText={availableSkillOptions.length ? "Search and attach another skill." : "All visible skills are already attached."}
                              isDisabled={!availableSkillOptions.length || loadingSkills}
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={() => void handleAttachSkill()}
                            disabled={!selectedSkillOption || attachingSkill}
                          >
                            {attachingSkill ? "Attaching..." : "Attach skill"}
                          </Button>
                        </div>
                      ) : null}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {selectedAgent.skill_bindings.length ? (
                          selectedAgent.skill_bindings.map((binding) => (
                            <div
                              key={binding.id}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200"
                            >
                              <span>{binding.skill.name}</span>
                              {canManageAgent ? (
                                <button
                                  type="button"
                                  onClick={() => void handleDetachSkill(binding.skill.id)}
                                  className="rounded-full p-1 text-slate-400 transition hover:bg-slate-800 hover:text-red-300"
                                  disabled={detachingSkill}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              ) : null}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-400">No skills attached yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Runtime Registry</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">
                    {canInteract ? (loadingRuntimeRegistry ? "Loading..." : `${runtimeAgents.length} visible`) : "Permission required"}
                  </h3>
                </div>
                <div className="rounded-2xl bg-white p-3 text-slate-700 shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {canInteract ? (
                  runtimeAgents.length ? (
                    runtimeAgents.map((agent) => (
                      <div key={agent.id} className="rounded-[22px] border border-white bg-white px-4 py-3 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{agent.name}</p>
                            <p className="mt-1 truncate text-xs text-slate-500">{agent.slug}</p>
                          </div>
                          {onUseAgent ? (
                            <Button type="button" variant="outline" size="sm" onClick={() => onUseAgent(agent.slug)}>
                              {activeAgentName === agent.slug ? <Check className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                              {activeAgentName === agent.slug ? "Active" : "Use"}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-[22px] border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">
                      No enabled workspace-visible agents are currently exposed to runtime.
                    </p>
                  )
                ) : (
                  <p className="rounded-[22px] border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">
                    Runtime registry requires <span className="font-semibold">interact_with_agent</span>.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-900 bg-slate-950 p-4 text-slate-50 shadow-[0_20px_55px_rgba(2,6,23,0.35)]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-300" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Default Templates</p>
                  <h3 className="mt-1 text-lg font-semibold text-white">
                    {loadingTemplates ? "Loading..." : `${templates.length} available`}
                  </h3>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {templates.length ? (
                  templates.map((template) => (
                    <div key={template.id} className="rounded-[24px] border border-slate-800 bg-slate-900/80 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-white">{template.name}</p>
                            {template.is_featured ? (
                              <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200">
                                featured
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-300">{template.description || "No description yet."}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-950 p-2 text-slate-300">
                          <Bot className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-700 px-2.5 py-1 text-slate-300">{template.tool_bindings.length} tools</span>
                        <span className="rounded-full border border-slate-700 px-2.5 py-1 text-slate-300">{template.skill_bindings.length} skills</span>
                        <span className="rounded-full border border-slate-700 px-2.5 py-1 text-slate-300">{template.preferred_transport}</span>
                      </div>
                      {canCreateAgent ? (
                        <div className="mt-4">
                          <Button type="button" onClick={() => openInstallDialog(template)} disabled={installingTemplate}>
                            Install to workspace
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="rounded-[24px] border border-dashed border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-400">
                    No templates available yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <AgentEditorDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        title="Create custom workspace agent"
        description="This creates a workspace-scoped agent record that will later be loaded by the DB-backed A2A runtime."
        value={createForm}
        onChange={setCreateForm}
        onSubmit={handleCreateAgent}
        isBusy={creatingAgent}
      />

      <AgentEditorDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title="Edit workspace agent"
        description="Update the control-plane definition without touching the runtime container layout."
        value={editForm}
        onChange={setEditForm}
        onSubmit={handleUpdateAgent}
        isBusy={updatingAgent}
      />

      <AgentEditorDialog
        open={installDialogOpen}
        onOpenChange={setInstallDialogOpen}
        title={`Install ${installingTemplateRecord?.name || "template"} to workspace`}
        description="You can override the defaults before this template becomes a workspace agent."
        value={installForm}
        onChange={setInstallForm}
        onSubmit={handleInstallTemplate}
        isBusy={installingTemplate}
      />
    </>
  );
}

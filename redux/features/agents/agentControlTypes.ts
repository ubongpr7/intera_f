export type AgentVisibility = "workspace" | "private";
export type AgentRoutingPolicy = "direct" | "orchestrated" | "specialist_only";

export interface ModelVersionOption {
  id: string | number;
  model_name: string;
  provider: string;
}

export interface ToolServerRecord {
  id: string;
  server_id: string;
  name: string;
  description: string;
  transport: string;
  server_url: string;
  tool_name_prefix: string;
  auth_mode: string;
  auth_config: Record<string, unknown>;
  health_status: string;
  metadata: Record<string, unknown>;
  last_synced_at: string | null;
}

export interface WorkspaceToolConnectionRecord {
  id: string;
  profile: string | number;
  tool_server: ToolServerRecord | null;
  name: string;
  slug: string;
  connection_scope: "workspace" | "user";
  owner_user_id: string | null;
  auth_type: string;
  server_url_override: string;
  status: string;
  token_expires_at: string | null;
  granted_scopes: string[];
  resource_owner_id: string;
  resource_label: string;
  last_tested_at: string | null;
  last_error: string;
  metadata: Record<string, unknown>;
  has_credential_payload: boolean;
  has_access_token: boolean;
  has_refresh_token: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaveWorkspaceToolConnectionPayload {
  tool_server: string;
  name: string;
  slug: string;
  connection_scope?: "workspace" | "user";
  owner_user?: string | null;
  auth_type?: string;
  server_url_override?: string;
  credential_payload?: Record<string, unknown> | null;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string | null;
  granted_scopes?: string[];
  resource_owner_id?: string;
  resource_label?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface WorkspaceToolConnectionTestResponse {
  ok: boolean;
  server_url: string;
  header_names: string[];
  tool_count?: number;
  sample_tools?: string[];
  detail?: string;
}

export interface AgentToolRecord {
  id: string;
  scope: string;
  profile: string | null;
  key: string;
  display_name: string;
  description: string;
  remote_tool_name: string;
  full_tool_name: string;
  auth_mode: string;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  metadata: Record<string, unknown>;
  is_discoverable: boolean;
  health_status: string;
  tool_server: ToolServerRecord | null;
  last_synced_at: string | null;
}

export interface AgentSkillRecord {
  id: string;
  scope: string;
  profile: string | null;
  key: string;
  name: string;
  description: string;
  tags: string[];
  examples: string[];
  input_modes: string[];
  output_modes: string[];
  metadata: Record<string, unknown>;
}

export interface AgentTemplateSkillBindingRecord {
  id: string;
  order: number;
  is_primary: boolean;
  metadata: Record<string, unknown>;
  skill: AgentSkillRecord;
}

export interface AgentTemplateToolBindingRecord {
  id: string;
  order: number;
  is_required: boolean;
  tool_config: Record<string, unknown>;
  tool: AgentToolRecord;
}

export interface AgentTemplateRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  protocol_version: string;
  preferred_transport: string;
  url: string;
  version: string;
  documentation_url: string;
  icon_url: string;
  capabilities: Record<string, unknown>;
  default_input_modes: string[];
  default_output_modes: string[];
  system_instruction: string;
  developer_instruction: string;
  assistant_instruction: string;
  metadata: Record<string, unknown>;
  is_active: boolean;
  is_featured: boolean;
  allow_workspace_installs: boolean;
  sort_order: number;
  skill_bindings: AgentTemplateSkillBindingRecord[];
  tool_bindings: AgentTemplateToolBindingRecord[];
  card_payload: Record<string, unknown>;
}

export interface WorkspaceAgentSkillBindingRecord {
  id: string;
  order: number;
  is_primary: boolean;
  metadata: Record<string, unknown>;
  skill: AgentSkillRecord;
}

export interface WorkspaceAgentToolBindingRecord {
  id: string;
  order: number;
  is_required: boolean;
  tool_config: Record<string, unknown>;
  tool: AgentToolRecord;
}

export interface WorkspaceAgentRecord {
  id: string;
  profile: string | number;
  source_template: AgentTemplateRecord | null;
  origin: string;
  visibility: AgentVisibility;
  routing_policy: AgentRoutingPolicy;
  slug: string;
  name: string;
  description: string;
  protocol_version: string;
  preferred_transport: string;
  url: string;
  provider_organization: string;
  provider_url: string;
  version: string;
  documentation_url: string;
  icon_url: string;
  additional_interfaces: Array<Record<string, unknown>>;
  capabilities: Record<string, unknown>;
  security_schemes: Record<string, unknown>;
  security: Array<Record<string, unknown>>;
  supports_authenticated_extended_card: boolean;
  default_input_modes: string[];
  default_output_modes: string[];
  system_instruction: string;
  developer_instruction: string;
  assistant_instruction: string;
  llm_version: ModelVersionOption | null;
  llm_temperature: number;
  max_reasoning_steps: number;
  metadata: Record<string, unknown>;
  is_enabled: boolean;
  template_version_snapshot: string;
  skill_bindings: WorkspaceAgentSkillBindingRecord[];
  tool_bindings: WorkspaceAgentToolBindingRecord[];
  card_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceAgentRuntimeSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  origin: string;
  visibility: AgentVisibility;
  routing_policy: AgentRoutingPolicy;
  preferred_transport: string;
  version: string;
  icon_url: string;
  documentation_url: string;
  source_template_slug: string | null;
  llm_version: ModelVersionOption | null;
  capabilities: Record<string, unknown>;
  default_input_modes: string[];
  default_output_modes: string[];
  supports_authenticated_extended_card: boolean;
  metadata: Record<string, unknown>;
  tool_count: number;
  skill_count: number;
  card_payload: Record<string, unknown>;
}

export interface RuntimeAgentRegistryResponse {
  profile_id: string | number;
  workspace_name: string;
  agent_count: number;
  agents: WorkspaceAgentRuntimeSummary[];
}

export interface CreateWorkspaceAgentPayload {
  slug: string;
  name: string;
  description?: string;
  visibility?: AgentVisibility;
  routing_policy?: AgentRoutingPolicy;
  protocol_version?: string;
  preferred_transport?: string;
  url?: string;
  provider_organization?: string;
  provider_url?: string;
  version?: string;
  documentation_url?: string;
  icon_url?: string;
  additional_interfaces?: Array<Record<string, unknown>>;
  capabilities?: Record<string, unknown>;
  security_schemes?: Record<string, unknown>;
  security?: Array<Record<string, unknown>>;
  supports_authenticated_extended_card?: boolean;
  default_input_modes?: string[];
  default_output_modes?: string[];
  system_instruction?: string;
  developer_instruction?: string;
  assistant_instruction?: string;
  llm_version?: string | number | null;
  llm_temperature?: number;
  max_reasoning_steps?: number;
  metadata?: Record<string, unknown>;
  is_enabled?: boolean;
}

export interface InstallAgentTemplatePayload {
  slug?: string;
  name?: string;
  description?: string;
  visibility?: AgentVisibility;
  routing_policy?: AgentRoutingPolicy;
  system_instruction?: string;
  developer_instruction?: string;
  assistant_instruction?: string;
  is_enabled?: boolean;
}

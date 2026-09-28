import type { Address } from "../common/commonTypes";

export interface CompanyProfile {
  id: string;
  name: string;
  logo?: string | null;
  industry?: string;
  description?: string;
  founded_date?: string;
  employees_count?: number;
  tax_id?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  other_link?: string;
  phone?: string;
  email?: string;
  currency?: string;
  headquarters_address?: Address;
  headquarters_address_id?: string | null;
  is_verified: boolean;
  verification_date?: string;
  created_at: string;
  updated_at: string;
  owner?: number;
}

export interface CompanyProfileListItem {
  id: string;
  name: string;
  industry?: string;
  employees_count?: number;
  is_verified: boolean;
  owner_name?: string;
  staff_count: number;
  created_at: string;
}

export interface StaffRole {
  id: string;
  name: string;
  description?: string;
  permissions: number[];
  created_at: string;
  updated_at: string;
}

export interface StaffRoleListItem {
  id: string;
  name: string;
  description?: string;
  assignments_count: number;
  created_at: string;
  permission_count: number;
}

export interface StaffGroup {
  id: string;
  name: string;
  description?: string;
  permissions: number[];
  users: number[];
  created_at: string;
  updated_at: string;
}

export interface StaffGroupListItem {
  id: string;
  name: string;
  description?: string;
  users_count: number;
  created_at: string;
  permission_count: number;
}

export interface StaffRoleAssignment {
  id: string;
  user: number;
  role: string;
  role_name?: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  assigned_at: string;
  assigned_by?: number | string | null;
  assigned_by_email?: string | null;
  profile?: string | number | null;
}

export interface StaffAssignment {
  id: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    get_full_name?: string;
    role?: string | null;
  };
  role: StaffRoleListItem;
  assigned_by?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    get_full_name?: string;
    role?: string | null;
  };
  profile?: string;
  start_date: string;
  end_date?: string | null;
  is_active: boolean;
  is_currently_active: boolean;
  assigned_at: string;
}

export interface RecallPolicy {
  id: string;
  name: string;
  description?: string;
  severity_levels: any[];
  notification_template?: string;
  contact_information: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReorderStrategy {
  id: string;
  name: string;
  description?: string;
  strategy_type: string;
  parameters: Record<string, any>;
  applies_to_categories?: string;
  applies_to_all: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryPolicy {
  id: string;
  name: string;
  description: string;
  policy_type: string;
  details: Record<string, any>;
  applies_to_categories?: string;
  applies_to_all: boolean;
  effective_date: string;
  expiry_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user?: number;
  action: string;
  model_name: string;
  object_id: number;
  timestamp: string;
  details: Record<string, any>;
  next: string;
  previous: string;
}

export interface CompanyProfilePoliciesResponse {
  recall_policies: RecallPolicy[];
  reorder_strategies: ReorderStrategy[];
  inventory_policies: InventoryPolicy[];
}

export interface CompanyProfileAnalytics {
  total_staff: number;
  active_roles: number;
  active_groups: number;
  total_addresses: number;
  total_policies: number;
  verification_status: boolean;
  profile_age_days: number;
}

export interface WorkspaceDefaultSyncSummary {
  created_count: number;
  updated_count: number;
  preset_names: string[];
}

export interface PopulateDefaultStaffAccessResponse {
  profile_id: string;
  profile_name: string;
  roles: WorkspaceDefaultSyncSummary;
  groups: WorkspaceDefaultSyncSummary;
}

export interface CompanyFormData {
  name: string;
  logo?: File | string | null;
  industry?: string;
  description?: string;
  founded_date?: string;
  employees_count?: number;
  tax_id?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  other_link?: string;
  phone?: string;
  email?: string;
  currency?: string;
  headquarters_address?: Address;
  headquarters_address_id?: string | null;
}

export interface AgentModelVersionOption {
  id: number | string;
  provider: string;
  provider_label: string;
  model_name: string;
  base_url?: string | null;
}

export interface CompanyAgentSetup {
  id: number | string;
  profile?: number | string;
  name: string;
  version: number | string;
  provider: string;
  provider_label: string;
  model_name: string;
  provider_base_url?: string | null;
  effective_base_url?: string | null;
  special_instruction?: string;
  system_instruction?: string;
  assistant_instruction?: string;
  has_api_key: boolean;
  has_tavily_api_key: boolean;
  api_key_masked?: string;
  tavily_api_key_masked?: string;
}

export interface CompanyAgentSetupResponse {
  configured: boolean;
  agent: CompanyAgentSetup | null;
  available_versions: AgentModelVersionOption[];
}

export interface SaveCompanyAgentSetupPayload {
  name?: string;
  version?: number | string;
  api_key?: string;
  tavily_api_key?: string;
  special_instruction?: string;
  system_instruction?: string;
  assistant_instruction?: string;
}

export interface AddStaffPayload {
  user_id: string;
  role_id: string;
  start_date?: string;
  end_date?: string | null;
}

export interface RemoveStaffPayload {
  user_id: string | number;
}

export interface CompanyInvitation {
  id: string;
  profile?: string;
  profile_name?: string;
  email: string;
  role: string;
  invitation_message?: string;
  invitation_code?: string;
  status: string;
  invited_by?: string;
  invited_by_email?: string;
  accepted_by?: string | null;
  accepted_by_email?: string | null;
  expires_at?: string | null;
  responded_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyInvitationLookupResponse {
  is_registered_user: boolean;
  detail?: string;
  id: string;
  profile?: string;
  profile_name?: string;
  email: string;
  role: string;
  invitation_message?: string;
  invitation_code?: string;
  status: string;
  invited_by?: string;
  invited_by_email?: string;
  accepted_by?: string | null;
  accepted_by_email?: string | null;
  expires_at?: string | null;
  responded_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InviteCompanyPayload {
  email: string;
  role?: string;
  invitation_message?: string;
}

export interface InviteCompanyBulkPayload {
  emails?: string[] | string;
  role?: string;
  invitation_message?: string;
  file?: File;
  csv_file?: File;
}

export interface CompanyInvitationAcceptPayload {
  invitation_code: string;
}

export interface CompanyInvitationAcceptResponse {
  membership_id: string;
  profile_id: string;
  role: string;
  status: string;
}

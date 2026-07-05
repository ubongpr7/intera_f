export interface SupportAccessPreset {
  key: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface SupportAccessActor {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  get_full_name?: string;
  role?: string | null;
  picture?: string | null;
}

export interface SupportAccessGrant {
  id: string;
  profile: string;
  profile_name?: string;
  grantee_user: SupportAccessActor | null;
  accepted_by?: SupportAccessActor | null;
  grantee_email_snapshot: string;
  invitation_code?: string;
  created_by?: SupportAccessActor | null;
  approved_by?: SupportAccessActor | null;
  revoked_by?: SupportAccessActor | null;
  reason: string;
  ticket_reference?: string | null;
  permission_mode: string;
  membership_role: string;
  custom_permissions: string[];
  effective_permissions: string[];
  starts_at: string;
  expires_at: string;
  revoked_at?: string | null;
  responded_at?: string | null;
  last_used_at?: string | null;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  preset?: SupportAccessPreset | null;
}

export interface SupportAccessGrantCreatePayload {
  grantee_email: string;
  reason: string;
  ticket_reference?: string;
  permission_mode: string;
  membership_role: "member" | "admin";
  custom_permissions?: string[];
  starts_at?: string;
  expires_at: string;
  notes?: string;
}

export interface SupportAccessGrantExtendPayload {
  expires_at: string;
  notes?: string;
}

export interface SupportAccessGrantRevokePayload {
  notes?: string;
}

export interface SupportAccessGrantRespondPayload {
  invitation_code: string;
}

export interface SupportAccessGrantAcceptResponse {
  support_access_grant_id: string;
  profile_id: string;
  status: string;
  starts_at?: string | null;
  expires_at?: string | null;
}

export interface SupportAccessCandidateUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  get_full_name?: string;
  picture?: string | null;
}

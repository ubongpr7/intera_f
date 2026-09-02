import type { RoleAssignment } from "../management/managementTypes";

export interface UserData {
  id: number;
  email: string;
  phone?: string | null;
  picture?: string | null;
  profile_image?: string;
  first_name: string;
  last_name: string;
  get_full_name?: string;
  role?: string | null;
  sex?: "male" | "female" | "not_to_mention" | null;
  is_verified: boolean;
  is_staff: boolean;
  mfa_enabled?: boolean;
  has_setup_mfa?: boolean;
  date_of_birth?: Date | string | null;
  profile?: number | null;
  date_joined?: Date | string;
  last_login?: Date | string | null;
  roles?: RoleAssignment[];
  referral_code?: string;
}

export interface ReferralUser {
  id: number | string;
  email: string;
  first_name?: string;
  last_name?: string;
  joined_at?: string | null;
}

export interface ReferralPayout {
  id: number | string;
  payment_reference: string;
  payment_amount: string;
  commission_amount: string;
  currency: string;
  status: string;
  plan_slug?: string;
  created_at?: string;
}

export interface ReferralDashboard {
  referral_code: string;
  referral_url: string;
  commission_rate: string | number;
  referred_count: number;
  referred_users: ReferralUser[];
  earnings: {
    total: string;
    pending: string;
    paid: string;
  };
  payouts: ReferralPayout[];
}

export interface UserSummary {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  get_full_name?: string;
  role?: string | null;
}

export interface ActivityLogInterface {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  action: "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "CANCEL";
  model_name: string;
  object_id: number;
  timestamp: string;
  details: {
    changes: Record<string, { old: unknown; new: unknown }>;
    ip_address: string;
    user_agent: string;
  };
  model_identifier: string;
}

export interface ActivityLogResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ActivityLogInterface[];
}

export interface StaffAssignment {
  id: string;
  membership_role?: string | null;
  role?: {
    id?: string;
    name?: string;
  };
  user?: {
    id?: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string | null;
  };
}

export interface InvitationRow {
  id: string;
  email?: string;
  role?: string;
  status?: string;
  expires_at?: string;
  invitation_code?: string;
  created_at?: string;
}

export interface BulkInviteResponse {
  created_count: number;
  existing_pending_count: number;
  skipped_count: number;
  invalid_count: number;
  created: InvitationRow[];
  existing_pending: InvitationRow[];
  skipped: Array<{ email: string; reason: string }>;
  invalid_emails: string[];
}

export interface MfaSetupResponse {
  mfa_secret: string;
  otpauth_url: string;
  qr_code: string;
  mfa_enabled: boolean;
  has_setup_mfa: boolean;
}

export interface MfaVerifyResponse {
  detail: string;
  mfa_enabled: boolean;
  has_setup_mfa?: boolean;
  access?: string;
  refresh?: string;
  profile?: string | null;
  profile_context?: Record<string, unknown> | null;
  profiles?: Array<Record<string, unknown>>;
}

export interface MfaTogglePayload {
  enabled?: boolean;
  code: string;
}

export interface MfaToggleResponse {
  detail: string;
  mfa_enabled: boolean;
}

export interface MfaResetRequestResponse {
  detail: string;
  email: string;
}

export interface MfaResetConfirmResponse {
  detail: string;
  mfa_enabled: boolean;
  has_setup_mfa: boolean;
}

export interface MfaEmailRequestResponse {
  detail: string;
  email: string;
}

export interface VerificationRequestPayload {
  email: string;
  action: "send_code" | "verify_code";
  code?: string;
}

export interface VerificationResponse {
  message?: string;
  user_id?: number;
  email?: string;
  error?: string;
}

export interface PlanMetadata {
  id?: string;
  slug?: string;
  name?: string;
}

export interface PlanFeatureQuota {
  limit_type?: string;
  limit_value?: number | null;
  service_area?: string;
  service_identifier?: string;
}

export interface UserQuotaMetadata {
  plan?: PlanMetadata | null;
  plan_features: Record<string, PlanFeatureQuota>;
}

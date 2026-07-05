import type { SocialProviderSlug } from "@/lib/socialAuth";

export interface AuthUser {
  first_name: string;
  last_name: string;
  email: string;
}

export interface SocialAuthArgs {
  provider: SocialProviderSlug;
  state: string;
  code: string;
  redirectUri: string;
}

export interface CompanyProfileContext {
  id: string;
  name: string;
  company_code: string;
  logo?: string | null;
  industry?: string | null;
  owner_id?: string | null;
  currency?: string | null;
  role?: string | null;
  membership_id?: string | null;
  support_access?: boolean;
  support_access_grant_id?: string | null;
  support_access_expires_at?: string | null;
  support_access_mode?: string | null;
  support_actor_type?: string | null;
}

export interface AuthSessionResponse {
  access: string;
  refresh: string;
  id: string | number;
  username?: string;
  email?: string;
  first_name?: string;
  is_verified?: boolean;
  profile?: string | null;
  profile_context?: CompanyProfileContext | null;
  profiles?: CompanyProfileContext[];
  currency?: string | null;
  model_name?: string | null;
  provider?: string | null;
  agent_name?: string | null;
}

export interface CompanyMembershipResponse {
  active_profile_id: string | null;
  profiles: CompanyProfileContext[];
}

export interface SwitchCompanyPayload {
  profile_id?: string;
  company_code?: string;
  support_access_grant_id?: string;
}

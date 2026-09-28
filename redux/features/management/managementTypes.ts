import type { Address } from "../common/commonTypes";

export type { Address };

export interface CompanyProfileData {
  name: string;
  industry: string;
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
  currency: string;
}

export interface GroupData {
  id: number;
  name: string;
  is_system?: boolean;
  description?: string;
  users: string;
  users_count: number;
  permission_count: number;
  assignments_count: string;
}

export type RoleData = GroupData;

export interface PaginatedManagementResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  page: number;
  page_size: number;
  total_pages: number;
  results: T[];
}

export interface CreateRoleAssignmentPayload {
  role: number;
  user: string;
  start_date?: string;
  end_date?: string | null;
  is_active?: boolean;
}

export interface RoleAssignment {
  id: number;
  user: string;
  role_name: string;
  role: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  assigned_by: number;
  assigned_at: string;
  profile: string;
  created_at?: string;
  updated_at?: string;
}

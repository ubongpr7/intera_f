export interface PermissionDetail {
  codename: string;
  name: string;
  description: string;
  category: string;
  has_permission: boolean;
}

export interface UserPermissionsResponse {
  permissions: PermissionDetail[];
}

export interface PermissionUpdatePayload {
  permissions: string[];
}

export interface GroupMembershipState {
  id: string;
  name: string;
  belongs_to: boolean;
}

export interface UserGroupsResponse {
  groups: GroupMembershipState[];
}

export interface UserGroupUpdatePayload {
  groups: string[];
}

export interface RoleAssignmentRecord {
  id: string;
  user: string;
  role?: string;
  role_name?: string;
  start_date: string;
  end_date?: string | null;
  is_active: boolean;
  assigned_at?: string;
  assigned_by?: string;
  profile?: string;
}

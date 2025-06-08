export interface CompanyProfile {
  id: string
  name: string
  industry?: string
  description?: string
  founded_date?: string
  employees_count?: number
  tax_id?: string
  website?: string
  linkedin?: string
  twitter?: string
  instagram?: string
  facebook?: string
  other_link?: string
  phone?: string
  email?: string
  currency?: number
  headquarters_address?: CompanyAddress
  is_verified: boolean
  verification_date?: string
  created_at: string
  updated_at: string
  owner?: number
}

export interface CompanyAddress {
  id?: string
  street_address?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

export interface StaffRole {
  id: string
  name: string
  description?: string
  permissions: number[]
  created_at: string
  updated_at: string
}

export interface StaffGroup {
  id: string
  name: string
  description?: string
  permissions: number[]
  users: number[]
  created_at: string
  updated_at: string
}

export interface StaffRoleAssignment {
  id: string
  user: number
  role: string
  start_date: string
  end_date?: string
  is_active: boolean
  assigned_at: string
}

export interface RecallPolicy {
  id: string
  name: string
  description?: string
  severity_levels: any[]
  notification_template?: string
  contact_information: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ReorderStrategy {
  id: string
  name: string
  description?: string
  strategy_type: string
  parameters: Record<string, any>
  applies_to_categories?: string
  applies_to_all: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface InventoryPolicy {
  id: string
  name: string
  description: string
  policy_type: string
  details: Record<string, any>
  applies_to_categories?: string
  applies_to_all: boolean
  effective_date: string
  expiry_date?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  user?: number
  action: string
  model_name: string
  object_id: number
  timestamp: string
  details: Record<string, any>
  next: string
  previous: string
}

export interface CompanyFormData {
  name: string
  industry?: string
  description?: string
  founded_date?: string
  employees_count?: number
  tax_id?: string
  website?: string
  linkedin?: string
  twitter?: string
  instagram?: string
  facebook?: string
  other_link?: string
  phone?: string
  email?: string
  currency?: number
  headquarters_address?: CompanyAddress
}

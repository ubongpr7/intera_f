export interface AdminContext {
  id: string | number
  email: string
  first_name?: string
  last_name?: string
  is_staff: boolean
  is_superuser: boolean
}

export interface PlatformStaffInvitation {
  id: string
  email: string
  status: string
  expires_at: string
  created_at: string
  accepted_at?: string | null
}


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

export interface Address {
    country: number | null; // Assuming country is referenced by ID
    region: number | null; // Assuming region is referenced by ID
    subregion: number | null; // Assuming subregion is referenced by ID
    city: number | null; // Assuming city is referenced by ID
    apt_number: number | null;
    street_number: number | null;
    street: string | null;
    postal_code: string | null;
    company: string | null;
    full_address: string | null;
  }
  
  export interface GroupData{
    id: number;
    name: string;
    description?: string;
    users: string;
    users_count: number;
    permission_count: number;
    assignments_count:string
  }
  
  export type RoleData = GroupData;


  // Request payload for creating/updating a role assignment
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
 
  end_date: string ;
 is_active: boolean;
  assigned_by: number;
  
  assigned_at: string;
  
  profile: string;
  
  created_at?: string;
  updated_at?: string;
}

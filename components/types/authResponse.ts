
// register 

export type RegisterResponse = {
  id: string;
  email: string;
  first_name: string;
};

export type ErrorResponse = {
  data?: {
    detail?: string;
    [key: string]: any;
  };
  status?: number;
};


//login
export interface LoginResponse {
    id: string | number;
    username?: string;
    email?: string;
    is_verified?: boolean;
    is_staff?: boolean;
    is_superuser?: boolean;
    profile?: string | null;
    first_name?: string;
    access?: string;
    refresh?: string;
    profile_context?: {
      id?: string | number;
      name?: string;
      company_code?: string;
      role?: string | null;
      owner_id?: string | null;
      membership_id?: string | null;
      currency?: string | null;
      support_access?: boolean;
      support_access_grant_id?: string | null;
      support_access_expires_at?: string | null;
      support_access_mode?: string | null;
      support_actor_type?: string | null;
    } | null;
    profiles?: Array<{
      id?: string | number;
      name?: string;
      company_code?: string;
      role?: string | null;
      owner_id?: string | null;
      membership_id?: string | null;
      currency?: string | null;
      support_access?: boolean;
      support_access_grant_id?: string | null;
      support_access_expires_at?: string | null;
      support_access_mode?: string | null;
      support_actor_type?: string | null;
    }>;
    currency?: string | null;
    model_name?: string | null;
    provider?: string | null;
    agent_name?: string | null;
  }
  
export interface LoginErrorResponse {
    data?: {
      detail?: string;
      non_field_errors?: string[];
      email?: string[];
      password?: string[];
    };
    status?: number;
  }



// verify

export interface ResendError {
    data?: {
      error?: string;
      message?: string;
    };
    status?: number;
  }
export interface VerificationError {
    
      error?: string;
      message?: string;
    
    status?: number;
  }
  

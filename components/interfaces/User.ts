import { RoleAssignment } from "./management";

// types/user.ts
export interface UserData {
    id: number;
    email: string;
    phone?: string | null;
    picture?: string | null;
    first_name: string;
    last_name: string;
    sex?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
    is_verified: boolean;
    is_staff: boolean;
    is_subscriber: boolean;
    is_worker: boolean;
    is_main: boolean;
    date_of_birth?: Date | string | null;
    profile?: number | null;
    date_joined: Date | string;
    last_login?: Date | string | null;
    password:string;
    roles?: RoleAssignment[];
  }
  

export interface ActivityLogInterface {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'CANCEL';
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

  
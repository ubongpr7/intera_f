
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
    id: string;
    username: string;
    email: string;
    is_worker: boolean;
    is_main: boolean;
    is_verified: boolean;
    profile:string
    company?:string
    first_name: string;
    access_token?: string;  // If using JWT
    refresh_token?: string; // If using refresh tokens
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
  
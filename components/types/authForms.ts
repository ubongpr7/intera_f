export type LoginFormData = {
    email: string;
    password: string;
    company_code?: string;
  };
  

export  type RegisterFormInputs = {
    first_name: string;
    last_name?: string;
    email: string;
    password: string;
    re_password: string;
    terms_accepted: boolean;
    privacy_accepted: boolean;
  };

// verify
export interface VerificationProps {
  email: string;
  redirectTo:string
}

export interface VerifyFormData {
    code: string;
    userId: string;
  }

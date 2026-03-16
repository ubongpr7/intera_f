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

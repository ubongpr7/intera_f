export type LoginFormData = {
    email: string;
    password: string;
  };
  

export  type RegisterFormInputs = {
    first_name: string;
    email: string;
    password: string;
    re_password: string;
  };

// verify
export interface VerificationProps {
  userId: string;
  redirectTo:string
}

export interface VerifyFormData {
    code: string;
    userId: string;
  }
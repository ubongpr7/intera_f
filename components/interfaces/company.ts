export interface CompanyDataInterface {
    id: number;
    name: string;
    description?: string | null;
    website?: string | null;
    address?: string;       
    phone?: string | null;
    email?: string | null;
    link?: string | null;
    image?: string | null;   
    notes?: string | null;   
    is_customer: boolean;
    is_supplier: boolean;
    is_manufacturer: boolean;
    currency: string;
    created_by?: number | null;  
    attachments?: number[];  
    base_currency?: string;    
    currency_name?: string;    
    created_at?: string;       
    updated_at?: string;    
    company_type?:string;
    short_address?:string;
        
  }
  // interfaces/company.ts
export interface CompanyAddressInterface {
  id: number;
  company: number;  // Company ID reference
  title: string;
  primary: boolean;
  line1: string;
  line2?: string;
  postal_code: string;
  country: string;
  shipping_notes?: string;
  internal_shipping_notes?: string;
  link?: string;
  created_at?: string;
  updated_at?: string;
}

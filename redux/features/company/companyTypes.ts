import type { Address } from "../common/commonTypes";

export interface CompanyDataInterface {
  id: number | string;
  name: string;
  description?: string | null;
  notes?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  link?: string | null;
  image?: string | null;
  address?: string | null;
  is_customer: boolean;
  is_supplier: boolean;
  is_manufacturer: boolean;
  currency?: string | null;
  currency_name?: string | null;
  company_type?: string;
  short_address?: string | null;
  created_by?: number | string | null;
  created_at?: string;
  updated_at?: string;
  attachments?: Array<Record<string, unknown>>;
}

export interface CompanyAddressInterface extends Address {
  id: number | string;
  company: number | string;
  title?: string | null;
  link?: string | null;
  primary?: boolean;
  shipping_notes?: string | null;
  internal_shipping_notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyAddressDataInterface extends CompanyAddressInterface {}

export interface ContactPersonInterface {
  id: number | string;
  company: number | string;
  name: string;
  phone?: string | null;
  email?: string | null;
  role?: string | null;
}

export interface CompanyListParams {
  is_supplier?: boolean;
  is_customer?: boolean;
  is_manufacturer?: boolean;
  search?: string;
}

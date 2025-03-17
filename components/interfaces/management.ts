
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

// interfaces/address.ts
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
  }
  
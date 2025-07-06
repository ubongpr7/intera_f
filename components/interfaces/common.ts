import { LucideIcon } from "lucide-react";

// interfaces/dropdown.ts
export interface DropdownOption {
    id: number;
    name: string;
  }
export interface CurrencyResponse {
    currencies:{
      code: string;
      name: string;
    }
  }

  export interface Address {
    id?: number
  country: number | null
  region: number | null
  subregion: number | null
  city: number | null
  apt_number: number | null
  street_number: number | null
  street: string | null
  postal_code: string | null
  company?: string | null
  full_address: string | null
  longitude?:string
  latitude?:string
}
  export interface ActionItem {
    icon: LucideIcon
    text: string
    action: () => Promise<void> | void  
    disabled?: boolean
    helpText: string
  }

export interface RefetchDataProp{
  setRefetchData:(refetchData:boolean)=>void;
  refetchData:boolean
}




export interface Permission {
    codename: string
    name: string
    description: string
    category: string
    has_permission: boolean
  }
  
export  interface CategoryGroup {
    [key: string]: Permission[]
  }

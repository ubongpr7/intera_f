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

  export interface ActionItem {
    icon: LucideIcon
    text: string
    action: () => Promise<void> | void  
    disabled?: boolean
    helpText: string
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

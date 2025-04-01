import { 
  CompanyAddressDataInterface,
  CompanyAddressInterface, 
  CompanyDataInterface ,
  ContactPersonInterface

} from "../interfaces/company";

export const CompanyKeyInfo = {
    name: 'The legal name of the company (required, unique identifier)',
    description: 'Brief overview of the company\'s business activities',
    website: 'Official company website URL (include https://)',
    address: 'Physical location or headquarters address',
    phone: 'Primary contact phone number with country code',
    email: 'Main contact email address',
    link: 'Secondary URL (e.g., internal wiki page, CRM profile)',
    image: 'URL to company logo or profile image',
    notes: 'Internal notes or comments about the company',
    is_customer: 'Flag indicating if company purchases from us',
    is_supplier: 'Flag indicating if we purchase from this company',
    is_manufacturer: 'Flag indicating if company manufactures components',
    currency: 'Default currency for financial transactions (ISO code)'
  };
  
  export const CompanyInterfaceKeys: (keyof CompanyDataInterface)[] = [
    'name',
    'description',
    'website',
    'phone',
    'email',
    'short_address',
    'link',
    'notes',
    'is_supplier',
    'is_customer',
    'is_manufacturer',
    'currency'
  ];
  
  
  export const CompanyAddressInterfaceKeys: (keyof CompanyAddressDataInterface)[] = [
    'title',
    'primary',
    'country',
    'region',
    `subregion`,
    'city',
    'apt_number',
    'street_number',
    'street',
    'postal_code',
    'shipping_notes',
    'internal_shipping_notes',
    'link',
    // 'company'
  ];
  
  export const defaultValues: Partial<CompanyDataInterface> = {
    is_customer: false,
    is_supplier: true,
    is_manufacturer: false,
    // currency: 'USD',
    description: '',
    website: '',
    address: '',
    phone: '',
    email: '',
    link: '',
    notes: ''
  };
  
export const CompanyAddressKeyInfo = {
  title: 'Human-readable name for the address location',
  primary: 'Mark as primary company address',
  postal_code: 'Postal/ZIP code and city',
  country: 'Country code (2-letter ISO)',
  shipping_notes: 'Special instructions for couriers',
  internal_shipping_notes: 'Internal notes about shipping to this address',
  link: 'External link with map or additional info'
};

export const defaultAddressValues: Partial<CompanyAddressInterface> = {
  primary: false,
  line1: '',
  line2: '',
  postal_code: '',
  country: 'US',
  shipping_notes: '',
  internal_shipping_notes: ''
};

export const nonEditableAddressFields: (keyof CompanyAddressInterface)[] = [
  'id', 'company', 'created_at', 'updated_at'
];


export const contactPersonInterfaceKeys: (keyof ContactPersonInterface )[] =[
'name','phone','email','role',
]


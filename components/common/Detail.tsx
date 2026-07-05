'use client';

import { useState } from 'react';
import { Check, CheckCircle, Edit, XCircle } from 'lucide-react';
import ActionHeader from './actions';
import { ActionItem } from "@/redux/features/common/commonTypes"
import { getCurrencySymbol, getCurrencySymbolForProfile } from '@/lib/currency-utils';
import Image from 'next/image';
import CustomCreateCard from './createCard';
import { formatMachineLabel } from '@/lib/displayLabels';


interface DetailCardProps<T> {
  data: T;
  interfaceKeys: (keyof T)[];
  titleField?: keyof T;
  excludeFields?: (keyof T)[];
  displayFields?: (keyof T)[];
  policyFields?: (keyof T)[];
  notEditableFields?: (keyof T)[];
  updateMutation?: (data: Partial<T>) => Promise<void>;
  selectOptions?: Partial<Record<keyof T, Array<{ value: string; text: string }>>>;
  isLoading: boolean;
  keyInfo?: Partial<Record<keyof T, string>>;
  dateFields?: (keyof T)[];
  datetimeFields?: (keyof T)[];
  optionalFields?: (keyof T)[];
  actions?:ActionItem[]
}

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
};

const defaultHiddenDetailFields = new Set([
  'id',
  'profile',
  'profile_id',
  'workspace',
  'workspace_id',
  'company',
  'company_id',
  'owner',
  'owner_id',
  'created_by',
  'created_by_id',
  'created_by_user_id',
  'created_by_details',
  'updated_by',
  'updated_by_id',
  'updated_by_user_id',
  'updated_by_details',
  'modified_by',
  'modified_by_id',
  'modified_by_details',
  'deleted_by',
  'deleted_by_id',
  'metadata',
  'meta',
  'raw_metadata',
  'internal_metadata',
  'object_id',
  'content_type',
]);

const machineLabelFields = new Set([
  'status',
  'stock_status',
  'inventory_type',
  'item_type',
  'product_type',
  'company_type',
  'pricing_type',
  'pricing_strategy',
  'strategy_type',
  'order_status',
  'payment_status',
  'fulfillment_status',
  'approval_status',
  'priority',
  'severity',
  'movement_type',
  'transaction_type',
]);

const shouldFormatAsMachineLabel = (key: string, value: unknown) => {
  if (typeof value !== 'string') return false;
  const normalizedKey = key.toLowerCase();
  return (
    machineLabelFields.has(normalizedKey) ||
    normalizedKey.endsWith('_status') ||
    normalizedKey.endsWith('_type') ||
    normalizedKey.endsWith('_mode')
  );
};

const formatNumberValue = (value: number) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 6,
  }).format(value);

export default function DetailCard<T extends Record<string, any>>({
  data,
  interfaceKeys,
  titleField = 'name',
  excludeFields = [],
  displayFields,
  policyFields = [],
  notEditableFields = [],
  updateMutation,
  selectOptions,
  isLoading,
  keyInfo,
  dateFields = [],
  datetimeFields = [],
  optionalFields = [],
  actions=[]
}: DetailCardProps<T>) {
  const [isEditOpenOption, setIsEditOpenOption] = useState(false);

  const candidateData = displayFields?.length
    ? displayFields.map((key) => [key, data[key]] as [keyof T, any])
    : Object.entries(data) as [keyof T, any][];
  const filteredData = candidateData.filter(([key, value]) => {
    const normalizedKey = String(key).toLowerCase();
    if (excludeFields.includes(key) || defaultHiddenDetailFields.has(normalizedKey) || value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (typeof value === 'object' && !Array.isArray(value)) return false;
    return true;
  });

  const mainFields = filteredData.filter(
    ([key]) => !policyFields.includes(key)
  );

  const policyData = policyFields?.length > 0
    ? filteredData?.filter(([key]) => policyFields?.includes(key))
    : null;

  const formatLabel = (str: string): string => {
    if (str.endsWith('_snapshot')) {
      str = str.replace(/_snapshot$/, '');
    }
    str = str
      .replace('default_uom_code', 'default UOM')
      .replace('stock_uom_code', 'stock UOM')
      .replace('inventory_item', 'inventory item');
    if (str.toLocaleLowerCase().includes('weight')){
      str = str+ ' (kg)'
    }
    if (str.toLocaleLowerCase().endsWith('margin')){
      str = str+ ' (%)'
    }
    return str.replace(/_name$/, '').replace(/_/g, ' ');
  };
  const renderValue = (key: keyof T, value: any) => {
    const keyName = String(key);
    const selectedLabel = selectOptions?.[key]?.find(
      (option) => String(option.value) === String(value),
    )?.text;
    if (selectedLabel) {
      return <p className="text-sm font-semibold text-foreground">{selectedLabel}</p>;
    }
    if (key === 'currency' || String(key).toLowerCase().includes('currency') ){
      return `${getCurrencySymbol(value)} ${value}`
    }
    if ( keyName.toLowerCase().includes('price') ){
      return `${getCurrencySymbolForProfile()} ${formatNumberValue(Number(value) || 0)}`
    }
    // if (String(key).toLowerCase().includes('image') ){
    //   return <Image src={value} width={24} alt={value}/>
    // }
    if (typeof value === 'boolean'){
      if (value ){
        return (<CheckCircle className="h-5 w-5 text-emerald-600" />)

      }else {
        return <XCircle className="h-5 w-5 text-muted-foreground" />
      }

    }
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      return
    }
    if (key === 'display_image' && typeof value === 'string') {
      return (
        <div className="w-24 h-24 relative">
          <Image src={value} alt={formatLabel(key as string)} fill className="object-cover rounded-lg" />
        </div>
      );
    }
    if (['created_at', 'updated_at','delivery_date','issue_date','complete_date','received_date'].includes(key as string) || dateFields.includes(key) || datetimeFields.includes(key)) {
      return (
        <div>
        <p className="text-sm font-semibold text-foreground">
          {formatDateTime(value as string)}
        </p>
        </div>
      )
    }
    if (typeof value === 'number') {
      return (
        <p className="text-sm font-semibold text-foreground">
          {formatNumberValue(value)}
        </p>
      );
    }
    if (typeof value === 'string' && shouldFormatAsMachineLabel(keyName, value)) {
      return (
        <p className="text-sm font-semibold text-foreground">
          {formatMachineLabel(value)}
        </p>
      );
    }
    if (Array.isArray(value)) {
      const primitiveValues = value.filter((item) => ['string', 'number', 'boolean'].includes(typeof item));
      if (!primitiveValues.length) return null;
      return (
        <p className="text-sm font-semibold text-foreground">
          {primitiveValues.map((item) => String(item)).join(', ')}
        </p>
      );
    }
    return (
      
      <p className="text-sm font-semibold text-foreground">
        {value}
      </p>
    );
  };


  const renderField = (key: keyof T, value: any, isPolicyField: boolean = false) => (
    <div
      key={key as string}
      className={`${
        isPolicyField ? 'border-blue-200/70 bg-blue-50/50 dark:border-blue-500/25 dark:bg-blue-500/10' : 'border-border bg-card'
      } rounded-2xl border p-6 shadow-sm transition-shadow hover:shadow-md`}
    >
      <div className="space-y-1">
        <span
          className={`${
            isPolicyField ? 'text-blue-700 dark:text-blue-200' : 'text-muted-foreground'
          } text-sm font-medium uppercase tracking-wide`}
        >
          {formatLabel(key as string)}
        </span>
        <div className="mt-1" >{renderValue(key, value)}</div> 
      </div>
    </div>
  );

  return (
    <div className="relative rounded-[28px] border border-border bg-card p-8 text-card-foreground shadow-[0_18px_50px_-34px_rgba(15,23,42,0.34)]">
      {updateMutation && (
        <button
          onClick={() => setIsEditOpenOption(true)}
          className="absolute right-6 top-6 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Edit className="h-5 w-5" />
        </button>
      )}
      
      {data[titleField] && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {data[titleField] as React.ReactNode}
          </h1>
        </div>
      )}
      {actions && (
        <ActionHeader
          items={actions}
        className="border-b border-border p-4"
      />
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {mainFields.map(([key, value]) => renderField(key, value))}
      </div>

      {policyData && (
        <section className="mt-10 border-t border-border pt-10">
          <h2 className="mb-6 text-xl font-semibold text-foreground">More Details</h2>
          <div className="grid grid-cols-1 gap-6">
            {policyData.map(([key, value]) => renderField(key, value, true))}
          </div>
        </section>
      )}

      {isEditOpenOption && updateMutation && (
        
        <CustomCreateCard
            defaultValues={data}
            onClose={() => setIsEditOpenOption(false)}

            onSubmit={updateMutation}
            isLoading={isLoading}
            selectOptions={selectOptions}
            keyInfo={keyInfo}

            notEditableFields={notEditableFields}
            interfaceKeys={interfaceKeys}
            optionalFields={optionalFields}
         dateFields={dateFields}
          datetimeFields={datetimeFields}
 
            hiddenFields={{}}
            itemTitle={`Update ${data[titleField]}`}
          />
      )}
    </div>
  );
}

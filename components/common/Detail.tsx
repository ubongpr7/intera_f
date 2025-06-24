'use client';

import { useState } from 'react';
import { Check, CheckCircle, Edit, XCircle } from 'lucide-react';
import CustomUpdateCard from './updateCard';
import ActionHeader from './actions';
import { ActionItem } from '../interfaces/common'


interface DetailCardProps<T> {
  data: T;
  titleField?: keyof T;
  excludeFields?: (keyof T)[];
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

export default function DetailCard<T extends Record<string, any>>({
  data,
  titleField = 'name',
  excludeFields = [],
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

  const filteredData = Object.entries(data).filter(
    ([key, value]) =>
      !excludeFields.includes(key as keyof T) &&
      value !== null &&
      value !== undefined
  ) as [keyof T, any][];

  const mainFields = filteredData.filter(
    ([key]) => !policyFields.includes(key)
  );

  const policyData = policyFields?.length > 0
    ? filteredData?.filter(([key]) => policyFields?.includes(key))
    : null;

  const editableFields = Object.keys(data).filter(
    key => !notEditableFields.includes(key as keyof T)
  ) as (keyof T)[];

  const formatLabel = (str: string): string => {
    return str.replace(/_name$/, '').replace(/_/g, ' ');
  };
  const renderValue = (key: keyof T, value: any) => {
    if (typeof value === 'boolean'){
      if (value ){
        return (<CheckCircle/>)

      }else {
        return <XCircle/>
      }

    }
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      return (
        <div>
          <pre className={`text-sm bg-gray-50 p-3 rounded-md whitespace-pre-wrap break-words font-mono`}>
            {JSON.stringify(value, null, 2)}
            </pre>
            </div>

      )
    }

    if (['created_at', 'updated_at','delivery_date','issue_date','complete_date','received_date'].includes(key as string)) {
      return (
        <div>
        <p className="text-sm font-semibold text-gray-900">
          {formatDateTime(value as string)}
        </p>
        </div>
      )
    }
    return (
      
      <p className="text-sm font-semibold text-gray-900">
        {value}
      </p>
    );
  };


  const renderField = (key: keyof T, value: any, isPolicyField: boolean = false) => (
    <div
      key={key as string}
      className={`${
        isPolicyField ? 'bg-blue-50/30 border-blue-100' : 'border-gray-100'
      } bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow p-6`}
    >
      <div className="space-y-1">
        <span
          className={`${
            isPolicyField ? 'text-blue-600' : 'text-gray-500'
          } text-sm font-medium uppercase tracking-wide`}
        >
          {formatLabel(key as string)}
        </span>
        <div className="mt-1">{renderValue(key, value)}</div> 
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 relative">
      {updateMutation && (
        <button
          onClick={() => setIsEditOpenOption(true)}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <Edit className="w-5 h-5 text-gray-500" />
        </button>
      )}
      
      {data[titleField] && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {data[titleField] as React.ReactNode}
          </h1>
        </div>
      )}
      {actions && (
        <ActionHeader
          items={actions}
        className="p-4 border-b"
      />
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {mainFields.map(([key, value]) => renderField(key, value))}
      </div>

      {policyData && (
        <section className="mt-10 pt-10 border-t border-gray-100">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">More Details</h2>
          <div className="grid grid-cols-1 gap-6">
            {policyData.map(([key, value]) => renderField(key, value, true))}
          </div>
        </section>
      )}

      {isEditOpenOption && updateMutation && (
        <CustomUpdateCard
          data={data}
          selectOptions={selectOptions}
          editableFields={editableFields}
          onClose={() => setIsEditOpenOption(false)}
          onSubmit={updateMutation}
          isLoading={isLoading}
          keyInfo={keyInfo}
          dateFields={dateFields}
          datetimeFields={datetimeFields}
          optionalFields={optionalFields}
        />
      )}
    </div>
  );
}

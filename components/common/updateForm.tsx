'use client'
import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { useForm, Controller, Path, DefaultValues } from 'react-hook-form';
import dynamic from 'next/dynamic';
import LoadingAnimation from './LoadingAnimation';
import { FieldInfo } from './fileFieldInfor';
import { isValidPhoneNumber } from 'libphonenumber-js';
import {
  useGetContactPersonQuery,
  useGetCompanyDataQuery,
  useGetCompanyContactPersonQuery,
} from '../../redux/features/company/companyAPISlice';
import {
  useGetCountriesQuery,
  useGetRegionsQuery,
  useGetSubregionsQuery,
  useGetCitiesQuery,
} from '../../redux/features/common/typeOF';



const PhoneInput = dynamic(
  () => import('react-phone-number-input'),
  { 
    ssr: false,
    loading: () => <input className="border rounded p-2" placeholder="Loading phone input..." />
  }
);

interface CustomUpdateCardProps<T> {
  data: T;
  editableFields: (keyof T)[];
  onSubmit: (data: Partial<T>) => Promise<void>;
  selectOptions?: Partial<Record<keyof T, Array<{ value: string; text: string }>>>;
  isLoading: boolean;
  keyInfo?: Partial<Record<keyof T, string>>;
  dateFields?: (keyof T)[];
  datetimeFields?: (keyof T)[];
  optionalFields?: (keyof T)[];
  hiddenFields?: Partial<Record<keyof T, any>>;
  notEditableFields?: (keyof T)[];
  displayKeys?: (keyof T)[];
}

export default function CustomUpdateForm<T extends Record<string, any>>({
  data,
  editableFields,
  onSubmit,
  selectOptions,
  isLoading,
  keyInfo,
  dateFields = [],
  datetimeFields = [],
  optionalFields = [],
  hiddenFields = {},
  notEditableFields = [],
  displayKeys = [],
}: CustomUpdateCardProps<T>) {
  const safeData = data || {} as T;
  const {
    control,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<Partial<T>>({
    defaultValues: {
      ...editableFields.reduce((acc, key) => ({
        ...acc,
        [key]: safeData[key] ?? '', // Use safeData with fallback
      }), {} as DefaultValues<Partial<T>>),
      ...hiddenFields,
    },
  });
  
  const geoFields = {
    country: {
      query: useGetCountriesQuery,
      data: [] as Array<{ id: string | number; name: string }>,
      dependsOn: null,
      watchKey: null,
    },
    region: {
      query: useGetRegionsQuery,
      data: [] as Array<{ id: string; name: string }>,
      dependsOn: 'country',
      watchKey: 'country',
    },
    subregion: {
      query: useGetSubregionsQuery,
      data: [] as Array<{ id: string; name: string }>,
      dependsOn: 'region',
      watchKey: 'region',
    },
    city: {
      query: useGetCitiesQuery,
      data: [] as Array<{ id: string; name: string }>,
      dependsOn: 'subregion',
      watchKey: 'subregion',
    },
  };

  // Fetch geo data
  Object.entries(geoFields).forEach(([key, config]) => {
    const watchValue = config.watchKey ? watch(config.watchKey as Path<Partial<T>>) : null;
    const { data } = config.query((watchValue || 0) as any, { skip: !watchValue && !!config.dependsOn });
    geoFields[key as keyof typeof geoFields].data = data || [];
  });
  const [edit,setEdit] = useState(false);
  const selectedSupplier = watch('supplier' as Path<Partial<T>>);
  const { data: contactPersons = [] } = useGetCompanyContactPersonQuery(selectedSupplier,{skip:!selectedSupplier});

  useEffect(() => {
    const resetDependents = (parentKey: keyof T, ...dependentKeys: (keyof T)[]) => {
      const parentValue = watch(parentKey as Path<Partial<T>>);
      if (parentValue) return;
      dependentKeys.forEach(key => setValue(key as Path<Partial<T>>, '' as any));
    };

    resetDependents('country' as keyof T, 'region', 'subregion', 'city');
    resetDependents('region' as keyof T, 'subregion', 'city');
    resetDependents('subregion' as keyof T, 'city');
    resetDependents('supplier' as keyof T, 'contact');
  }, [watch, setValue]);

  const minStock = watch('minimum_stock_level' as Path<Partial<T>>);
  const reOrderPoint = watch('re_order_point' as Path<Partial<T>>);
  const reOrderQty = watch('re_order_quantity' as Path<Partial<T>>);
  const safetyQty = watch('safety_stock_level' as Path<Partial<T>>);
  
  useEffect(() => {
    trigger([
      'minimum_stock_level',
      're_order_point',
      'safety_stock_level',
      're_order_quantity'
    ] as Path<Partial<T>>[]);
  }, [minStock, reOrderPoint, reOrderQty, safetyQty, trigger]);

  const formatLabel = (str: string) => {
    return str.replace('first_name', 'Name').replace(/_/g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
  };

  const getInputType = (key: keyof T) => {
    const keyStr = String(key).toLowerCase();
    
    if (keyStr in geoFields) return 'geo-select';
    if (dateFields.includes(key)) return 'date';
    if (datetimeFields.includes(key)) return 'datetime-local';
    if (keyStr === 'phone') return 'phone';
    if (keyStr === 'website' || keyStr === 'link') return 'url';
    if (keyStr === 'password') return 'password';
    if (keyStr === 'email') return 'email';
    if (selectOptions?.[key]) return 'select';
    
    const value = data?.[key];
    if (typeof value === 'boolean') return 'checkbox';
    if (typeof value === 'number') return 'number';
    return 'text';
  };

  const onSubmitHandler = async (formData: Partial<T>) => {
    try {
      await onSubmit(formData);
      setEdit(false);
    } catch (error) {
    }
  };


  const regularFields = editableFields.filter(key => 
    !notEditableFields.includes(key) && String(key) !== 'description'
  );
  const hasDescription = editableFields.some(key => 
    !notEditableFields.includes(key) && String(key) === 'description'
  );
  
  return (
    <div className="">
    {!edit && (
      <div>
      {}
    <ResponsiveDataGrid
        data={safeData}
        keys={displayKeys}

      />
      
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
      <div className="flex justify-end gap-3">
        
        <button
          type="button"
          onClick={() => setEdit(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
        >
        Edit    
      </button>
      </div>
      </div>
      </div>
    )}
      <div className="">
      {edit && (
      <form 
        onSubmit={handleSubmit(onSubmitHandler)} 
        className={`flex flex-col overflow-y-auto h-full `}
      >
          <div>
            {Object.entries(hiddenFields).map(([fieldName, fieldValue]) => (
              <Controller
                key={`hidden-${fieldName}`}
                name={fieldName as Path<Partial<T>>}
                control={control}
                render={({ field }) => (
                  <input
                    type="hidden"
                    {...field}
                    value={fieldValue}
                  />
                )}
              />
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-4 pb-4">
              {regularFields.map((key) => {
                const keyStr = String(key).toLowerCase();
                const inputType = getInputType(key);
                const isGeoField = inputType === 'geo-select';
                const geoConfig = isGeoField ? geoFields[keyStr as keyof typeof geoFields] : null;
                const isDisabled = geoConfig?.dependsOn ? !watch(geoConfig.dependsOn as Path<Partial<T>>) : false;
                const isContactField = key === 'contact';
                const isSupplierSelected = !!selectedSupplier;

                return (
                  <div key={`field-${String(key)}`} className="space-y-2 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700">
                      {formatLabel(String(key))}
                      {keyInfo?.[key] && <FieldInfo info={keyInfo[key]} displayBelow={true} />}
                    </label>
                    <div className="relative">
                      <Controller
                        name={key as Path<Partial<T>>}
                        control={control}
                        rules={{
                          required: optionalFields.includes(key) ? false : 'This field is required',
                          validate: (value) => {
                            if (isGeoField && value) {
                              const isValid = geoConfig?.data.some(
                                (item) => item.id === Number(value)
                              );
                              return isValid || `Invalid ${formatLabel(String(key))} selection`;
                            }
                            if (inputType === 'phone' && value && !isValidPhoneNumber(value.toString())) {
                              return 'Invalid phone number';
                            }
                            if (key === 'safety_stock_level' && typeof value === 'number' && Number(value) > Number(minStock)) {
                              return 'Must be ≤ minimum stock level';
                            }
                            if (key === 'minimum_stock_level' && typeof value === 'number') {
                              if (Number(value) <= Number(safetyQty)) return 'Must be > safety stock level';
                              if (Number(value) >= Number(reOrderPoint)) return 'Must be < re-order point';
                            }
                            if (key === 're_order_point' && typeof value === 'number') {
                              if (Number(value) <= Number(minStock)) return 'Must be > minimum stock level';
                              if (Number(value) >= Number(reOrderQty)) return 'Must be < re-order quantity';
                            }
                            if (key === 're_order_quantity' && typeof value === 'number' && Number(value) <= Number(reOrderPoint)) {
                              return 'Must be > re-order point';
                            }
                            return true;
                          },
                        }}
                        render={({ field }) => {
                          if (isGeoField) {
                            return (
                              <select
                                {...field}
                                value={field.value as string | number | undefined}
                                disabled={isDisabled}
                                className={`w-full bg-gray-50 px-3 border-2 border-gray-300 focus:outline-none
                                  focus:border-blue-500 py-2 rounded-md ${
                                  errors[key as string] 
                                    ? 'border-red-500 ring-red-500' 
                                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                }`}
                              >
                                <option value="">Select {formatLabel(String(key))}</option>
                                {geoConfig?.data?.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.name}
                                  </option>
                                ))}
                              </select>
                            );
                          }

                         
                          if (isContactField) {
                            return (
                              <select
                                disabled={!isSupplierSelected}
                                className={`w-full bg-gray-50 px-3 border-2 border-gray-300 focus:outline-none
                                  focus:border-blue-500 py-2 rounded-md ${
                                  errors[key as string] 
                                    ? 'border-red-500 ring-red-500' 
                                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                }`}
                                // Explicitly set select props instead of spreading field
                                value={field.value as string}  // Convert to string
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => field.onChange(e.target.value)}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                                >
                                <option value="">Select Contact Person</option>
                                {contactPersons.map((contact: { id: number; name: string }) => (
                                  <option key={contact.id} value={contact.id.toString()}> {/* Ensure string value */}
                                    {contact.name}
                                  </option>
                                ))}
                              </select>
                            );
                          }
                          
                          if (inputType === 'select') {
                            return (
                              <select
                              value={field.value as string}  // Convert to string
                              onChange={(e) => field.onChange(e.target.value)}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}

                                className={`w-full bg-gray-50 px-3 border-2 border-gray-300 focus:outline-none
                                  focus:border-blue-500 py-2 rounded-md ${
                                  errors[key as string] 
                                    ? 'border-red-500 ring-red-500' 
                                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                }`}
                              >
                                <option value="">Select {formatLabel(String(key))}</option>
                                {selectOptions?.[key]?.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.text}
                                  </option>
                                ))}
                              </select>
                            );
                          }

                          if (inputType === 'checkbox') {
                            return (
                              <input
                              type="checkbox"
                              // Explicitly set checkbox props
                              checked={!!field.value}
                              onChange={(e) => field.onChange(e.target.checked)} // Use boolean directly
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              className="w-5 h-5"
                            />
                            );
                          }

                          if (inputType === 'phone') {
                            return (
                              <PhoneInput
                              value={field.value as string}
                              onChange={(value) => field.onChange(value)}
                              onBlur={field.onBlur}
                              inputRef={field.ref}
                              name={field.name}
                        
                                international
                                defaultCountry="NG"
                                className={`w-full bg-gray-50 px-3 border-2 border-gray-300 focus:outline-none 
                                  focus:border-blue-500 py-2 rounded-md ${
                                  errors[key as string] 
                                    ? 'border-red-500 ring-red-500' 
                                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                }`}
                              />
                            );
                          }
                          return (
                            <input
                              type={inputType}
                              {...field}
                              value={field.value as string | number | undefined}
                              className={`w-full bg-gray-50 px-3 border-2 border-gray-300 focus:outline-none
                                focus:border-blue-500 py-2 rounded-md ${
                                errors[key as string] 
                                  ? 'border-red-500 ring-red-500' 
                                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                              }`}
                            />
                          );
                        }}
                      />
                      {errors[key as string] && (
                        <p className="text-xs text-red-600 mt-1">
                          {String(errors[key as string]?.message)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {hasDescription && (
              <div className="mt-4 col-span-full">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                    {keyInfo?.description && <FieldInfo info={keyInfo.description} displayBelow={true} />}
                  </label>
                  <div className="relative">
                    <Controller
                      name={"description" as Path<Partial<T>>}
                      control={control}
                      rules={{ required: optionalFields.includes('description' as keyof T) ? false : 'This field is required' }}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          value={field.value as string || ''}
                          rows={4}
                          className={`w-full bg-gray-50 px-3 border-2 border-gray-300 focus:outline-none
                            focus:border-blue-500 py-2 rounded-md ${
                            errors.description 
                              ? 'border-red-500 ring-red-500' 
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                      )}
                    />
                    {errors.description && (
                      <p className="text-xs text-red-600 mt-1">
                        {String(errors.description?.message)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
            <div className="flex justify-end gap-3">
              
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              >
                {isLoading ? (
                  <LoadingAnimation text="Updating..." ringColor="#3b82f6" />
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </form>
      )}
      </div>
    </div>
  );
}


import { clsx } from 'clsx';
import { getCurrencySymbolForProfile } from '@/lib/currency-utils';

interface DataGridProps<T extends Record<string, any>> {
  data: T;
  keys: (keyof T)[];
}

const formatLabel = (str: string) => {
  return str
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/_/g, ' ') // Replace underscores with spaces
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
};

export  function ResponsiveDataGrid<T extends Record<string, any>>({
  data,
  keys,
}: DataGridProps<T>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {keys.map((key) => {
        const value = data[key];
        const isDescription = key === 'description';

        return (
          <div
            key={String(key)}
            className={clsx(
              'bg-white p-4 rounded-lg border border-gray-200 shadow-sm',
              {
                'col-span-full': isDescription,
                'break-words': isDescription,
              }
            )}
          >
            <div className="text-sm font-medium text-gray-500 mb-1 capitalize">
              {formatLabel(String(key))}
            </div>
            <div className={clsx('text-gray-900', { 'text-sm': isDescription })}>
            {
              String(key).toLocaleLowerCase().endsWith('price')?(
                <span className="text-blue-600">{getCurrencySymbolForProfile()} {value}</span>
              ) :typeof value === 'boolean' ? (
                  <span className="text-blue-600">{value ? <Check/> : <X/>}</span>
                ) : value ? (
                  String(value)
                ) : (
                  <span className="text-gray-400">N/A</span>
                )
            }
            </div>
          </div>
        );
      })}
    </div>
  );
}
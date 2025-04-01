'use client'
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useForm, Controller, Path, DefaultValues } from 'react-hook-form';
import dynamic from 'next/dynamic';
import LoadingAnimation from './LoadingAnimation';
import { FieldInfo } from './fileFieldInfor';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { useGetContactPersonQuery, useGetCompanyDataQuery } from '../../redux/features/company/companyAPISlice';
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

interface CustomCreateCardProps<T> {
  defaultValues?: Partial<T>;
  onClose: () => void;
  onSubmit: (data: Partial<T>) => Promise<void>;
  selectOptions?: Partial<Record<keyof T, Array<{ value: string; text: string }>>>;
  isLoading: boolean;
  keyInfo?: Partial<Record<keyof T, string>>;
  notEditableFields?: (keyof T)[];
  interfaceKeys: (keyof T)[];
  optionalFields?: (keyof T)[];
  dateFields?: (keyof T)[];
  datetimeFields?: (keyof T)[];
  hiddenFields?: Partial<Record<keyof T, any>>;
}

export default function CustomCreateCard<T extends Record<string, any>>({
  defaultValues = {},
  onClose,
  onSubmit,
  selectOptions = {},
  isLoading,
  keyInfo,
  notEditableFields = [],
  interfaceKeys,
  optionalFields = [],
  dateFields = [],
  datetimeFields = [],
  hiddenFields = {},
}: CustomCreateCardProps<T>) {
  const {
    control,
    handleSubmit,
    watch,
    trigger,
    reset,
    setValue,
    formState: { errors },
  } = useForm<Partial<T>>({
    defaultValues: {
      ...interfaceKeys.reduce((acc, key) => ({
        ...acc,
        [key]: defaultValues[key] ?? '',
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

  // Fetch geo data and manage dependencies
  Object.entries(geoFields).forEach(([key, config]) => {
    const watchValue = config.watchKey ? watch(config.watchKey as Path<Partial<T>>) : null;
    const { data } = config.query((watchValue || 0) as any, { skip: !watchValue && !!config.dependsOn });
    geoFields[key as keyof typeof geoFields].data = data || [];
  });

  const selectedSupplier = watch('supplier' as Path<Partial<T>>);
  const { data: contactPersons = [] } = useGetContactPersonQuery(selectedSupplier || 0);
  const { data: companyData = [] } = useGetCompanyDataQuery(''); 

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
    
    const value = defaultValues[key];
    if (typeof value === 'boolean') return 'checkbox';
    if (typeof value === 'number') return 'number';
    return 'text';
  };

  const onSubmitHandler = async (formData: Partial<T>) => {
    try {
      await onSubmit(formData);
      onClose();
      reset();
    } catch (error) {
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const fields = interfaceKeys.filter(key => !notEditableFields.includes(key));
  const regularFields = fields.filter(key => String(key) !== 'description');
  const hasDescription = fields.some(key => String(key) === 'description');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl relative flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 z-10"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <form onSubmit={handleSubmit(onSubmitHandler)} className="flex flex-col overflow-y-auto h-full">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Create New</h2>
          </div>

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
                const isOptional = optionalFields.includes(key);
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
                          required: isOptional ? false : 'This field is required',
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
                                disabled={isDisabled}
                                className={`w-full bg-gray-50 px-3 border-2 border-gray-300 focus:outline-none
                                  focus:border-blue-500 py-2 rounded-md ${
                                  errors[key as string] 
                                    ? 'border-red-500 ring-red-500' 
                                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                }`}
                                value={field.value as string | number | undefined}
                              >
                                <option value="">Select {formatLabel(String(key))}</option>
                                {geoConfig?.data?.map((item) => (
                                  <option
                                    key={`geo-option-${keyStr}-${item.id}`}
                                    value={item.id}
                                  >
                                    {item.name}
                                  </option>
                                ))}
                              </select>
                            );
                          }

                          if (isContactField) {
                            return (
                              <select
                                {...field}
                                disabled={!isSupplierSelected}
                                className={`w-full bg-gray-50 px-3 border-2 border-gray-300 focus:outline-none
                                  focus:border-blue-500 py-2 rounded-md ${
                                  errors[key as string] 
                                    ? 'border-red-500 ring-red-500' 
                                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                }`}
                              >
                                <option value="">Select Contact Person</option>
                                {contactPersons.map((contact) => (
                                  <option key={contact.id} value={contact.id}>
                                    {contact.name}
                                  </option>
                                ))}
                              </select>
                            );
                          }

                          if (inputType === 'select') {
                            return (
                              <select
                                {...field}
                                className={`w-full bg-gray-50 px-3 border-2 border-gray-300 focus:outline-none
                                  focus:border-blue-500 py-2 rounded-md ${
                                  errors[key as string] 
                                    ? 'border-red-500 ring-red-500' 
                                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                }`}
                              >
                                <option value="">Select {formatLabel(String(key))}</option>
                                {selectOptions[key]?.map((option) => (
                                  <option
                                    key={`select-option-${String(key)}-${option.value}`}
                                    value={option.value}
                                  >
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
                                {...field}
                                checked={!!field.value}
                                className="w-5 h-5"
                              />
                            );
                          }

                          if (inputType === 'phone') {
                            return (
                              <PhoneInput
                                {...field}
                                international
                                defaultCountry="NG"
                                className={`w-full bg-gray-50 px-3 border-2 border-gray-300 focus:outline-none 
                                  focus:border-blue-500 py-2 rounded-md ${
                                  errors[key as string] 
                                    ? 'border-red-500 ring-red-500' 
                                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                }`}
                                onChange={value => field.onChange(value)}
                                value={field.value as string}
                              />
                            );
                          }

                          return (
                            <input
                              type={inputType}
                              {...field}
                              value={field.value as string | number | readonly string[] | undefined}
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
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              >
                {isLoading ? (
                  <LoadingAnimation text="Creating..." ringColor="#3b82f6" />
                ) : (
                  'Create'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
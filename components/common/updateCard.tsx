'use client'
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useForm, Controller, Path, DefaultValues } from 'react-hook-form';
import dynamic from 'next/dynamic';
import LoadingAnimation from './LoadingAnimation';
import { FieldInfo } from './fileFieldInfor';
import { isValidPhoneNumber } from 'libphonenumber-js';
import {
  useGetContactPersonQuery,
  useGetCompanyDataQuery,
} from '../../redux/features/company/companyAPISlice';
import {
  useGetCountriesQuery,
  useGetRegionsQuery,
  useGetSubregionsQuery,
  useGetCitiesQuery,
} from '../../redux/features/common/typeOF';
import { toast } from 'react-toastify';
import { extractErrorMessage } from '@/lib/utils';

const PhoneInput = dynamic(
  () => import('react-phone-number-input'),
  {
    ssr: false,
    loading: () => <input className="border rounded p-2" placeholder="Loading phone input..." />
  }
);

interface CustomUpdateCardProps<T extends Record<string, any>> {
  data: T;
  editableFields?: (keyof T)[];
  onClose: () => void;
  onSubmit: (data: Partial<T>) => Promise<void>;
  selectOptions?: Partial<Record<keyof T, Array<{ value: string; text: string }>>>;
  isLoading: boolean;
  keyInfo?: Partial<Record<keyof T, string>>;
  dateFields?: (keyof T)[];
  datetimeFields?: (keyof T)[];
  optionalFields?: (keyof T)[];
  hiddenFields?: Partial<Record<keyof T, any>>;
  notEditableFields?: (keyof T)[];
  parentFields?: string[];
  idOfItem?: string | number;
}

export default function CustomUpdateCard<T extends Record<string, any>>({
  data,
  editableFields = [],
  onClose,
  onSubmit,
  selectOptions = {},
  isLoading,
  keyInfo = {},
  dateFields = [],
  datetimeFields = [],
  optionalFields = [],
  hiddenFields = {},
  notEditableFields = [],
  parentFields = [],
  idOfItem,
}: CustomUpdateCardProps<T>) {
  // Initialize default values, handling parent fields specially
  const getDefaultValue = (key: keyof T) => {
    const keyStr = String(key).toLowerCase();
    if (parentFields.includes(keyStr) && selectOptions[key]) {
      const filteredOptions = selectOptions[key].filter(option => option.value !== idOfItem);
      const value = data[key];
      // Only use value if it's valid in filteredOptions, otherwise default to ''
      return (value && filteredOptions.some(option => option.value === String(value))) ? String(value) : '';
    }
    return data[key] ?? '';
  };

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
        [key]: getDefaultValue(key),
      }), {} as DefaultValues<Partial<T>>),
      ...Object.entries(hiddenFields).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: value ?? '',
      }), {}),
    },
  });

  const percentageFieldsDict: Partial<Record<string, string>> = {
    minimum_stock_level: 'Minimum stock level',
    re_order_point: 'Re-order point',
    safety_stock_level: 'Safety stock level',
    alert_threshold: 'Alert threshold',
    supplier_reliability_score: 'Supplier reliability score',
  };

  const geoFields: Record<string, {
    query: any;
    data: Array<{ id: string | number; name: string }>;
    dependsOn: string | null;
    watchKey: string | null;
  }> = {
    country: {
      query: useGetCountriesQuery,
      data: [],
      dependsOn: null,
      watchKey: null,
    },
    region: {
      query: useGetRegionsQuery,
      data: [],
      dependsOn: 'country',
      watchKey: 'country',
    },
    subregion: {
      query: useGetSubregionsQuery,
      data: [],
      dependsOn: 'region',
      watchKey: 'region',
    },
    city: {
      query: useGetCitiesQuery,
      data: [],
      dependsOn: 'subregion',
      watchKey: 'subregion',
    },
  };

  // Fetch geo data
  Object.entries(geoFields).forEach(([key, config]) => {
    const watchValue = config.watchKey ? watch(config.watchKey as Path<Partial<T>>) : null;
    const { data } = config.query((watchValue || 0) as any, { skip: !watchValue && !!config.dependsOn });
    geoFields[key].data = data || [];
  });

  const selectedSupplier = watch('supplier' as Path<Partial<T>>);
  const { data: contactPersons = [] } = useGetContactPersonQuery(selectedSupplier, { skip: !selectedSupplier });

  // Sync parent field values if invalid
  useEffect(() => {
    editableFields.forEach(key => {
      const keyStr = String(key).toLowerCase();
      if (parentFields.includes(keyStr) && selectOptions[key]) {
        const filteredOptions = selectOptions[key].filter(option => option.value !== idOfItem);
        const currentValue = watch(key as Path<Partial<T>>);
        if (currentValue && !filteredOptions.some(option => option.value === String(currentValue))) {
          setValue(key as Path<Partial<T>>, '' as any);
        }
      }
    });
  }, [editableFields, parentFields, selectOptions, idOfItem, watch, setValue]);

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

  const getInputType = (key: keyof T): string => {
    const keyStr = String(key).toLowerCase();
    const percentageFields = [
      'minimum_stock_level',
      're_order_point',
      'safety_stock_level',
      'alert_threshold',
      'supplier_reliability_score',
    ];

    if (percentageFields.includes(keyStr)) return 'percentage';
    if (keyStr in geoFields) return 'geo-select';
    if (parentFields.includes(keyStr)) return 'select';
    if (dateFields.includes(key)) return 'date';
    if (datetimeFields.includes(key)) return 'datetime-local';
    if (keyStr === 'phone') return 'phone';
    if (keyStr === 'website' || keyStr === 'link') return 'url';
    if (keyStr === 'password') return 'password';
    if (keyStr === 'email') return 'email';
    if (selectOptions[key]) return 'select';

    const value = data[key];
    if (typeof value === 'boolean') return 'checkbox';
    if (typeof value === 'number') return 'number';
    return 'text';
  };

  const onSubmitHandler = async (formData: Partial<T>) => {
    try {
      await onSubmit(formData);
      onClose();
      toast.success('Item updated successfully');
    } catch (error) {
      toast.error(`${extractErrorMessage(error, editableFields as string[])}`);
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const regularFields = editableFields.filter(key =>
    !notEditableFields.includes(key) && String(key) !== 'description'
  );
  const hasDescription = editableFields.some(key =>
    !notEditableFields.includes(key) && String(key) === 'description'
  );

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
            <h2 className="text-xl font-semibold">Edit Details</h2>
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
                    value={fieldValue ?? ''}
                  />
                )}
              />
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {regularFields.map((key) => {
                const keyStr = String(key).toLowerCase();
                const inputType = getInputType(key);
                const isGeoField = inputType === 'geo-select';
                const isContactField = key === 'contact';
                const isParentField = parentFields.includes(keyStr);
                const geoConfig = isGeoField ? geoFields[keyStr] : null;
                const isDisabled = geoConfig?.dependsOn ? !watch(geoConfig.dependsOn as Path<Partial<T>>) : false;
                const isSupplierSelected = !!selectedSupplier;

                // Filter options for parent fields to exclude idOfItem
                const filteredOptions = isParentField && selectOptions[key]
                  ? selectOptions[key].filter(option => option.value !== idOfItem)
                  : selectOptions[key] || [];

                return (
                  <div key={`field-${String(key)}`} className="space-y-2 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700">
                      {formatLabel(String(key))}
                      {keyInfo[key] && <FieldInfo info={keyInfo[key]} displayBelow={true} />}
                    </label>
                    <div className="relative">
                      <Controller
                        name={key as Path<Partial<T>>}
                        control={control}
                        rules={{
                          required: optionalFields.includes(key) ? false : 'This field is required',
                          validate: (value) => {
                            if (percentageFieldsDict[keyStr]) {
                              if (Number(value) < 1 || Number(value) > 100) {
                                return `${percentageFieldsDict[keyStr]} must be between 1% and 100%`;
                              }
                            }

                            if (isGeoField && value) {
                              const isValid = geoConfig?.data.some(
                                (item) => item.id === Number(value)
                              );
                              return isValid || `Invalid ${formatLabel(String(key))} selection`;
                            }

                            if (isParentField && value) {
                              const isValid = filteredOptions.some(
                                (option) => option.value === value
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
                          if (inputType === 'percentage') {
                            return (
                              <div className="relative">
                                <input
                                  type="number"
                                  {...field}
                                  value={Number(field.value) || 0}
                                  min={1}
                                  max={100}
                                  step={0.1}
                                  className={`w-full bg-gray-50 px-3 border-2 border-gray-300 focus:outline-none
                                    focus:border-blue-500 py-2 rounded-md ${
                                    errors[key as string]
                                      ? 'border-red-500 ring-red-500'
                                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                  }`}
                                />
                                <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                              </div>
                            );
                          }

                          if (isGeoField) {
                            return (
                              <select
                                {...field}
                                value={typeof field.value === 'string' || typeof field.value === 'number' ? field.value : ''}
                                disabled={isDisabled}
                                className={`w-full bg-gray-50 px-3 border-2 border-gray-300 focus:outline-none
                                  focus:border-blue-500 py-2 rounded-md ${
                                  errors[key as string]
                                    ? 'border-red-500 ring-red-500'
                                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                }`}
                                onChange={(e) => field.onChange(e.target.value || '')}
                              >
                                <option value="" disabled>Select {formatLabel(String(key))}</option>
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
                                value={typeof field.value === 'string' || typeof field.value === 'number' ? field.value : ''}
                                onChange={(e) => field.onChange(e.target.value || '')}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                              >
                                <option value="" disabled>Select Contact Person</option>
                                {contactPersons.map((contact: { id: number; name: string }) => (
                                  <option key={contact.id} value={contact.id.toString()}>
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
                                value={typeof field.value === 'string' || typeof field.value === 'number' ? field.value : ''}
                                className={`w-full bg-gray-50 px-3 border-2 border-gray-300 focus:outline-none
                                  focus:border-blue-500 py-2 rounded-md ${
                                  errors[key as string]
                                    ? 'border-red-500 ring-red-500'
                                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                }`}
                                onChange={(e) => field.onChange(e.target.value || '')}
                              >
                                <option value="" disabled>Select {formatLabel(String(key))}</option>
                                {filteredOptions.map((option) => (
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
                                checked={!!field.value}
                                onChange={(e) => field.onChange(e.target.checked)}
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
                                value={field.value as string | undefined}
                                onChange={(value) => field.onChange(value || '')}
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
                              value={typeof field.value === 'string' || typeof field.value === 'number' ? field.value : ''}
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
                    {keyInfo.description && <FieldInfo info={keyInfo.description} displayBelow={true} />}
                  </label>
                  <div className="relative">
                    <Controller
                      name={"description" as Path<Partial<T>>}
                      control={control}
                      rules={{ required: optionalFields.includes('description' as keyof T) ? false : 'This field is required' }}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          value={field.value as string | undefined || ''}
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
                  <LoadingAnimation text="Updating..." ringColor="#3b82f6" />
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
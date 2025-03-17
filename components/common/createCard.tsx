'use client'
import { useState, useEffect, InputHTMLAttributes } from 'react';
import { X } from 'lucide-react';
import { useForm, Controller, DefaultValues, Path } from 'react-hook-form';
import LoadingAnimation from './LoadingAnimation';
import { FieldInfo } from './fileFieldInfor';

interface CustomCreateCardProps<T> {
  defaultValues?: Partial<T>;
  onClose: () => void;
  onSubmit: (data: Partial<T>) => Promise<void>;
  selectOptions?: Partial<Record<keyof T, Array<{ value: string; text: string }>>>;
  isLoading: boolean;
  keyInfo?: Partial<Record<keyof T, string>>;
  notEditableFields?: (keyof T)[];
  interfaceKeys: (keyof T)[];
  optionalFields?: (keyof T)[]; // Add optionalFields prop
}

export default function CustomCreateCard<T extends Record<string, any>>({
  defaultValues = {},
  onClose,
  onSubmit,
  selectOptions,
  isLoading,
  keyInfo,
  notEditableFields = [],
  interfaceKeys,
  optionalFields = [],
}: CustomCreateCardProps<T>) {
  const initializedDefaultValues = interfaceKeys.reduce((acc, key) => {
    acc[key] = (defaultValues[key] ?? '') as T[keyof T]
    return acc;
  }, {} as Partial<T>);

  const {
    control,
    handleSubmit,
    watch,
    reset, 
    trigger,
    formState: { errors },
  } = useForm<Partial<T>>({ defaultValues: initializedDefaultValues as DefaultValues<Partial<T>> });

  const minStock = watch('minimum_stock_level' as Path<Partial<T>>);
  const reOrderPoint = watch('re_order_point' as Path<Partial<T>>);
  const reOrderQty = watch('re_order_quantity' as Path<Partial<T>>);
  const safetyQty = watch('safety_stock_level' as Path<Partial<T>>);

  useEffect(() => {
    trigger(['minimum_stock_level', 're_order_point', 'safety_stock_level', 're_order_quantity'] as Path<Partial<T>>[]);
  }, [minStock, reOrderPoint, reOrderQty, safetyQty, trigger]);

  const formatLabel = (str: string) => {
    return str.replace(/_/g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
  };

  const getInputType = (value: any) => {
    if (typeof value === 'boolean') return 'checkbox';
    if (!isNaN(value) && value !== '') return 'number';
    return 'text';
  };

  const onSubmitHandler = async (formData: Partial<T>) => {
    try {
      await onSubmit(formData);
      onClose();
      reset()
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
            <h2 className="text-xl font-semibold">Create New Entry</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {regularFields.map((key) => {
                const inputType = getInputType(initializedDefaultValues[key]);
                const fieldOptions = selectOptions?.[key];
                const info = keyInfo?.[key];

                return (
                  <div key={key as string} className="space-y-2 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700">
                      {formatLabel(String(key))}
                      {info && <FieldInfo info={info} displayBelow={true} />}
                    </label>
                    <div className="relative">
                      <Controller
                        name={key as Path<Partial<T>>}
                        control={control}
                        rules={{
                          required: optionalFields?.includes(key) ? undefined : 'This field is required', // Conditionally set required
                          validate: (value) => {
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
                            return true; // Ensure validation always returns a boolean
                          },
                        }}
                        render={({ field }) =>
                          fieldOptions ? (
                            <select
                              {...field}
                              value={String(field.value ?? '')}
                              className={`w-full bg-gray-50 px-3 border-2 border-gray-300 focus:outline-none
                                focus:border-blue-500 py-2 rounded-md ${
                                errors[key as string] 
                                  ? 'border-red-500 ring-red-500' 
                                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                              }`}
                            >
                              <option value="">Select an option</option>
                              {fieldOptions.map((option, index) => (
                                <option key={index} value={option.value}>
                                  {option.text}
                                </option>
                              ))}
                            </select>
                          ) : inputType === 'checkbox' ? (
                            <input
                              type="checkbox"
                              {...field}
                              checked={!!field.value}
                              className="w-5 h-5"
                            />
                          ) : (
                            <input
                              type={inputType}
                              {...field}
                              value={String(field.value ?? '')} // Ensure value is never undefined
                              className={`w-full bg-gray-50 px-3 border-2 border-gray-300 focus:outline-none
                                focus:border-blue-500 py-2 rounded-md ${
                                errors[key as string] 
                                  ? 'border-red-500 ring-red-500' 
                                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                              }`}
                            />
                          )
                        }
                      />
                      {errors[key as string] && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors[key as string]?.message as string | undefined}
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
                      render={({ field }) => (
                        <textarea
                          {...field}
                          value={String(field.value ?? '')} // Ensure value is never undefined
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
                        {typeof errors.description?.message === 'string' ? errors.description.message : ''}
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
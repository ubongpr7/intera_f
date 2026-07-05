"use client"
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useForm, Controller, Path, DefaultValues } from "react-hook-form";
import dynamic from "next/dynamic";
import LoadingAnimation from "./LoadingAnimation";
import { FieldInfo } from "./fileFieldInfor";
import { isValidPhoneNumber } from "libphonenumber-js";
import { useGetContactPersonQuery, useGetCompanyDataQuery, useGetCompanyContactPersonQuery } from "../../redux/features/company/companyAPISlice";
import {
  useGetCountriesQuery,
  useGetRegionsQuery,
  useGetSubregionsQuery,
  useGetCitiesQuery,
} from "../../redux/features/common/typeOF";
import { toast } from "react-toastify";
import { extractErrorMessage } from "@/lib/utils";
import { ReactSelectField, type SelectOption } from "@/components/ui/react-select-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getCurrencySymbolForProfile } from "@/lib/currency-utils";
import { buildFieldGuidance } from "./fieldInfoGuidance";
import { normalizeFormPayload } from "@/lib/formPayload";

const PhoneInput = dynamic(
  () => import("react-phone-number-input"),
  { 
    ssr: false,
    loading: () => <input className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500" placeholder="Loading phone input..." />
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
  readOnlyFields?: (keyof T)[]; 
  itemTitle?: string;
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
  readOnlyFields = [],
  itemTitle = "Item",
}: CustomCreateCardProps<T>) {
  const getSingleSelectOption = (option: SelectOption | readonly SelectOption[] | null): SelectOption | null => {
    if (Array.isArray(option)) {
      return null;
    }
    return option as SelectOption | null;
  };

  const getFieldErrorMessage = (fieldName: keyof T) => {
    const message = errors[fieldName as string]?.message;
    return typeof message === "string" ? message : message ? String(message) : undefined;
  };

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
        [key]: defaultValues[key] ?? "",
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
      dependsOn: "country",
      watchKey: "country",
    },
    subregion: {
      query: useGetSubregionsQuery,
      data: [] as Array<{ id: string; name: string }>,
      dependsOn: "region",
      watchKey: "region",
    },
    city: {
      query: useGetCitiesQuery,
      data: [] as Array<{ id: string; name: string }>,
      dependsOn: "subregion",
      watchKey: "subregion",
    },
  };
  
  const percentageFieldsDict = {
    discount_rate: "Discount rate",
    tax_rate: "Tax rate",
    supplier_reliability_score: "Supplier reliability score",
  };
  
  Object.entries(geoFields).forEach(([key, config]) => {
    const watchValue = config.watchKey ? watch(config.watchKey as Path<Partial<T>>) : null;
    const { data } = config.query((watchValue || 0) as any, { skip: !watchValue && !!config.dependsOn });
    geoFields[key as keyof typeof geoFields].data = data || [];
  });

  const selectedSupplier = watch("supplier" as Path<Partial<T>>);
  const supplierId =
    typeof selectedSupplier === "string" || typeof selectedSupplier === "number" ? selectedSupplier : undefined;
  const { data: contactPersons = [] } = useGetCompanyContactPersonQuery(supplierId ?? "", { skip: !supplierId });
  useGetCompanyDataQuery("");

  useEffect(() => {
    const resetDependents = (parentKey: keyof T, ...dependentKeys: (keyof T)[]) => {
      const parentValue = watch(parentKey as Path<Partial<T>>);
      if (parentValue) return;
      dependentKeys.forEach((key) => setValue(key as Path<Partial<T>>, "" as any));
    };

    resetDependents("country" as keyof T, "region", "subregion", "city");
    resetDependents("region" as keyof T, "subregion", "city");
    resetDependents("subregion" as keyof T, "city");
    resetDependents("supplier" as keyof T, "contact");
  }, [watch, setValue]);

  const minStock = watch("minimum_stock_level" as Path<Partial<T>>);
  const reorderPoint = watch("reorder_point" as Path<Partial<T>>) ?? watch("re_order_point" as Path<Partial<T>>);
  const reorderQty = watch("reorder_quantity" as Path<Partial<T>>) ?? watch("re_order_quantity" as Path<Partial<T>>);
  const safetyQty = watch("safety_stock_level" as Path<Partial<T>>);
  useEffect(() => {
    trigger([
      "minimum_stock_level",
      "reorder_point",
      "re_order_point",
      "safety_stock_level",
      "reorder_quantity",
      "re_order_quantity",
    ] as Path<Partial<T>>[]);
  }, [minStock, reorderPoint, reorderQty, safetyQty, trigger]);

  const formatLabel = (str: string) => {
    if (str.endsWith("_snapshot")) {
      str = str.replace(/_snapshot$/, "");
    }
    str = str
      .replace("default_uom_code", "default UOM")
      .replace("stock_uom_code", "stock UOM")
      .replace("inventory_item", "inventory item");
    if (str.toLocaleLowerCase().includes('weight')){
      str = str+ ' (kg)'
    }
    return str.replace("first_name", "Name").replace(/_/g, " ").replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
  };
  
  const getInputType = (key: keyof T) => {
    const keyStr = String(key).toLowerCase();
    const percentageList = ['tax_rate', 'discount_rate', 'supplier_reliability_score'];
    const value = defaultValues[key];
    if (selectOptions?.[key]) return "select";
    if (typeof value === "boolean") return "checkbox";


    if (typeof value === "number") return "number";
    if (percentageList.includes(keyStr)) return "percentage";
    if (String(key).toLocaleLowerCase().startsWith('allow')) return 'checkbox';
    if (String(key).toLocaleLowerCase().endsWith('percentage')) return 'percentage';
    if (String(key).toLocaleLowerCase().endsWith('multiplier')) return 'number';
    if (String(key).toLocaleLowerCase().endsWith('weight')) return 'number';
    if (String(key).toLocaleLowerCase().endsWith('price')) return 'number';
    if (String(key).toLocaleLowerCase().endsWith('quantity')) return 'number';
    if (String(key).toLocaleLowerCase().includes('limit')) return 'number';
    if (String(key).toLocaleLowerCase().endsWith('discount')) return 'number';
    if (String(key).toLocaleLowerCase().endsWith('date')) return 'date';
    if (keyStr in geoFields) return "geo-select";
    if (dateFields.includes(key)) return "date";
    if (datetimeFields.includes(key)) return "datetime-local";
    if (keyStr === "phone") return "phone";
    if (keyStr === "website" || keyStr === "link") return "url";
    if (keyStr === "password") return "password";
    if (keyStr === "email") return "email";
    return "text";
    
  };

  const onSubmitHandler = async (formData: Partial<T>) => {
    try {
      await onSubmit(
        normalizeFormPayload(formData, {
          optionalFields,
          hiddenFields,
          dateFields,
          datetimeFields,
        }),
      );
      toast.success("Operation  Successfully");
      onClose();
      reset();
    } catch (error) {
      toast.error(`${extractErrorMessage(error, interfaceKeys as string[])}`);
    }
  };
  

  const isUpdating = useRef(false);
  useEffect(() => {
    const subscription = watch((value, { name: changedField }) => {
      if (isUpdating.current) return;
      isUpdating.current = true;
  
      const clampRate = (rate: number) => Math.min(Math.max(rate, 0), 100);
      const getNum = (val: any) => Math.max(parseFloat(val) || 0, 0);
      const precisionRound = (num: number) => Math.round(num * 100) / 100;
  
      const quantity = getNum(value.quantity);
      const unit_price = getNum(value.unit_price);
      const basePrice = precisionRound(quantity * unit_price);
  
      const directDiscount = changedField === "discount";
      const directTax = changedField === "tax_amount";
  
      let discountRate = directDiscount ? 0 : clampRate(getNum(value.discount_rate));
      let taxRate = directTax ? 0 : clampRate(getNum(value.tax_rate));
      
      const safeUpdate = (field: keyof T, value: number) => {
        const current = getNum((watch(field as Path<Partial<T>>) as number | string | undefined) ?? 0);
        const rounded = precisionRound(value);
        if (!Object.is(current, rounded)) {
          setValue(field as Path<Partial<T>>, rounded as any);
        }
      };
  
      try {
        const discount = directDiscount
          ? getNum(value.discount)
          : basePrice * (discountRate / 100);
        
        const discountedPrice = Math.max(basePrice - discount, 0);
        const tax = directTax
          ? getNum(value.tax_amount)
          : discountedPrice * (taxRate / 100);
  
        if (directDiscount) {
          discountRate = 0;
          safeUpdate("discount_rate", 0);
        }
        if (directTax) {
          taxRate = 0;
          safeUpdate("tax_rate", 0);
        }
  
        if (!directDiscount) safeUpdate("discount", discount);
        if (!directTax) safeUpdate("tax_amount", tax);
  
        const total = discountedPrice + tax;
        safeUpdate("total_price", total);
  
      } finally {
        isUpdating.current = false;
      }
    });
  
    return () => subscription.unsubscribe();
  }, [watch, setValue]);
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const fields = interfaceKeys.filter((key) => !notEditableFields.includes(key));
  const regularFields = fields.filter((key) => String(key) !== "description");
  const hasDescription = fields.some((key) => String(key) === "description");
  const visibleFieldCount = regularFields.length + (hasDescription ? 1 : 0);
  const useSideFormLayout = visibleFieldCount > 6;
  const panelTitle = itemTitle || "Create Item";
  const actionText = panelTitle.toLowerCase().startsWith("update") ? "Save changes" : panelTitle;
  const loadingText = panelTitle.toLowerCase().startsWith("update") ? "Saving..." : "Creating...";
  const descriptionInfoText =
    keyInfo?.description ??
    buildFieldGuidance({
      fieldName: "description",
      label: "Description",
      inputType: "text",
      isOptional: optionalFields.includes("description" as keyof T),
    });

  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        useSideFormLayout ? "flex items-stretch justify-end" : "flex items-center justify-center p-4 md:p-8",
      )}
    >
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} />

      <div
        className={cn(
          "relative flex w-full flex-col overflow-hidden border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_32px_80px_rgba(15,23,42,0.22)] dark:border-slate-800/90 dark:bg-[linear-gradient(180deg,#020617_0%,#0f172a_58%,#111827_100%)] dark:shadow-[0_40px_90px_rgba(2,6,23,0.82)]",
          useSideFormLayout
            ? "ml-auto h-full max-w-[min(56rem,100vw)] rounded-none border-y-0 border-r-0 sm:rounded-l-[34px]"
            : "max-h-[92vh] max-w-5xl rounded-[32px]",
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 z-10 rounded-full border border-white/70 bg-white/85 p-2.5 text-slate-500 shadow-sm backdrop-blur transition hover:bg-white hover:text-slate-800 dark:border-slate-700 dark:bg-slate-950/85 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
        >
          <X className="h-5 w-5 text-gray-500 dark:text-slate-300" />
        </button>
        <form onSubmit={handleSubmit(onSubmitHandler)} className="flex h-full flex-col overflow-hidden">
         <div className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-blue-50/70 px-7 pb-6 pt-7 md:px-8 dark:border-slate-800/80 dark:bg-[linear-gradient(115deg,rgba(15,23,42,0.98),rgba(17,24,39,0.96),rgba(30,41,59,0.96))]">
            <div className="mb-3 inline-flex rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700 shadow-sm dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
              {useSideFormLayout ? "Side form workspace" : "Quick create form"}
            </div>
            <div className="pr-14">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{panelTitle}</h2>
              
            </div>
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

          <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(248,251,255,0.96)_100%)] px-7 py-6 md:px-8 dark:bg-[radial-gradient(circle_at_top,rgba(30,41,59,0.96)_0%,rgba(15,23,42,0.98)_52%,rgba(2,6,23,1)_100%)]">
            <div className="grid grid-cols-1 gap-4 pb-4 md:grid-cols-2">
              {regularFields.map((key) => {
                const isReadOnly = readOnlyFields.includes(key);
                const keyStr = String(key).toLowerCase();
                const inputType = getInputType(key);
                const isGeoField = inputType === "geo-select";
                const isOptional = optionalFields.includes(key);
                const geoConfig = isGeoField ? geoFields[keyStr as keyof typeof geoFields] : null;
                const isDisabled = geoConfig?.dependsOn ? !watch(geoConfig.dependsOn as Path<Partial<T>>) : false;
                const readonlyStyles = "cursor-not-allowed border-slate-200 bg-slate-100/90 text-slate-500 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-400";
                const fieldInfoText =
                  keyInfo?.[key] ??
                  buildFieldGuidance({
                    fieldName: String(key),
                    label: formatLabel(String(key)),
                    inputType,
                    isOptional,
                    isReadOnly,
                    isSelect: inputType === "select" || inputType === "geo-select" || key === "contact",
                  });

                const isContactField = key === "contact";
                const isSupplierSelected = !!selectedSupplier;
                const isCheckbox = inputType === "checkbox";

                return (
                  <div
                    key={`field-${String(key)}`}
                    className={cn(
                      "relative z-0 min-w-[220px] rounded-[26px] border border-slate-200/80 bg-white/85 p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] backdrop-blur hover:z-30 focus-within:z-30 dark:border-slate-800 dark:bg-slate-950/72 dark:shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]",
                      isCheckbox ? "md:col-span-2" : "",
                    )}
                  >
                    <label className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      <span>
                        {formatLabel(String(key))} {String(key).toLocaleLowerCase().includes('price') ? getCurrencySymbolForProfile() : ''}
                      </span>
                       {isOptional && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] tracking-[0.14em] text-slate-500 dark:bg-slate-800 dark:text-slate-300">(Optional)</span>}
                      <FieldInfo info={fieldInfoText} displayBelow={true} />
                    </label>
                    <div className="relative">
                      <Controller
                        name={key as Path<Partial<T>>}
                        control={control}
                        rules={{
                          required: isOptional ? false : "This field is required",
                          validate: (value) => {
                            if (percentageFieldsDict[keyStr as keyof typeof percentageFieldsDict]) {
                              if (Number(value) < 1 || Number(value) > 100) {
                                return `${percentageFieldsDict[keyStr as keyof typeof percentageFieldsDict]} must be between 1% and 100%`;
                              }
                            }

                            if (key === "discount_rate" && Number(value) > 100) {
                              return "Discount rate cannot exceed 100%";
                            }
                            if (key === "tax_rate" && Number(value) > 100) {
                              return "Tax rate cannot exceed 100%";
                            }
                            if (isGeoField && value) {
                              const isValid = geoConfig?.data.some(
                                (item) => item.id === Number(value)
                              );
                              return isValid || `Invalid ${formatLabel(String(key))} selection`;
                            }
                            if (inputType === "phone" && value && !isValidPhoneNumber(value?.toString())) {
                              return "Invalid phone number";
                            }

                            if (key === "safety_stock_level" && typeof value === "number" && Number(value) > Number(minStock)) {
                              return "Must be ≤ minimum stock level";
                            }
                            if (key === "minimum_stock_level" && typeof value === "number") {
                              if (Number(value) <= Number(safetyQty)) return "Must be > safety stock level";
                              if (Number(value) >= Number(reorderPoint)) return "Must be < reorder point";
                            }
                            if ((key === "reorder_point" || key === "re_order_point") && typeof value === "number") {
                              if (Number(value) <= Number(minStock)) return "Must be > minimum stock level";
                              if (Number(value) >= Number(reorderQty)) return "Must be < reorder quantity";
                            }
                            if ((key === "reorder_quantity" || key === "re_order_quantity") && typeof value === "number" && Number(value) <= Number(reorderPoint)) {
                              return "Must be > reorder point";
                            }
                            return true;
                          },
                        }}
                        render={({ field }) => {
                          if (inputType === "percentage") {
                            return (
                              <div className="relative">
                                <Input
                                  type="number"
                                  min={1}
                                  max={100}
                                  step={0.1}
                                  value={field.value?.toString() ?? ""}
                                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                  onBlur={field.onBlur}
                                  className={cn(
                                    "h-12 rounded-2xl border-slate-200 bg-slate-50/80 pr-10 text-sm shadow-none focus:bg-white focus-visible:border-blue-400 focus-visible:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800",
                                    errors[key as string] ? "border-red-400 focus-visible:ring-red-500/20" : "",
                                  )}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 dark:text-slate-500">%</span>
                              </div>
                            );
                          }
                          if (isReadOnly) {
                            return (
                              <Input
                                type="text"
                                readOnly
                                value={field.value?.toString() ?? ""}
                                className={cn("h-12 rounded-2xl px-4 text-sm shadow-none", readonlyStyles)}
                              />
                            );
                          }
                          
                          if (isGeoField) {
                            const options = geoConfig?.data.map((item) => ({
                              value: item.id?.toString(),
                              label: item.name,
                            })) || [];
                            return (
                              <ReactSelectField
                                options={options}
                                value={options.find((option) => option.value === field.value?.toString()) || null}
                                onChange={(option) => {
                                  const nextOption = getSingleSelectOption(option);
                                  if (nextOption) {
                                    field.onChange(nextOption.value);
                                  } else {
                                    field.onChange("");
                                  }
                                }}
                                onBlur={field.onBlur}
                                isDisabled={isDisabled}
                                placeholder={`Select ${formatLabel(String(key))}`}
                                isSearchable
                                isClearable
                                className={cn(
                                  "w-full",
                                  errors[key as string] ? "border-red-500" : ""
                                )}
                                error={getFieldErrorMessage(key)}
                              />
                            );
                          }

                          if (isContactField) {
                            const options = contactPersons.map((contact) => ({
                              value: contact.id.toString(),
                              label: contact.name,
                            }));
                            return (
                              <ReactSelectField
                                options={options}
                                value={options.find((option) => option.value === field.value?.toString()) || null}
                                onChange={(option) => {
                                  const nextOption = getSingleSelectOption(option);
                                  if (nextOption) {
                                    field.onChange(nextOption.value);
                                  } else {
                                    field.onChange("");
                                  }
                                }}
                                onBlur={field.onBlur}
                                isDisabled={!isSupplierSelected}
                                placeholder="Select Contact Person"
                                isSearchable
                                isClearable
                                className={cn(
                                  "w-full",
                                  errors[key as string] ? "border-red-500" : ""
                                )}
                                error={getFieldErrorMessage(key)}
                              />
                            );
                          }
                          if (inputType === "select") {
                            const options = (selectOptions[key] || []).map((option) => ({
                              value: option.value.toString(),
                              label: option.text,
                            }));
                            return (
                              <ReactSelectField
                                options={options}
                                value={options.find((option) => option.value === field.value?.toString()) || null}
                                onChange={(option) => {
                                  const nextOption = getSingleSelectOption(option);
                                  if (nextOption) {
                                    field.onChange(nextOption.value);
                                  } else {
                                    field.onChange("");
                                  }
                                }}
                                onBlur={field.onBlur}
                                placeholder={`Select ${formatLabel(String(key))}`}
                                isSearchable
                                isClearable
                                className={cn(
                                  "w-full",
                                  errors[key as string] ? "border-red-500" : ""
                                )}
                                error={getFieldErrorMessage(key)}
                              />
                            );
                          }

                          if (inputType === "checkbox") {
                            return (
                              <div className="flex min-h-[54px] items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/80">
                                <div className="pr-4">
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-100">{field.value ? "Enabled" : "Disabled"}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Toggle this option for the record you are creating.</p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={!!field.value}
                                  onChange={(e) => field.onChange(e.target.checked)}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                  className="h-5 w-5 rounded-md border-slate-300 text-blue-600 shadow-sm focus:ring-4 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900"
                                />
                              </div>
                            );
                          }

                          if (inputType === "phone") {
                            return (
                              <PhoneInput
                                value={field.value as string}
                                onChange={(value) => field.onChange(value)}
                                onBlur={field.onBlur}
                                inputRef={field.ref}
                                name={field.name}
                                international
                                defaultCountry="NG"
                                className={cn(
                                  "w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 shadow-none transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:focus-within:bg-slate-800",
                                  errors[key as string] ? "border-red-400 focus-within:ring-red-500/20" : "",
                                )}
                              />
                            );
                          }

                          return (
                            <Input
                              type={inputType}
                              {...field}
                              value={field.value as string | number | readonly string[] | undefined}
                              className={cn(
                                "h-12 rounded-2xl border-slate-200 bg-slate-50/80 px-4 text-sm shadow-none focus:bg-white focus-visible:border-blue-400 focus-visible:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800",
                                errors[key as string] ? "border-red-400 focus-visible:ring-red-500/20" : "",
                              )}
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
              <div className="col-span-full mt-2 rounded-[26px] border border-slate-200/80 bg-white/85 p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/72 dark:shadow-[0_22px_48px_-30px_rgba(2,6,23,0.9)]">
                <div className="space-y-2">
                  <label className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Description
                    {optionalFields.includes("description" as keyof T) && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] tracking-[0.14em] text-slate-500 dark:bg-slate-800 dark:text-slate-300">(Optional)</span>}
                    <FieldInfo info={descriptionInfoText} displayBelow={true} />
                  </label>
                  <div className="relative">
                    <Controller
                      name={"description" as Path<Partial<T>>}
                      control={control}
                      rules={{ required: optionalFields.includes("description" as keyof T) ? false : "This field is required" }}
                      render={({ field }) => (
                        <Textarea
                          rows={6}
                          value={field.value?.toString() ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          className={cn(
                            "min-h-[180px] rounded-[24px] border-slate-200 bg-slate-50/80 px-4 py-3 text-sm shadow-none focus:bg-white focus-visible:border-blue-400 focus-visible:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800",
                            errors.description ? "border-red-400 focus-visible:ring-red-500/20" : "",
                          )}
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

          <div className="sticky bottom-0 border-t border-slate-200/80 bg-white/90 px-7 py-5 backdrop-blur md:px-8 dark:border-slate-800 dark:bg-slate-950/88">
            <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="h-11 rounded-2xl border-slate-200 px-5 text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 dark:hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-11 rounded-2xl px-5 mr-20 shadow-[0_18px_40px_-24px_rgba(37,99,235,0.65)]"
              >
                {isLoading ? (
                  <LoadingAnimation text={loadingText} ringColor="#ffffff" />
                ) : (
                  actionText
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

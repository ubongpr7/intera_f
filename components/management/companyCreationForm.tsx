'use client';
import { useCreateCompanyProfileMutation } from '../../redux/features/management/companyProfileApiSlice';
import { useEffect, useState } from 'react';
import { useForm, SubmitHandler,Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Step1, Step2, Step3, Step4 } from './createSteps';
import { Address } from '../interfaces/management';
import { useRouter } from 'nextjs-toploader/app'
import { useCreateCompanyProfileAddressMutation,useGetOwnerCompanyProfileMutation  } from '../../redux/features/management/companyProfileApiSlice';
import {
  useGetCountriesQuery,
  useGetRegionsQuery,
  useGetSubregionsQuery,
  useGetCitiesQuery,
} from '../../redux/features/common/typeOF';

import Select from 'react-select'; // For better dropdown UI

type FormData = {
  name: string;
  industry: string;
  founded_date?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  phone?: string;
  email?: string;
  tax_id?: string;
  employees_count?: number;
  currency: string;
};

export default function CompanyForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [createCompany] = useCreateCompanyProfileMutation();
  const router = useRouter();
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    trigger 
  } = useForm<FormData>();

  const handleBack = () => currentStep > 1 && setCurrentStep(prev => prev - 1);

  const handleNext = async () => {
    let isValid = false;
    
    // Validate current step fields
    switch(currentStep) {
      case 1: 
        isValid = await trigger(['name', 'industry']);
        break;
      case 2:
        isValid = await trigger(['founded_date', 'website']);
        break;
      case 3:
        isValid = await trigger(['phone', 'email']);
        break;
      case 4:
        isValid = await trigger(['currency']);
        break;
      default:
        isValid = true;
    }

    if (isValid && currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      await createCompany(data).unwrap();
      toast.success('Company profile created!');
      router.push('/profile/create/address');
    } catch (error) {
      toast.error('Failed to create company profile');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-gray-100 rounded-lg shadow-md">
    <div className= "flex justify-center mb-3 font-bold text-2xl"><h1>Create Company Profile</h1></div>
      <div className="flex items-center mb-8">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
        >
          ←
        </button>
        <div className="flex-1 text-center">
          <div className="flex justify-center space-x-2 mb-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-2 w-8 rounded-full ${currentStep >= step ? 'bg-blue-600' : 'bg-gray-200'}`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">Step {currentStep} of 4</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {currentStep === 1 && <Step1 register={register} errors={errors} />}
        {currentStep === 2 && <Step2 register={register} />}
        {currentStep === 3 && <Step3 register={register} errors={errors} />}
        {currentStep === 4 && <Step4 register={register} errors={errors} />}

        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Back
          </button>
          
          {currentStep < 4 ? (
            <div

              onClick={handleNext}
              className="px-4 py-2 cursor-pointer text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Next
            </div>
          ) : (
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              Create Company
            </button>
          )}
        </div>
      </form>
    </div>
  );
}


interface AddressFormProps {
  defaultValues?: Partial<Address>;
}
interface IdName{
  id:string;
  name:string;
}

export function AddressForm({ defaultValues }: AddressFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Address>({
    defaultValues,
  });
  const router = useRouter();

  const [createCompanyProfileAddress, { isLoading, isError, isSuccess }] =
    useCreateCompanyProfileAddressMutation();

  // Fetch the company profile for the authenticated user
  const [getOwnerCompanyProfile, { data: companyProfile }] = useGetOwnerCompanyProfileMutation();

  useEffect(() => {
    getOwnerCompanyProfile(1).unwrap().then((data) => {
      if (data?.id) {
        // Set the company ID in the hidden input field
        setValue('company', data.id);
      }
    }).catch((error) => {
    });
  }, [getOwnerCompanyProfile, setValue]);
  
  const { data: countries } = useGetCountriesQuery();

  // Fetch regions based on selected country
  const selectedCountry = watch('country');
  const { data: regions } = useGetRegionsQuery(selectedCountry || 0, {
    skip: !selectedCountry, // Skip if no country is selected
  });

  // Fetch subregions based on selected region
  const selectedRegion = watch('region');
  const { data: subregions } = useGetSubregionsQuery(selectedRegion || 0, {
    skip: !selectedRegion, // Skip if no region is selected
  });

  // Fetch cities based on selected subregion
  const selectedSubregion = watch('subregion');
  const { data: cities } = useGetCitiesQuery(selectedSubregion || 0, {
    skip: !selectedSubregion, // Skip if no subregion is selected
  });

  const onSubmit: SubmitHandler<Address> = async (data) => {
    try {
      await createCompanyProfileAddress(data).unwrap();
      toast.success('Address created successfully!');
      router.push('/dashboard');

    } catch (error) {
    }
  };

  // Custom styles for react-select
  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      backgroundColor: 'rgb(249 250 251)', // bg-gray-50
      borderColor: 'rgb(209 213 219)', // border-gray-300
      borderRadius: '0.375rem', // rounded-md
      boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', // shadow-sm
      '&:hover': {
        borderColor: 'rgb(59 130 246)', // focus:border-blue-500
      },
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? 'rgb(59 130 246)' : 'white', // Selected option
      color: state.isSelected ? 'white' : 'black',
      '&:hover': {
        backgroundColor: 'rgb(59 130 246)', // Hover option
        color: 'white',
      },
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: 'white', // Dropdown menu background
    }),
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Hidden input for company ID */}
      <input
        type="hidden"
        {...register('company')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Country</label>
          <Controller
            name="country"
            control={control}
            rules={{ required: 'Country is required' }}
            render={({ field }) => (
              <Select
                {...field}
                options={countries?.map((c) => ({ value: c.id, label: c.name }))}
                onChange={(option) => field.onChange(option?.value)}
                value={
                  countries?.find((c) => c.id === field.value)
                    ? { value: field.value, label: countries.find((c) => c.id === field.value)?.name }
                    : null
                }
                placeholder="Select a country"
                styles={customStyles}
              />
            )}
          />
          {errors.country && (
            <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
          )}
        </div>

        {/* Region/State */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Region/State</label>
          <Controller
            name="region"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={regions?.map((r) => ({ value: r.id, label: r.name }))}
                onChange={(option) => field.onChange(option?.value)}
                value={
                  regions?.find((r) => r.id === field.value)
                    ? { value: field.value, label: regions.find((r) => r.id === field.value)?.name }
                    : null
                }
                placeholder="Select a region"
                isDisabled={!selectedCountry}
                styles={customStyles}
              />
            )}
          />
        </div>

        {/* Subregion/LGA */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Subregion/LGA</label>
          <Controller
            name="subregion"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={subregions?.map((s) => ({ value: s.id, label: s.name }))}
                onChange={(option) => field.onChange(option?.value)}
                value={
                  subregions?.find((s) => s.id === field.value)
                    ? { value: field.value, label: subregions.find((s) => s.id === field.value)?.name }
                    : null
                }
                placeholder="Select a subregion"
                isDisabled={!selectedRegion}
                styles={customStyles}
              />
            )}
          />
        </div>

        {/* City/Town */}
        <div>
          <label className="block text-sm font-medium text-gray-700">City/Town</label>
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={cities?.map((c) => ({ value: c.id, label: c.name }))}
                onChange={(option) => field.onChange(option?.value)}
                value={
                  cities?.find((c) => c.id === field.value)
                    ? { value: field.value, label: cities.find((c) => c.id === field.value)?.name }
                    : null
                }
                placeholder="Select a city"
                isDisabled={!selectedSubregion}
                styles={customStyles}
              />
            )}
          />
        </div>

        {/* Apartment Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Apartment Number</label>
          <input
            type="number"
            {...register('apt_number')}
            className="mt-1 block w-full bg-gray-50 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        {/* Street Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Street Number</label>
          <input
            type="number"
            {...register('street_number')}
            className="mt-1 block w-full bg-gray-50 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        {/* Street */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Street</label>
          <input
            type="text"
            {...register('street')}
            className="mt-1 block w-full bg-gray-50 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        {/* Postal Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Postal Code</label>
          <input
            type="text"
            {...register('postal_code')}
            className="mt-1 block w-full bg-gray-50 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
        >
          {isLoading ? 'Submitting...' : 'Save Address'}
        </button>
      </div>

      {/* Success/Error Messages */}
      {isSuccess && (
        <p className="text-green-500 text-sm mt-2">Address created successfully!</p>
      )}
      {isError && (
        <p className="text-red-500 text-sm mt-2">Failed to create address. Please try again.</p>
      )}
    </form>
  );
}
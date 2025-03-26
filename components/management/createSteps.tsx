// components/company/steps/Step1.tsx (Basic Info)
import { useGetTypesByModelQuery } from '../../redux/features/common/typeOF';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { useGetCurrenciesQuery,useGetCurrencyQuery } from '../../redux/features/common/typeOF';
export function Step1({ register, errors }: { 
    register: UseFormRegister<any>;
    errors: FieldErrors<any>;
  }) {
    const { data: industryTypes, isLoading, error } = useGetTypesByModelQuery('industry');
  
    return (
      <div className="space-y-4">
        {/* Company Name field remains unchanged */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Company Name*</label>
          <input
            {...register('name', { required: 'Company name is required' })}
            className="mt-1 block w-full bg-gray-50 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {errors.name && typeof errors.name.message === 'string' && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>
  
        {/* Updated Industry field with select */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Industry*</label>
          <select
            {...register('industry', { required: 'Industry is required' })}
            className="mt-1 block w-full bg-gray-50 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            disabled={isLoading || !!error}
          >
            {error ? (
              <option value="">Error loading industries</option>
            ) : isLoading ? (
              <option value="">Loading industries...</option>
            ) : industryTypes && industryTypes.length > 0 ? (
              <>
                <option value="" disabled>Select an industry</option>
                {industryTypes.map((industryType) => (
                  <option key={industryType.id} value={industryType.id}>
                    {industryType.name}
                  </option>
                ))}
              </>
            ) : (
              <option value="">No industries available</option>
            )}
          </select>
          {errors.industry && typeof errors.industry.message === 'string' && <p className="text-red-500 text-sm mt-1">{errors.industry.message}</p>}
        </div>
  
        {/* Founded Date field remains unchanged */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Founded Date</label>
          <input
            type="date"
            {...register('founded_date')}
            className="mt-1 block w-full bg-gray-50 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>
    );
  }

// components/company/steps/Step2.tsx (Social Media)
export  function Step2({ register }: { register: UseFormRegister<any> }) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Website</label>
          <input
            type="url"
            {...register('website')}
            className="mt-1 block w-full rounded-md bg-gray-50 border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="https://www.example.com"
          />
        </div>
        
  
        <div>
          <label className="block text-sm font-medium text-gray-700">LinkedIn</label>
          <input
            type="url"
            {...register('linkedin')}
            className="mt-1 block w-full rounded-md border bg-gray-50 border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="https://linkedin.com/company"
          />
        </div>
  
        {/* Add similar fields for Twitter, Facebook, Instagram */}
      </div>
    );
  }


export  function Step3({ register, errors }: { 
    register: UseFormRegister<any>;
    errors: FieldErrors<any>;
  }) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input
            {...register('phone')}
            className="mt-1 block w-full rounded-md  bg-gray-50 border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="+1 234 567 890"
          />
        </div>
  
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            {...register('email')}
            className="mt-1 block w-full bg-gray-50 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="contact@company.com"
          />
        </div>
  
        <div>
          <label className="block text-sm  font-medium text-gray-700">Tax ID/VAT Number</label>
          <input
            {...register('tax_id')}
            className="mt-1 block w-full bg-gray-50 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="GB123456789"
          />
        </div>
      </div>
    );
  }

 
export function Step4({ register, errors }: { 
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
}) {
  const { data: response, isLoading, error } = useGetCurrencyQuery();

  // Extract currencies from the response
  const currencies = response || [];

  return (
    <div className="space-y-4">
      {/* Number of Employees field */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Number of Employees</label>
        <input
          type="number"
          {...register('employees_count')}
          className="mt-1 block w-full bg-gray-50 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      {/* Currency field */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Base Currency*</label>
        <select
          {...register('currency', { required: 'Currency is required' })}
          className="mt-1 block w-full bg-gray-50 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          disabled={isLoading || !!error}
        >
          {error ? (
            <option value="">Error loading currencies</option>
          ) : isLoading ? (
            <option value="">Loading currencies...</option>
          ) : currencies.length > 0 ? (
            <>
              <option value="" disabled>Select a currency</option>
              {currencies
                .filter((currency) => currency.code !== null) // Filter out currencies with null codes
                .map((currency) => (
                  <option key={currency.id} value={currency.id}>
                    {currency.code}
                  </option>
                ))}
            </>
          ) : (
            <option value="">No currencies available</option>
          )}
        </select>
        {/* Safely access the currency error */}
        {errors?.currency && typeof errors.currency.message === 'string' && (
          <p className="text-red-500 text-sm mt-1">{errors.currency.message}</p>
        )}
      </div>
    </div>
  );
}
'use client'
import DetailCard from '../common/Detail';
import { CompanyDataInterface } from '../interfaces/company';
import LoadingAnimation from '../common/LoadingAnimation';
import { CompanyKeyInfo } from './selectOptions';
import { useGetCurrencyQuery } from '../../redux/features/common/typeOF';
import { useGetCompanyQuery,useUpdateCompanyMutation } from '../../redux/features/company/companyAPISlice';

export default function CompanyDetail({ id }: { id: string }) {
  const { data: Company, isLoading,refetch  } = useGetCompanyQuery(id);
  const CompanyDataInterface = Company as CompanyDataInterface;
  const [updateCompany,{isLoading:updateIsLoading}] = useUpdateCompanyMutation();

  
  const handleUpdate = async (updatedData: Partial<CompanyDataInterface>) => {
    await updateCompany({ id: CompanyDataInterface.id, data: updatedData }).unwrap();
    await refetch();

  };


const { data: response,isLoading:currencyLoading,error:currencyError } = useGetCurrencyQuery();
  const currencies = response||[]
  

  const currencyOptions = currencies.map(currency => ({
  value: currency.id,
  text: `${currency.code} `
}));
 
  const  selectOptions = {
          
    currency:currencyOptions,
  }
//////////////////////////////




  if (isLoading) return <div>
  <div className="text-center flex items-center justify-center py-8 text-gray-500 ">
  <LoadingAnimation text="Loading..." ringColor="#3b82f6" />
  </div>
  </div>;
  if (!Company) return <div>Company not found</div>;

  
  return (
    
    <DetailCard 
    titleField={'name'}
      data={CompanyDataInterface}
      notEditableFields={['id','company_type', 'created_at','updated_at',]}
      updateMutation={handleUpdate}
      excludeFields={['id','is_customer','is_supplier','is_manufacturer',]}
      selectOptions={selectOptions}
      isLoading={updateIsLoading}
      policyFields={['description']}
      keyInfo={CompanyKeyInfo}
      optionalFields={['is_customer','is_supplier','is_manufacturer']}

    />
  );
}

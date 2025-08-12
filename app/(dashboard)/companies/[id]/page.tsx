import CompanyDetail from "@/components/company/Details";
import CompanyAddressView from "@/components/company/contactAdress";
import Tabs from '@/components/common/Tabs';
import ContactPersonView from "@/components/company/Contact";



export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const tabs = [
    {
      id: 'all',
      label: 'Company Details',
      content:<CompanyDetail id={id} />,
    },
   
    {
      id: 'address',
      label: 'Company Address(es)',
      content: <CompanyAddressView company_id={id} />,
    },
    {
      id: 'contactPerson',
      label: 'Direct Contacts',
      content: <ContactPersonView company_id={id} />,
    },

    
  ];

  return (
    <div>
    <Tabs items={tabs} 
    className="bg-white  rounded-lg shadow-sm p-4"
    />  
    </div>
  );

}

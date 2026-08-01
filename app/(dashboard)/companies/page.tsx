"use client";

import Tabs from '@/components/common/Tabs';
import CompanyView from '@/components/company/companyView';
import { Building2 } from 'lucide-react';
const CompaniesPage = () => {
  const tabs = [
    {
      id: 'all',
      label: 'All Companies',
      icon: Building2,
      content: <CompanyView />,
    },
    
  ];

  return (
    <div className="companies-page mx-auto w-full max-w-[1800px] space-y-6 px-4 py-6 lg:px-8 2xl:px-10">
      <div className="companies-page-heading">
        <div className="companies-page-icon"><Building2 className="h-5 w-5" /></div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Partner directory</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">Affiliated Companies</h1>
        </div>
      </div>
      <Tabs 
        items={tabs} 
        className="companies-page-tabs rounded-[28px] bg-white p-4 shadow-sm"
      />
    </div>
  );
};

export default CompaniesPage;

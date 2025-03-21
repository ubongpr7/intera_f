import Tabs from '../../components/common/Tabs';
import CompanyView from '../../components/company/companyView';
const CompaniesPage = () => {
  const tabs = [
    {
      id: 'all',
      label: 'All Companies',
      content: <CompanyView />,
    },
    
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Inventory Management</h1>
      <Tabs 
        items={tabs} 
        className="bg-white  rounded-lg shadow-sm p-4"
      />
    </div>
  );
};

export default CompaniesPage;
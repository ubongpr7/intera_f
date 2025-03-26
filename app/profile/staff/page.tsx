// app/inventory/page.tsx
import Tabs from '../../../components/common/Tabs';
import StaffCreateCard from 'components/management/Staff';
const StaffPage = () => {
  const tabs = [
    {
      id: 'all',
      label: 'All Staff',
      content: <StaffCreateCard />,
    },
    
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Staff Management</h1>
      <Tabs 
        items={tabs} 
        className="bg-white  rounded-lg shadow-sm p-4"
      />
    </div>
  );
};

export default StaffPage;
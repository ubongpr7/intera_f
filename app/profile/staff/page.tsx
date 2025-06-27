'use client'
import StaffRole from '../../../components/management/roles';
import Tabs from '../../../components/common/Tabs';
import StaffCreateCard from '../../../components/management/Staff';
import StaffGroup from '../../../components/management/groups';
import {useState} from 'react'
const StaffPage = () => {
  const [refetchData,setRefetchData] = useState(false)
  const tabs = [
    {
      id: 'all',
      label: 'All Staff',
      content: <StaffCreateCard refetchData={refetchData} setRefetchData={setRefetchData} />,
    },
    {
      id: 'group',
      label: 'Staff Group',
      content: <StaffGroup refetchData={refetchData} setRefetchData={setRefetchData}  />,
    },
    
    {
      id: 'role',
      label: 'Staff Role',
      content: <StaffRole refetchData={refetchData} setRefetchData={setRefetchData}  />,
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
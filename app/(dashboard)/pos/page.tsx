
import Tabs from '@/components/common/Tabs';
import Configurations from '@/components/pos/Configurations';
import Discounts from '@/components/pos/Discounts';
import Terminals from '@/components/pos/Terminals';
import Sessions from '@/components/pos/Sessions';
import Orders from '@/components/pos/Orders';
import Customers from '@/components/pos/Customers';
import Tables from '@/components/pos/Tables';
import SalesAnalytics from '@/components/pos/SalesAnalytics';

const POSConfigurationPage = () => {
  const tabs = [
    {
      id: 'configurations',
      label: 'Configurations',
      content: <Configurations />,
    },
    {
      id: 'discounts',
      label: 'Discounts',
      content: <Discounts />,
    },
    {
      id: 'terminals',
      label: 'Terminals',
      content: <Terminals />,
    },
    {
      id: 'sessions',
      label: 'Sessions',
      content: <Sessions />,
    },
    {
      id: 'orders',
      label: 'Orders',
      content: <Orders />,
    },
    {
      id: 'customers',
      label: 'Customers',
      content: <Customers />,
    },
    {
      id: 'tables',
      label: 'Tables',
      content: <Tables />,
    },
    {
      id: 'analytics',
      label: 'Sales Analytics',
      content: <SalesAnalytics />,
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">POS Configuration</h1>
      <Tabs 
        items={tabs} 
        className="bg-white  rounded-lg shadow-sm p-4"
      />
    </div>
  );
};

export default POSConfigurationPage;

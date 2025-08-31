
import Tabs from '@/components/common/Tabs';
import Configurations from '@/components/pos/Configurations';
import Discounts from '@/components/pos/Discounts';
import Terminals from '@/components/pos/Terminals';

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

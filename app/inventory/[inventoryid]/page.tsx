import InventoryDetail from "../../../components/inventory/Detail";
import Tabs from '../../../components/common/Tabs';
import StockItems from "../../../components/stock/CreateStockItems";


export default async function InventoryDetailPage({
  params,
}: {
  params: Promise<{ inventoryid: string }>;
}) {
  const inventoryId = (await params).inventoryid;

  const tabs = [
    {
      id: 'details',
      label: 'Inventory Details',
      content:<InventoryDetail id={inventoryId} />

    },
    {
      id: 'stock',
      label: 'Stock Items',
      content:<StockItems reference={inventoryId} />

    },
   
   
   
    
    
  ];
  return (
    <div>
      <Tabs items={tabs} />
    </div>
  );
}

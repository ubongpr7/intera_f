'use client'
import { StockItem } from "../interfaces/stock";
import { Column, DataTable } from "../common/DataTable/DataTable";
import { useGetStockItemDataForInventoryQuery,useCreateStockItemMutation, useGetStockItemDataLocationQuery } from "../../redux/features/stock/stockAPISlice";
import { useEffect, useState } from "react";
import { PageHeader } from "../inventory/PageHeader";
import CustomCreateCard from '../common/createCard';
import { PACKAGING_OPTIONS } from "./options";
import { useGetMinimalInventoryQuery } from "@/redux/features/inventory/inventoryAPiSlice";



const inventoryColumns: Column<StockItem>[] = [
  {
    header: 'Name',
    accessor: 'name',
    className: 'font-medium',
  },
  {
    header: 'Quantity',
    accessor: 'quantity_w_unit',
    render:(value)=>value||0,
    className: 'font-medium',
  },
  {
    header: 'Stock Keeping Unit',
    accessor: 'sku',
    className: 'font-medium',
  },
  
  {
    header: 'Installed In',
    accessor: 'belongs_to',
    className: 'font-medium',
  },
  
  
];

function StockItems({reference}:{reference:string}) {
    const {data:stockItems,isLoading:stockItemsLoading,refetch,error}=useGetStockItemDataForInventoryQuery(reference)
    const [createStockItem, { isLoading: stockItemCreateLoading }] = useCreateStockItemMutation();
    // const [reorderQuantity,setReorderQuantity] = useState(100)
    const [isCreateOpen, setIsCreateOpen] = useState(false); 
    const {data:StockLocationData,isLoading:stockLocationsLoading,}=useGetStockItemDataLocationQuery()
    // const {data:minimalInventory,isLoading:inventoryLoading } =useGetMinimalInventoryQuery(reference)
   
    const stockItemsOptions = stockItems?.map((StockItem:StockItem) => ({
        text: `${StockItem.name } (${StockItem.sku})`,
        value: StockItem.id,
      })) || [];
    const locationOptions = StockLocationData?.map((StockLocationItem) => ({
        text: `${StockLocationItem.name } (${StockLocationItem.code})`,
        value: StockLocationItem.id.toString(),
      })) || [];
    const packagingOptions = PACKAGING_OPTIONS.map((packaging) => ({
        text: `${packaging.label} (${packaging.description})`,
        value: packaging.value,
      })) || [];
      const statusOptions = [
        {"text": "OK", "value": "ok"},
        {"text": "Attention needed", "value": "attention_needed"},
        {"text": "Damaged", "value": "damaged"},
        {"text": "Destroyed", "value": "destroyed"},
        {"text": "Rejected", "value": "rejected"},
        {"text": "Lost", "value": "lost"},
        {"text": "Quarantined", "value": "quarantined"},
        {"text": "Returned", "value": "returned"}
    ]
      const selectionOpions={
        location:locationOptions,
        parent:stockItemsOptions,
        packaging:packagingOptions,
        belongs_to:stockItemsOptions,
        status:statusOptions,
      
      }
    const handleCreate = async (createdData: Partial<StockItem>) => {
      const Data= {...createdData,inventory:reference,}
    try {   
        const response = await createStockItem(Data);
        setIsCreateOpen(false);
        await refetch(); 
    }
    catch (error) {
    }
    };
    const handleRowClick = (row: StockItem) => {

      };

      const interfaceKeys: (keyof StockItem)[] = [
        'name',
        'quantity',
        'purchase_price',
        'status',
        'location',
        'parent',
        'belongs_to',
        'packaging',
        // 'expiry_date',
        'notes',
        'link',
        'delete_on_deplete',

      ];
      
 return (
    <div>
    <PageHeader
            title="Stock Items"
            onClose={() => setIsCreateOpen(true)} // Renamed to onCreate for clarity
          />
      <DataTable<StockItem>
              columns={inventoryColumns}
              data={stockItems || []}
              isLoading={stockItemsLoading}
              onRowClick={handleRowClick}
            />

        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${isCreateOpen ? 'block' : 'hidden'}`}>
                <CustomCreateCard
                  defaultValues={{packaging:'box','quantity':0,status:'ok',purchase_price:0,delete_on_deplete:false}}
                  onClose={() => setIsCreateOpen(false)}
                  onSubmit={handleCreate}
                  isLoading={stockItemCreateLoading}
                  selectOptions={selectionOpions}
                  keyInfo={{location:`Optional, defaults to parent or inventory's category location `}}
                  notEditableFields={[]}
                  interfaceKeys={interfaceKeys}
                  dateFields={['expiry_date']}
                  optionalFields={['parent','notes','belongs_to','link','serial','location','delete_on_deplete']}
                  hiddenFields={{}}
                  itemTitle={'Create Stock Item'}
                />
              </div>
    </div>
  );
}
export default StockItems;

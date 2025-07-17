'use client'
import { PurchaseOrderLineItem } from "../../interfaces/order";
import { Column, DataTable } from "../../common/DataTable/DataTable";
import { useGetPurchseOrderLineItemsQuery,useCreatePurchaseOrderLineItemMutation } from "../../../redux/features/orders/orderAPISlice";
import { useState } from "react";
import { PageHeader } from "../../inventory/PageHeader";
import CustomCreateCard from '../../common/createCard';
import {  useGetStockItemDataQuery } from "@/redux/features/stock/stockAPISlice";


const inventoryColumns: Column<PurchaseOrderLineItem>[] = [
  {
    header: 'Quantity',
    accessor: 'stock_item_name',
    className: 'font-medium',
  },
  {
    header: 'Quantity',
    accessor: 'quantity_w_unit',
    className: 'font-medium',
  },
  {
    header: 'Unit Price',
    accessor: 'unit_price',
    className: 'font-medium',
  },
  {
    header: 'Total Tax',
    accessor: 'tax_amount',
    className: 'font-medium',
  },
  {
    header: 'Total Discount',
    accessor: 'discount',
    className: 'font-medium',
  },
  {
    header: 'Total Price',
    accessor: 'total_price',
    className: 'font-medium',
  },

  
  
];

function PurchaseOrderLineItems({reference}:{reference:string}) {
    const {data:lineItems,isLoading:lineItemsLoading,refetch,error}=useGetPurchseOrderLineItemsQuery(reference)
    const [createLineItem, { isLoading: lineItemCreateLoading }] = useCreatePurchaseOrderLineItemMutation();
    const [isCreateOpen, setIsCreateOpen] = useState(false); // Renamed for clarity
    const {data:stockItems,isLoading:stockItemsLoading,}=useGetStockItemDataQuery(reference)
    
    const handleCreate = async (createdData: Partial<PurchaseOrderLineItem>) => {
    try {   
        const response = await createLineItem({data:createdData,purchase_order_id:reference});
        setIsCreateOpen(false);
        await refetch(); 
    }
    catch (error) {
    }
    };
    const handleRowClick = (row: PurchaseOrderLineItem) => {

      };
      
    const stockItemsOptions = stockItems?.map((StockItem) => ({
      text: `${StockItem.name } (${StockItem.sku})`,
      value: StockItem.id,
    })) || [];
    const selectionOptions={
      stock_item:stockItemsOptions
    }
      const interfaceKeys: (keyof PurchaseOrderLineItem)[] = [
        
        'stock_item',
        'quantity',
        'unit_price',
        'tax_rate',
        'discount_rate',
        'discount',
        'tax_amount',
        'total_price',
      ];
      
 return (
    <div>
    <PageHeader
            title="Purchase Order Line Items"
            onClose={() => setIsCreateOpen(true)} // Renamed to onCreate for clarity
          />
      <DataTable<PurchaseOrderLineItem>
              columns={inventoryColumns}
              data={lineItems || []}
              isLoading={lineItemsLoading}
              onRowClick={handleRowClick}
            />

        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${isCreateOpen ? 'block' : 'hidden'}`}>
                <CustomCreateCard
                  defaultValues={{'quantity': 1, 'unit_price': 0, 'tax_rate': 0, 'discount_rate': 0, 'tax_amount': 0, 'discount': 0, 'total_price': 0}}
                  onClose={() => setIsCreateOpen(false)}
                  onSubmit={handleCreate}
                  isLoading={lineItemCreateLoading}
                  selectOptions={selectionOptions}
                  keyInfo={{}}
                  notEditableFields={['stock_item_name',]}
                  interfaceKeys={interfaceKeys}
                  dateFields={[]}
                  optionalFields={[]}
                  readOnlyFields={['total_price', 'tax_amount', 'discount',]}
                />
              </div>
    </div>
  );
}
export default PurchaseOrderLineItems;

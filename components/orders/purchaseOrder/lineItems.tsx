'use client'
import { PurchaseOrderLineItem } from "../../interfaces/order";
import { Column, DataTable, ActionButton } from "../../common/DataTable/DataTable";
import { useGetPurchseOrderLineItemsQuery,useCreatePurchaseOrderLineItemMutation, useUpdatePurchaseOrderLineItemMutation, useDeletePurchaseOrderLineItemMutation } from "../../../redux/features/orders/orderAPISlice";
import { useState } from "react";
import { PageHeader } from "../../inventory/PageHeader";
import CustomCreateCard from '../../common/createCard';
import {  useGetStockItemDataQuery } from "@/redux/features/stock/stockAPISlice";
import { getCurrencySymbol } from "@/lib/currency-utils";
import { toast } from "react-toastify";
import { Edit, Trash2 } from "lucide-react";

interface Props {
  reference: string;
  currency: string;
  lineItemsLoading: boolean;
  lineItems: PurchaseOrderLineItem[];
  refetch: () => void;
}


function PurchaseOrderLineItems({reference,currency,lineItemsLoading,lineItems,refetch}:Props) {
    const [createLineItem, { isLoading: lineItemCreateLoading }] = useCreatePurchaseOrderLineItemMutation();
    const [updateLineItem, { isLoading: lineItemUpdateLoading }] = useUpdatePurchaseOrderLineItemMutation();
    const [deleteLineItem, { isLoading: lineItemDeleteLoading }] = useDeletePurchaseOrderLineItemMutation();
    const [isCreateOpen, setIsCreateOpen] = useState(false); 
    const [editingLineItem, setEditingLineItem] = useState<PurchaseOrderLineItem | null>(null);
    const {data:stockItems,isLoading:stockItemsLoading,}=useGetStockItemDataQuery(reference)
    
const inventoryColumns: Column<PurchaseOrderLineItem>[] = [
  {
    header: 'Product Name',
    accessor: (row) => row.stock_item_details.name,
    className: 'font-medium',
  },
  {
    header: 'Batch Number',
    accessor: 'batch_number',
    className: 'font-medium',
  },
  {
    header: 'Quantity',
    accessor: 'quantity',
    className: 'font-medium',
  },
 
  {
    header: `Unit Price (${getCurrencySymbol(currency)})`,
    accessor: 'unit_price',
    className: 'font-medium',
  },
  {
    header: `Total Tax  (${getCurrencySymbol(currency)})`,
    accessor: `tax_amount`,
    className: 'font-medium',
  },
  {
    header: `Total Discount  (${getCurrencySymbol(currency)})`,
    accessor: 'discount',
    className: 'font-medium',
  },
  {
    header: `Total Price  (${getCurrencySymbol(currency)})`,
    accessor: 'total_price',
    className: 'font-medium',
  },
];

    const handleCreate = async (createdData: Partial<PurchaseOrderLineItem>) => {
        await createLineItem({data:createdData,purchase_order_id:reference}).unwrap();
        setIsCreateOpen(false);
        await refetch(); 
    
    };

    const handleUpdate = async (updatedData: Partial<PurchaseOrderLineItem>) => {
      if (!editingLineItem) return;
        await updateLineItem({ reference: reference, id: editingLineItem.id, data: updatedData }).unwrap();
        setEditingLineItem(null);
        await refetch();
    };

    const handleDelete = async (id: string) => {
      if (window.confirm("Are you sure you want to delete this line item?")) {
        try {
          await deleteLineItem({reference: reference, id: id}).unwrap();
          await refetch();
          toast.success("Line item deleted successfully!");
        } catch (error) {
          toast.error("Failed to delete line item.");
        }
      }
    };

    const actionButtons: ActionButton<PurchaseOrderLineItem>[] = [
      {
        label: "Edit",
        icon: Edit,
        onClick: (row) => setEditingLineItem(row),
      },
      {
        label: "Delete",
        icon: Trash2,
        onClick: (row) => handleDelete(row.id),
        className: "text-red-600 hover:text-red-800",
      },
    ];

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
      <DataTable<PurchaseOrderLineItem>
              columns={inventoryColumns}
              data={lineItems || []}
              isLoading={lineItemsLoading}
              actionButtons={actionButtons}
              searchableFields={['batch_number', 'quantity', 'unit_price', 'tax_amount', 'discount', 'total_price']}
              filterableFields={['batch_number']}
              sortableFields={['batch_number', 'quantity', 'unit_price', 'tax_amount', 'discount', 'total_price']}
              title="Purchase Order Line Items"
            onClose={() => setIsCreateOpen(true)}
            />

        {(isCreateOpen || editingLineItem) && (
          <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50`}>
            <CustomCreateCard
              defaultValues={editingLineItem || {'quantity': 1, 'unit_price': 0, 'tax_rate': 0, 'discount_rate': 0, 'tax_amount': 0, 'discount': 0, 'total_price': 0}}
              onClose={() => {
                setIsCreateOpen(false);
                setEditingLineItem(null);
              }}
              onSubmit={editingLineItem ? handleUpdate : handleCreate}
              isLoading={lineItemCreateLoading || lineItemUpdateLoading}
              selectOptions={selectionOptions}
              keyInfo={{}}
              notEditableFields={editingLineItem ? ['batch_number'] : []}
              interfaceKeys={interfaceKeys}
              dateFields={[]}
              optionalFields={[]}
              readOnlyFields={['total_price', 'tax_amount', 'discount',]}
              itemTitle={editingLineItem ? 'Update Line Item' : 'Create Line Item'}
            />
          </div>
        )}
    </div>
  );
}
export default PurchaseOrderLineItems;

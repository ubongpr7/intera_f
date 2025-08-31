'use client'
import { StockItem } from "../interfaces/stock";
import { Column, DataTable, ActionButton } from "../common/DataTable/DataTable";
import { useGetStockItemDataForInventoryQuery, useCreateStockItemMutation, useGetStockItemDataLocationQuery, useUpdateStockItemMutation, useDeleteStockItemMutation } from "../../redux/features/stock/stockAPISlice";
import { useEffect, useState } from "react";

import CustomCreateCard from '../common/createCard';
import { PACKAGING_OPTIONS } from "./options";
import { useGetMinimalInventoryQuery } from "@/redux/features/inventory/inventoryAPiSlice";
import { toast } from "react-toastify";
import { Edit, Trash2 } from "lucide-react";
import { get } from "http";
import { formatCurrency, getCurrencySymbolForProfile } from "@/lib/currency-utils";
import { getCookie } from "cookies-next";
import { TableImageHover } from "../common/table-image-render";

interface InventoryColumnRender {
  (value: any, row?: StockItem): React.ReactNode;
}

interface InventoryColumn<T> {
  header: string;
  accessor: keyof T;
  className?: string;
  render?: InventoryColumnRender;
}

const formatQuantity = (value: any): number => {
  value = parseFloat(value);

  if (value === null || value === undefined) return 0;

  const decimalPart = value.toString().split('.')[1];
  if (decimalPart && decimalPart.length > 2) {
    return parseFloat(value.toPrecision(2));
  } else {
    return parseFloat(value.toFixed(2));
  }
};

const inventoryColumns: InventoryColumn<StockItem>[] = [
  {
    header: 'Name',
    accessor: 'name',
    className: 'font-medium',
  },
  {
    header: 'Variant Barcode',
    accessor: 'product_variant',
    className: 'font-medium',
  },
  {
    header: 'Image',
    accessor: 'display_image',
    render: (value: string) => (
      <TableImageHover
              src={value}
              alt="Product Image"
              className="hover:ring-2 hover:ring-blue-500 hover:ring-opacity-50"
            />
          ),
    className: 'font-medium',
  },
  {
    header: 'Quantity',
    accessor: 'quantity',
    render: (value: number) => formatQuantity(value),
    className: 'font-medium',
  },
  {
    header: 'Purchase Price',
    accessor: 'purchase_price',
    render: (value: number) => formatCurrency(`${getCookie('currency') || 'NGN'}`, value),
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
    const [updateStockItem, { isLoading: stockItemUpdateLoading }] = useUpdateStockItemMutation();
    const [deleteStockItem, { isLoading: stockItemDeleteLoading }] = useDeleteStockItemMutation();
    const [isCreateOpen, setIsCreateOpen] = useState(false); 
    const [editingStockItem, setEditingStockItem] = useState<StockItem | null>(null);
    const {data:StockLocationData,isLoading:stockLocationsLoading,}=useGetStockItemDataLocationQuery()
   
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
        await createStockItem(Data).unwrap();
        setIsCreateOpen(false);
        await refetch(); 
        toast.success("Stock item created successfully!");
    }
    catch (error) {
      toast.error("Failed to create stock item.");
    }
    };

    const handleUpdate = async (updatedData: Partial<StockItem>) => {
      if (!editingStockItem) return;
        await updateStockItem({ id: editingStockItem.id, data: updatedData }).unwrap();
        setEditingStockItem(null);
        await refetch();
       
    };

    const handleDelete = async (id: string) => {
      if (window.confirm("Are you sure you want to delete this stock item?")) {
        try {
          await deleteStockItem(id).unwrap();
          await refetch();
          toast.success("Stock item deleted successfully!");
        } catch (error) {
          toast.error("Failed to delete stock item.");
        }
      }
    };

    const actionButtons: ActionButton<StockItem>[] = [
      {
        label: "Edit",
        icon: Edit,
        onClick: (row) => setEditingStockItem(row),
      },
      {
        label: "Delete",
        icon: Trash2,
        onClick: (row) => handleDelete(row.id),
        className: "text-red-600 hover:text-red-800",
      },
    ];

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
        'notes',
        'link',
        // 'delete_on_deplete',

      ];
      
 return (
    <div>
    
      <DataTable<StockItem>
              columns={inventoryColumns}
              data={stockItems || []}
              isLoading={stockItemsLoading}
              onRowClick={handleRowClick}
              actionButtons={actionButtons}
              searchableFields={['name', 'sku']}
              filterableFields={['status']}
              sortableFields={['name', 'sku']}
               title="Stock Items"
            onClose={() => setIsCreateOpen(true)} 
            />

        {(isCreateOpen || editingStockItem) && (
          <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50`}>
            <CustomCreateCard
              defaultValues={editingStockItem || {packaging:'box','quantity':0,status:'ok',purchase_price:0,delete_on_deplete:false}}
              onClose={() => {
                setIsCreateOpen(false);
                setEditingStockItem(null);
              }}
              onSubmit={editingStockItem ? handleUpdate : handleCreate}
              isLoading={stockItemCreateLoading || stockItemUpdateLoading}
              selectOptions={selectionOpions}
              keyInfo={{location:`Optional, defaults to parent or inventory's category location `}}
              notEditableFields={editingStockItem ? ['sku'] : []}
              interfaceKeys={interfaceKeys}
              dateFields={['expiry_date']}
              optionalFields={['parent','notes','belongs_to','link','serial','location','delete_on_deplete']}
              hiddenFields={{}}
              itemTitle={editingStockItem ? 'Update Stock Item' : 'Create Stock Item'}
            />
          </div>
        )}
    </div>
  );
}
export default StockItems;
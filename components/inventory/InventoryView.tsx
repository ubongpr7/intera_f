'use client'
import { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'nextjs-toploader/app';
import { ActionButton, Column, DataTable } from "../common/DataTable/DataTable";
import { InventoryData, inventoryTypes } from "@/redux/features/inventory/inventoryTypes";
import { useGetInventoryDataQuery, useCreateInventoryMutation, useDeleteInventoryMutation } from "../../redux/features/inventory/inventoryAPiSlice";
import CustomCreateCard from '../common/createCard';
import { InventoryInterfaceKeys,defaultValues } from './selectOptions';
import { InventoryKeyInfo } from './selectOptions';
import { useGetUnitsQuery } from "../../redux/features/common/typeOF";
import { useGetInventoryCategoriesQuery } from "../../redux/features/inventory/inventoryAPiSlice";
import { RefetchDataProp } from "@/redux/features/common/commonTypes";
import { formatCurrencyCompact } from '@/lib/currency-utils';
import { buildStructuralLocationScopeParams } from '@/lib/structuralLocationScope';
import { formatMachineLabel } from '@/lib/displayLabels';
import { useStructuralLocationScope } from '@/hooks/useStructuralLocationScope';
import { Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import StructuralLocationScopeSelect from '@/components/stock/StructuralLocationScopeSelect';
import { useGetSupplersQuery } from '@/redux/features/company/companyAPISlice';
import { extractErrorMessage } from '@/lib/utils';
import { confirmAction } from '../common/confirmAction';

const renderInventoryThumbnail = (imageUrl: string | null | undefined, name: string) => (
  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
    {imageUrl ? (
      <Image src={imageUrl} alt={name} fill className="object-cover" sizes="44px" />
    ) : (
      <div className="flex h-full w-full items-center justify-center bg-gray-100 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        Inv
      </div>
    )}
  </div>
)

const inventoryColumns: Column<InventoryData>[] = [
  {
    header: 'Name',
    accessor: 'name',
    render: (value, row) => (
      <div className="flex items-center gap-3">
        {renderInventoryThumbnail(row.display_image || row.product_variant_image_url, row.name)}
        <div className="min-w-0">
          <div className="truncate font-medium text-gray-900">{value}</div>
          <div className="truncate text-xs text-gray-500">{row.category_name || formatMachineLabel(row.inventory_type, 'Inventory item')}</div>
        </div>
      </div>
    ),
    className: 'font-medium',
  },
  {
    header: 'SKU',
    accessor: 'sku_snapshot',
    render: (value) => value || 'Not set',
    className: 'font-medium',
  },
  {
    header: 'On Hand',
    accessor: 'current_stock_level',
    className: 'font-medium',
  },
  {
    header: 'Available',
    accessor: 'quantity_available',
    className: 'font-medium',
  },
  {
    header: 'Store',
    accessor: 'location_name',
    render: (value, row) => {
      const locations = Array.isArray(row.location_breakdown) ? row.location_breakdown : [];
      const extraCount = Math.max(locations.length - 1, 0);
      return (
        <div className="min-w-[180px]">
          <div className="font-medium text-gray-900">{String(value || "Unassigned")}</div>
          <div className="text-xs text-gray-500">
            {extraCount > 0 ? `+${extraCount} more store${extraCount > 1 ? "s" : ""}` : "Primary structural store"}
          </div>
        </div>
      );
    },
  },
  {
    header: 'Stock Value',
    accessor: 'total_stock_value',
    render:(value)=>formatCurrencyCompact('NGN',value),
    className: 'font-medium',
  },
  {
    header: 'Inventory Type',
    accessor: 'inventory_type',
    render: (value) => formatMachineLabel(value, 'Not set'),
    className: 'font-medium',
  },
  {
    header: 'Category',
    accessor: 'category_name',
    render: (value) => value || 'Uncategorized',
    info: 'Operational category assigned to the inventory item',
  },
  {
    header: 'Reorder Point',
    accessor: 'reorder_point',
    render: (value) => value || '0',
  },
];


type InventoryViewProps = RefetchDataProp & {
  selectedLocationIds?: string[];
  onSelectedLocationIdsChange?: (value: string[]) => void;
};

function InventoryView({
  refetchData,
  setRefetchData,
  selectedLocationIds: controlledSelectedLocationIds,
  onSelectedLocationIdsChange,
}: InventoryViewProps) {
  const [internalSelectedLocationIds, setInternalSelectedLocationIds] = useStructuralLocationScope();
  const isLocationScopeControlled = controlledSelectedLocationIds !== undefined || onSelectedLocationIdsChange !== undefined;
  const selectedLocationIds = controlledSelectedLocationIds ?? internalSelectedLocationIds;
  const handleSelectedLocationIdsChange = onSelectedLocationIdsChange ?? setInternalSelectedLocationIds;
  const inventoryQuery = useMemo(
    () => buildStructuralLocationScopeParams(selectedLocationIds),
    [selectedLocationIds],
  );
  const { data, isLoading, refetch, error } = useGetInventoryDataQuery(inventoryQuery);
  const [createInventory, { isLoading: inventoryCreateLoading }] = useCreateInventoryMutation();
  const [deleteInventory] = useDeleteInventoryMutation();
  const [isCreateOpen, setIsCreateOpen] = useState(false); // Renamed for clarity
  const router = useRouter();

  const handleCreate = async (createdData: Partial<InventoryData>) => {
    await createInventory(createdData).unwrap();
    setIsCreateOpen(false); 
    await refetch(); 
  };

    //////////////////////////////
    const { data: categories = [], refetch:refetchCategory } = useGetInventoryCategoriesQuery();
      const { data: units=[] } = useGetUnitsQuery();
      const { data: suppliers=[] } = useGetSupplersQuery();
      

      
  useEffect(() => {
    if (!refetchData) {
      return;
    }

    refetchCategory();
    setRefetchData(false);
  }, [refetchCategory, refetchData, setRefetchData]);

     const unitOptions = units.map((unit: any) => ({
   value: unit.code,
  text: `${unit.name}${unit.abbreviated_name ? ` (${unit.abbreviated_name})` : ""}`,
})); 
      const typeOptions = inventoryTypes ? inventoryTypes.map((inventory_type: any) => ({
        value: inventory_type.id,
        text: inventory_type.text,
      })) : [];
      const supplierOptions = suppliers.map((supplier) => ({
        value: String(supplier.id),
        text: supplier.name,
      }));
    
      const categoryOptions = categories.map((cat: any) => ({
        value: cat.id,
        text: cat.name,
      }));
  

    const  selectOptions = {
          
            inventory_category:categoryOptions,
            inventory_type:typeOptions,
            default_supplier:supplierOptions,
            default_uom_code:unitOptions,
            stock_uom_code:unitOptions,
            status: [
              { value: 'draft', text: 'Draft' },
              { value: 'active', text: 'Active' },
              { value: 'archived', text: 'Archived' },
              { value: 'discontinued', text: 'Discontinued' }
            ],
          
      }
  
    //////////////////////////////

  const handleRowClick = (row: InventoryData) => {
    router.push(`/inventory/${row.id}`);
  };

  const handleDelete = async (row: InventoryData) => {
    const confirmed = await confirmAction({
      title: "Delete inventory item?",
      description: `Delete inventory "${row.name}"? This can affect stock operations and reporting for this item.`,
      confirmText: "Delete inventory",
      destructive: true,
    })
    if (!confirmed) return

    try {
      await deleteInventory(row.id).unwrap();
      toast.success("Inventory item deleted successfully.");
      await refetch();
    } catch (error) {
      toast.error(extractErrorMessage(error, ["detail"]) || "Failed to delete inventory item.");
    }
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Unable to load inventory items: {extractErrorMessage(error, ["detail", "error"])}
      </div>
    );
  }

  const notEditableFields: (keyof InventoryData)[] = [
    'id',
    'created_at',
    'updated_at',
    'category_name',
    'name',
    'current_stock_level',
    'current_stock',
    'quantity_available',
    'quantity_reserved',
    'stock_status',
    'total_stock_value',
    'created_by_details',
    'modified_by_details',
    'updated_by_details',
    'stock_analytics',
    'category_details',
    'display_image',
    'product_variant_image_url'
  ];

  const actionButtons: ActionButton<InventoryData>[] = [
    {
      label: "Delete",
      icon: Trash2,
      onClick: (row) => {
        void handleDelete(row);
      },
      variant: "danger",
    },
  ];

  

  return (
    <div>
      {!isLocationScopeControlled ? (
        <StructuralLocationScopeSelect
          allowMultiSelect
          className="mb-4 max-w-sm"
          id="inventory-structural-location-filter"
          values={selectedLocationIds}
          onValuesChange={handleSelectedLocationIdsChange}
        />
      ) : null}
      
      <DataTable<InventoryData>
        columns={inventoryColumns}
        data={data || []}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        actionButtons={actionButtons}
        searchableFields={['name', 'sku_snapshot', 'barcode_snapshot', 'location_name', 'default_supplier_name']}
        filterableFields={[
          'category_name',
          'inventory_type',
          'stock_status',
          'status',
          'location_name',
          'default_supplier_name',
          'track_stock',
          'track_lot',
          'track_serial',
          'track_expiry',
        ]}
        sortableFields={['name', 'sku_snapshot', 'inventory_type', 'current_stock_level', 'quantity_available', 'total_stock_value']}
        rangeFilterFields={['current_stock_level', 'quantity_available', 'quantity_reserved', 'total_stock_value', 'minimum_stock_level', 'reorder_point']}
         title="Inventory Items"
        onClose={() =>setIsCreateOpen(true)} 
      />

      {isCreateOpen ? (
        <CustomCreateCard
          defaultValues={defaultValues}
          onClose={() => {
            setIsCreateOpen(false)
          }}
          onSubmit={handleCreate}
          isLoading={inventoryCreateLoading}
          selectOptions={selectOptions}
          keyInfo={InventoryKeyInfo}
          notEditableFields={notEditableFields}
          interfaceKeys={InventoryInterfaceKeys}
          optionalFields={['description','inventory_category','default_supplier','stock_uom_code']}
          itemTitle={'Create Inventory Item'}
        />
      ) : null}
    </div>
  );
}

export default InventoryView;

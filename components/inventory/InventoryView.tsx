'use client'
import { useEffect, useMemo, useRef, useState } from 'react';

import { useRouter } from 'nextjs-toploader/app';
import { usePathname, useSearchParams } from 'next/navigation';
import { ActionButton, Column, DataTable, type DataTableQueryState } from "../common/DataTable/DataTable";
import { InventoryData, inventoryTypes } from "@/redux/features/inventory/inventoryTypes";
import { useListInventoryPageQuery, useCreateInventoryMutation, useDeleteInventoryMutation, useGetAvailableCatalogVariantsQuery } from "../../redux/features/inventory/inventoryAPiSlice";
import CustomCreateCard from '../common/createCard';
import { InventoryInterfaceKeys,defaultValues } from './selectOptions';
import { InventoryKeyInfo } from './selectOptions';
import { useGetUnitsQuery } from "../../redux/features/common/typeOF";
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
import { Pagination } from '@/components/ui/pagination';
import { TableImageHover } from '../common/table-image-render';

const renderInventoryThumbnail = (imageUrl: string | null | undefined, name: string) => (
  <div className="h-14 w-14 shrink-0">
    {imageUrl ? (
      <TableImageHover
        src={imageUrl}
        alt={name}
        productName={name}
        className="h-14 w-14 rounded-xl object-contain"
      />
    ) : (
      <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-gray-200 bg-gray-100 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        Inv
      </div>
    )}
  </div>
)

const renderInventoryCard = (row: InventoryData, rowIndex: number) => (
  <article
    key={row.id || rowIndex}
    className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
  >
    <div className="relative flex h-44 items-center justify-center bg-muted/50 p-4">
      {row.display_image || row.product_variant_image_url ? (
        <TableImageHover
          src={row.display_image || row.product_variant_image_url || ""}
          alt={row.name}
          productName={row.name}
        className="h-44 w-44 rounded-2xl object-contain"
        />
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-card text-xs font-semibold uppercase tracking-wide text-muted-foreground">Inv</div>
      )}
    </div>
    <div className="space-y-3 p-4">
      <div className="min-w-0">
        <h3 className="truncate font-semibold text-foreground" title={row.name}>{row.name}</h3>
        <p className="truncate text-xs text-muted-foreground">{formatMachineLabel(row.inventory_type, "Inventory item")}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-muted/60 p-2"><p className="text-[10px] uppercase text-muted-foreground">On hand</p><p className="font-semibold text-foreground">{row.current_stock_level ?? 0}</p></div>
        <div className="rounded-xl bg-muted/60 p-2"><p className="text-[10px] uppercase text-muted-foreground">Available</p><p className="font-semibold text-foreground">{row.quantity_available ?? 0}</p></div>
      </div>
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="truncate" title={row.barcode_snapshot || "Barcode not set"}>
          Barcode: {row.barcode_snapshot || "Not set"}
        </span>
        <span className="shrink-0 font-semibold text-foreground">{formatCurrencyCompact("NGN", row.total_stock_value ?? 0)}</span>
      </div>
      <p className="truncate text-xs text-muted-foreground" title={row.location_name || "Location not set"}>
        Location: {row.location_name || "Unassigned"}
      </p>
    </div>
  </article>
)

const inventoryColumns: Column<InventoryData>[] = [
  {
    header: 'Name',
    accessor: 'name',
    render: (value, row) => (
      <div className="flex w-[min(42vw,520px)] max-w-[520px] min-w-[220px] items-center gap-3">
        {renderInventoryThumbnail(row.display_image || row.product_variant_image_url, row.name)}
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-gray-900" title={String(value ?? '')}>{value}</div>
          <div className="truncate text-xs text-gray-500">{formatMachineLabel(row.inventory_type, 'Inventory item')}</div>
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
    header: 'Barcode',
    accessor: 'barcode_snapshot',
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
  const inventoryQuery = useMemo(
    () => buildStructuralLocationScopeParams(selectedLocationIds),
    [selectedLocationIds],
  );
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const tableStateKey = "table_inventory_items"
  const [tableQueryState, setTableQueryState] = useState<DataTableQueryState | null>(null)
  const lastTableQuerySignature = useRef<string | null>(null)
  const search = tableQueryState?.searchTerm ?? searchParams.get(`${tableStateKey}_search`) ?? ""
  const inventoryType = tableQueryState?.filters.inventory_type ?? searchParams.get(`${tableStateKey}_filter_inventory_type`) ?? undefined
  const status = tableQueryState?.filters.status ?? searchParams.get(`${tableStateKey}_filter_status`) ?? undefined
  const stockStatus = tableQueryState?.filters.stock_status ?? searchParams.get(`${tableStateKey}_filter_stock_status`) ?? undefined
  const sortField = tableQueryState?.sortConfig?.key ?? searchParams.get(`${tableStateKey}_sort`)
  const sortDirection = tableQueryState?.sortConfig?.direction ?? searchParams.get(`${tableStateKey}_direction`)
  const orderingFieldMap: Record<string, string> = {
    name: "name_snapshot",
    minimum_stock_level: "minimum_stock_level",
    reorder_point: "reorder_point",
    current_stock_level: "current_stock_level",
    quantity_available: "quantity_available",
  }
  const ordering = sortField && orderingFieldMap[sortField]
    ? `${sortDirection === "descending" ? "-" : ""}${orderingFieldMap[sortField]}`
    : undefined
  const requestedPage = Number(searchParams.get(`${tableStateKey}_page`)) || 1
  const [currentPage, setCurrentPage] = useState(requestedPage)

  useEffect(() => {
    setCurrentPage(requestedPage)
  }, [requestedPage])

  useEffect(() => {
    const syncPageFromBrowserHistory = () => {
      const nextPage = Number(new URLSearchParams(window.location.search).get(`${tableStateKey}_page`)) || 1
      setCurrentPage(nextPage)
    }

    window.addEventListener("popstate", syncPageFromBrowserHistory)
    return () => window.removeEventListener("popstate", syncPageFromBrowserHistory)
  }, [tableStateKey])

  const handleTableQueryStateChange = (nextQueryState: DataTableQueryState) => {
    const nextSignature = JSON.stringify(nextQueryState)
    if (lastTableQuerySignature.current !== null && lastTableQuerySignature.current !== nextSignature) {
      setCurrentPage(1)
    }
    lastTableQuerySignature.current = nextSignature
    setTableQueryState(nextQueryState)
  }

  const updateUrl = (params: URLSearchParams) => {
    const query = params.toString()
    const href = query ? `${pathname}?${query}` : pathname

    if (typeof window !== "undefined" && `${window.location.pathname}${window.location.search}` !== href) {
      window.history.pushState(window.history.state, "", href)
    }
  }
  const handleSelectedLocationIdsChange = (value: string[]) => {
    (onSelectedLocationIdsChange ?? setInternalSelectedLocationIds)(value)
    setCurrentPage(1)
    const params = new URLSearchParams(searchParams.toString())
    params.delete(`${tableStateKey}_page`)
    updateUrl(params)
  }
  const pageSize = 20
  const { data: inventoryPage, isLoading, refetch, error } = useListInventoryPageQuery({
    ...inventoryQuery,
    search: search.trim() || undefined,
    inventory_type: inventoryType,
    status,
    stock_status: stockStatus as "in_stock" | "low_stock" | "out_of_stock" | "needs_reorder" | undefined,
    ordering,
    page: currentPage,
    page_size: pageSize,
  });
  const data = inventoryPage?.results ?? []
  const totalPages = inventoryPage?.total_pages ?? 1
  const { data: availableCatalogVariants = [] } = useGetAvailableCatalogVariantsQuery()

    const [createInventory, { isLoading: inventoryCreateLoading }] = useCreateInventoryMutation();
    const [deleteInventory] = useDeleteInventoryMutation();
    const [isCreateOpen, setIsCreateOpen] = useState(false); // Renamed for clarity
    const router = useRouter();

  const handleCreate = async (createdData: Partial<InventoryData>) => {
    await createInventory(createdData).unwrap();
    setIsCreateOpen(false); 
    await refetch(); 
  };

      const { data: units=[] } = useGetUnitsQuery();
      const { data: suppliers=[] } = useGetSupplersQuery();
      

      
  useEffect(() => {
    if (!refetchData) {
      return;
    }

    refetch();
    setRefetchData(false);
  }, [refetch, refetchData, setRefetchData]);

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
      const variantOptions = availableCatalogVariants.map((variant) => ({
        value: variant.id,
        text: `${variant.product_name} - ${variant.display_name}${variant.sku ? ` (${variant.sku})` : ""}`,
      }));
    

    const  selectOptions = {
          
            inventory_type:typeOptions,
            default_supplier:supplierOptions,
            default_uom_code:unitOptions,
            stock_uom_code:unitOptions,
            product_variant_id: variantOptions,
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

  const notEditableFields: (keyof InventoryData)[] = [
    'id',
    'created_at',
    'updated_at',
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
        data={data}
        isLoading={isLoading}
        error={error}
        errorMessage="Unable to load inventory items."
        onRetry={refetch}
        onRowClick={handleRowClick}
        actionButtons={actionButtons}
        serverSide
        urlStateKey="inventory_items"
        onQueryStateChange={handleTableQueryStateChange}
        startNumberFrom={(currentPage - 1) * pageSize + 1}
        getRowId={(row) => row.id}
        searchableFields={['name', 'barcode_snapshot', 'sku_snapshot']}
        barcodeScannableField="barcode_snapshot"
        filterableFields={[
          'inventory_type',
          'status',
          'stock_status',
        ]}
        filterOptions={{
          inventory_type: typeOptions.map(({ value, text }) => ({ value, label: text })),
          status: [
            { value: 'draft', label: 'Draft' },
            { value: 'active', label: 'Active' },
            { value: 'archived', label: 'Archived' },
            { value: 'discontinued', label: 'Discontinued' },
          ],
          stock_status: [
            { value: 'in_stock', label: 'In stock' },
            { value: 'low_stock', label: 'Low stock' },
            { value: 'out_of_stock', label: 'Out of stock' },
            { value: 'needs_reorder', label: 'Needs reorder' },
          ],
        }}
        sortableFields={['name', 'minimum_stock_level', 'reorder_point', 'current_stock_level']}
        numericFields={['minimum_stock_level', 'reorder_point', 'current_stock_level']}
        rangeFilterFields={[]}
        cardRenderer={renderInventoryCard}
        defaultViewMode="cards"
         title="Inventory Items"
        onClose={() =>setIsCreateOpen(true)} 
      />
      <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(nextPage) => {
            const boundedPage = Math.max(1, Math.min(nextPage, totalPages))
            setCurrentPage(boundedPage)
            const params = new URLSearchParams(searchParams.toString())
            if (boundedPage <= 1) {
              params.delete(`${tableStateKey}_page`)
            } else {
              params.set(`${tableStateKey}_page`, String(boundedPage))
            }
            updateUrl(params)
          }}
        />
      </div>

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
          optionalFields={['product_variant_id','name_snapshot','description','default_supplier','stock_uom_code']}
          onFieldValueChange={(fieldName, value, setFieldValue) => {
            if (fieldName !== 'product_variant_id') return
            const variant = availableCatalogVariants.find((item) => item.id === value)
            setFieldValue('name_snapshot', variant?.display_name ?? '')
          }}
          itemTitle={'Create Inventory Item'}
        />
      ) : null}
    </div>
  );
}

export default InventoryView;

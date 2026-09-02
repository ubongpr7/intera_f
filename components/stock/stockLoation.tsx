'use client'
import { StockLocation } from "@/redux/features/stock/stockTypes";
import { Column, DataTable, ActionButton } from "../common/DataTable/DataTable";
import { useListStockLocationsQuery, useListStockLocationsPageQuery, useCreateStockLocationMutation, useGetStockLocationTypesQuery, useDeleteStockLocationMutation, useUpdateStockLocationMutation } from "../../redux/features/stock/stockAPISlice";
import { useDeferredValue, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import CustomCreateCard from '../common/createCard';
import { useGetCompanyUsersQuery } from "../../redux/features/users/userApiSlice";
import { RefetchDataProp } from "@/redux/features/common/commonTypes";
import { toast } from 'react-toastify';
import { CheckCircle2, Edit, Trash2 } from "lucide-react";
import StockLocationInspector from "./StockLocationInspector";
import { confirmAction } from "../common/confirmAction";
import { extractErrorMessage } from "@/lib/utils";
import { useSubscriptionQuota } from "@/hooks/useSubscriptionQuota";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateSharedAddressMutation, useRetireSharedAddressMutation, useUpdateSharedAddressMutation } from "@/redux/features/locations/locationsApiSlice";

const inventoryColumns: Column<StockLocation>[] = [
  {
    header: 'Name',
    accessor: 'name',
    className: 'font-medium',
  },
  {
    header: 'Location Type',
    accessor: 'location_type_name',
    className: 'font-medium',
  },
  {
    header: 'Parent',
    accessor: 'parent_name',
    className: 'font-medium',
  },
  {
    header: 'Code',
    accessor: 'code',
    className: 'font-medium',
  },
  {
    header: 'Mode',
    accessor: (row) => {
      if (row.structural) {
        return 'Structural';
      }
      if (row.external) {
        return 'External';
      }
      return 'Operational';
    },
    render: (value) => {
      const label = String(value);
      const tone =
        label === 'Structural'
          ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
          : label === 'External'
            ? 'border-amber-200 bg-amber-50 text-amber-900'
            : 'border-green-200 bg-green-50 text-green-800';
      return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
    },
  },
  {
    header: 'Default scope',
    accessor: (row) => (row.structural ? (row.is_default_structural_location ? 'Workspace default' : 'Structural') : 'Not applicable'),
    render: (value, row) => {
      const label = String(value);
      if (!row.structural) {
        return <span className="text-xs font-medium text-slate-400">Not applicable</span>;
      }
      const tone = row.is_default_structural_location
        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
        : 'border-slate-200 bg-slate-50 text-slate-700';
      return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
    },
  },
  {
    header: 'Stocked Items',
    accessor: 'stock_count',
    className: 'font-medium text-right',
  },
  {
    header: 'Physical Location',
    accessor: 'physical_address',
    className: 'font-medium',
  },
];

function StockLocations({refetchData, setRefetchData}:RefetchDataProp) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [locationMode, setLocationMode] = useState("all");
    const [locationTypeFilter, setLocationTypeFilter] = useState("all");
    const pageSize = 20;
    const deferredSearch = useDeferredValue(search.trim());
    const { data: locationsPage, isLoading: loadingLocations, error: locationsError, refetch } = useListStockLocationsPageQuery({
      search: deferredSearch || undefined,
      structural: locationMode === "structural" ? true : locationMode === "operational" ? false : undefined,
      external: locationMode === "external" ? true : undefined,
      location_type: locationTypeFilter === "all" ? undefined : locationTypeFilter,
      page,
      page_size: pageSize,
      ordering: "name",
    });
    const { data: structuralLocationsPage, refetch: refetchStructuralLocations } = useListStockLocationsPageQuery({
      structural: true,
      page: 1,
      page_size: 1,
    });
    const [createStockLocation, { isLoading: creatingLocation }] = useCreateStockLocationMutation();
    const [updateStockLocation, { isLoading: updatingLocation }] = useUpdateStockLocationMutation();
    const [deleteStockLocation, { isLoading: deletingLocation }] = useDeleteStockLocationMutation();
    const [createSharedAddress, { isLoading: creatingSharedAddress }] = useCreateSharedAddressMutation();
    const [updateSharedAddress, { isLoading: updatingSharedAddress }] = useUpdateSharedAddressMutation();
    const [retireSharedAddress, { isLoading: retiringSharedAddress }] = useRetireSharedAddressMutation();
    const [isCreateOpen, setIsCreateOpen] = useState(false); 
    const [editingStockLocation, setEditingStockLocation] = useState<StockLocation | null>(null);
    const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
    const needsLocationLookup = isCreateOpen || Boolean(editingStockLocation) || Boolean(selectedLocationId);
    const { data: lookupLocations = [], refetch: refetchLookupLocations } = useListStockLocationsQuery(
      needsLocationLookup ? undefined : skipToken,
    );
    const locations = locationsPage?.results ?? [];
    const {data:locationTypes,isLoading:locationTypesLoading}=useGetStockLocationTypesQuery()
    const { data: userData, isLoading: userLoading,  } = useGetCompanyUsersQuery();
    const structuralLocationQuota = useSubscriptionQuota(
      "structural-locations",
      structuralLocationsPage?.count ?? 0,
    );
    
    const locationTypeOptions = locationTypes?.map((locationType) => ({
        text: `${locationType.name } (${locationType.description})`,
        value: locationType.id.toString(),
      })) || [];
    const locationOptions = lookupLocations.map((location) => ({
        text: `${location.name } (${location.code})`,
        value: location.id.toString(),
      })) || [];
      
    const userOptions = userData?.map((assignment) => ({
        text: `${assignment.user?.first_name ?? "Unknown"} ${assignment.user?.email ?? ""}`.trim(),
        value: String(assignment.user?.id ?? assignment.id),
      })) || [];
      const selectionOpions={
        location_type:locationTypeOptions,
        parent:locationOptions,
        official:userOptions,
      
      }
    const handleCreate = async (createdData: Partial<StockLocation>) => {
    if (createdData.structural !== false && !structuralLocationQuota.canCreate) {
      toast.error(structuralLocationQuota.message);
      return;
    }
    try {   
        const location = await createStockLocation(createdData).unwrap();
        if (location.physical_address?.trim()) {
          const sharedAddress = await createSharedAddress({
            label: location.name || "stock location",
            address_line_1: location.physical_address,
            external_reference: `inventory:stock-location:${location.id}`,
          }).unwrap();
          await updateStockLocation({ id: location.id, data: { address_id: sharedAddress.id } }).unwrap();
        }
        setIsCreateOpen(false);
        await Promise.all([refetch(), refetchStructuralLocations(), refetchLookupLocations()]);
        toast.success("Stock location created successfully!");
    }
    catch (error) {
      toast.error("Failed to create stock location.");
    }
    };

    const handleUpdate = async (updatedData: Partial<StockLocation>) => {
      if (!editingStockLocation) return;
      try {
        const location = await updateStockLocation({ id: editingStockLocation.id, data: updatedData }).unwrap();
        const physicalAddress = location.physical_address?.trim();
        if (physicalAddress) {
          const sharedAddress = editingStockLocation.address_id
            ? await updateSharedAddress({
                id: editingStockLocation.address_id,
                data: { label: location.name || "stock location", address_line_1: physicalAddress },
              }).unwrap()
            : await createSharedAddress({
                label: location.name || "stock location",
                address_line_1: physicalAddress,
                external_reference: `inventory:stock-location:${location.id}`,
              }).unwrap();
          if (!editingStockLocation.address_id) {
            await updateStockLocation({ id: location.id, data: { address_id: sharedAddress.id } }).unwrap();
          }
        } else if (editingStockLocation.address_id) {
          await retireSharedAddress(editingStockLocation.address_id).unwrap();
          await updateStockLocation({ id: location.id, data: { address_id: null } }).unwrap();
        }
        setEditingStockLocation(null);
        await Promise.all([refetch(), refetchStructuralLocations(), refetchLookupLocations()]);
        toast.success("Stock location updated successfully!");
      } catch (error) {
        toast.error("Failed to update stock location.");
      }
    };

    const handleDelete = async (id: string) => {
      const confirmed = await confirmAction({
        title: "Delete stock location?",
        description: "This removes the stock location. Existing stock balances and movement history may need review.",
        confirmText: "Delete location",
        destructive: true,
      });
      if (!confirmed) return;

      try {
        await deleteStockLocation(id).unwrap();
        await Promise.all([refetch(), refetchStructuralLocations(), refetchLookupLocations()]);
        toast.success("Stock location deleted successfully!");
      } catch (error) {
        toast.error(extractErrorMessage(error, ["detail"]) || "Failed to delete stock location.");
      }
    };

    const handleMakeDefault = async (row: StockLocation) => {
      try {
        await updateStockLocation({
          id: row.id,
          data: { is_default_structural_location: true },
        }).unwrap();
        await Promise.all([refetch(), refetchStructuralLocations(), refetchLookupLocations()]);
        toast.success(`${row.name} is now the workspace default structural location.`);
      } catch (error) {
        toast.error("Failed to update the workspace default structural location.");
      }
    };

    const actionButtons: ActionButton<StockLocation>[] = [
      {
        label: "Make default",
        icon: CheckCircle2,
        onClick: (row, event) => {
          event.stopPropagation();
          handleMakeDefault(row);
        },
        hidden: (row) => !row.structural || Boolean(row.is_default_structural_location),
        disabled: () => updatingLocation,
        className: "text-emerald-700 hover:text-emerald-900",
      },
      {
        label: "Edit",
        icon: Edit,
        onClick: (row) => setEditingStockLocation(row),
      },
      {
        label: "Delete",
        icon: Trash2,
        onClick: (row) => handleDelete(String(row.id)),
        disabled: () => deletingLocation,
        className: "text-red-600 hover:text-red-800",
      },
    ];

    const handleRowClick = (row: StockLocation) => {
      setSelectedLocationId(String(row.id));
      };

      const interfaceKeys: (keyof StockLocation)[] = [
        'name',
        'location_type',
        'parent',
        'official',
        'external',
        'structural',
        'physical_address'
      ];
      
 return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search stock locations"
          aria-label="Search stock locations"
          className="max-w-sm"
        />
        <Select value={locationMode} onValueChange={(value) => { setLocationMode(value); setPage(1); }}>
          <SelectTrigger className="w-[180px]" aria-label="Filter stock location mode">
            <SelectValue placeholder="All modes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All modes</SelectItem>
            <SelectItem value="structural">Structural</SelectItem>
            <SelectItem value="operational">Operational</SelectItem>
            <SelectItem value="external">External</SelectItem>
          </SelectContent>
        </Select>
        <Select value={locationTypeFilter} onValueChange={(value) => { setLocationTypeFilter(value); setPage(1); }}>
          <SelectTrigger className="w-[220px]" aria-label="Filter stock location type">
            <SelectValue placeholder="All location types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All location types</SelectItem>
            {(locationTypes || []).map((locationType) => (
              <SelectItem key={locationType.id} value={String(locationType.id)}>{locationType.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable<StockLocation>
              columns={inventoryColumns}
              data={locations}
              isLoading={loadingLocations}
              error={locationsError}
              errorMessage="Unable to load stock locations."
              onRetry={refetch}
              onRowClick={handleRowClick}
              actionButtons={actionButtons}
              searchableFields={[]}
              filterableFields={[]}
              sortableFields={[]}
              rangeFilterFields={[]}
              title="Stock Locations"
            onClose={() => setIsCreateOpen(true)} 
            />

        <div className="mt-4 flex justify-end">
          <Pagination currentPage={locationsPage?.page ?? page} totalPages={locationsPage?.total_pages ?? 1} onPageChange={setPage} />
        </div>

        {(isCreateOpen || editingStockLocation) ? (
          <CustomCreateCard
            defaultValues={editingStockLocation || {external:false,structural:true}}
            onClose={() => {
              setIsCreateOpen(false);
              setEditingStockLocation(null);
            }}
            onSubmit={editingStockLocation ? handleUpdate : handleCreate}
            isLoading={creatingLocation || updatingLocation || creatingSharedAddress || updatingSharedAddress || retiringSharedAddress}
            selectOptions={selectionOpions}
            keyInfo={{'physical_address':`Optional, takes parent's address by default`}}
            notEditableFields={[]}
            interfaceKeys={interfaceKeys}
            dateFields={[]}
            optionalFields={['parent','external','structural','physical_address']}
            readOnlyFields={[]}
            itemTitle={editingStockLocation ? 'Update Location' : 'Create Location'}
          />
        ) : null}

        {selectedLocationId ? (
            <StockLocationInspector
            locationId={selectedLocationId}
            allLocations={lookupLocations}
            onClose={() => setSelectedLocationId(null)}
            onUpdated={() => {
              void refetch();
              void refetchLookupLocations();
            }}
          />
        ) : null}
    </div>
  );
}
export default StockLocations;

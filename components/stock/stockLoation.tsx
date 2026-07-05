'use client'
import { StockLocation } from "@/redux/features/stock/stockTypes";
import { Column, DataTable, ActionButton } from "../common/DataTable/DataTable";
import { useListStockLocationsQuery, useCreateStockLocationMutation, useGetStockLocationTypesQuery, useDeleteStockLocationMutation, useUpdateStockLocationMutation } from "../../redux/features/stock/stockAPISlice";
import { useState } from "react";
import CustomCreateCard from '../common/createCard';
import { useGetCompanyUsersQuery } from "../../redux/features/users/userApiSlice";
import { RefetchDataProp } from "@/redux/features/common/commonTypes";
import { toast } from 'react-toastify';
import { CheckCircle2, Edit, Trash2 } from "lucide-react";
import StockLocationInspector from "./StockLocationInspector";
import { confirmAction } from "../common/confirmAction";
import { extractErrorMessage } from "@/lib/utils";
import { useSubscriptionQuota } from "@/hooks/useSubscriptionQuota";

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
    const {data:locations,isLoading:loadingLocations,refetch}=useListStockLocationsQuery()
    const [createStockLocation, { isLoading: creatingLocation }] = useCreateStockLocationMutation();
    const [updateStockLocation, { isLoading: updatingLocation }] = useUpdateStockLocationMutation();
    const [deleteStockLocation, { isLoading: deletingLocation }] = useDeleteStockLocationMutation();
    const [isCreateOpen, setIsCreateOpen] = useState(false); 
    const [editingStockLocation, setEditingStockLocation] = useState<StockLocation | null>(null);
    const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
    const {data:locationTypes,isLoading:locationTypesLoading}=useGetStockLocationTypesQuery()
    const { data: userData, isLoading: userLoading,  } = useGetCompanyUsersQuery();
    const structuralLocationQuota = useSubscriptionQuota(
      "structural-locations",
      (locations || []).filter((location) => location.structural).length,
    );
    
    const locationTypeOptions = locationTypes?.map((locationType) => ({
        text: `${locationType.name } (${locationType.description})`,
        value: locationType.id.toString(),
      })) || [];
    const locationOptions = locations?.map((location) => ({
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
        await createStockLocation(createdData).unwrap();
        setIsCreateOpen(false);
        await refetch(); 
        toast.success("Stock location created successfully!");
    }
    catch (error) {
      toast.error("Failed to create stock location.");
    }
    };

    const handleUpdate = async (updatedData: Partial<StockLocation>) => {
      if (!editingStockLocation) return;
      try {
        await updateStockLocation({ id: editingStockLocation.id, data: updatedData }).unwrap();
        setEditingStockLocation(null);
        await refetch();
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
        await refetch();
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
        await refetch();
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
      <DataTable<StockLocation>
              columns={inventoryColumns}
              data={locations || []}
              isLoading={loadingLocations}
              onRowClick={handleRowClick}
              actionButtons={actionButtons}
              searchableFields={['name', 'code', 'physical_address', 'location_type_name', 'parent_name']}
              filterableFields={['location_type_name', 'parent_name', 'official', 'external', 'structural']}
              sortableFields={['name', 'code', 'stock_count', 'physical_address', 'location_type_name', 'parent_name']}
              rangeFilterFields={['stock_count']}
              title="Stock Locations"
            onClose={() => setIsCreateOpen(true)} 
            />

        {(isCreateOpen || editingStockLocation) ? (
          <CustomCreateCard
            defaultValues={editingStockLocation || {external:false,structural:true}}
            onClose={() => {
              setIsCreateOpen(false);
              setEditingStockLocation(null);
            }}
            onSubmit={editingStockLocation ? handleUpdate : handleCreate}
            isLoading={creatingLocation || updatingLocation}
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
            allLocations={locations || []}
            onClose={() => setSelectedLocationId(null)}
            onUpdated={refetch}
          />
        ) : null}
    </div>
  );
}
export default StockLocations;

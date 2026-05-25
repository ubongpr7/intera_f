'use client'
import { StockLocation } from "@/redux/features/stock/stockTypes";
import { Column, DataTable, ActionButton } from "../common/DataTable/DataTable";
import { useListStockLocationsQuery, useCreateStockLocationMutation, useGetStockLocationTypesQuery, useDeleteStockLocationMutation, useUpdateStockLocationMutation } from "../../redux/features/stock/stockAPISlice";
import { useState } from "react";
import CustomCreateCard from '../common/createCard';
import { useGetCompanyUsersQuery } from "../../redux/features/users/userApiSlice";
import { RefetchDataProp } from "@/redux/features/common/commonTypes";
import { toast } from 'react-toastify';
import { Edit, Trash2 } from "lucide-react";
import StockLocationInspector from "./StockLocationInspector";

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
      if (window.confirm("Are you sure you want to delete this stock location?")) {
        try {
          await deleteStockLocation(id).unwrap();
          await refetch();
          toast.success("Stock location deleted successfully!");
        } catch (error) {
          toast.error("Failed to delete stock location.");
        }
      }
    };

    const actionButtons: ActionButton<StockLocation>[] = [
      {
        label: "Edit",
        icon: Edit,
        onClick: (row) => setEditingStockLocation(row),
      },
      {
        label: "Delete",
        icon: Trash2,
        onClick: (row) => handleDelete(String(row.id)),
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
              searchableFields={['name', 'code', 'physical_address']}
              filterableFields={['location_type_name', 'parent_name']}
              sortableFields={['name', 'code', 'stock_count', 'physical_address']}
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

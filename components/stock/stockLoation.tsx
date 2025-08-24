'use client'
import { StockLocation } from "../interfaces/stock";
import { Column, DataTable, ActionButton } from "../common/DataTable/DataTable";
import { useGetStockItemDataLocationQuery, useCreateStockItemLocationMutation, useGetStockLocationTypesQuery, useDeleteStockItemLocationMutation, useUpdateStockItemLocationMutation } from "../../redux/features/stock/stockAPISlice";
import { useState } from "react";
import { PageHeader } from "../inventory/PageHeader";
import CustomCreateCard from '../common/createCard';
import { useGetCompanyUsersQuery } from "../../redux/features/users/userApiSlice";
import { RefetchDataProp } from "../interfaces/common";
import { toast } from 'react-toastify';
import { Edit, Trash2 } from "lucide-react";

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
    header: 'Physical Location',
    accessor: 'physical_address',
    className: 'font-medium',
  },
];

function StockLocations({refetchData, setRefetchData}:RefetchDataProp) {
    const {data:StockLocationData,isLoading:stockItemsLoading,refetch,error}=useGetStockItemDataLocationQuery()
    const [createStockLocation, { isLoading: stockItemCreateLoading }] = useCreateStockItemLocationMutation();
    const [updateStockLocation, { isLoading: stockItemUpdateLoading }] = useUpdateStockItemLocationMutation();
    const [deleteStockLocation, { isLoading: stockItemDeleteLoading }] = useDeleteStockItemLocationMutation();
    const [isCreateOpen, setIsCreateOpen] = useState(false); 
    const [editingStockLocation, setEditingStockLocation] = useState<StockLocation | null>(null);
    const {data:locationTypes,isLoading:locationTypesLoading}=useGetStockLocationTypesQuery('')
    const { data: userData, isLoading: userLoading,  } = useGetCompanyUsersQuery();
    
    const locationTypeOptions = locationTypes?.map((locationType) => ({
        text: `${locationType.name } (${locationType.description})`,
        value: locationType.id.toString(),
      })) || [];
    const locationOptions = StockLocationData?.map((StockLocationItem) => ({
        text: `${StockLocationItem.name } (${StockLocationItem.code})`,
        value: StockLocationItem.id.toString(),
      })) || [];
      
    const userOptions = userData?.map((user) => ({
        text: `${user.first_name} ${user.email}`,
        value: user.id.toString(),
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
    <PageHeader
            title="Stock Locations"
            onClose={() => setIsCreateOpen(true)} 
          />
      <DataTable<StockLocation>
              columns={inventoryColumns}
              data={StockLocationData || []}
              isLoading={stockItemsLoading}
              onRowClick={handleRowClick}
              actionButtons={actionButtons}
            />

        {(isCreateOpen || editingStockLocation) && (
          <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50`}>
            <CustomCreateCard
              defaultValues={editingStockLocation || {external:false,structural:true}}
              onClose={() => {
                setIsCreateOpen(false);
                setEditingStockLocation(null);
              }}
              onSubmit={editingStockLocation ? handleUpdate : handleCreate}
              isLoading={stockItemCreateLoading || stockItemUpdateLoading}
              selectOptions={selectionOpions}
              keyInfo={{'physical_address':`Optional, takes parent's address by default`}}
              notEditableFields={[]}
              interfaceKeys={interfaceKeys}
              dateFields={[]}
              optionalFields={['parent','external','structural','physical_address']}
              readOnlyFields={[]}
              itemTitle={editingStockLocation ? 'Update Location' : 'Create Location'}
            />
          </div>
        )}
    </div>
  );
}
export default StockLocations;
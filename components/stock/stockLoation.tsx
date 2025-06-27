'use client'
import { StockLocation } from "../interfaces/stock";
import { Column, DataTable } from "../common/DataTable/DataTable";
import { useGetStockItemDataLocationQuery,useCreateStockItemLocationMutation,useGetStockLocationTypesQuery } from "../../redux/features/stock/stockAPISlice";
import { useState } from "react";
import { PageHeader } from "../inventory/PageHeader";
import CustomCreateCard from '../common/createCard';
import { useGetCompanyUsersQuery } from "../../redux/features/users/userApiSlice";
import { RefetchDataProp } from "../interfaces/common";

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
    const [isCreateOpen, setIsCreateOpen] = useState(false); 
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
        const response = await createStockLocation(createdData);
        setIsCreateOpen(false);
        await refetch(); 
        setRefetchData(true)
    }
    catch (error) {
    }
    };
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
            />

        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${isCreateOpen ? 'block' : 'hidden'}`}>
                <CustomCreateCard
                  defaultValues={{external:false,structural:true}}
                  onClose={() => setIsCreateOpen(false)}
                  onSubmit={handleCreate}
                  isLoading={stockItemCreateLoading}
                  selectOptions={selectionOpions}
                  keyInfo={{'physical_address':`Optional, takes parent's address by default`}}
                  notEditableFields={[]}
                  interfaceKeys={interfaceKeys}
                  dateFields={[]}
                  optionalFields={['parent','external','structural','physical_address']}
                  readOnlyFields={[]}
                  itemTitle='Location'
                />
              </div>
    </div>
  );
}
export default StockLocations;

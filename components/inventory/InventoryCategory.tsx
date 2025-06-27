'use client'
import { useEffect, useState } from 'react';
import { PageHeader } from "../inventory/PageHeader"
import { title } from "process"
import { useRouter } from 'nextjs-toploader/app'
import { DataTable,Column } from "../common/DataTable/DataTable";
import { useCreateCategoryMutation, useGetInventoryCategoriesQuery,useUpdateCategoryMutation} from "../../redux/features/inventory/inventoryAPiSlice";
import { CategoryData } from '../interfaces/inventory';
import CustomCreateCard from '../common/createCard';
import { toast } from 'react-toastify';
import { useGetStockItemDataLocationQuery } from '@/redux/features/stock/stockAPISlice';
import { RefetchDataProp } from '../interfaces/common';
import CustomUpdateForm from '../common/updateForm';
import CustomUpdateCard from '../common/updateCard';

const inventoryColumns: Column<CategoryData>[] = [
  {
    header: 'Name',
    accessor: 'name',
    className: 'font-medium',
  },
  
  {
    header: 'Inventories',
    accessor: 'inventory_count',
    render: (value) => value || 'N/A',
    className: 'font-medium',
  },
  
  {
    header: 'Parent Category',
    accessor: 'parent_name',
    render: (value) => value || 'N/A',
    info:'Category to which the category belong'
  },
  
];
function InventoryCategoryView({refetchData, setRefetchData}:RefetchDataProp) {
  const { data, isLoading, error,refetch } = useGetInventoryCategoriesQuery('');
  const router = useRouter();
  const [createCategory,{isLoading:creatingCategory,error:catError}]= useCreateCategoryMutation()
  const {data:StockLocationData,isLoading:stockLocationsLoading,refetch:refetchLocation}=useGetStockItemDataLocationQuery()
  const [categoryDetail,setCategoryDetail] = useState<CategoryData>()
  const [updateCategory,{isLoading:isUpdatingCategory}]=useUpdateCategoryMutation()
  const [itemId, setItemId] =useState('')
  const [isEditOpenOption,setIsEditOpenOption] = useState(false)
  useEffect(()=>{
    if (StockLocationData){
      refetchLocation()
      setRefetchData(false)

    }
  },[refetchData])
  const categoryOptions = data?.map((cat: CategoryData) => ({
      value: cat.id,
      text: cat.name,
    }));
  const locationOptions = StockLocationData?.map((StockLocationItem) => ({
        text: `${StockLocationItem.name } (${StockLocationItem.code})`,
        value: StockLocationItem.id.toString(),
      })) || [];
  const [isCreateOpen, setIsCreateOpen] = useState(false); // Renamed for clarity
  const CategoryInterfaceKeys: (keyof CategoryData)[]=[
    'name','description','parent','structural','default_location'
  ]
  const notEditableFields: (keyof CategoryData)[] = [
    'id','inventory_count',
  ]
  
  const selectOptions: Partial<Record<keyof CategoryData, { value: string; text: string; }[]>> = {
      parent: categoryOptions,
      default_location:locationOptions
    }
    const handleCreate = async (createdData: Partial<CategoryData>) => {
      await createCategory(createdData).unwrap();
        await refetch(); 
        setIsCreateOpen(false);
      setRefetchData(true)
      
    };
    const handleUpdate = async (createdData: Partial<CategoryData>) => {
      await updateCategory({data:createdData, id:itemId}).unwrap();
        await refetch(); 
        setIsCreateOpen(false);
      setRefetchData(true)
      setRefetchData(true)
      
    };

    const handleRowClick = (row: CategoryData) => {
      setItemId(`${row.id}`)
      setCategoryDetail(row)
      setIsEditOpenOption(true)
    };
  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading inventory data: {(error as any).message || 'Unknown error'}
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Category" onClose={()=>{ setIsCreateOpen(true)}}/>
      <DataTable<CategoryData>
        columns={inventoryColumns}
        data={data || []}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        
      />
      <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${isCreateOpen ? 'block' : 'hidden'}`}>
              <CustomCreateCard
                defaultValues={{structural:false}}
                onClose={() => setIsCreateOpen(false)}
                onSubmit={handleCreate}
                isLoading={creatingCategory}
                selectOptions={selectOptions}
                keyInfo={{default_location:`Optional, defaults to parent's location`}}
                notEditableFields={notEditableFields}
                interfaceKeys={CategoryInterfaceKeys}
                optionalFields={['description', 'parent','structural','default_location']}
                />
            </div>

        {(categoryDetail && isEditOpenOption ) &&(<div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${isEditOpenOption ? 'block' : 'hidden'}`}>

            <CustomUpdateCard
                data={categoryDetail || {} as CategoryData}
                selectOptions={selectOptions}
                editableFields={['name','structural','parent','default_location','description']}
                onClose={() => setIsEditOpenOption(false)}
                onSubmit={handleUpdate}

                isLoading={isUpdatingCategory}

                keyInfo={{}}
                dateFields={[]}
                datetimeFields={[]}
                optionalFields={['description','structural']}
                idOfItem={itemId}
                parentFields={['parent']}
              />
           
            </div>)}
    </div>
  )
}
export default InventoryCategoryView
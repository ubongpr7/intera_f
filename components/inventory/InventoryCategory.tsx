'use client'
import { useEffect, useState } from 'react';
import { PageHeader } from "../inventory/PageHeader"
import { title } from "process"
import { useRouter } from 'nextjs-toploader/app'
import { DataTable,Column } from "../common/DataTable/DataTable";
import { useCreateCategoryMutation, useGetInventoryCategoriesQuery} from "redux/features/inventory/inventoryAPiSlice";
import { CategoryData } from '../interfaces/inventory';
import CustomCreateCard from '../common/createCard';

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
    accessor: 'parent',
    render: (value) => value || 'N/A',
    info:'Category to which the category belong'
  },
  
];
function InventoryCategoryView() {
  const { data, isLoading, error,refetch } = useGetInventoryCategoriesQuery('');
  const router = useRouter();
  const [createCategory,{isLoading:creatingCategory,error:catError}]= useCreateCategoryMutation()
  
  const categoryOptions = data?.map((cat: CategoryData) => ({
      value: cat.id,
      text: cat.name,
    }));
  
  const [isCreateOpen, setIsCreateOpen] = useState(false); // Renamed for clarity
  const CategoryInterfaceKeys: (keyof CategoryData)[]=[
    'name','description','parent'
  ]
  const notEditableFields: (keyof CategoryData)[] = [
    'id','inventory_count'
  ]
  const selectOptions: Partial<Record<keyof CategoryData, { value: string; text: string; }[]>> = {
      parent: categoryOptions
    }
    const handleCreate = async (createdData: Partial<CategoryData>) => {
      await createCategory(createdData).unwrap();
      setIsCreateOpen(false);
      await refetch(); 
    };
    const handleRowClick = (row: CategoryData) => {
    
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
                defaultValues={{}}
                onClose={() => setIsCreateOpen(false)}
                onSubmit={handleCreate}
                isLoading={creatingCategory}
                selectOptions={selectOptions}
                keyInfo={{}}
                notEditableFields={notEditableFields}
                interfaceKeys={CategoryInterfaceKeys}
                optionalFields={['description', 'parent']}
                />
            </div>
    </div>
  )
}
export default InventoryCategoryView
'use client'
import { useEffect, useState } from 'react';
import { PageHeader } from "../inventory/PageHeader"
import { title } from "process"
import { useRouter } from 'nextjs-toploader/app'
import { DataTable,Column } from "../common/DataTable/DataTable";
import { useCreateProductCategoryMutation, useGetProductCategoriesQuery} from "../../redux/features/product/productAPISlice";
import { ProductCategoryData } from '../interfaces/product';
import CustomCreateCard from '../common/createCard';

const inventoryColumns: Column<ProductCategoryData>[] = [
  {
    header: 'Name',
    accessor: 'name',
    className: 'font-medium',
  },
  
  {
    header: 'Inventories',
    accessor: 'product_count',
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
function ProductCategoryView() {
  const { data, isLoading, error,refetch } = useGetProductCategoriesQuery('');
  const router = useRouter();
  const [createCategory,{isLoading:creatingCategory,error:catError}]= useCreateProductCategoryMutation()
  
  const categoryOptions = data?.map((cat: ProductCategoryData) => ({
      value: cat.id,
      text: cat.name,
    }));
  
  const [isCreateOpen, setIsCreateOpen] = useState(false); // Renamed for clarity
  const CategoryInterfaceKeys: (keyof ProductCategoryData)[]=[
    'name','description','parent'
  ]
  const notEditableFields: (keyof ProductCategoryData)[] = [
    'id','product_count'
  ]
  const selectOptions: Partial<Record<keyof ProductCategoryData, { value: string; text: string; }[]>> = {
      parent: categoryOptions
    }
    const handleCreate = async (createdData: Partial<ProductCategoryData>) => {
      await createCategory(createdData).unwrap();
      setIsCreateOpen(false);
      await refetch(); 
    };
    const handleRowClick = (row: ProductCategoryData) => {
    
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
      <PageHeader title="Product Category" onClose={()=>{ setIsCreateOpen(true)}}/>
      <DataTable<ProductCategoryData>
        columns={inventoryColumns}
        data={data || []}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        searchableFields={['name']}
        filterableFields={['parent']}
        sortableFields={['name']}
  
        
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
export default ProductCategoryView
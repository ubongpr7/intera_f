'use client'
import DetailCard from '../common/Detail';
import { useGetProductCategoriesQuery, useGetProductQuery } from '../../redux/features/product/productAPISlice'
import { ProductData } from '../interfaces/product';
import { useUpdateProductMutation } from '../../redux/features/product/productAPISlice';
import { useGetTypesByModelQuery, useGetUnitsQuery } from '../../redux/features/common/typeOF';
import LoadingAnimation from '../common/LoadingAnimation';


export default function InventoryDetail({ id }: { id: string }) {
  const { data: inventory, isLoading,refetch  } = useGetProductQuery(id);
  const ProductData = inventory as ProductData;
  const [updateInventory,{isLoading:updateIsLoading}] = useUpdateProductMutation();

  
  const handleUpdate = async (updatedData: Partial<ProductData>) => {
    await updateInventory({ id: ProductData.id, data: updatedData }).unwrap();
    await refetch();

  };


//////////////////////////////
const { data: categories = [], isLoading: isCatLoading, error: catError } = useGetProductCategoriesQuery(1);
const { data: types } = useGetTypesByModelQuery('inventory');
const { data: units } = useGetUnitsQuery();

const unitOptions = units ? units.map((unit: any) => ({
  value: unit.id,
  text: unit.name,
})) : [];

const typeOptions = types ? types.map((inventory_type: any) => ({
  value: inventory_type.id,
  text: inventory_type.name,
})) : [];

const categoryOptions = categories.map((cat: any) => ({
  value: cat.id,
  text: cat.name,
}));

const  selectOptions = {
    
      category:categoryOptions,
      unit:unitOptions,
      
}

//////////////////////////////




  if (isLoading) return <div>
  <div className="text-center flex items-center justify-center py-8 text-gray-500 ">
  <LoadingAnimation text="Loading..." ringColor="#3b82f6" />
  </div>
  </div>;
  if (!inventory) return <div>Inventory not found</div>;

  
  return (
    <DetailCard 
      data={ProductData}
      notEditableFields={['id', 'created_at','updated_at', ]}
      updateMutation={handleUpdate}
      excludeFields={['id','category',]}
      selectOptions={selectOptions}
      isLoading={updateIsLoading}
      policyFields={['description']}
      keyInfo={{}}
      optionalFields={['description',]}

    />
  );
}

'use client'
import DetailCard from '../common/Detail';
import { useGetProductCategoriesQuery, useGetProductQuery } from '../../redux/features/product/productAPISlice'
import type { Product } from "@/redux/features/product/productTypes";
import { useUpdateProductMutation } from '../../redux/features/product/productAPISlice';
import { useGetUnitsQuery } from '../../redux/features/common/typeOF';
import LoadingAnimation from '../common/LoadingAnimation';
import { ProductFormKeys } from './selectOptions';

export default function ProductDetail({ id, }: { id: string }) {
  const { data: product, isLoading, refetch } = useGetProductQuery(id);
  const productData = product as Product;
  const [updateProduct, { isLoading: updateIsLoading }] = useUpdateProductMutation();

  
  const handleUpdate = async (updatedData: Partial<Product>) => {
    await updateProduct({ id: productData.id, data: updatedData }).unwrap();
    await refetch();

  };


//////////////////////////////
const { data: categories = [] } = useGetProductCategoriesQuery();
const { data: units=[] } = useGetUnitsQuery();

const unitOptions = units.map((unit: any) => ({
    value: `${unit.name} (${unit.dimension_type})`,
    text: `${unit.name} (${unit.dimension_type})`,
  }));

const categoryOptions = categories.map((cat: any) => ({
  value: cat.name,
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
  if (!product) return <div>Product not found</div>;

  
  return (
    <DetailCard 
      interfaceKeys={ProductFormKeys}
    
      data={productData}
      notEditableFields={['id', 'created_at','updated_at', ]}
      updateMutation={handleUpdate}
      excludeFields={['id', 'category_details', 'display_image', 'price_range', 'attribute_links', 'quick_sale_variants', 'pricing_strategy_details', 'created_by_details']}
      selectOptions={selectOptions}
      isLoading={updateIsLoading}
      policyFields={['description', 'short_description', 'meta_title', 'meta_description']}
      keyInfo={{}}
      optionalFields={['description', 'short_description', 'cost_price', 'barcode', 'sku', 'pos_category', 'unit', 'dimensions', 'weight', 'meta_title', 'meta_description']}


    />
  );
}

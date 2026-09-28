'use client'
import DetailCard from '../common/Detail';
import { useGetProductCategoriesQuery, useGetProductQuery } from '../../redux/features/product/productAPISlice'
import type { Product } from "@/redux/features/product/productTypes";
import { useUpdateProductMutation } from '../../redux/features/product/productAPISlice';
import { useGetUnitsQuery } from '../../redux/features/common/typeOF';
import LoadingAnimation from '../common/LoadingAnimation';
import { ProductFormKeys } from './selectOptions';
import { RecordNotFoundCard } from '../common/RecordNotFoundCard';

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
  if (!product) return <RecordNotFoundCard title="Product not found" description="This product may have been deleted, archived, or is not available in the current workspace." />;

  
  return (
    <DetailCard 
      interfaceKeys={ProductFormKeys}
      displayFields={[
        'display_image',
        'description',
        'short_description',
        'category',
        'pos_category',
        'base_price',
        'cost_price',
        'unit',
        'weight',
        'dimensions',
        'tax_rate',
        'tax_inclusive',
        'allow_discount',
        'max_discount_percent',
        'quick_sale',
        'is_template',
        'is_active',
        'is_featured',
        'track_stock',
        'allow_backorder',
        'low_stock_threshold',
        'variant_count',
        'total_stock',
        'profit_margin',
        'pos_ready',
        'average_cost',
        'low_stock_variants',
        'out_of_stock_variants',
        'created_at',
        'updated_at',
      ]}
    
      data={productData}
      notEditableFields={['id', 'created_at','updated_at',]}
      updateMutation={handleUpdate}
      excludeFields={['id','sku','category_details', "barcode",'display_image', 'price_range', 'attribute_links', 'quick_sale_variants', 'pricing_strategy_details', 'created_by_details']}
      selectOptions={selectOptions}
      isLoading={updateIsLoading}
      policyFields={['description', 'short_description', 'meta_title', 'meta_description']}
      keyInfo={{}}


      optionalFields={['description', 'category', "is_featured", "quick_sale", 'short_description', 'tax_inclusive', 'cost_price', 'is_template', 'allow_backorder', 'pos_category', 'unit', 'dimensions', 'weight', 'meta_title', 'meta_description']}


    />
  );
}

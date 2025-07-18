// app/inventory/page.tsx
import Tabs from '../../components/common/Tabs';
import ProductCategoryView from '../../components/product/productCategory';
import ProductView from '@/components/product/productView';
const ProductPage = () => {
  const tabs = [
    {
      id: 'all',
      label: 'All Products',
      content: <ProductView />,
    },
    // {
    //   id: 'categories',
    //   label: 'Product Category',
    //   content: <ProductCategoryView />,
    // },
   
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Product Management</h1>
      <Tabs 
        items={tabs} 
        className="bg-white  rounded-lg shadow-sm p-4"
      />
    </div>
  );
};

export default ProductPage;
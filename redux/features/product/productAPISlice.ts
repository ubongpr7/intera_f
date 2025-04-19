import { apiSlice } from '../../services/apiSlice';
import { ProductData, ProductCategoryData } from '../../../components/interfaces/product';

const product_api = 'product_api';

export const productApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    createProduct: builder.mutation({
      query: (productData: Partial<ProductData>) => ({
        url: `/${product_api}/products/`,
        method: 'POST',
        body: productData
      }),
    }),
    createProductCategory: builder.mutation({
      query: (data: Partial<ProductCategoryData>) => ({
        url: `/${product_api}/categories/`,
        method: 'POST',
        body: data
      }),
    }),
    updateProduct: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${product_api}/products/${id}/`,
        method: 'PATCH',
        body: data
      }),
    }),
    getProduct: builder.query({
      query: (id) => `/${product_api}/products/${id}/`,
    }),
    getProductCategories: builder.query({
      query: () => `/${product_api}/categories/`,
    }),
    getProductData: builder.query<ProductData[], void>({
      query: () => ({
        url: `/${product_api}/products/`,
        method: 'GET',
      }),
    }),
    // Additional endpoints for pricing strategies and attributes
    createPricingStrategy: builder.mutation({
      query: (strategyData) => ({
        url: `/${product_api}/pricing-strategies/`,
        method: 'POST',
        body: strategyData
      }),
    }),
    getProductVariants: builder.query({
      query: (productId) => `/${product_api}/products/${productId}/variants/`,
    }),
    updatePricingStrategy: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${product_api}/pricing-strategies/${id}/`,
        method: 'PATCH',
        body: data
      }),
    }),
  }),
});

export const { 
  useCreateProductMutation,
  useCreateProductCategoryMutation,
  useUpdateProductMutation,
  useGetProductQuery,
  useGetProductCategoriesQuery,
  useGetProductDataQuery,
  useCreatePricingStrategyMutation,
  useGetProductVariantsQuery,
  useUpdatePricingStrategyMutation
} = productApiSlice;
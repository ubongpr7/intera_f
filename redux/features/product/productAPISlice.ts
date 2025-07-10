import { apiSlice } from "../../services/apiSlice"
import type { Attachment, Product, ProductAttribute, ProductAttributeLink, ProductAttributeValue, ProductCategory, ProductVariantAttribute } from "../../../components/interfaces/product"

const product_api = "product_api"
const service = "product"

export const productApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Product Management
    createProduct: builder.mutation({
      query: (productData: Partial<Product>) => ({
        url: `/${product_api}/products/`,
        method: "POST",
        body: productData,
        service: service,
      }),
    }),

    removeTemplateMode: builder.mutation({
      query: ({ id }) => ({
        url: `/${product_api}/products/${id}/create_stock_items/`,
        method: "POST",
        body: {},
        service: service,
      }),
    }),
    updateProduct: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${product_api}/products/${id}/`,
        method: "PATCH",
        body: data,
        service: service,
      }),
    }),

    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/${product_api}/products/${id}/`,
        method: "DELETE",
        service: service,
      }),
    }),

    getProduct: builder.query({
      query: (id) => ({
        url: `/${product_api}/products/${id}/`,
        service: service,
      }),
    }),

    getMinimalProduct: builder.query({
      query: (id) => ({
        url: `/${product_api}/products/${id}/minimal_product/`,
        service: service,
      }),
    }),
  
    getProductData: builder.query<Product[], void>({
      query: () => ({
        url: `/${product_api}/products/`,
        method: "GET",
        service: service,
      }),
    }),

    toggleProductQuickSale: builder.mutation({
      query: (id) => ({
        url: `/${product_api}/management/products/${id}/toggle-quick-sale/`,
        method: "POST",
        service: service,
      }),
    }),

    toggleProductFeatured: builder.mutation({
      query: (id) => ({
        url: `/${product_api}/management/products/${id}/toggle-featured/`,
        method: "POST",
        service: service,
      }),
    }),

    getProductVariants: builder.query({
      query: (productId) => ({
        url: `/${product_api}/management/products/${productId}/variants/`,
        service: service,
      }),
    }),

    getProductPosVariants: builder.query({
      query: (productId) => ({
        url: `/${product_api}/management/products/${productId}/pos-variants/`,
        service: service,
      }),
    }),

    getProductFeaturedVariants: builder.query({
      query: (productId) => ({
        url: `/${product_api}/management/products/${productId}/featured-variants/`,
        service: service,
      }),
    }),

    getProductPriceHistory: builder.query({
      query: ({ productId, params = {} }) => ({
        url: `/${product_api}/management/products/${productId}/price-history/`,
        params,
        service: service,
      }),
    }),

    getProductAnalytics: builder.query({
      query: (productId) => ({
        url: `/${product_api}/management/products/${productId}/analytics/`,
        service: service,
      }),
    }),

    // Product Categories
    createProductCategory: builder.mutation({
      query: (data: Partial<ProductCategory>) => ({
        url: `/${product_api}/categories/`,
        method: "POST",
        body: data,
        service: service,
      }),
    }),

    updateProductCategory: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${product_api}/categories/${id}/`,
        method: "PATCH",
        body: data,
        service: service,
      }),
    }),

    deleteProductCategory: builder.mutation({
      query: (id) => ({
        url: `/${product_api}/categories/${id}/`,
        method: "DELETE",
        service: service,
      }),
    }),

    getProductCategories: builder.query({
      query: (params = {}) => ({
        url: `/common_api/categories/`,
        params,
        service: 'common',
      }),
    }),

    getCategoryTree: builder.query({
      query: () => ({
        url: `/${product_api}/management/categories/tree/`,
        service: service,
      }),
    }),

    getPosCategoryTree: builder.query({
      query: () => ({
        url: `/${product_api}/management/categories/pos-tree/`,
        service: service,
      }),
    }),

    getCategoryProducts: builder.query({
      query: ({ categoryId, params = {} }) => ({
        url: `/${product_api}/management/categories/${categoryId}/products/`,
        params,
        service: service,
      }),
    }),


    // AI Bulk Creation
    aiBulkCreateProducts: builder.mutation<{ task_id: string; status: string; message: string }, FormData>({
      query: (formData) => ({
        url: `/${product_api}/products/ai_bulk_create/`,
        method: "POST",
        body: formData,
        service: service,
      }),
    }),

    getBulkTaskStatus: builder.query<
      {
        task_id: string
        status: string
        error_message?: string
        result_file?: string
        created_at: string
        updated_at: string
      },
      string
    >({
      query: (taskId) => ({
        url: `/${product_api}/products/bulk_task_status/?task_id=${taskId}`,
        service: service,
      }),
    }),

    listBulkTasks: builder.query<
      Array<{
        task_id: string
        status: string
        created_at: string
        result_file?: string
      }>,
      void
    >({
      query: () => ({
        url: `/${product_api}/products/bulk_task_status/`,
        service: service,
      }),
    }),
    // Product Variants
    createProductVariant: builder.mutation({
      query: (variantData) => ({
        url: `/${product_api}/variants/`,
        method: "POST",
        body: variantData,
        service: service,
      }),
    }),

    updateProductVariant: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${product_api}/variants/${id}/`,
        method: "PATCH",
        body: data,
        service: service,
      }),
    }),

    deleteProductVariant: builder.mutation({
      query: (id) => ({
        url: `/${product_api}/variants/${id}/`,
        method: "DELETE",
        service: service,
      }),
    }),

    getProductVariant: builder.query({
      query: (id) => ({
        url: `/${product_api}/variants/${id}/`,
        service: service,
      }),
    }),

    getAllProductVariants: builder.query({
      query: (params = {}) => ({
        url: `/${product_api}/variants/`,
        params,
        service: service,
      }),
    }),

    toggleVariantFeatured: builder.mutation({
      query: (id) => ({
        url: `/${product_api}/management/variants/${id}/toggle-featured/`,
        method: "POST",
        service: service,
      }),
    }),

    toggleVariantPosVisible: builder.mutation({
      query: (id) => ({
        url: `/${product_api}/management/variants/${id}/toggle-pos-visible/`,
        method: "POST",
        service: service,
      }),
    }),

    getVariantStockHistory: builder.query({
      query: (id) => ({
        url: `/${product_api}/management/variants/${id}/stock-history/`,
        service: service,
      }),
    }),

    updateVariantStock: builder.mutation({
      query: ({ id, quantity, reason }) => ({
        url: `/${product_api}/management/variants/${id}/update-stock/`,
        method: "POST",
        body: { quantity, reason },
        service: service,
      }),
    }),

    bulkCreateVariants: builder.mutation({
      query: ({ productId, attributeCombinations }) => ({
        url: `/${product_api}/products/${productId}/variants/bulk-create/`,
        method: "POST",
        body: { product_id: productId, attribute_combinations: attributeCombinations },
        service: service,
      }),
    }),
    
    getVariantStatistics: builder.query<any, string>({
      query: (variantId) => ({
        url:`/${product_api}/variants/${variantId}/statistics/`,
        service: service,

      })
    }),
    getVariantMedia: builder.query<Attachment[], string>({
      query: (variantId) => ({
        url: `/${product_api}/variants/${variantId}/media/`,
        service: service,
      
      }),
    }),
    addVariantMedia: builder.mutation<Attachment, { variantId: string; data: FormData }>({
      query: ({ variantId, data }) => ({
        url: `/${product_api}/variants/${variantId}/add_media/`,
        method: 'POST',
        body: data,
        service: service,

      }),
    }),
    removeVariantMedia: builder.mutation<void, { variantId: string; attachmentId: string }>({
      query: ({ variantId, attachmentId }) => ({
        url: `/${product_api}/variants/${variantId}/remove_media/`,
        method: 'POST',
        body: { attachment_id: attachmentId },
        service: service,

      }),
    }),
    addVariantAttribute: builder.mutation<ProductVariantAttribute, { variantId: string; data: Partial<ProductVariantAttribute> }>({
      query: ({ variantId, data }) => ({
        url: `/${product_api}/variants/${variantId}/add_attribute/`,
        method: 'POST',
        body: data,
        service: service,

      }),
    }),
    editVariantAttribute: builder.mutation({
      query: ({ variantId, attributeLinkId, data }) => ({
        url: `/${product_api}/variants/${variantId}/edit_attribute/`,
        method: "POST",
        body: {
          attribute_link_id: attributeLinkId,
          ...data,
        },
        service: service,
      }),
      
    }),
    removeVariantAttribute: builder.mutation<void, { variantId: string; attributeLinkId: string }>({
      query: ({ variantId, attributeLinkId }) => ({
        url: `/${product_api}/variants/${variantId}/remove_attribute/`,
        method: 'POST',
        body: { attribute_link_id: attributeLinkId },
        service: service,

      }),
    }),
    
    getProductAttributeValues: builder.query<ProductAttributeValue[], { attributeId: string }>({
      query: ({ attributeId }) =>({
        url: `/${product_api}/attributes/${attributeId}/values/`,
        service: service,
      }),
    }),


    // Attribute links

    
    getProductAttributeLinks: builder.query<ProductAttributeLink[], {productId: string,variant:string}>({
      query: ({productId,variant}) =>({
        url: `/${product_api}/products/${productId}/attribute_links/?variant=${variant}`,
        service: service,
      }),
    }),
    createProductAttributeLink: builder.mutation<ProductAttributeLink, { productId: string; data: Partial<ProductAttributeLink> }>({
      query: ({ productId, data }) => ({
        url: `/${product_api}/products/${productId}/create_attribute_link/`,
        method: 'POST',
        body: data,
        service: service,
      }),
    }),
    updateProductAttributeLink: builder.mutation<ProductAttributeLink, { productId: string; id: string; data: Partial<ProductAttributeLink> }>({
      query: ({ productId, id, data }) => ({
        url: `/${product_api}/products/${productId}/update_attribute_link/`,
        method: 'PATCH',
        body: { id, ...data },
        service: service,
      }),
    }),
    deleteProductAttributeLink: builder.mutation<void, { productId: string; id: string }>({
      query: ({ productId, id }) => ({
        url: `/${product_api}/products/${productId}/delete_attribute_link/?id=${id}`,
        method: 'DELETE',
        service: service,
      }),
    }),
    
    // Product Attributes
    createProductAttribute: builder.mutation({
      query: (attributeData) => ({
        url: `/${product_api}/attributes/`,
        method: "POST",
        body: attributeData,
        service: service,
      }),
    }),

    updateProductAttribute: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${product_api}/attributes/${id}/`,
        method: "PATCH",
        body: data,
        service: service,
      }),
    }),

    deleteProductAttribute: builder.mutation({
      query: (id) => ({
        url: `/${product_api}/attributes/${id}/`,
        method: "DELETE",
        service: service,
      }),
    }),

    getProductAttributes: builder.query({
      query: ({excludeProductId}) => ({
        url: `/${product_api}/attributes/?exclude_product_id=${excludeProductId}`,
        
        service: service,
      }),
    }),

    getAttributeValues: builder.query({
      query: (attributeId) => ({
        url: `/${product_api}/management/attributes/${attributeId}/values/`,
        service: service,
      }),
    }),

    addAttributeValue: builder.mutation({
      query: ({ attributeId, valueData }) => ({
        url: `/${product_api}/management/attributes/${attributeId}/add-value/`,
        method: "POST",
        body: valueData,
        service: service,
      }),
    }),

    getVariantAttributes: builder.query({
      query: () => ({
        url: `/${product_api}/management/attributes/variant-attributes/`,
        service: service,
      }),
    }),

    // Attribute Values
    createAttributeValue: builder.mutation({
      query: (valueData) => ({
        url: `/${product_api}/attribute-values/`,
        method: "POST",
        body: valueData,
        service: service,
      }),
    }),

    updateAttributeValue: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${product_api}/attribute-values/${id}/`,
        method: "PATCH",
        body: data,
        service: service,
      }),
    }),

    deleteAttributeValue: builder.mutation({
      query: (id) => ({
        url: `/${product_api}/attribute-values/${id}/`,
        method: "DELETE",
        service: service,
      }),
    }),

    toggleAttributeValueActive: builder.mutation({
      query: (id) => ({
        url: `/${product_api}/management/attribute-values/${id}/toggle-active/`,
        method: "POST",
        service: service,
      }),
    }),

    // Pricing Strategies
    createPricingStrategy: builder.mutation({
      query: (strategyData) => ({
        url: `/${product_api}/pricing-strategies/`,
        method: "POST",
        body: strategyData,
        service: service,
      }),
    }),

    updatePricingStrategy: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${product_api}/pricing-strategies/${id}/`,
        method: "PATCH",
        body: data,
        service: service,
      }),
    }),

    deletePricingStrategy: builder.mutation({
      query: (id) => ({
        url: `/${product_api}/pricing-strategies/${id}/`,
        method: "DELETE",
        service: service,
      }),
    }),

    getPricingStrategies: builder.query({
      query: (params = {}) => ({
        url: `/${product_api}/pricing-strategies/`,
        params,
        service: service,
      }),
    }),

    calculatePrice: builder.mutation({
      query: ({ strategyId, costPrice, quantity }) => ({
        url: `/${product_api}/management/pricing-strategies/${strategyId}/calculate-price/`,
        method: "POST",
        body: { cost_price: costPrice, quantity },
        service: service,
      }),
    }),

    getActivePricingStrategies: builder.query({
      query: () => ({
        url: `/${product_api}/management/pricing-strategies/active/`,
        service: service,
      }),
    }),

    // Price Change History
    getPriceChangeHistory: builder.query({
      query: (params = {}) => ({
        url: `/${product_api}/price-history/`,
        params,
        service: service,
      }),
    }),

    getRecentPriceChanges: builder.query({
      query: (days = 7) => ({
        url: `/${product_api}/management/price-history/recent/`,
        params: { days },
        service: service,
      }),
    }),

    getPendingPriceApprovals: builder.query({
      query: () => ({
        url: `/${product_api}/management/price-history/pending/`,
        service: service,
      }),
    }),

    approvePriceChange: builder.mutation({
      query: (id) => ({
        url: `/${product_api}/management/price-history/${id}/approve/`,
        method: "POST",
        service: service,
      }),
    }),

    rejectPriceChange: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/${product_api}/management/price-history/${id}/reject/`,
        method: "POST",
        body: { reason },
        service: service,
      }),
    }),

    // Purchase Price History
    createPurchasePriceHistory: builder.mutation({
      query: (historyData) => ({
        url: `/${product_api}/purchase-history/`,
        method: "POST",
        body: historyData,
        service: service,
      }),
    }),

    updatePurchasePriceHistory: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${product_api}/purchase-history/${id}/`,
        method: "PATCH",
        body: data,
        service: service,
      }),
    }),

    getPurchasePriceHistory: builder.query({
      query: (params = {}) => ({
        url: `/${product_api}/purchase-history/`,
        params,
        service: service,
      }),
    }),

    getCurrentPurchasePrices: builder.query({
      query: () => ({
        url: `/${product_api}/management/purchase-history/current/`,
        service: service,
      }),
    }),

    endPricePeriod: builder.mutation({
      query: (id) => ({
        url: `/${product_api}/management/purchase-history/${id}/end-period/`,
        method: "POST",
        service: service,
      }),
    }),

    // Pricing Rules
    createPricingRule: builder.mutation({
      query: (ruleData) => ({
        url: `/${product_api}/pricing-rules/`,
        method: "POST",
        body: ruleData,
        service: service,
      }),
    }),

    updatePricingRule: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${product_api}/pricing-rules/${id}/`,
        method: "PATCH",
        body: data,
        service: service,
      }),
    }),

    deletePricingRule: builder.mutation({
      query: (id) => ({
        url: `/${product_api}/pricing-rules/${id}/`,
        method: "DELETE",
        service: service,
      }),
    }),

    getPricingRules: builder.query({
      query: (params = {}) => ({
        url: `/${product_api}/pricing-rules/`,
        params,
        service: service,
      }),
    }),

    getActivePricingRules: builder.query({
      query: () => ({
        url: `/${product_api}/management/pricing-rules/active/`,
        service: service,
      }),
    }),

    calculateDiscount: builder.mutation({
      query: (discountData) => ({
        url: `/${product_api}/management/pricing-rules/calculate-discount/`,
        method: "POST",
        body: discountData,
        service: service,
      }),
    }),

    togglePricingRuleActive: builder.mutation({
      query: (id) => ({
        url: `/${product_api}/management/pricing-rules/${id}/toggle-active/`,
        method: "POST",
        service: service,
      }),
    }),

    // Attachments
    createAttachment: builder.mutation({
      query: (attachmentData) => ({
        url: `/${product_api}/attachments/`,
        method: "POST",
        body: attachmentData,
        service: service,
      }),
    }),

    updateAttachment: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${product_api}/attachments/${id}/`,
        method: "PATCH",
        body: data,
        service: service,
      }),
    }),

    deleteAttachment: builder.mutation({
      query: (id) => ({
        url: `/${product_api}/attachments/${id}/`,
        method: "DELETE",
        service: service,
      }),
    }),

    getAttachments: builder.query({
      query: (params = {}) => ({
        url: `/${product_api}/attachments/`,
        params,
        service: service,
      }),
    }),

    setPrimaryAttachment: builder.mutation({
      query: (id) => ({
        url: `/${product_api}/management/attachments/${id}/set-primary/`,
        method: "POST",
        service: service,
      }),
    }),

    bulkUploadAttachments: builder.mutation({
      query: (uploadData) => ({
        url: `/${product_api}/bulk/attachments/upload/`,
        method: "POST",
        body: uploadData,
        service: service,
      }),
    }),

    // POS Configuration
    getPosConfiguration: builder.query({
      query: () => ({
        url: `/${product_api}/pos/config/`,
        service: service,
      }),
    }),

    updatePosConfiguration: builder.mutation({
      query: (configData) => ({
        url: `/${product_api}/pos/config/`,
        method: "POST",
        body: configData,
        service: service,
      }),
    }),

    generateBarcode: builder.query({
      query: () => ({
        url: `/${product_api}/pos/config/barcode/`,
        service: service,
      }),
    }),

    // POS Operations
    getPosProducts: builder.query({
      query: (params = {}) => ({
        url: `/${product_api}/pos/products/`,
        params,
        service: service,
      }),
    }),

    searchPosProducts: builder.query({
      query: (searchQuery) => ({
        url: `/${product_api}/pos/products/search/`,
        params: { q: searchQuery },
        service: service,
      }),
    }),

    getPosFeaturedProducts: builder.query({
      query: () => ({
        url: `/${product_api}/pos/products/featured/`,
        service: service,
      }),
    }),

    getPosCategories: builder.query({
      query: () => ({
        url: `/${product_api}/pos/products/categories/`,
        service: service,
      }),
    }),

    getPosVariants: builder.query({
      query: (params = {}) => ({
        url: `/${product_api}/variants/`,
        params,
        service: service,
      }),
    }),

    searchPosVariants: builder.query({
      query: (searchQuery) => ({
        url: `/${product_api}/variants/search/`,
        params: { q: searchQuery },
        service: service,
      }),
    }),

    getVariantByBarcode: builder.query({
      query: (barcode) => ({
        url: `/${product_api}/variants/barcode/`,
        params: { barcode },
        service: service,
      }),
    }),

    // Bulk Operations
    bulkPosUpdate: builder.mutation({
      query: ({ productIds, updates }) => ({
        url: `/${product_api}/bulk/products/pos-update/`,
        method: "POST",
        body: { product_ids: productIds, updates },
        service: service,
      }),
    }),

    bulkUpdatePrices: builder.mutation({
      query: (productIds) => ({
        url: `/${product_api}/bulk/products/price-update/`,
        method: "POST",
        body: { product_ids: productIds },
        service: service,
      }),
    }),

    // Analytics
    getInventorySummary: builder.query({
      query: () => ({
        url: `/${product_api}/analytics/inventory-summary/`,
        service: service,
      }),
    }),

    getStockAlerts: builder.query({
      query: () => ({
        url: `/${product_api}/analytics/stock-alerts/`,
        service: service,
      }),
    }),

    getPriceTrends: builder.query({
      query: (days = 30) => ({
        url: `/${product_api}/analytics/price-trends/`,
        params: { days },
        service: service,
      }),
    }),

    getDashboardStats: builder.query({
      query: () => ({
        url: `/${product_api}/dashboard/stats/`,
        service: service,
      }),
    }),

    // Export Operations
    exportProductsCsv: builder.query({
      query: (params = {}) => ({
        url: `/${product_api}/export/products/csv/`,
        params,
        service: service,
      }),
    }),

    exportVariantsCsv: builder.query({
      query: (params = {}) => ({
        url: `/${product_api}/export/variants/csv/`,
        params,
        service: service,
      }),
    }),

    exportPriceHistoryCsv: builder.query({
      query: (params = {}) => ({
        url: `/${product_api}/export/price-history/csv/`,
        params,
        service: service,
      }),
    }),
  }),
})

export const {
  // Product Management
  useCreateProductMutation,
  useUpdateProductMutation,
  useRemoveTemplateModeMutation,
  useDeleteProductMutation,
  useGetProductQuery,
  useGetMinimalProductQuery,
  useGetProductDataQuery,
  useToggleProductQuickSaleMutation,
  useToggleProductFeaturedMutation,
  useGetProductVariantsQuery,
  useGetProductPosVariantsQuery,
  useGetProductFeaturedVariantsQuery,
  useGetProductPriceHistoryQuery,
  useGetProductAnalyticsQuery,

  // Product Categories
  useCreateProductCategoryMutation,
  useUpdateProductCategoryMutation,
  useDeleteProductCategoryMutation,
  useGetProductCategoriesQuery,
  useGetCategoryTreeQuery,
  useGetPosCategoryTreeQuery,
  useGetCategoryProductsQuery,

  // AI Bulk Creation
  useAiBulkCreateProductsMutation,
  useGetBulkTaskStatusQuery,
  useLazyGetBulkTaskStatusQuery,
  useListBulkTasksQuery,
  // Product Variants
  useCreateProductVariantMutation,
  useUpdateProductVariantMutation,
  useDeleteProductVariantMutation,
  useGetProductVariantQuery,
  useGetAllProductVariantsQuery,
  useToggleVariantFeaturedMutation,
  useToggleVariantPosVisibleMutation,
  useGetVariantStockHistoryQuery,
  useUpdateVariantStockMutation,
  useBulkCreateVariantsMutation,
  useGetVariantStatisticsQuery,
  useGetVariantMediaQuery,
  useAddVariantMediaMutation,
  useRemoveVariantMediaMutation,
  useAddVariantAttributeMutation,
  useEditVariantAttributeMutation,
  useRemoveVariantAttributeMutation,


  // Attribute links
  
  useGetProductAttributeLinksQuery,
  useCreateProductAttributeLinkMutation,
  useUpdateProductAttributeLinkMutation,
  useDeleteProductAttributeLinkMutation,  
  
  // Product Attributes
  useGetProductAttributeValuesQuery,
  useCreateProductAttributeMutation,
  useUpdateProductAttributeMutation,
  useDeleteProductAttributeMutation,
  useGetProductAttributesQuery,
  useGetAttributeValuesQuery,
  useAddAttributeValueMutation,
  useGetVariantAttributesQuery,

  // Attribute Values
  useCreateAttributeValueMutation,
  useUpdateAttributeValueMutation,
  useDeleteAttributeValueMutation,
  useToggleAttributeValueActiveMutation,

  // Pricing Strategies
  useCreatePricingStrategyMutation,
  useUpdatePricingStrategyMutation,
  useDeletePricingStrategyMutation,
  useGetPricingStrategiesQuery,
  useCalculatePriceMutation,
  useGetActivePricingStrategiesQuery,

  // Price Change History
  useGetPriceChangeHistoryQuery,
  useGetRecentPriceChangesQuery,
  useGetPendingPriceApprovalsQuery,
  useApprovePriceChangeMutation,
  useRejectPriceChangeMutation,

  // Purchase Price History
  useCreatePurchasePriceHistoryMutation,
  useUpdatePurchasePriceHistoryMutation,
  useGetPurchasePriceHistoryQuery,
  useGetCurrentPurchasePricesQuery,
  useEndPricePeriodMutation,

  // Pricing Rules
  useCreatePricingRuleMutation,
  useUpdatePricingRuleMutation,
  useDeletePricingRuleMutation,
  useGetPricingRulesQuery,
  useGetActivePricingRulesQuery,
  useCalculateDiscountMutation,
  useTogglePricingRuleActiveMutation,

  // Attachments
  useCreateAttachmentMutation,
  useUpdateAttachmentMutation,
  useDeleteAttachmentMutation,
  useGetAttachmentsQuery,
  useSetPrimaryAttachmentMutation,
  useBulkUploadAttachmentsMutation,

  // POS Configuration
  useGetPosConfigurationQuery,
  useUpdatePosConfigurationMutation,
  useGenerateBarcodeQuery,

  // POS Operations
  useGetPosProductsQuery,
  useSearchPosProductsQuery,
  useGetPosFeaturedProductsQuery,
  useGetPosCategoriesQuery,
  useGetPosVariantsQuery,
  useSearchPosVariantsQuery,
  useGetVariantByBarcodeQuery,

  // Bulk Operations
  useBulkPosUpdateMutation,
  useBulkUpdatePricesMutation,

  // Analytics
  useGetInventorySummaryQuery,
  useGetStockAlertsQuery,
  useGetPriceTrendsQuery,
  useGetDashboardStatsQuery,

  // Export Operations
  useExportProductsCsvQuery,
  useExportVariantsCsvQuery,
  useExportPriceHistoryCsvQuery,
} = productApiSlice

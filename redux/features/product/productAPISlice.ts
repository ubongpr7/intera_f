import { apiSlice } from "../../services/apiSlice"
import type {
  Attachment,
  BulkTaskStatus,
  PriceChangeHistory,
  PricingRule,
  PricingStrategy,
  Product,
  ProductAttribute,
  ProductAttributeLink,
  ProductAttributeValue,
  ProductCategory,
  ProductDashboardStats,
  ProductInventorySummary,
  ProductPosProductsResponse,
  ProductPriceTrends,
  ProductStockAlerts,
  ProductVariant,
  ProductVariantAttribute,
  PurchasePriceHistory,
} from "./productTypes"

const product_api = "product_api"
const service = "product"

const unsupportedEndpoint = (detail: string) => async () => ({
  error: {
    status: 501,
    data: { detail },
  } as const,
})

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

    getProduct: builder.query<Product, string>({
      query: (id) => ({
        url: `/${product_api}/products/${id}/`,
        service: service,
      }),
    }),

    getMinimalProduct: builder.query<Partial<Product>, string>({
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

    getProductVariants: builder.query<ProductVariant[], string>({
      query: (productId) => ({
        url: `/${product_api}/management/products/${productId}/variants/`,
        service: service,
      }),
    }),

    getProductPosVariants: builder.query<ProductVariant[], string>({
      query: (productId) => ({
        url: `/${product_api}/management/products/${productId}/pos-variants/`,
        service: service,
      }),
    }),

    getProductFeaturedVariants: builder.query<ProductVariant, string>({
      query: (productId) => ({
        url: `/${product_api}/management/products/${productId}/featured-variants/`,
        service: service,
      }),
    }),

    getProductPriceHistory: builder.query<PriceChangeHistory[], { productId: string; params?: Record<string, unknown> }>({
      query: ({ productId, params = {} }) => ({
        url: `/${product_api}/management/products/${productId}/price-history/`,
        params,
        service: service,
      }),
    }),

    getProductAnalytics: builder.query<Record<string, unknown>, string>({
      query: (productId) => ({
        url: `/${product_api}/management/products/${productId}/analytics/`,
        service: service,
      }),
    }),

    // Product Categories
    createProductCategory: builder.mutation<ProductCategory, Partial<ProductCategory>>({
      queryFn: unsupportedEndpoint("Product category creation is not exposed by the current product_service backend."),
    }),

    updateProductCategory: builder.mutation<ProductCategory, { id: string; data: Partial<ProductCategory> }>({
      queryFn: unsupportedEndpoint("Product category updates are not exposed by the current product_service backend."),
    }),

    deleteProductCategory: builder.mutation<void, string>({
      queryFn: unsupportedEndpoint("Product category deletion is not exposed by the current product_service backend."),
    }),

    getProductCategories: builder.query<ProductCategory[], unknown>({
      query: () => ({
        url: `/${product_api}/products/product_categories/`,
        service: service,
      }),
    }),

    getCategoryTree: builder.query<ProductCategory[], void>({
      queryFn: unsupportedEndpoint("Category tree endpoints are not exposed by the current product_service backend."),
    }),

    getPosCategoryTree: builder.query<ProductCategory[], void>({
      queryFn: unsupportedEndpoint("POS category tree endpoints are not exposed by the current product_service backend."),
    }),

    getCategoryProducts: builder.query<Product[], { categoryId: string; params?: Record<string, unknown> }>({
      query: ({ categoryId, params = {} }) => ({
        url: `/${product_api}/products/`,
        params: { ...params, category: categoryId },
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

    getBulkTaskStatus: builder.query<BulkTaskStatus, string>({
      query: (taskId) => ({
        url: `/${product_api}/products/bulk_task_status/?task_id=${taskId}`,
        service: service,
      }),
    }),

    listBulkTasks: builder.query<BulkTaskStatus[], void>({
      query: () => ({
        url: `/${product_api}/products/bulk_task_status/`,
        service: service,
      }),
    }),
    // Product Variants
    createProductVariant: builder.mutation<ProductVariant, Partial<ProductVariant>>({
      query: (variantData) => ({
        url: `/${product_api}/variants/`,
        method: "POST",
        body: variantData,
        service: service,
      }),
    }),

    updateProductVariant: builder.mutation<ProductVariant, { id: string; data: Partial<ProductVariant> }>({
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

    getProductVariant: builder.query<ProductVariant, string>({
      query: (id) => ({
        url: `/${product_api}/variants/${id}/`,
        service: service,
      }),
    }),

    getAllProductVariants: builder.query<ProductVariant[], Record<string, unknown> | void>({
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

    getVariantStockHistory: builder.query<Record<string, unknown>, string>({
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
    
    getVariantStatistics: builder.query<Record<string, unknown>, string>({
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
    createProductAttribute: builder.mutation<ProductAttribute, Partial<ProductAttribute>>({
      query: (attributeData) => ({
        url: `/${product_api}/attributes/`,
        method: "POST",
        body: attributeData,
        service: service,
      }),
    }),

    updateProductAttribute: builder.mutation<ProductAttribute, { id: string; data: Partial<ProductAttribute> }>({
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

    getProductAttributes: builder.query<ProductAttribute[], { excludeProductId?: string } | void>({
      query: ({excludeProductId}) => ({
        url: `/${product_api}/attributes/?exclude_product_id=${excludeProductId}`,
        
        service: service,
      }),
    }),

    getAttributeValues: builder.query<ProductAttributeValue[], string>({
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

    getVariantAttributes: builder.query<ProductAttribute[], void>({
      query: () => ({
        url: `/${product_api}/management/attributes/variant-attributes/`,
        service: service,
      }),
    }),

    // Attribute Values
    createAttributeValue: builder.mutation<ProductAttributeValue, Partial<ProductAttributeValue>>({
      query: (valueData) => ({
        url: `/${product_api}/attribute-values/`,
        method: "POST",
        body: valueData,
        service: service,
      }),
    }),

    updateAttributeValue: builder.mutation<ProductAttributeValue, { id: string; data: Partial<ProductAttributeValue> }>({
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
    createPricingStrategy: builder.mutation<PricingStrategy, Partial<PricingStrategy>>({
      query: (strategyData) => ({
        url: `/${product_api}/pricing-strategies/`,
        method: "POST",
        body: strategyData,
        service: service,
      }),
    }),

    updatePricingStrategy: builder.mutation<PricingStrategy, { id: string; data: Partial<PricingStrategy> }>({
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

    getPricingStrategies: builder.query<PricingStrategy[], Record<string, unknown> | void>({
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

    getActivePricingStrategies: builder.query<PricingStrategy[], void>({
      query: () => ({
        url: `/${product_api}/management/pricing-strategies/active/`,
        service: service,
      }),
    }),

    // Price Change History
    getPriceChangeHistory: builder.query<PriceChangeHistory[], Record<string, unknown> | void>({
      query: (params = {}) => ({
        url: `/${product_api}/price-history/`,
        params,
        service: service,
      }),
    }),

    getRecentPriceChanges: builder.query<PriceChangeHistory[], number | void>({
      query: (days = 7) => ({
        url: `/${product_api}/management/price-history/recent/`,
        params: { days },
        service: service,
      }),
    }),

    getPendingPriceApprovals: builder.query<PriceChangeHistory[], void>({
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
    createPurchasePriceHistory: builder.mutation<PurchasePriceHistory, Partial<PurchasePriceHistory>>({
      query: (historyData) => ({
        url: `/${product_api}/purchase-history/`,
        method: "POST",
        body: historyData,
        service: service,
      }),
    }),

    updatePurchasePriceHistory: builder.mutation<PurchasePriceHistory, { id: string; data: Partial<PurchasePriceHistory> }>({
      query: ({ id, data }) => ({
        url: `/${product_api}/purchase-history/${id}/`,
        method: "PATCH",
        body: data,
        service: service,
      }),
    }),

    getPurchasePriceHistory: builder.query<PurchasePriceHistory[], Record<string, unknown> | void>({
      query: (params = {}) => ({
        url: `/${product_api}/purchase-history/`,
        params,
        service: service,
      }),
    }),

    getCurrentPurchasePrices: builder.query<PurchasePriceHistory[], void>({
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
    createPricingRule: builder.mutation<PricingRule, Partial<PricingRule>>({
      query: (ruleData) => ({
        url: `/${product_api}/pricing-rules/`,
        method: "POST",
        body: ruleData,
        service: service,
      }),
    }),

    updatePricingRule: builder.mutation<PricingRule, { id: string; data: Partial<PricingRule> }>({
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

    getPricingRules: builder.query<PricingRule[], Record<string, unknown> | void>({
      query: (params = {}) => ({
        url: `/${product_api}/pricing-rules/`,
        params,
        service: service,
      }),
    }),

    getActivePricingRules: builder.query<PricingRule[], void>({
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
    createAttachment: builder.mutation<Attachment, FormData | Record<string, unknown>>({
      query: (attachmentData) => ({
        url: `/${product_api}/attachments/`,
        method: "POST",
        body: attachmentData,
        service: service,
      }),
    }),

    updateAttachment: builder.mutation<Attachment, { id: string; data: Partial<Attachment> }>({
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

    getAttachments: builder.query<Attachment[], Record<string, unknown> | void>({
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
    getPosConfiguration: builder.query<Record<string, unknown>, unknown>({
      queryFn: unsupportedEndpoint("POS configuration endpoints are not exposed by the current product_service backend."),
    }),

    updatePosConfiguration: builder.mutation<Record<string, unknown>, Record<string, unknown>>({
      queryFn: unsupportedEndpoint("POS configuration endpoints are not exposed by the current product_service backend."),
    }),

    generateBarcode: builder.query<Record<string, unknown>, unknown>({
      queryFn: unsupportedEndpoint("Barcode generation endpoints are not exposed by the current product_service backend."),
    }),

    // POS Operations
    getPosProducts: builder.query<ProductPosProductsResponse, Record<string, unknown> | void>({
      query: (params = {}) => ({
        url: `/${product_api}/pos/products/`,
        params,
        service: service,
      }),
    }),

    searchPosProducts: builder.query<Product[], string>({
      query: (searchQuery) => ({
        url: `/${product_api}/pos/products/search/`,
        params: { q: searchQuery },
        service: service,
      }),
    }),

    getPosFeaturedProducts: builder.query<Product[], void>({
      query: () => ({
        url: `/${product_api}/pos/products/featured/`,
        service: service,
      }),
    }),

    getPosCategories: builder.query<ProductCategory[], void>({
      query: () => ({
        url: `/${product_api}/products/product_categories/`,
        service: service,
      }),
    }),

    getPosVariants: builder.query<ProductVariant[], Record<string, unknown> | void>({
      query: (params = {}) => ({
        url: `/${product_api}/pos/variants/`,
        params,
        service: service,
      }),
    }),

    searchPosVariants: builder.query<ProductVariant[], string>({
      query: (searchQuery) => ({
        url: `/${product_api}/pos/variants/search/`,
        params: { q: searchQuery },
        service: service,
      }),
    }),

    getVariantByBarcode: builder.query<ProductVariant, string>({
      query: (barcode) => ({
        url: `/${product_api}/pos/variants/barcode/`,
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
    getInventorySummary: builder.query<ProductInventorySummary, void>({
      query: () => ({
        url: `/${product_api}/analytics/inventory-summary/`,
        service: service,
      }),
    }),

    getStockAlerts: builder.query<ProductStockAlerts, void>({
      query: () => ({
        url: `/${product_api}/analytics/stock-alerts/`,
        service: service,
      }),
    }),

    getPriceTrends: builder.query<ProductPriceTrends, number | void>({
      query: (days = 30) => ({
        url: `/${product_api}/analytics/price-trends/`,
        params: { days },
        service: service,
      }),
    }),

    getDashboardStats: builder.query<ProductDashboardStats, void>({
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

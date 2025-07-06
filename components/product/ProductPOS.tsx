"use client"

import React from "react"

import { useState } from "react"
import {
  useGetPosConfigurationQuery,
  useUpdatePosConfigurationMutation,
  useGenerateBarcodeQuery,
  useToggleProductQuickSaleMutation,
} from "@/redux/features/product/productAPISlice"
import LoadingAnimation from "../common/LoadingAnimation"
import { Product } from "../interfaces/product"

interface ProductPOSProps {
  productId: string
    product:Partial<Product>
  
}

export default function ProductPOS({ productId,product }: ProductPOSProps) {
  const [isEditing, setIsEditing] = useState(false)

  const { data: posConfig, isLoading: configLoading, refetch: refetchConfig } = useGetPosConfigurationQuery('')
  const { data: nextBarcode } = useGenerateBarcodeQuery('')
  const [updateConfig, { isLoading: isUpdating }] = useUpdatePosConfigurationMutation()
  const [toggleQuickSale] = useToggleProductQuickSaleMutation()

  const [configData, setConfigData] = useState({
    default_tax_rate: 0,
    tax_inclusive_pricing: false,
    allow_negative_stock: false,
    show_stock_levels: true,
    low_stock_warning: true,
    require_barcode: false,
    auto_generate_barcode: true,
    barcode_prefix: "",
    auto_print_receipt: true,
    receipt_header: "",
    receipt_footer: "",
    allow_item_discount: true,
    allow_transaction_discount: true,
    max_discount_without_approval: 10,
    products_per_page: 20,
    show_product_images: true,
    default_view: "grid",
    enable_quick_sale: true,
    quick_sale_categories: "",
    cash_rounding: 0.01,
    enable_loyalty: false,
    loyalty_points_rate: 1.0,
  })

  React.useEffect(() => {
    if (posConfig) {
      setConfigData(posConfig)
    }
  }, [posConfig])

  const handleSaveConfig = async () => {
    try {
      await updateConfig(configData).unwrap()
      setIsEditing(false)
      refetchConfig()
    } catch (error) {
      console.error("Error updating POS config:", error)
    }
  }

  const handleToggleQuickSale = async () => {
    try {
      await toggleQuickSale(productId).unwrap()
    } catch (error) {
      console.error("Error toggling quick sale:", error)
    }
  }

  if (configLoading) {
    return (
      <div className="text-center flex items-center justify-center py-8 text-gray-500">
        <LoadingAnimation text="Loading POS settings..." ringColor="#3b82f6" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">POS Settings</h2>
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={isUpdating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {isUpdating && <LoadingAnimation text="" ringColor="#ffffff"  />}
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit Settings
            </button>
          )}
        </div>
      </div>

      {/* Product-Specific POS Settings */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Product POS Settings</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Sale Status</label>
            <div className="flex items-center space-x-3">
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  product?.quick_sale ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                }`}
              >
                {product?.quick_sale ? "Enabled" : "Disabled"}
              </span>
              <button
                onClick={handleToggleQuickSale}
                className={`px-3 py-1 rounded text-sm ${
                  product?.quick_sale
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {product?.quick_sale ? "Disable" : "Enable"}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1">Quick sale products appear in POS for fast access</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">POS Category</label>
            <p className="text-sm text-gray-900">{product?.pos_category || "Not assigned"}</p>
            <p className="text-xs text-gray-600 mt-1">Category for POS display grouping</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate</label>
            <p className="text-sm text-gray-900">{product?.tax_rate}%</p>
            <p className="text-xs text-gray-600 mt-1">Default tax rate for this product</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Discount Settings</label>
            <div className="space-y-1">
              <p className="text-sm text-gray-900">Allow Discount: {product?.allow_discount ? "Yes" : "No"}</p>
              {product?.allow_discount && (
                <p className="text-sm text-gray-900">Max Discount: {product?.max_discount_percent}%</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Global POS Configuration */}
      
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Global POS Configuration</h3>

        <div className="space-y-6">
          {/* Tax Settings */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Tax Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Tax Rate (%)</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={configData.default_tax_rate}
                    onChange={(e) =>
                      setConfigData({
                        ...configData,
                        default_tax_rate: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 text-inherit py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900">{configData.default_tax_rate}%</p>
                )}
              </div>

              <div className="flex items-center">
                {isEditing ? (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={configData.tax_inclusive_pricing}
                      onChange={(e) =>
                        setConfigData({
                          ...configData,
                          tax_inclusive_pricing: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">Tax Inclusive Pricing</span>
                  </label>
                ) : (
                  <div>
                    <span className="text-sm text-gray-700">Tax Inclusive Pricing: </span>
                    <span className="text-sm text-gray-900">{configData.tax_inclusive_pricing ? "Yes" : "No"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stock Settings */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Stock Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                {isEditing ? (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={configData.allow_negative_stock}
                      onChange={(e) =>
                        setConfigData({
                          ...configData,
                          allow_negative_stock: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">Allow Negative Stock</span>
                  </label>
                ) : (
                  <div>
                    <span className="text-sm text-gray-700">Allow Negative Stock: </span>
                    <span className="text-sm text-gray-900">{configData.allow_negative_stock ? "Yes" : "No"}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center">
                {isEditing ? (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={configData.show_stock_levels}
                      onChange={(e) =>
                        setConfigData({
                          ...configData,
                          show_stock_levels: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">Show Stock Levels</span>
                  </label>
                ) : (
                  <div>
                    <span className="text-sm text-gray-700">Show Stock Levels: </span>
                    <span className="text-sm text-gray-900">{configData.show_stock_levels ? "Yes" : "No"}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center">
                {isEditing ? (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={configData.low_stock_warning}
                      onChange={(e) =>
                        setConfigData({
                          ...configData,
                          low_stock_warning: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">Low Stock Warning</span>
                  </label>
                ) : (
                  <div>
                    <span className="text-sm text-gray-700">Low Stock Warning: </span>
                    <span className="text-sm text-gray-900">{configData.low_stock_warning ? "Yes" : "No"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Barcode Settings */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Barcode Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barcode Prefix</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={configData.barcode_prefix}
                    onChange={(e) =>
                      setConfigData({
                        ...configData,
                        barcode_prefix: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., PRD"
                  />
                ) : (
                  <p className="text-sm text-gray-900">{configData.barcode_prefix || "None"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Barcode</label>
                <p className="text-sm text-gray-900">{nextBarcode?.next_barcode || "Loading..."}</p>
              </div>

              <div className="flex items-center">
                {isEditing ? (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={configData.require_barcode}
                      onChange={(e) =>
                        setConfigData({
                          ...configData,
                          require_barcode: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">Require Barcode</span>
                  </label>
                ) : (
                  <div>
                    <span className="text-sm text-gray-700">Require Barcode: </span>
                    <span className="text-sm text-gray-900">{configData.require_barcode ? "Yes" : "No"}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center">
                {isEditing ? (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={configData.auto_generate_barcode}
                      onChange={(e) =>
                        setConfigData({
                          ...configData,
                          auto_generate_barcode: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">Auto Generate Barcode</span>
                  </label>
                ) : (
                  <div>
                    <span className="text-sm text-gray-700">Auto Generate: </span>
                    <span className="text-sm text-gray-900">{configData.auto_generate_barcode ? "Yes" : "No"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Display Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Products Per Page</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={configData.products_per_page}
                    onChange={(e) =>
                      setConfigData({
                        ...configData,
                        products_per_page: Number.parseInt(e.target.value) || 20,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900">{configData.products_per_page}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default View</label>
                {isEditing ? (
                  <select
                    value={configData.default_view}
                    onChange={(e) =>
                      setConfigData({
                        ...configData,
                        default_view: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="grid">Grid View</option>
                    <option value="list">List View</option>
                  </select>
                ) : (
                  <p className="text-sm text-gray-900">
                    {configData.default_view === "grid" ? "Grid View" : "List View"}
                  </p>
                )}
              </div>

              <div className="flex items-center">
                {isEditing ? (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={configData.show_product_images}
                      onChange={(e) =>
                        setConfigData({
                          ...configData,
                          show_product_images: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">Show Product Images</span>
                  </label>
                ) : (
                  <div>
                    <span className="text-sm text-gray-700">Show Images: </span>
                    <span className="text-sm text-gray-900">{configData.show_product_images ? "Yes" : "No"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Receipt Settings */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Receipt Settings</h4>
            <div className="space-y-4">
              <div className="flex items-center">
                {isEditing ? (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={configData.auto_print_receipt}
                      onChange={(e) =>
                        setConfigData({
                          ...configData,
                          auto_print_receipt: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">Auto Print Receipt</span>
                  </label>
                ) : (
                  <div>
                    <span className="text-sm text-gray-700">Auto Print Receipt: </span>
                    <span className="text-sm text-gray-900">{configData.auto_print_receipt ? "Yes" : "No"}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Header</label>
                  {isEditing ? (
                    <textarea
                      value={configData.receipt_header}
                      onChange={(e) =>
                        setConfigData({
                          ...configData,
                          receipt_header: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Custom header text..."
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{configData.receipt_header || "None"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer</label>
                  {isEditing ? (
                    <textarea
                      value={configData.receipt_footer}
                      onChange={(e) =>
                        setConfigData({
                          ...configData,
                          receipt_footer: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Custom footer text..."
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{configData.receipt_footer || "None"}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

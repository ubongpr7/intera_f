"use client"

import {
  useGetProductAnalyticsQuery,
  useGetStockAlertsQuery,
  useGetPriceTrendsQuery,
} from "@/redux/features/product/productAPISlice"
import LoadingAnimation from "../common/LoadingAnimation"
import { getCurrencySymbolForProfile } from "@/lib/currency-utils"

interface ProductAnalyticsProps {
  productId: string
}

export default function ProductAnalytics({ productId }: ProductAnalyticsProps) {
  const { data: analytics, isLoading: analyticsLoading } = useGetProductAnalyticsQuery(productId)
  const { data: stockAlerts, isLoading: alertsLoading } = useGetStockAlertsQuery('')
  const { data: priceTrends, isLoading: trendsLoading } = useGetPriceTrendsQuery(30)

  if (analyticsLoading) {
    return (
      <div className="text-center flex items-center justify-center py-8 text-gray-500">
        <LoadingAnimation text="Loading analytics..." ringColor="#3b82f6" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Product Analytics</h2>

      {/* Key Metrics */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Variants</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total:</span>
                <span className="text-sm font-medium text-gray-900">{analytics.variant_stats.total_variants}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active:</span>
                <span className="text-sm font-medium text-green-600">{analytics.variant_stats.active_variants}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Inactive:</span>
                <span className="text-sm font-medium text-red-600">{analytics.variant_stats.inactive_variants}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Stock Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Stock:</span>
                <span className="text-sm font-medium text-gray-900">{analytics.stock_stats.total_stock}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Low Stock:</span>
                <span className="text-sm font-medium text-yellow-600">{analytics.stock_stats.low_stock_variants}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Out of Stock:</span>
                <span className="text-sm font-medium text-red-600">{analytics.stock_stats.out_of_stock_variants}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pricing</h3>
            <div className="space-y-2">
              {analytics.price_stats.min_price !== undefined && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Min Price:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {getCurrencySymbolForProfile()} {analytics.price_stats.min_price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Max Price:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {getCurrencySymbolForProfile()} {analytics.price_stats.max_price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Price:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {getCurrencySymbolForProfile()} {analytics.price_stats.avg_price.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Profit Margin:</span>
                <span
                  className={`text-sm font-medium ${analytics.profit_margin > 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {analytics.profit_margin.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Activity</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Price Changes:</span>
                <span className="text-sm font-medium text-gray-900">{analytics.recent_price_changes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">POS Ready:</span>
                <span className={`text-sm font-medium ${analytics.pos_ready ? "text-green-600" : "text-red-600"}`}>
                  {analytics.pos_ready ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Alerts */}
      {!alertsLoading && stockAlerts && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Alerts</h3>
          {stockAlerts.low_stock_items && stockAlerts.low_stock_items.length > 0 ? (
            <div className="space-y-3">
              {stockAlerts.low_stock_items.slice(0, 5).map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-yellow-50 border border-yellow-200 rounded"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-600">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-yellow-800">{item.quantity} remaining</p>
                    <p className="text-xs text-yellow-600">Threshold: {item.threshold}</p>
                  </div>
                </div>
              ))}
              {stockAlerts.low_stock_items.length > 5 && (
                <p className="text-sm text-gray-600 text-center">
                  And {stockAlerts.low_stock_items.length - 5} more items...
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No stock alerts for this product.</p>
          )}
        </div>
      )}

      {/* Price Trends */}
      {!trendsLoading && priceTrends && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Trends (Last 30 Days)</h3>
          {priceTrends.price_changes_by_type && priceTrends.price_changes_by_type.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {priceTrends.price_changes_by_type.map((change: any, index: number) => (
                  <div key={index} className="text-center p-4 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">{change.change_type}</p>
                    <p className="text-lg font-semibold text-gray-900">{change.count}</p>
                    <p className="text-xs text-gray-500">Avg: {change.avg_change?.toFixed(2)}%</p>
                  </div>
                ))}
              </div>

              {priceTrends.daily_trends && priceTrends.daily_trends.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Daily Changes</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {priceTrends.daily_trends.map((trend: any, index: number) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{trend.day}</span>
                        <div className="flex space-x-4">
                          <span className="text-gray-900">{trend.count} changes</span>
                          <span className={`${trend.avg_change > 0 ? "text-green-600" : "text-red-600"}`}>
                            {trend.avg_change?.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No price changes in the last 30 days.</p>
          )}
        </div>
      )}
    </div>
  )
}

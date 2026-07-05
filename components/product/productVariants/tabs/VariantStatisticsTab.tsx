"use client"

import { useGetVariantStatisticsQuery } from "@/redux/features/product/productAPISlice"
import type { VariantStatisticsResponse } from "@/redux/features/product/productTypes"
import { QueryStateBoundary } from "@/components/common/QueryStateBoundary"

interface VariantStatisticsTabProps {
  variantId: string
}

const VariantStatisticsTab = ({ variantId }: VariantStatisticsTabProps) => {
  const { data: statistics, isLoading, isFetching, error, refetch } = useGetVariantStatisticsQuery(variantId)

  if (isLoading || error) {
    return (
      <QueryStateBoundary
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        onRetry={refetch}
        loadingText="Loading variant statistics..."
        errorTitle="Unable to load variant statistics"
        className="m-4"
      >
        <div />
      </QueryStateBoundary>
    )
  }

  if (!statistics) {
    return (
      <div className="p-4">
        <p className="text-gray-500">No statistics available</p>
      </div>
    )
  }

  const safeStatistics: VariantStatisticsResponse = statistics
  const stock = safeStatistics.stock ?? { available: 0, committed: 0, on_order: 0 }
  const priceHistory = safeStatistics.price_history ?? []
  const sales = safeStatistics.sales ?? { total_sales: 0, last_sale: null }

  return (
    <div className="p-4 max-h-[70vh] overflow-y-auto space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Stock</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Available</p>
            <p className="text-2xl font-bold text-green-600">{stock.available || 0}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Committed</p>
            <p className="text-2xl font-bold text-orange-600">{stock.committed || 0}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">On Order</p>
            <p className="text-2xl font-bold text-blue-600">{stock.on_order || 0}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Price History</h3>
        {priceHistory.length > 0 ? (
          <div className="space-y-2">
            {priceHistory.map((ph) => (
              <div key={ph.id} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{ph.timestamp}</span>
                  <span className="text-sm font-medium">
                    ${ph.old_price} → ${ph.new_price} ({ph.percentage_change?.toFixed(2)}%)
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{ph.reason}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No price history available</p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Sales</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Sales</p>
            <p className="text-2xl font-bold">{sales.total_sales || 0}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Last Sale</p>
            <p className="text-lg font-medium">{sales.last_sale || "No sales yet"}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VariantStatisticsTab

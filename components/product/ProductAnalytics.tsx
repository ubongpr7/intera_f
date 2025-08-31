"use client"

import React, { useState } from 'react';
import {
  useGetProductAnalyticsQuery,
  useGetStockAlertsQuery,
  useGetPriceTrendsQuery,
} from "@/redux/features/product/productAPISlice"
import LoadingAnimation from "../common/LoadingAnimation"
import { getCurrencySymbolForProfile } from "@/lib/currency-utils"
import { 
  Box, 
  TrendingUp, 
  AlertTriangle, 
  Tag, 
  Activity, 
  BarChart3, 
  ChevronDown, 
  ChevronUp,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { 
  BarChart, Bar, 
  LineChart, Line, 
  XAxis, YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

interface ProductAnalyticsProps {
  productId: string
}

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label, currencySymbol }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-md border border-gray-200">
        <p className="font-semibold text-gray-800">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.name.includes('Price') ? `${currencySymbol}${entry.value.toFixed(2)}` : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ProductAnalytics({ productId }: ProductAnalyticsProps) {
  const { data: analytics, isLoading: analyticsLoading } = useGetProductAnalyticsQuery(productId)
  const { data: stockAlerts, isLoading: alertsLoading } = useGetStockAlertsQuery('')
  const { data: priceTrends, isLoading: trendsLoading } = useGetPriceTrendsQuery(30)
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  if (analyticsLoading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100 h-96 flex items-center justify-center">
        <LoadingAnimation text="Loading analytics..." ringColor="#3b82f6" />
      </div>
    )
  }

  const currencySymbol = getCurrencySymbolForProfile();

  // Prepare data for charts
  const variantData = [
    { name: 'Active', value: analytics?.variant_stats.active_variants || 0, color: '#10B981' },
    { name: 'Inactive', value: analytics?.variant_stats.inactive_variants || 0, color: '#EF4444' }
  ];

  const stockData = [
    { name: 'In Stock', value: (analytics?.stock_stats.total_stock || 0) - (analytics?.stock_stats.out_of_stock_variants || 0), color: '#10B981' },
    { name: 'Low Stock', value: analytics?.stock_stats.low_stock_variants || 0, color: '#F59E0B' },
    { name: 'Out of Stock', value: analytics?.stock_stats.out_of_stock_variants || 0, color: '#EF4444' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Product Analytics</h2>
        <div className="flex space-x-2">
          <button className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      {analytics && (
        <div className="grid  grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Variants Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all duration-300 hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Variants</h3>
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Box className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total:</span>
                <span className="text-lg font-bold text-gray-900">{analytics.variant_stats.total_variants}</span>
              </div>
              
              <div className="bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-indigo-500 h-2 rounded-full" 
                  style={{ width: `${(analytics.variant_stats.active_variants / analytics.variant_stats.total_variants) * 100}%` }}
                ></div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">Active</p>
                  <p className="text-lg font-bold text-green-700">{analytics.variant_stats.active_variants}</p>
                </div>
                <div className="text-center p-2 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">Inactive</p>
                  <p className="text-lg font-bold text-red-700">{analytics.variant_stats.inactive_variants}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Status Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all duration-300 hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Stock Status</h3>
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Stock:</span>
                <span className="text-lg font-bold text-gray-900">{analytics.stock_stats.total_stock}</span>
              </div>
              
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stockData}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={30}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stockData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex justify-between">
                <span className="text-xs text-green-600 font-medium">In Stock</span>
                <span className="text-xs text-amber-600 font-medium">Low Stock</span>
                <span className="text-xs text-red-600 font-medium">Out of Stock</span>
              </div>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all duration-300 hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Pricing</h3>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="space-y-4">
              {analytics.price_stats.min_price !== undefined && (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">Min</p>
                      <p className="text-sm font-bold text-gray-900">
                        {currencySymbol} {analytics.price_stats.min_price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">Avg</p>
                      <p className="text-sm font-bold text-gray-900">
                        {currencySymbol} {analytics.price_stats.avg_price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">Max</p>
                      <p className="text-sm font-bold text-gray-900">
                        {currencySymbol} {analytics.price_stats.max_price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ 
                        width: `${((analytics.price_stats.avg_price - analytics.price_stats.min_price) / 
                          (analytics.price_stats.max_price - analytics.price_stats.min_price)) * 100}%`,
                        marginLeft: `${((analytics.price_stats.min_price - analytics.price_stats.min_price) / 
                          (analytics.price_stats.max_price - analytics.price_stats.min_price)) * 100}%`
                      }}
                    ></div>
                  </div>
                </>
              )}
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-600">Profit Margin</p>
                <p className={`text-lg font-bold ${analytics.profit_margin > 0 ? "text-green-600" : "text-red-600"}`}>
                  {analytics.profit_margin > 0 ? '+' : ''}{analytics.profit_margin.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {/* Activity Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all duration-300 hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Activity</h3>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600">Price Changes (30d)</p>
                <p className="text-lg font-bold text-blue-700">{analytics.recent_price_changes}</p>
              </div>
              
              <div className="text-center p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600">POS Ready</p>
                <div className="flex items-center justify-center">
                  {analytics.pos_ready ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500 mr-1" />
                      <span className="text-sm font-medium text-green-700">Yes</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-500 mr-1" />
                      <span className="text-sm font-medium text-red-700">No</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Alerts */}
      {!alertsLoading && stockAlerts && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" /> Stock Alerts
            </h3>
            <button 
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              onClick={() => setExpandedSection(expandedSection === 'alerts' ? null : 'alerts')}
            >
              {expandedSection === 'alerts' ? 'Show Less' : 'View All'}
            </button>
          </div>
          
          {stockAlerts.low_stock_items && stockAlerts.low_stock_items.length > 0 ? (
            <div className="space-y-3">
              {(expandedSection === 'alerts' ? stockAlerts.low_stock_items : stockAlerts.low_stock_items.slice(0, 3)).map((item: any, index: number) => {
                const stockPercentage = (item.quantity / item.threshold) * 100;
                return (
                  <div
                    key={index}
                    className="flex justify-between items-center p-4 bg-amber-50 border border-amber-200 rounded-xl transition-all duration-300 hover:shadow-sm"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-600">SKU: {item.sku}</p>
                    </div>
                    
                    <div className="w-24 mx-4">
                      <div className="flex justify-between text-xs text-amber-800 mb-1">
                        <span>{item.quantity}</span>
                        <span>{item.threshold}</span>
                      </div>
                      <div className="bg-amber-200 rounded-full h-2">
                        <div 
                          className="bg-amber-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, stockPercentage)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-sm font-medium ${stockPercentage < 30 ? 'text-red-600' : 'text-amber-600'}`}>
                        {item.quantity} remaining
                      </p>
                      <p className="text-xs text-amber-600">Threshold: {item.threshold}</p>
                    </div>
                  </div>
                );
              })}
              
              {stockAlerts.low_stock_items.length > 3 && !expandedSection && (
                <p className="text-sm text-gray-600 text-center pt-2">
                  +{stockAlerts.low_stock_items.length - 3} more items with low stock
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
              <p className="text-gray-500">No stock alerts for this product.</p>
            </div>
          )}
        </div>
      )}

      {/* Price Trends */}
      {!trendsLoading && priceTrends && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 text-indigo-600 mr-2" /> Price Trends (Last 30 Days)
            </h3>
            <button 
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              onClick={() => setExpandedSection(expandedSection === 'trends' ? null : 'trends')}
            >
              {expandedSection === 'trends' ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
          
          {priceTrends.price_changes_by_type && priceTrends.price_changes_by_type.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {priceTrends.price_changes_by_type.map((change: any, index: number) => {
                  const isPositive = change.avg_change > 0;
                  return (
                    <div key={index} className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200 transition-all duration-300 hover:shadow-sm">
                      <p className="text-sm text-gray-600 mb-2">{change.change_type}</p>
                      <div className="flex items-center justify-center">
                        {isPositive ? (
                          <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
                        )}
                        <p className="text-lg font-semibold text-gray-900">{change.count}</p>
                      </div>
                      <p className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        Avg: {isPositive ? '+' : ''}{change.avg_change?.toFixed(2)}%
                      </p>
                    </div>
                  );
                })}
              </div>

              {expandedSection === 'trends' && priceTrends.daily_trends && priceTrends.daily_trends.length > 0 && (
                <div className="border-t pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2 text-indigo-600" /> Daily Changes
                  </h4>
                  
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={priceTrends.daily_trends}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} />} />
                        <Bar 
                          dataKey="avg_change" 
                          name="Avg Change %" 
                          fill="#8884d8" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                    {priceTrends.daily_trends.map((trend: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm">
                        <span className="text-gray-600">{trend.day}</span>
                        <div className="flex space-x-4">
                          <span className="text-gray-900">{trend.count} changes</span>
                          <span className={`flex items-center ${trend.avg_change > 0 ? "text-green-600" : "text-red-600"}`}>
                            {trend.avg_change > 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
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
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Tag className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No price changes in the last 30 days.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
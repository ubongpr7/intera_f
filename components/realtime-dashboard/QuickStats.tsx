'use client';
import { useGetDashboardStatsQuery, useGetLowStockItemsQuery } from '@/redux/features/dashboard/dashboardApiSlice';
import { Box, AlertTriangle, ClipboardList, Truck, TrendingUp, ChevronRight } from 'lucide-react';
import LoadingAnimation from '../common/LoadingAnimation';
import { useMemo, useState } from 'react';

const QuickStats = () => {
  const { data, error, isLoading } = useGetDashboardStatsQuery('');
  const { data: lowStockData, error: lowStockError, isLoading: lowStockLoading } = useGetLowStockItemsQuery({ stock_status: "low_stock" });
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const lowStockCount = useMemo(() => {
    return lowStockData?.length || 0;
  }, [lowStockData]);

  const stats = [
    {
      id: 1,
      title: 'Total Products',
      value: data?.total_products || 0,
      icon: <Box className="w-6 h-6" />,
      color: 'bg-gradient-to-r from-indigo-500 to-purple-600',
      hoverColor: 'hover:from-indigo-600 hover:to-purple-700',
      trend: '+12% from last month',
      description: 'All products in inventory'
    },
    {
      id: 2,
      title: 'Low Stock Items',
      value: lowStockCount,
      icon: <AlertTriangle className="w-6 h-6" />,
      color: 'bg-gradient-to-r from-rose-500 to-pink-600',
      hoverColor: 'hover:from-rose-600 hover:to-pink-700',
      trend: lowStockCount > 5 ? 'Needs attention' : 'Stock levels acceptable',
      description: 'Items below minimum stock level'
    },
    {
      id: 3,
      title: 'POs This Month',
      value: data?.purchase_orders_this_month || 0,
      icon: <ClipboardList className="w-6 h-6" />,
      color: 'bg-gradient-to-r from-cyan-500 to-blue-600',
      hoverColor: 'hover:from-cyan-600 hover:to-blue-700',
      trend: '+3 from last week',
      description: 'Purchase orders created this month'
    },
    {
      id: 4,
      title: 'Pending Shipments',
      value: data?.pending_shipments || 0,
      icon: <Truck className="w-6 h-6" />,
      color: 'bg-gradient-to-r from-amber-500 to-orange-600',
      hoverColor: 'hover:from-amber-600 hover:to-orange-700',
      trend: '2 arriving tomorrow',
      description: 'Shipments awaiting processing'
    }
  ];

  if (isLoading) return (
    <div className="h-full flex justify-center items-center">
      <LoadingAnimation />
    </div>
  );
  
  if (error) return (
    <div className="rounded-xl bg-white p-6 shadow-lg border border-gray-100">
      <div className="flex flex-col items-center justify-center py-10">
        <div className="rounded-full bg-red-100 p-4 mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Error Loading Data</h3>
        <p className="text-gray-500 text-sm">Please try refreshing the page</p>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Inventory Overview</h2>
        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center">
          View full report <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {stats.map((stat, index) => (
          <div 
            key={stat.id}
            className={`relative rounded-2xl p-6 text-white shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl cursor-pointer ${stat.color} ${stat.hoverColor}`}
            onMouseEnter={() => setExpandedCard(stat.id)}
            onMouseLeave={() => setExpandedCard(null)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                {stat.icon}
              </div>
              <TrendingUp className="w-5 h-5 opacity-80" />
            </div>
            
            <h3 className="text-lg font-semibold mb-2">{stat.title}</h3>
            <p className="text-3xl font-bold mb-2">{stat.value}</p>
            
            <div className={`overflow-hidden transition-all duration-300 ${expandedCard === stat.id ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
              <p className="text-sm opacity-90 mb-1">{stat.trend}</p>
              <p className="text-xs opacity-75">{stat.description}</p>
            </div>
            
            <div className={`absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-500 ${expandedCard === stat.id ? 'w-full' : 'w-0'}`}></div>
          </div>
        ))}
      </div>

      {lowStockLoading && (
        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-center">
            <div className="animate-pulse bg-blue-200 rounded-full p-2 mr-3">
              <Box className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-blue-700">Loading low stock items...</p>
          </div>
        </div>
      )}
      
      {lowStockError && (
        <div className="mt-8 p-4 bg-red-50 rounded-xl border border-red-100">
          <div className="flex items-center">
            <div className="bg-red-100 rounded-full p-2 mr-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-red-700">Error loading low stock items</p>
          </div>
        </div>
      )}
      
      {lowStockData && lowStockData.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Low Stock Alert</h3>
            <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-sm font-medium">
              {lowStockCount} items need attention
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {lowStockData.map((item: any) => (
              <div 
                key={item.id} 
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:border-rose-200"
              >
                <div className="relative">
                  {item.display_image ? (
                    <img 
                      src={item.display_image} 
                      alt={item.name} 
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                      <Box className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Low Stock
                  </div>
                </div>
                
                <div className="p-4">
                  <p className="font-semibold text-gray-900 mb-1 truncate">{item.name}</p>
                  <p className="text-sm text-gray-600 mb-3">SKU: {item.sku}</p>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">Current Stock</p>
                      <p className="text-lg font-bold text-rose-600">{parseFloat(item.quantity).toFixed(0)}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Minimum Required</p>
                      <p className="text-lg font-bold text-gray-700">{item.minimum_stock_level}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-rose-500 h-2 rounded-full" 
                      style={{ width: `${Math.min(100, (parseFloat(item.quantity) / item.minimum_stock_level) * 100)}%` }}
                    ></div>
                  </div>
                  
                  <button className="mt-4 w-full py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">
                    Create Purchase Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickStats;
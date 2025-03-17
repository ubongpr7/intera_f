import { Package, AlertCircle, Box, TrendingDown } from 'lucide-react';

export default function InventoryOverview() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl  font-semibold">Inventory Overview</h2>
        <Package className="w-6 h-6 text-blue-600" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Total Stock Value</p>
          <p className="text-2xl font-bold">$245,234</p>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Total SKUs</p>
          <p className="text-2xl text-gray-500 font-bold">1,234</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="font-medium">Low Stock Items</span>
          </div>
          <span className="text-red-600 font-bold">23</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Box className="w-5 h-5 text-yellow-600" />
            <span className="font-medium">Overstock Items</span>
          </div>
          <span className="text-yellow-600 font-bold">15</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <TrendingDown className="w-5 h-5 text-purple-600" />
            <span className="font-medium">Slow Moving</span>
          </div>
          <span className="text-purple-600 font-bold">42</span>
        </div>
      </div>
    </div>
  );
}
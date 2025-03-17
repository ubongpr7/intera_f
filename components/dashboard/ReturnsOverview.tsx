// components/dashboard/ReturnsOverview.tsx
import { Undo, AlertCircle, Package } from 'lucide-react';

export default function ReturnsOverview() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Returns Overview</h2>
        <Undo className="w-6 h-6 text-violet-600" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg text-center">
          <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Total Returns</p>
          <p className="text-2xl font-bold">48</p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Refund Value</p>
          <p className="text-2xl font-bold">$2,450</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span>Damaged Products</span>
          <span className="font-medium">24 (50%)</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Wrong Items Shipped</span>
          <span className="font-medium">12 (25%)</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Customer Returns</span>
          <span className="font-medium">12 (25%)</span>
        </div>
      </div>
    </div>
  );
}
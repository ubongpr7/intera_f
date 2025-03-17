// components/dashboard/SalesPerformance.tsx
import { LineChart } from 'lucide-react';

export default function SalesPerformance() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Sales Performance</h2>
        <LineChart className="w-6 h-6 text-green-600" />
      </div>

      <div className="mb-8 h-64 bg-gray-50 rounded-lg p-4">
        {/* Replace with your actual chart component */}
        <div className="flex items-center justify-center h-full text-gray-400">
          <span>Sales Chart Placeholder</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">This Month's Sales</p>
          <p className="text-2xl font-bold">$45,230</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Avg. Order Value</p>
          <p className="text-2xl font-bold">$234</p>
        </div>
      </div>
    </div>
  );
}
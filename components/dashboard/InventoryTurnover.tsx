// components/dashboard/InventoryTurnover.tsx
import { LineChart, ArrowUp } from 'lucide-react';

export default function InventoryTurnover() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Inventory Turnover</h2>
        <LineChart className="w-6 h-6 text-cyan-600" />
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold mb-2">5.2x</p>
          <div className="flex items-center text-green-600">
            <ArrowUp className="w-4 h-4 mr-1" />
            <span>12% vs last period</span>
          </div>
        </div>
        
        <div className="w-32 h-24 bg-gray-50 rounded-lg p-2">
          {/* Mini chart placeholder */}
          <div className="h-full w-full border-2 border-dashed border-gray-200 rounded-md flex items-center justify-center text-gray-400">
            <span className="text-xs">Chart</span>
          </div>
        </div>
      </div>
    </div>
  );
}
// components/dashboard/InventoryMovement.tsx
import { ArrowDown, ArrowUp, Activity } from 'lucide-react';

export default function InventoryMovement() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Inventory Movement</h2>
        <Activity className="w-6 h-6 text-sky-600" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-3 mb-2">
            <ArrowUp className="w-6 h-6 text-green-600" />
            <div>
              <p className="text-sm text-gray-500">Incoming Stock</p>
              <p className="text-2xl font-bold">458 units</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">+12% from last week</p>
        </div>

        <div className="p-4 bg-red-50 rounded-lg">
          <div className="flex items-center space-x-3 mb-2">
            <ArrowDown className="w-6 h-6 text-red-600" />
            <div>
              <p className="text-sm text-gray-500">Outgoing Stock</p>
              <p className="text-2xl font-bold">892 units</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">-4% from last week</p>
        </div>
      </div>

      <div className="h-48 bg-gray-50 rounded-lg p-4">
        {/* Placeholder for movement timeline chart */}
        <div className="flex items-center justify-center h-full text-gray-400">
          <span>Movement Timeline Chart</span>
        </div>
      </div>
    </div>
  );
}
// components/dashboard/OrderFulfillment.tsx
import { PackageCheck, Timer, Rocket } from 'lucide-react';

export default function OrderFulfillment() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Order Fulfillment</h2>
        <PackageCheck className="w-6 h-6 text-emerald-600" />
      </div>

      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Fulfillment Rate</span>
            <span className="font-bold text-emerald-600">94.7%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="w-[94.7%] h-full bg-emerald-500"></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <Timer className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Avg. Time</p>
            <p className="text-xl font-bold">2.4h</p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <Rocket className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Same Day Ship</p>
            <p className="text-xl font-bold">87%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
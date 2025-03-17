// components/dashboard/SupplierLeadTime.tsx
import { Clock, Truck, BarChart } from 'lucide-react';

export default function SupplierLeadTime() {
  const suppliers = [
    { name: "TechParts Co", avgLeadTime: 2, trend: -15 },
    { name: "Global Supply", avgLeadTime: 5, trend: +8 },
    { name: "Prime Logistics", avgLeadTime: 7, trend: +22 },
  ];

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Supplier Lead Times</h2>
        <Truck className="w-6 h-6 text-amber-600" />
      </div>

      <div className="space-y-4">
        {suppliers.map((supplier) => (
          <div key={supplier.name} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{supplier.name}</span>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{supplier.avgLeadTime} days</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <BarChart className="w-4 h-4 text-gray-500" />
                <span className="text-gray-500">Trend (7d avg)</span>
              </div>
              <span className={`${
                supplier.trend > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {supplier.trend > 0 ? '+' : ''}{supplier.trend}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}